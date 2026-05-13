const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');
const app = express();

// Railway akan kasih PORT otomatis
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load database license dari file
let licenses = {};
const LICENSE_FILE = './licenses.json';

if (fs.existsSync(LICENSE_FILE)) {
  try {
    const data = fs.readFileSync(LICENSE_FILE, 'utf8');
    licenses = JSON.parse(data);
    console.log(`✅ Loaded ${Object.keys(licenses).length} existing licenses`);
  } catch (error) {
    console.error('Error loading licenses:', error.message);
  }
}

// Simpan license ke file
function saveLicenses() {
  try {
    fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenses, null, 2));
  } catch (error) {
    console.error('Error saving licenses:', error.message);
  }
}

// ==================== ADMIN API ====================

// Generate key baru
app.post('/admin/generate-key', (req, res) => {
  const { duration } = req.body;

  if (!duration || duration < 1) {
    return res.status(400).json({
      success: false,
      message: 'Durasi harus minimal 1 hari'
    });
  }

  // Generate random key
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  const key = 'SIGMA-' + segments.join('-');

  const now = Date.now();
  const expiry = now + (duration * 24 * 60 * 60 * 1000);

  licenses[key] = {
    createdAt: now,
    expiresAt: expiry,
    isActive: true,
    duration: duration,
    createdAtFormatted: new Date(now).toLocaleString('id-ID'),
    expiresAtFormatted: new Date(expiry).toLocaleString('id-ID')
  };

  saveLicenses();

  console.log(`✅ Key Generated: ${key}`);
  console.log(`   Expires: ${licenses[key].expiresAtFormatted}`);

  res.json({
    success: true,
    key: key,
    expiresAt: new Date(expiry).toISOString(),
    duration: duration,
    message: `Key berhasil dibuat, berlaku ${duration} hari`
  });
});

// List semua key
app.get('/admin/list-keys', (req, res) => {
  const keysList = Object.entries(licenses).map(([key, data]) => ({
    key: key,
    ...data,
    isExpired: Date.now() > data.expiresAt,
    remainingDays: Math.max(0, Math.ceil((data.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
  }));

  res.json({
    success: true,
    total: keysList.length,
    keys: keysList
  });
});

// ==================== PUBLIC API ====================

// Validasi key
app.post('/api/validate-key', (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.json({
      valid: false,
      message: 'Key tidak boleh kosong'
    });
  }

  if (!licenses[key]) {
    return res.json({
      valid: false,
      message: 'Key tidak valid atau tidak ditemukan'
    });
  }

  if (!licenses[key].isActive) {
    return res.json({
      valid: false,
      message: 'Key ini telah dinonaktifkan'
    });
  }

  if (Date.now() > licenses[key].expiresAt) {
    return res.json({
      valid: false,
      message: 'Key sudah expired',
      expiredAt: new Date(licenses[key].expiresAt).toISOString()
    });
  }

  const remaining = Math.ceil((licenses[key].expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

  console.log(`✅ Key validated: ${key} (Remaining: ${remaining} days)`);

  res.json({
    valid: true,
    expiresAt: licenses[key].expiresAt,
    remainingDays: remaining,
    message: `Key valid, sisa ${remaining} hari`
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Halaman utama
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SigmaDOTS Server</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #333; margin-bottom: 10px; }
        .status { color: #28a745; font-size: 18px; margin: 20px 0; }
        .info { color: #666; font-size: 14px; line-height: 1.8; }
        .endpoint {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          margin: 10px 0;
          font-family: monospace;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 SigmaDOTS Server</h1>
        <div class="status">✅ Server Online</div>
        <div class="info">
          <p>License Management Server</p>
          <div class="endpoint">
            🔑 Generate Key<br>
            <code>POST /admin/generate-key</code>
          </div>
          <div class="endpoint">
            ✅ Validate Key<br>
            <code>POST /api/validate-key</code>
          </div>
          <div class="endpoint">
            📋 List Keys<br>
            <code>GET /admin/list-keys</code>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 SigmaDOTS License Server');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:   http://0.0.0.0:${PORT}`);
  console.log(`🔑 Validate: /api/validate-key`);
  console.log(`🎫 Generate: /admin/generate-key`);
  console.log(`📋 List:     /admin/list-keys`);
  console.log(`🏥 Health:   /api/health`);
  console.log('═══════════════════════════════════════');
});
