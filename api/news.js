// Vercel serverless function: latest agricultural-engineering headlines for the homepage news panel.
// Runs a few Google News RSS searches (no API key needed), keeps recent headlines whose title is
// actually about ag-engineering topics, and lets Vercel's CDN cache the result for an hour, so the
// panel refreshes itself without any manual work.
const QUERIES = [
  'agricultural engineering',
  'farm mechanisation India',
  'agricultural drone India',
  'precision agriculture India',
  'ICAR agricultural engineering',
  'micro irrigation India',
  'farm machinery tractor India',
];
const MAX_ITEMS = 10;
const MAX_PER_SOURCE = 2;
const MAX_AGE_DAYS = 7;

// the headline itself must mention an ag-engineering topic (Google matches queries loosely)
const RELEVANT = /mechani[sz]|tractor|machinery|harvester|implement|drone|irrigation|\bdrip\b|sprinkler|precision (agri|farm)|smart farm|digital (agri|farm)|agri-?tech|\bICAR\b|\bKVK\b|\bCIAE\b|\bCIPHET\b|\bIARI\b|agricultural engineering|post-harvest|cold (storage|chain)|food processing|solar pump|KUSUM|watershed|soil health|farm technolog|agri startup|seed drill|custom hiring|krishi/i;
// keep the panel about technology and development, not tragedies, crime or conflict
const SKIP = /\b(suicides?|killed|kills|deaths?|dead|dies|died|murder|rape|accident|crash|electrocuted|arrested|scam|strike|attack|war|military|missile)\b/i;
// market-research and listing pages that pose as news
const SPAM = /market (size|share|trends?|report|to reach|forecast|analysis|growth)|\bCAGR\b|list of \d|plant setup|industry report/i;
const SPAM_SOURCES = /tracxn|imarc|fortune business insights|credence research|marketsandmarkets|research and markets|grand view research|mordor intelligence|precedence research|openpr|einpresswire/i;

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function parse(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const pick = tag => {
      const r = m[1].match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
      return r ? decode(r[1]) : '';
    };
    let source = pick('source');
    let title = pick('title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    if (/^https?:\/\//.test(source)) { try { source = new URL(source).hostname.replace(/^www\./, ''); } catch (e) {} }
    const link = pick('link');
    const date = new Date(pick('pubDate'));
    if (!title || !/^https:\/\//.test(link) || isNaN(date)) continue;
    items.push({ title, source, link, date: date.toISOString() });
  }
  return items;
}

async function search(q) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:7d') + '&hl=en-IN&gl=IN&ceid=IN:en';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; theciae-news/1.0)' } });
  if (!r.ok) throw new Error('feed returned ' + r.status);
  return parse(await r.text());
}

function select(all) {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 864e5).toISOString();
  const seen = new Set();
  const perSource = {};
  const out = [];
  for (const n of all.sort((a, b) => b.date.localeCompare(a.date))) {
    if (n.date < cutoff || !RELEVANT.test(n.title) || SKIP.test(n.title) || SPAM.test(n.title) || SPAM_SOURCES.test(n.source)) continue;
    const key = n.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
    if (seen.has(key)) continue;
    if ((perSource[n.source] || 0) >= MAX_PER_SOURCE) continue;
    seen.add(key);
    perSource[n.source] = (perSource[n.source] || 0) + 1;
    out.push(n);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

module.exports = async (req, res) => {
  const results = await Promise.allSettled(QUERIES.map(search));
  const all = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
  if (!all.length) {
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(502).json({ error: 'News feed unavailable', items: [] });
  }
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({ updated: new Date().toISOString(), items: select(all) });
};
