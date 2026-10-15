// Vercel serverless function: the list of note files under courses/, plus the newest uploads.
// Browsers used to ask the GitHub API for this directly, but GitHub allows only 60 such requests
// an hour per IP address, and students sharing a mobile network or campus Wi-Fi ran out — the
// notes then vanished from the site. This function asks GitHub once (with GITHUB_TOKEN when it is
// set) and Vercel's CDN serves the answer to everyone for 10 minutes.
const REPO = 'kumarmohit69948-hub/theciae';
const BRANCH = 'main';
const SKIP = /(\.gitkeep|README\.md)$/;
const MAX_FRESH = 6;

function github(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'theciae-website-files' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(`https://api.github.com/repos/${REPO}${path}`, { headers }).then(r => {
    if (!r.ok) throw new Error('GitHub returned ' + r.status);
    return r.json();
  });
}

// newest notes added under courses/ (skips quiz/flashcard JSON and files deleted since)
async function recent(exists) {
  const commits = await github('/commits?path=courses&per_page=10');
  const out = [];
  const seen = new Set();
  for (const c of commits) {
    if (out.length >= MAX_FRESH) break;
    const det = await github('/commits/' + c.sha);
    for (const f of det.files || []) {
      if (out.length >= MAX_FRESH) break;
      if (f.status !== 'added' || !exists.has(f.filename) || seen.has(f.filename) || /\.json$/i.test(f.filename)) continue;
      if (f.filename.split('/').length < 4) continue;
      seen.add(f.filename);
      out.push({ path: f.filename, date: det.commit.author.date });
    }
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const t = await github(`/git/trees/${BRANCH}?recursive=1`);
    const tree = t.tree || [];
    const files = tree.filter(e => e.type === 'blob' && e.path.startsWith('courses/') && !SKIP.test(e.path)).map(e => e.path);
    const dirs = tree.filter(e => e.type === 'tree' && e.path.startsWith('courses/')).map(e => e.path);
    let fresh = [];
    try { fresh = await recent(new Set(files)); } catch (e) {}
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    return res.status(200).json({ branch: BRANCH, updated: new Date().toISOString(), files, dirs, fresh });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(502).json({ error: 'File list unavailable' });
  }
};
