# LabLink — AI-Powered Campus Laboratory Resource Sharing Platform

A complete, secure, and intelligent web platform that connects students with specialized laboratory equipment across college departments. Built with React, Flask, MongoDB, and Gemini AI.

---

## Tech Stack

| Layer        | Technology                                        |
|--------------|--------------------------------------------------|
| Frontend     | React 18, Tailwind CSS 3, Vite, React Router 6   |
| Backend      | Python Flask 3, REST API                         |
| Database     | MongoDB (via Flask-PyMongo)                      |
| AI           | Google Gemini 1.5 Flash                          |
| Scheduling   | Custom FairShare Algorithm (Python)              |
| Auth         | Argon2id, HttpOnly Cookies, TOTP MFA             |
| Testing      | Pytest, pytest-flask                             |

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB 6+ (local or MongoDB Atlas)
- Google Gemini API key (optional — features degrade gracefully)
- An Authenticator app (Google Authenticator, Authy) for admin MFA

---

## Quick Start

### 1. Clone

```bash
git clone <your-repo-url>
cd Promptwars
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
copy .env.example .env     # Windows
cp .env.example .env       # macOS/Linux
# Edit .env and fill in real values

python run.py
# Backend runs at http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable           | Required | Description                                              |
|--------------------|----------|----------------------------------------------------------|
| `MONGO_URI`        | ✅        | MongoDB connection string                                |
| `SECRET_KEY`       | ✅        | Flask secret key (long random string)                    |
| `SESSION_SECRET`   | ✅        | Session cookie signing key (long random string)          |
| `ADMIN_SETUP_SECRET` | ✅     | Secret header value for provisioning admin accounts      |
| `GEMINI_API_KEY`   | ⚠️ Optional | Google Gemini API key (AI features fallback if missing) |
| `FLASK_ENV`        | ⚠️ Optional | `development` or `production` (default: `production`)   |
| `FLASK_DEBUG`      | ⚠️ Optional | `true` or `false` (default: `false`)                    |
| `CORS_ORIGINS`     | ⚠️ Optional | Comma-separated allowed origins (default: `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variable           | Description                      |
|--------------------|----------------------------------|
| `VITE_API_BASE_URL`| Backend URL (default: `http://localhost:5000`) |

> ⚠️ **Never commit `.env` files to git.** Only `.env.example` should be committed.

---

## Provision First Admin Account

Admin accounts cannot be self-registered. Use the setup endpoint once:

```bash
curl -X POST http://localhost:5000/api/admin/setup \
  -H "X-Setup-Secret: your_admin_setup_secret" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@lab.edu","password":"SecurePass1"}'
```

The response includes a `totp_secret` and `totp_uri`. **Save the TOTP secret — it won't be shown again.** Scan the URI with your Authenticator app.

---

## Seed Sample Equipment (Development)

```bash
curl -X POST http://localhost:5000/api/dev/seed \
  -H "X-Setup-Secret: your_admin_setup_secret"
```

---

## Project Structure

```
Promptwars/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Env config + validation
│   │   ├── extensions.py        # PyMongo singleton
│   │   ├── middleware/
│   │   │   └── auth.py          # @require_auth decorator
│   │   ├── models/
│   │   │   └── schemas.py       # Reference schemas
│   │   ├── routes/
│   │   │   ├── auth.py          # Student/faculty auth
│   │   │   ├── admin_auth.py    # Admin auth (TOTP MFA)
│   │   │   ├── admin_panel.py   # Admin control center
│   │   │   ├── admin_setup.py   # Admin provisioning
│   │   │   ├── ai.py            # Gemini + FairShare endpoints
│   │   │   ├── bookings.py      # Booking CRUD
│   │   │   ├── equipment.py     # Equipment discovery
│   │   │   ├── faculty.py       # Faculty approvals
│   │   │   ├── health.py        # Health check
│   │   │   ├── notifications.py # Student notifications
│   │   │   ├── projects.py      # Project requests
│   │   │   ├── public.py        # Public stats
│   │   │   ├── qr.py            # QR check-in/out
│   │   │   ├── seed.py          # Dev data seeding
│   │   │   ├── student_dashboard.py
│   │   │   └── waitlist.py      # Smart waitlist
│   │   └── utils/
│   │       ├── db_indexes.py    # MongoDB indexes
│   │       ├── fairshare.py     # FairShare algorithm
│   │       ├── gemini_client.py # Gemini API client
│   │       ├── security.py      # Argon2id hashing
│   │       ├── session_manager.py
│   │       └── validators.py
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_equipment.py
│   │   ├── test_faculty.py
│   │   ├── test_ai.py
│   │   └── test_additional.py
│   ├── conftest.py              # Test env setup
│   ├── run.py
│   ├── requirements.txt
│   ├── .env                     # ← gitignored
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/              # AI recommendation panels
│   │   │   ├── auth/            # Auth layout + form field
│   │   │   ├── common/          # Navbar, Footer
│   │   │   ├── dashboard/       # DashboardLayout
│   │   │   ├── equipment/       # Equipment cards + modal
│   │   │   ├── landing/         # Landing page sections
│   │   │   └── requests/        # New request modal
│   │   ├── hooks/
│   │   │   ├── useAI.js
│   │   │   ├── useAuth.js
│   │   │   └── useEquipment.js
│   │   ├── pages/
│   │   │   ├── admin/           # Admin login + dashboard
│   │   │   ├── auth/            # Login + register pages
│   │   │   ├── faculty/         # Faculty portal
│   │   │   └── student/         # Student portal
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles/index.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── postcss.config.js
├── .gitignore
└── README.md
```

