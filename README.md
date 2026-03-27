# Period Tracker Application

A modern, AI-powered period tracking application built with **FastAPI** (Backend) and **Next.js** (Frontend). Features include cycle prediction, symptom tracking, daily logs, notifications, and admin dashboard for system configuration.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Post-Installation](#post-installation)
- [Project Structure](#project-structure)

---

## Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Cycle Tracking**: Track menstrual cycles with smart predictions
- **AI Insights**: Dynamic luteal phase calculation, symptom probability predictions, and smart recommendations
- **Daily Logs**: Log daily symptoms, moods, and health data
- **Notifications**: Customizable notification system with multiple channels
- **Admin Dashboard**: System settings management with configurable AI parameters
- **Responsive UI**: Beautiful, mobile-friendly interface with Tailwind CSS

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

### For Docker Setup (Recommended)
- [Docker](https://docs.docker.com/get-docker/) (v20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 or higher)
- [Git](https://git-scm.com/downloads)

### For Manual Setup
- [Git](https://git-scm.com/downloads)
- [Python](https://www.python.org/downloads/) (3.11 or higher)
- [Node.js](https://nodejs.org/) (20.x or higher)
- [PostgreSQL](https://www.postgresql.org/download/) (14 or higher)
- [pip](https://pip.pypa.io/en/stable/installation/)

---

## Quick Start (Docker)

The fastest way to get the application running is using Docker Compose.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/period-tracker.git
cd period-tracker
```

### 2. Environment Setup

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

(Optional) Edit the `.env` files to customize settings like database credentials or JWT secret keys.

### 3. Start All Services

Run the entire stack with a single command:

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** database on port `5432`
- **Backend API** (FastAPI) on port `8000`
- **Frontend** (Next.js) on port `3000`

### 4. Verify Services

- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Frontend App: http://localhost:3000

### 5. Stop Services

```bash
docker-compose down
```

To remove all data (including database):

```bash
docker-compose down -v
```

---

## Manual Setup

If you prefer to run services separately without Docker, follow these steps.

### Backend Setup

#### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection details:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/period_tracker
SECRET_KEY=your-super-secret-key-change-this-in-production
```

#### 4. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE period_tracker;
\q
```

#### 5. Run the Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: http://localhost:8000

---

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Configure Environment

```bash
cp .env.example .env.local
```

The default API URL should work for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3. Run the Frontend

```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## Post-Installation

After starting the application for the first time, you need to initialize system settings and create an admin user.

### 1. Initialize System Settings

These are the default configuration values used by the AI prediction engine and other system features.

**With Docker:**

```bash
docker-compose exec backend python init_settings.py
```

**Without Docker:**

```bash
cd backend
python init_settings.py
```

You should see output like:
```
✅ Default system settings initialized successfully!
   Created 10 new settings.
```

### 2. Create Admin User

An admin user is required to access the system settings dashboard.

**With Docker:**

```bash
docker-compose exec backend python create_admin.py
```

**Without Docker:**

```bash
cd backend
python create_admin.py
```

Follow the prompts to enter email and password:
```
==================================================
   Create Admin Account
==================================================

Enter admin email: admin@example.com
Enter admin password: yoursecurepassword

✅ Admin account created successfully!
   Email: admin@example.com
```

### 3. Access Admin Dashboard

1. Login to the application at http://localhost:3000 with your admin credentials
2. Navigate to `/admin` to access the Admin Dashboard
3. Go to `/admin/settings` to configure system settings including AI parameters:
   - `ai_regularity_strict_sd`: Threshold for "Very Regular" cycle classification
   - `ai_regularity_moderate_sd`: Threshold for "Moderate Variation" classification
   - `ai_symptom_base_prob`: Base probability for symptom predictions
   - `ovulation_offset_days`: Standard luteal phase length

---

## Project Structure

```
period-tracker/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API Routes
│   │   ├── core/           # Database, Security
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   └── services/       # Business Logic
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── init_settings.py    # Initialize system settings
│   └── create_admin.py     # Create admin user script
│
├── frontend/               # Next.js Frontend
│   ├── app/               # Next.js App Router
│   ├── components/         # React Components
│   ├── lib/                # Utilities (API client)
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml      # Docker orchestration
└── README.md              # This file
```

---

## API Documentation

When the backend is running, interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/period_tracker` |
| `SECRET_KEY` | JWT signing key | `your-super-secret-key...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifetime | `60` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

---

## Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Ensure PostgreSQL is running
2. Check your `DATABASE_URL` in `.env`
3. Verify the database `period_tracker` exists

### Docker Issues

If services fail to start:
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build

# Reset everything (WARNING: deletes data)
docker-compose down -v
docker-compose up -d
```

### Port Conflicts

If ports 3000, 8000, or 5432 are in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 on host instead
```

---

## License

This project is private and not licensed for public use.

---

## Support

For issues or questions, please contact the development team.
