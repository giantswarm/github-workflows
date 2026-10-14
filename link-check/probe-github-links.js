#!/usr/bin/env node
// Resolves links into Giant Swarm repositories through the GitHub API, for
// the check-readme-links workflow. The anonymous checker gets 404 from every
// link into a private repository, so the workflow hands those links to this
// script together with a token of an App that holds Contents: read. The
// script decides per link:
//
//   skip       the target exists (file, directory, ref, release, commit,
//              heading); the checker must not report it, so the workflow adds
//              the exact URL to the ignore list.
//   dead       the repository, path, ref, release, commit or heading does not
//              exist; the link stays in the check, where it fails with 404,
//              and the reason is written next to it in the report.
//   unchecked  the link needs a permission the App does not hold (issues,
//              pull requests, discussions, Actions, wiki, ...); the checker
//              skips it and the report says it was not checked.
//
// Links into public repositories are left to the checker untouched. A
// repository the App cannot see answers 404 to the API; as the App is
// installed on every repository of the organisation, that means the
// repository does not exist.
//
// Usage: probe-github-links.js --links <file with one URL per line> --out <json>
// Environment: GH_TOKEN (required), GITHUB_API_URL (default https://api.github.com).

'use strict';

const fs = require('node:fs');

const OWNER = 'giantswarm';
const API = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
const TOKEN = process.env.GH_TOKEN;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  if (!args.links || !args.out) {
    console.error('usage: probe-github-links.js --links <file> --out <json>');
    process.exit(2);
  }
  return args;
}

async function api(path, { raw = false } = {}) {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'giantswarm-check-readme-links',
  };
  const response = await fetch(`${API}${path}`, { headers });
  const type = response.headers.get('content-type') || '';
  const body = type.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, body, json: type.includes('application/json') };
}

const repoCache = new Map();

