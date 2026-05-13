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

// ==================== HALAMAN UTAMA ====================
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
        a { color: #667eea; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 SigmaDOTS Server</h1>
        <div class="status">✅ Server Online</div>
        <div class="info">
          <p>License Management Server</p>
          <div class="endpoint">
            🔑 <a href="/admin/generate">Generate Key</a><br>
            <code>POST /admin/generate-key</code>
          </div>
          <div class="endpoint">
            ✅ Validate Key<br>
            <code>POST /api/validate-key</code>
          </div>
          <div class="endpoint">
            📋 <a href="/admin/list-keys">List Keys</a><br>
            <code>GET /admin/list-keys</code>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ==================== HALAMAN GENERATE KEY ====================
app.get('/admin/generate', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Generate Key - SigmaDOTS</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
        }
        .logo { text-align: center; font-size: 50px; margin-bottom: 10px; }
        h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 25px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #555; font-size: 14px; }
        .duration-group { display: flex; gap: 10px; align-items: center; }
        .duration-group input { flex: 1; }
        .duration-group select { width: 120px; }
        input, select {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.3s;
          font-family: inherit;
        }
        input:focus, select:focus { outline: none; border-color: #667eea; }
        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4); }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .result {
          margin-top: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          display: none;
        }
        .result.show { display: block; }
        .result h3 { color: #28a745; margin-bottom: 15px; text-align: center; }
        .key-display {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 2px dashed #667eea;
          text-align: center;
          margin: 10px 0;
          word-break: break-all;
          user-select: all;
        }
        .copy-btn {
          background: #28a745;
          font-size: 14px;
          padding: 12px;
          margin-top: 10px;
        }
        .copy-btn:hover { background: #218838; }
        .info { font-size: 13px; color: #666; margin-top: 12px; text-align: center; line-height: 1.6; }
        .loader { display: none; text-align: center; margin: 15px 0; }
        .loader.active { display: block; }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: #667eea; text-decoration: none; font-size: 14px; }
        .back-link a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔐</div>
        <h1>Generate License Key</h1>
        <p class="subtitle">Buat key untuk aktivasi SigmaDOTS Extension</p>
        
        <div class="form-group">
          <label>Durasi Lisensi</label>
          <div class="duration-group">
            <input type="number" id="duration" value="7" min="1" max="365" placeholder="Durasi">
            <select id="durationType">
              <option value="days">Hari</option>
              <option value="weeks">Minggu</option>
              <option value="months">Bulan</option>
            </select>
          </div>
        </div>
        
        <button id="generateBtn" onclick="generateKey()">🔑 Generate Key</button>
        
        <div class="loader" id="loader">
          <div class="spinner"></div>
          <p style="margin-top: 10px; color: #666;">Membuat key...</p>
        </div>
        
        <div class="result" id="result">
          <h3>✅ Key Berhasil Dibuat!</h3>
          <div class="key-display" id="keyDisplay"></div>
          <button class="copy-btn" onclick="copyKey()">📋 Copy Key</button>
          <div class="info" id="expiryInfo"></div>
        </div>
        
        <div class="back-link">
          <a href="/">← Kembali ke Home</a>
        </div>
      </div>
      
      <script>
        let generatedKey = '';
        
        async function generateKey() {
          const durationInput = document.getElementById('duration');
          const durationType = document.getElementById('durationType').value;
          let duration = parseInt(durationInput.value);
          
          if (!duration || duration < 1) {
            alert('Durasi harus minimal 1');
            return;
          }
          
          if (durationType === 'weeks') duration *= 7;
          if (durationType === 'months') duration *= 30;
          
          const btn = document.getElementById('generateBtn');
          const loader = document.getElementById('loader');
          const result = document.getElementById('result');
          
          btn.disabled = true;
          loader.classList.add('active');
          result.classList.remove('show');
          
          try {
            const response = await fetch('/admin/generate-key', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ duration })
            });
            
            const data = await response.json();
            
            if (data.success) {
              generatedKey = data.key;
              document.getElementById('keyDisplay').textContent = data.key;
              
              const expiryDate = new Date(data.expiresAt);
              document.getElementById('expiryInfo').innerHTML = 
                '<strong>⏰ Expired:</strong> ' + expiryDate.toLocaleString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) + '<br><strong>📅 Durasi:</strong> ' + duration + ' hari';
              
              result.classList.add('show');
              result.scrollIntoView({ behavior: 'smooth' });
            } else {
              alert('Gagal: ' + data.message);
            }
          } catch (error) {
            alert('Error: ' + error.message);
          } finally {
            btn.disabled = false;
            loader.classList.remove('active');
          }
        }
        
        function copyKey() {
          if (!generatedKey) return;
          navigator.clipboard.writeText(generatedKey).then(() => {
            const btn = document.querySelector('.copy-btn');
            const original = btn.textContent;
            btn.textContent = '✅ Tercopy!';
            btn.style.background = '#218838';
            setTimeout(() => {
              btn.textContent = original;
              btn.style.background = '#28a745';
            }, 2000);
          }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = generatedKey;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('✅ Key dicopy!');
          });
        }
        
        // Enter key untuk submit
        document.getElementById('duration').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') generateKey();
        });
      </script>
    </body>
    </html>
  `);
});

// ==================== ADMIN API ====================

// Generate key baru (POST)
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

// List semua key (GET)
app.get('/admin/list-keys', (req, res) => {
  const keysList = Object.entries(licenses).map(([key, data]) => ({
    key: key,
    ...data,
    isExpired: Date.now() > data.expiresAt,
    remainingDays: Math.max(0, Math.ceil((data.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
  }));

  // Tampilkan sebagai HTML
  const htmlKeys = keysList.map(k => `
    <div style="background: ${k.isExpired ? '#ffe0e0' : '#e0ffe0'}; padding: 15px; margin: 10px 0; border-radius: 8px; font-family: monospace;">
      <strong>🔑 ${k.key}</strong><br>
      Status: ${k.isExpired ? '❌ EXPIRED' : k.isActive ? '✅ AKTIF' : '🚫 NONAKTIF'}<br>
      Dibuat: ${k.createdAtFormatted}<br>
      Expired: ${k.expiresAtFormatted}<br>
      Sisa: ${k.remainingDays} hari
    </div>
  `).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>License Keys - SigmaDOTS</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #333; text-align: center; }
        .back-link { text-align: center; margin-top: 20px; }
        .back-link a { color: #667eea; text-decoration: none; font-weight: bold; }
        .back-link a:hover { text-decoration: underline; }
        .total { text-align: center; color: #666; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Daftar License Keys</h1>
        <p class="total">Total: ${keysList.length} key</p>
        ${htmlKeys || '<p style="text-align:center;color:#666;">Belum ada key yang dibuat.</p>'}
        <div class="back-link">
          <a href="/">← Kembali ke Home</a> | 
          <a href="/admin/generate">🔑 Generate Key Baru</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ==================== PUBLIC API ====================

// Validasi key (POST)
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

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('🚀 SigmaDOTS License Server');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Server:   http://0.0.0.0:${PORT}`);
  console.log(`🔑 Generate: /admin/generate`);
  console.log(`📋 List:     /admin/list-keys`);
  console.log(`🏥 Health:   /api/health`);
  console.log('═══════════════════════════════════════');
});
