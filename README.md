# MyBrand Backend — Setup Guide

## Stack
- **Runtime**: Node.js + Express
- **Database**: SQLite (no setup needed — file created automatically)
- **Auth**: JWT (access token 15min + refresh token 7 days)
- **Email**: Nodemailer (Gmail or any SMTP)

---

## Quick Start

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your values:
- `JWT_SECRET` — any long random string
- `EMAIL_USER` / `EMAIL_PASS` — your Gmail + [App Password](https://myaccount.google.com/apppasswords)
- `EMAIL_TO` — where contact form emails are delivered
- `CLIENT_URL` — your frontend URL (for CORS)

### 3. Place your frontend
Copy your `index.html` into the `public/` folder.

Add this line before `</body>` in `index.html`:
```html
<script src="/api.js"></script>
```

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → get tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Get new access token |
| GET  | `/api/auth/me` | Get current user (requires token) |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| GET  | `/api/contact` | List messages (admin only) |
| PATCH | `/api/contact/:id/read` | Mark as read (admin) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/users` | List users (admin only) |
| PUT  | `/api/users/profile` | Update own profile |
| DELETE | `/api/users/:id` | Delete user (admin) |

---

## Make Yourself Admin

After registering, run this in your terminal:
```bash
sqlite3 data/mybrand.db "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

---

## Project Structure
```
backend/
├── server.js          ← Entry point
├── db.js              ← SQLite setup
├── .env               ← Your config (never commit this)
├── .env.example       ← Config template
├── middleware/
│   └── auth.js        ← JWT middleware
├── routes/
│   ├── auth.js        ← Register/login/logout
│   ├── contact.js     ← Contact form + email
│   └── users.js       ← User management
├── public/
│   ├── index.html     ← Your frontend (copy here)
│   └── api.js         ← Frontend ↔ backend connector
└── data/
    └── mybrand.db     ← SQLite database (auto-created)
```