// 'private', 'public', 'missing' or an error message.
async function repoVisibility(repo) {
  if (!repoCache.has(repo)) {
    const { status, body } = await api(`/repos/${OWNER}/${repo}`);
    let result;
    if (status === 200) {
      result = body.private ? 'private' : 'public';
    } else if (status === 404) {
      result = 'missing';
    } else {
      result = `HTTP ${status} ${body && body.message ? body.message : ''}`.trim();
    }
    repoCache.set(repo, result);
  }
  return repoCache.get(repo);
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

// Fetches a path at a ref through the contents API. A directory answers with
// a JSON array even when raw content is requested; a file answers with its
// text. Returns { found, kind, text } or { found: false }.
async function contents(repo, ref, path) {
  const query = `?ref=${encodeURIComponent(ref)}`;
  const { status, body, json } = await api(`/repos/${OWNER}/${repo}/contents/${encodePath(path)}${query}`, { raw: true });
  if (status === 404) {
    return { found: false };
  }
  if (status !== 200) {
    throw new Error(`HTTP ${status} on ${repo}/${path}@${ref}${json && body.message ? `: ${body.message}` : ''}`);
  }
  if (json && Array.isArray(body)) {
    return { found: true, kind: 'directory' };
  }
  return { found: true, kind: 'file', text: typeof body === 'string' ? body : '' };
}

// A branch name may contain slashes (renovate/aws-6.x), so the split between
// ref and path in blob/<ref>/<path> is ambiguous. Try the first one, two and
// three segments as the ref. A raw.githubusercontent.com URL may also spell
// the ref as refs/heads/<branch> or refs/tags/<tag>.
function refCandidates(segments) {
  const candidates = [];
  if (segments[0] === 'refs' && (segments[1] === 'heads' || segments[1] === 'tags') && segments.length >= 3) {
    for (let n = 3; n <= Math.min(5, segments.length); n++) {
      candidates.push({ ref: segments.slice(0, n).join('/'), path: segments.slice(n).join('/') });
    }
    return candidates;
  }
  for (let n = 1; n <= Math.min(3, segments.length); n++) {
    candidates.push({ ref: segments.slice(0, n).join('/'), path: segments.slice(n).join('/') });
  }
  return candidates;
}

async function findContents(repo, segments) {
  for (const { ref, path } of refCandidates(segments)) {
    const result = await contents(repo, ref, path);
    if (result.found) {
      return { ...result, ref, path };
    }
  }
  return { found: false };
}

// The heading anchors GitHub renders for a Markdown file, computed the way
// markdown-link-check does for local files: lower case, punctuation removed,
// blanks to hyphens, duplicates suffixed -1, -2, ... Also id="..." and
// <a name="..."> anchors written as HTML.
function anchorsOf(markdown) {
  const withoutCode = markdown.replace(/^(```|~~~)[\s\S]*?^\1[ \t]*$/gm, '');
  const headings = withoutCode.match(/^#+ .*$/gm) || [];
  const slugs = headings.map((heading) =>
    heading
      .replace(/\[(.+?)\]\([^)]*\)/g, '$1')
      .toLowerCase()
      .replace(/^#+\s*/, '')
      .replace(/\s+#+\s*$/, '')
      .replace(/[^\p{L}\p{Nd}\p{Nl}\s_\-`]/gu, '')
      .replace(/\*/gu, '')
      .replace(/`/gu, '')
      .trim()
      .replace(/\s/gu, '-'),
  );
  const seen = new Map();
  const unique = [];
  for (const slug of slugs) {
    const count = seen.get(slug) || 0;
    unique.push(count === 0 ? slug : `${slug}-${count}`);
    seen.set(slug, count + 1);
  }
  const html = [
    ...withoutCode.matchAll(/<[^>]+\sid=["']([^"']+)["']/g),
    ...withoutCode.matchAll(/<a\s[^>]*name=["']([^"']+)["']/g),
  ].map((match) => match[1]);
  return new Set([...unique, ...html]);
}

function anchorFound(anchors, fragment) {
  const wanted = decodeURIComponent(fragment).toLowerCase();
  return anchors.has(wanted) || anchors.has(wanted.replace(/^user-content-/, ''));
}

// Decides one link. Returns { verdict: 'skip' | 'dead' | 'unchecked' | 'public', reason }.
async function probe(url) {
  const parsed = new URL(url);
  const segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments[0] !== OWNER || segments.length < 2) {
    return { verdict: 'unchecked', reason: 'not a repository URL' };
  }
  const repo = segments[1].replace(/\.git$/, '');
  const rest = segments.slice(2);
  const fragment = parsed.hash.replace(/^#/, '');

  const visibility = await repoVisibility(repo);
  if (visibility === 'public') {
    return { verdict: 'public' };
  }
  if (visibility === 'missing') {
    return { verdict: 'dead', reason: `repository ${OWNER}/${repo} does not exist` };
  }
  if (visibility !== 'private') {
    return { verdict: 'unchecked', reason: `could not read ${OWNER}/${repo}: ${visibility}` };
  }

  if (parsed.hostname === 'raw.githubusercontent.com') {
    if (rest.length < 2) {
      return { verdict: 'dead', reason: 'a raw URL needs a ref and a path' };
    }
    const found = await findContents(repo, rest);
    return found.found
      ? { verdict: 'skip', reason: `${found.kind} exists` }
      : { verdict: 'dead', reason: `no such path at that ref in ${OWNER}/${repo}` };
  }

  const kind = rest[0];
  if (rest.length === 0) {
    return { verdict: 'skip', reason: 'repository exists' };
  }
  switch (kind) {
    case 'blob':
    case 'tree':
    case 'raw': {
      const refAndPath = rest.slice(1);
      if (refAndPath.length === 0) {
        return { verdict: 'skip', reason: 'repository exists' };
      }
      const found = await findContents(repo, refAndPath);
      if (!found.found) {
        return { verdict: 'dead', reason: `no such path at that ref in ${OWNER}/${repo}` };
      }
      if (kind === 'blob' && fragment && !/^L\d+(C\d+)?(-L\d+(C\d+)?)?$/.test(fragment) && found.kind === 'file') {
        if (/\.(md|markdown|mdown|mkd)$/i.test(found.path)) {
          if (!anchorFound(anchorsOf(found.text), fragment)) {
            return { verdict: 'dead', reason: `no heading #${fragment} in ${found.path}` };
          }
        }
      }
      return { verdict: 'skip', reason: `${found.kind} exists` };
    }
    case 'releases': {
      if (rest.length === 1) {
        return { verdict: 'skip', reason: 'repository exists' };
      }
      if (rest[1] === 'latest' && rest.length === 2) {
        const { status } = await api(`/repos/${OWNER}/${repo}/releases/latest`);
        return status === 200
          ? { verdict: 'skip', reason: 'release exists' }
          : { verdict: 'dead', reason: `${OWNER}/${repo} has no release` };
      }
      if ((rest[1] === 'tag' || rest[1] === 'download') && rest.length >= 3) {
        const { status, body } = await api(`/repos/${OWNER}/${repo}/releases/tags/${encodeURIComponent(rest[2])}`);
        if (status !== 200) {
          return { verdict: 'dead', reason: `no release ${rest[2]} in ${OWNER}/${repo}` };
        }
        if (rest[1] === 'download' && rest.length >= 4) {
          const asset = rest.slice(3).join('/');
          return (body.assets || []).some((a) => a.name === asset)
            ? { verdict: 'skip', reason: 'release asset exists' }
            : { verdict: 'dead', reason: `release ${rest[2]} has no asset ${asset}` };
        }
        return { verdict: 'skip', reason: 'release exists' };
      }
      return { verdict: 'skip', reason: 'repository exists' };
    }
    case 'commit': {
      if (rest.length < 2) {
        return { verdict: 'skip', reason: 'repository exists' };
      }
      const { status } = await api(`/repos/${OWNER}/${repo}/commits/${encodeURIComponent(rest[1])}`);
      return status === 200
        ? { verdict: 'skip', reason: 'commit exists' }
        : { verdict: 'dead', reason: `no commit ${rest[1]} in ${OWNER}/${repo}` };
    }
    case 'tags':
    case 'branches':
    case 'commits':
    case 'graphs':
    case 'network':
    case 'activity':
    case 'stargazers':
    case 'forks':
    case 'watchers':
      return { verdict: 'skip', reason: 'repository exists' };
    default:
      return { verdict: 'unchecked', reason: `the App cannot read /${kind} pages` };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!TOKEN) {
    console.error('GH_TOKEN is not set');
    process.exit(2);
  }
  const links = [...new Set(fs.readFileSync(args.links, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean))];
  const out = { skip: [], dead: [], unchecked: [], public: [] };
  for (const url of links) {
    let result;
    try {
      result = await probe(url);
    } catch (error) {
      result = { verdict: 'unchecked', reason: error.message };
    }
    if (result.verdict === 'public') {
      out.public.push(url);
    } else {
      out[result.verdict].push({ url, reason: result.reason });
    }
    console.log(`${result.verdict.padEnd(9)} ${url}${result.reason ? `  (${result.reason})` : ''}`);
  }
  // Exact ignore patterns for the checker: every link that exists and every
  // link the App cannot judge.
  out.patterns = [...out.skip, ...out.unchecked].map(
    ({ url }) => `^${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
  );
  fs.writeFileSync(args.out, JSON.stringify(out, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
