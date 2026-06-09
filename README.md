# 🖥️ SigmaDOTS Server

Backend Express server untuk sistem lisensi **SigmaDOTS Chrome Extension**. Menangani validasi license key dan generate token yang dikonsumsi langsung oleh popup ekstensi.

**Deploy:** Railway — `https://sigmadots-server-production.up.railway.app`

---

## Fitur

- **Verifikasi License Key** — Endpoint untuk memvalidasi key yang diinput pengguna di popup SigmaDOTS
- **Generate License Key** — Endpoint admin untuk membuat license key baru
- **CORS Support** — Dikonfigurasi agar bisa diakses dari Chrome extension
- **Persistent Process** — Berjalan sebagai long-running server (bukan serverless), cocok untuk Railway

---

## Tech Stack

- **Runtime:** Node.js >= 18
- **Framework:** Express.js
- **Middleware:** CORS (`cors`)
- **Deploy:** Railway

---

## Struktur Project

```
sigmadots-server/
├── server.js         # Entry point — semua route dan logic ada di sini
├── package.json
└── .gitignore
```

---

## Environment Variable

Set environment variable berikut di Railway dashboard (atau file `.env` untuk lokal):

```env
ADMIN_SECRET=your_admin_secret_here
```

> ⚠️ Jangan pernah commit nilai `ADMIN_SECRET` ke repo.

---

## API Endpoints

### `POST /verify`
Verifikasi license key dari ekstensi.

**Request body:**
```json
{
  "key": "LICENSE_KEY_DISINI"
}
```

**Response sukses (`200`):**
```json
{
  "valid": true
}
```

**Response gagal (`401`):**
```json
{
  "valid": false
}
```

---

### `POST /generate`
Generate license key baru. Hanya bisa diakses dengan `ADMIN_SECRET` yang benar.

**Request body:**
```json
{
  "secret": "ADMIN_SECRET_DISINI",
  "days": 30
}
```

**Response sukses (`200`):**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX"
}
```

---

## Instalasi Lokal

```bash
# Clone repo
git clone https://github.com/cuakproject/sigmadots-server.git
cd sigmadots-server

# Install dependencies
npm install

# Buat file .env
echo "ADMIN_SECRET=your_secret" > .env

# Jalankan server
npm start
```

Server akan berjalan di `http://localhost:3000`.

---

## Deployment ke Railway

1. Push ke branch `main`
2. Railway otomatis detect `npm start` dari `package.json`
3. Set `ADMIN_SECRET` di **Railway → Variables**
4. Server live di URL Railway yang di-assign

```bash
git add .
git commit -m "update"
git push origin main
```

---

## Relasi dengan Project Lain

Server ini adalah bagian dari ekosistem **SigmaDOTS**:

| Project | Repo | Fungsi |
|---|---|---|
| SigmaDOTS Extension | `cuakproject/sigmadots-full` | Chrome extension — consume API server ini |
| SigmaDOTS Server | `cuakproject/sigmadots-server` | Backend validasi & generate license key |

---

## Lisensi

Internal use only — [cuakproject](https://github.com/cuakproject)
