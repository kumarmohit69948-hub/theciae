// Vercel serverless function: deletes a file from courses/ via the GitHub API.
// Uses the same ADMIN_PASSWORD + GITHUB_TOKEN env vars as api/upload.js.
const REPO = 'kumarmohit69948-hub/theciae';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN)
    return res.status(503).json({ error: 'Delete not configured yet: set ADMIN_PASSWORD and GITHUB_TOKEN in Vercel.' });

  const { password, path } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong admin password' });
  if (!path) return res.status(400).json({ error: 'Missing file path' });

  const clean = String(path).replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  if (!clean.startsWith('courses/') || clean.includes('..') || /(\.gitkeep|README\.md)$/.test(clean))
    return res.status(400).json({ error: 'Only resource files inside courses/ can be deleted' });

  const url = `https://api.github.com/repos/${REPO}/contents/${clean.split('/').map(encodeURIComponent).join('/')}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'theciae-website-delete'
  };

  const existing = await fetch(url, { headers });
  if (!existing.ok) return res.status(404).json({ error: 'File not found on GitHub' });
  const { sha } = await existing.json();

  const r = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message: `Delete ${clean.split('/').pop()} via website`, sha, branch: 'main' })
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    return res.status(r.status).json({ error: j.message || 'GitHub API error' });
  }
  return res.status(200).json({ ok: true, path: clean });
};