---

## API Endpoints

### Public
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/health`               | System health check      |
| GET    | `/api/public/stats`         | Campus statistics        |
| GET    | `/api/public/featured-equipment` | Featured equipment  |

### Auth
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/register`        | Student/faculty register |
| POST   | `/api/auth/login`           | Student/faculty login    |
| POST   | `/api/auth/logout`          | Logout                   |
| GET    | `/api/auth/me`              | Current user info        |

### Equipment
| Method | Endpoint                            | Description             |
|--------|-------------------------------------|-------------------------|
| GET    | `/api/equipment/`                   | List (search/filter)    |
| GET    | `/api/equipment/<id>`               | Detail                  |
| GET    | `/api/equipment/<id>/availability`  | Availability check      |

### Projects & Bookings
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| POST   | `/api/projects/`                | Submit project request  |
| GET    | `/api/projects/`                | My requests             |
| PATCH  | `/api/projects/<id>/cancel`     | Cancel request          |
| POST   | `/api/bookings/`                | Create booking          |
| GET    | `/api/bookings/`                | My bookings             |
| PATCH  | `/api/bookings/<id>/cancel`     | Cancel booking          |

### Notifications
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | `/api/notifications/`                 | List notifications + unread count |
| PATCH  | `/api/notifications/<id>/read`        | Mark single notification read |
| PATCH  | `/api/notifications/read-all`         | Mark all notifications read  |

### Waitlist
| Method | Endpoint                        | Description                      |
|--------|---------------------------------|----------------------------------|
| POST   | `/api/waitlist/`                | Join waitlist for equipment      |
| GET    | `/api/waitlist/`                | My active waitlist entries       |
| PATCH  | `/api/waitlist/<id>/leave`      | Leave waitlist                   |

### QR Check-in/out
| Method | Endpoint                | Description                   |
|--------|-------------------------|-------------------------------|
| POST   | `/api/qr/checkin`       | Check in with QR token        |
| POST   | `/api/qr/checkout`      | Check out with QR token       |

### AI
| Method | Endpoint                    | Description                       |
|--------|-----------------------------|-----------------------------------|
| POST   | `/api/ai/recommend`         | Gemini equipment recommendations  |
| POST   | `/api/ai/score`             | FairShare priority score          |
| GET    | `/api/ai/rank`              | Rank all requests (faculty)       |
| GET    | `/api/ai/alternatives`      | Alternative time slots            |

### Admin
| Method | Endpoint                            | Description              |
|--------|-------------------------------------|--------------------------|
| POST   | `/api/admin/setup`                  | Provision admin account  |
| POST   | `/api/admin/login`                  | Admin login (TOTP MFA)   |
| GET    | `/api/admin/panel/stats`            | Admin dashboard stats    |
| GET    | `/api/admin/panel/users`            | User management          |
| GET    | `/api/admin/panel/sessions`         | Session monitoring       |
| GET    | `/api/admin/panel/audit-logs`       | Audit trail              |

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Security Notes

- Passwords hashed with **Argon2id** (time_cost=2, memory=65536)
- Sessions stored in MongoDB, **never in cookies** (only token reference)
- Admin accounts require **TOTP MFA** (never stored in plain text)
- All sensitive cookies are **HttpOnly, SameSite=Strict**
- **Audit logs** track all admin actions
- Password hashes and tokens are **never returned** in API responses
- Rate limiting via Flask-Limiter
- Input sanitization on all user-supplied strings
- MongoDB injection protection via ObjectId validation

---

## FairShare Algorithm

Priority scoring weights:
- **40%** Deadline urgency
- **25%** Equipment necessity (count + technical depth)
- **20%** Usage fairness (inverse of recent bookings)
- **15%** Availability feasibility

Gemini AI **explains** allocation decisions but **never determines** winners.

---

© 2024 LabLink. Built for hackathon demonstration purposes.
