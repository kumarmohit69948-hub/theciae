// Vercel serverless function: commits an uploaded file to the GitHub repo.
// Requires two environment variables set in the Vercel project settings:
//   ADMIN_PASSWORD - password the site owner types in the upload form
//   GITHUB_TOKEN   - fine-grained PAT with Contents read/write on this repo
const REPO = 'kumarmohit69948-hub/theciae';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN)
    return res.status(503).json({ error: 'Upload not configured yet: set ADMIN_PASSWORD and GITHUB_TOKEN in Vercel.' });

  const { password, path, content } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong admin password' });
  if (!path || !content) return res.status(400).json({ error: 'Missing path or file content' });

  const clean = String(path).replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (!clean.startsWith('courses/') || clean.includes('..'))
    return res.status(400).json({ error: 'Files can only be uploaded inside the courses/ folder' });

  const url = `https://api.github.com/repos/${REPO}/contents/${clean.split('/').map(encodeURIComponent).join('/')}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'theciae-website-upload'
  };

  // if the file already exists we must pass its sha to overwrite it
  let sha;
  const existing = await fetch(url, { headers });
  if (existing.ok) sha = (await existing.json()).sha;

  const r = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Add ${clean.split('/').pop()} via website upload`,
      content,
      branch: 'main',
      ...(sha ? { sha } : {})
    })
  });
  const j = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: j.message || 'GitHub API error' });
  return res.status(200).json({ ok: true, path: clean });
};
