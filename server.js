const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const licenses = {};

function generateKey() {
  return crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g).join('-');
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Generate license key (admin only)
app.post('/admin/generate', (req, res) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { days } = req.body;
  const key = generateKey();
  const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
  licenses[key] = { createdAt: Date.now(), expiresAt, active: true };
  res.json({ key, expiresAt: new Date(expiresAt).toISOString() });
});

// Verify license
app.post('/verify', (req, res) => {
  const { key } = req.body;
  const license = licenses[key];
  if (!license || !license.active) {
    return res.json({ valid: false, reason: 'Key tidak ditemukan' });
  }
  if (Date.now() > license.expiresAt) {
    return res.json({ valid: false, reason: 'Key sudah expired' });
  }
  res.json({ valid: true, expiresAt: license.expiresAt });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
