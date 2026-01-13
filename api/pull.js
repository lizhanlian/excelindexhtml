// Vercel serverless function: pull user data from GitHub repo contents
// GET ?username=<username>
// Requires env: GITHUB_PAT, GITHUB_REPO, optional GITHUB_BRANCH, optional SYNC_SECRET

const GITHUB_API_BASE = 'https://api.github.com';

async function getFile(owner, repo, path, branch) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${branch?`?ref=${encodeURIComponent(branch)}`:''}`;
  const res = await fetch(url, { headers: { Authorization: `token ${process.env.GITHUB_PAT}`, Accept: 'application/vnd.github+json' } });
  if (res.status === 200) return await res.json();
  if (res.status === 404) return null;
  throw new Error(`unexpected status getting file: ${res.status}`);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Only GET' });

    if (process.env.SYNC_SECRET) {
      const sent = req.headers['x-sync-secret'];
      if (!sent || sent !== process.env.SYNC_SECRET) return res.status(403).json({ error: 'Missing or invalid sync secret' });
    }

    if (!process.env.GITHUB_PAT || !process.env.GITHUB_REPO) return res.status(500).json({ error: 'server not configured (GITHUB_PAT or GITHUB_REPO)' });

    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'username required' });

    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path = `data/${username}.json`;

    const file = await getFile(owner, repo, path, branch);
    if (!file) return res.status(404).json({ error: 'not found' });

    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    const json = JSON.parse(content);
    return res.status(200).json({ ok: true, file: json, commitSha: file.sha });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
};
