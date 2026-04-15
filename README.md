# Cloud Storage

A cloud storage web application with a REST API, mobile-friendly web UI, and JWT authentication — accessible from any device, phone, or other repository.

---

## Features

- 📤 Upload files (drag & drop or click)
- 📥 Download files
- 🗑 Delete files
- 🔐 JWT authentication (login, register)
- 📱 Mobile-friendly responsive UI
- 🌐 REST API for remote access from any app or repo

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`:

```
JWT_SECRET=your-very-long-random-secret-here
PORT=3000
```

### 3. Run the server

```bash
npm start
```

Open http://localhost:3000 in your browser.

For development with auto-restart (Node 18+):

```bash
npm run dev
```

---

## Deploy Online (Railway — free)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select this repo
4. Add environment variable `JWT_SECRET` in Railway's settings
5. Railway will give you a public URL like `https://your-app.railway.app`

### Render (alternative)

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect this GitHub repo
3. Set **Start Command** to `npm start`
4. Add `JWT_SECRET` in environment variables

---

## REST API Reference

All file endpoints require the `Authorization: Bearer <token>` header.

### Authentication

#### Register

```
POST /api/auth/register
Content-Type: application/json

{ "username": "alice", "password": "mypassword" }
```

#### Login

```
POST /api/auth/login
Content-Type: application/json

{ "username": "alice", "password": "mypassword" }
```

Response: `{ "token": "eyJ...", "username": "alice", "expiresIn": "7d" }`

### Files

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/files | List your files |
| POST | /api/files/upload | Upload files (multipart/form-data, field: `files`) |
| GET | /api/files/:id/download | Download a file |
| DELETE | /api/files/:id | Delete a file |

### Health check

```
GET /health
```

---

## Access from Another Repo

```javascript
// Node.js / browser
const res = await fetch('https://your-app.railway.app/api/files', {
  headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' },
});
const { files } = await res.json();
```

```bash
# curl
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-app.railway.app/api/files
```

```python
# Python
import requests
r = requests.get(
    'https://your-app.railway.app/api/files',
    headers={'Authorization': 'Bearer YOUR_JWT_TOKEN'}
)
print(r.json())
```

---

## Security Notes

- Change `JWT_SECRET` to a long random string before deploying  
  Generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `storage/` and `data/` are gitignored — files and user data stay on-server only
- Rate limiting: 100 req/15 min (20 for auth endpoints)
- Set `CORS_ORIGIN` to your specific domain in production

---

## Project Structure

```
Cloud-/
├── server/
│   ├── index.js           # Express app entry point
│   ├── db.js              # JSON file database
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   └── routes/
│       ├── auth.js        # Register & login
│       └── files.js       # File CRUD
├── public/
│   └── index.html         # Web UI
├── .env.example
├── .gitignore
└── package.json
```
