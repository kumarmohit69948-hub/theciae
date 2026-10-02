// Vercel serverless function: add or delete an entry in notices.json in the repo.
// Reuses the same environment variables as the upload function:
//   ADMIN_PASSWORD - password the site owner types in the notice form
//   GITHUB_TOKEN   - fine-grained PAT with Contents read/write on this repo
const REPO = 'kumarmohit69948-hub/theciae';
const FILE = 'notices.json';
const CATEGORIES = ['JRF', 'SRF', 'Post-Doc', 'Admission', 'Other'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN)
    return res.status(503).json({ error: 'Not configured: set ADMIN_PASSWORD and GITHUB_TOKEN in Vercel.' });

  const { password, action, notice, id } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Wrong admin password' });

  const url = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'theciae-website-notice'
  };

  // read current notices.json (and its sha)
  let list = [];
  let sha;
  const existing = await fetch(url, { headers });
  if (existing.ok) {
    const j = await existing.json();
    sha = j.sha;
    try { list = JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')) || []; } catch { list = []; }
    if (!Array.isArray(list)) list = [];
  }

  let message;
  if (action === 'delete') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    list = list.filter(n => String(n.id) !== String(id));
    message = `Remove notice ${id} via website`;
  } else {
    const n = notice || {};
    const title = String(n.title || '').trim();
    const institution = String(n.institution || '').trim();
    const category = CATEGORIES.includes(n.category) ? n.category : 'Other';
    if (!title || !institution) return res.status(400).json({ error: 'Title and institution are required' });
    const clean = {
      id: Date.now().toString(),
      title: title.slice(0, 200),
      institution: institution.slice(0, 120),
      category,
      posted: /^\d{4}-\d{2}-\d{2}$/.test(n.posted) ? n.posted : new Date().toISOString().slice(0, 10),
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(n.deadline) ? n.deadline : '',
      sourceUrl: /^https?:\/\//i.test(n.sourceUrl) ? String(n.sourceUrl).slice(0, 500) : '',
      pdfUrl: /^https?:\/\//i.test(n.pdfUrl) ? String(n.pdfUrl).slice(0, 500) : '',
      notes: String(n.notes || '').trim().slice(0, 400)
    };
    list.unshift(clean); // newest first
    message = `Add notice "${clean.title}" via website`;
  }

  const content = Buffer.from(JSON.stringify(list, null, 2) + '\n', 'utf8').toString('base64');
  const r = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content, branch: 'main', ...(sha ? { sha } : {}) })
  });
  const j = await r.json();
  if (!r.ok) return res.status(r.status).json({ error: j.message || 'GitHub API error' });
  return res.status(200).json({ ok: true, count: list.length });
};
