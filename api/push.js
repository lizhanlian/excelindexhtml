// Vercel serverless function: push user data to GitHub repo contents
// Expects POST JSON: { username: string, payload: object }
// Requires env: GITHUB_PAT, GITHUB_REPO (owner/repo), optional GITHUB_BRANCH, optional SYNC_SECRET

const GITHUB_API_BASE = 'https://api.github.com';

async function getFileSha(owner, repo, path, branch) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${branch?`?ref=${encodeURIComponent(branch)}`:''}`;
  const res = await fetch(url, { headers: { Authorization: `token ${process.env.GITHUB_PAT}`, Accept: 'application/vnd.github+json' } });
  if (res.status === 200) {
    const j = await res.json();
    return j.sha;
  }
  if (res.status === 404) return null;
  throw new Error(`unexpected status getting file: ${res.status}`);
}

async function putFile(owner, repo, path, contentBase64, message, sha, branch) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = { message, content: contentBase64 };
  if (sha) body.sha = sha;
  if (branch) body.branch = branch;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${process.env.GITHUB_PAT}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  return j;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

    // optional simple secret to protect endpoint from abuse
    if (process.env.SYNC_SECRET) {
      const sent = req.headers['x-sync-secret'];
      if (!sent || sent !== process.env.SYNC_SECRET) return res.status(403).json({ error: 'Missing or invalid sync secret' });
    }

    if (!process.env.GITHUB_PAT || !process.env.GITHUB_REPO) return res.status(500).json({ error: 'server not configured (GITHUB_PAT or GITHUB_REPO)' });

    const { username, payload } = req.body || {};
    if (!username || !payload) return res.status(400).json({ error: 'username and payload required' });

    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path = `data/${username}.json`;

    const contentObj = { meta: { username, updatedAt: (new Date()).toISOString() }, data: payload };
    const contentStr = JSON.stringify(contentObj, null, 2);
    const contentBase64 = Buffer.from(contentStr, 'utf-8').toString('base64');

    const sha = await getFileSha(owner, repo, path, branch).catch(err => { throw err; });
    const message = `sync: update data for ${username} at ${new Date().toISOString()}`;
    const result = await putFile(owner, repo, path, contentBase64, message, sha, branch);

    return res.status(200).json({ ok: true, commit: result.commit ? result.commit.sha : null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
};
