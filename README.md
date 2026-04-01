# Period Tracker with Personalized AI

> **Created By:** CPE STUDENTS  
> An AI-powered menstrual cycle tracking application with hybrid prediction engine.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Post-Installation](#post-installation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Architecture Documentation](#architecture-documentation)

---

## Project Overview

A modern period tracking application featuring:

- **3-Tier Hybrid AI Prediction**: Weighted Moving Average + Bayesian Shrinkage + ML Model
- **Personalized Insights**: Symptom probability, dynamic luteal phase calculation
- **AI Health Chatbot**: Google Gemini-powered conversational assistant
- **Community Features**: Anonymous health discussions with AI moderation
- **Admin Dashboard**: Dynamic configuration of AI parameters

---

## Features

### Core Tracking
- Cycle logging with period length tracking
- Daily symptom and mood logging
- Cycle history visualization (calendar + charts)
- Fertility window prediction

### AI-Powered Features
- **Smart Prediction**: Automatically selects best algorithm based on data availability
- **Symptom Probability**: Personalized predictions based on historical patterns
- **Dynamic Luteal Phase**: Adjusts ovulation prediction based on cycle regularity
- **Smart Recommendations**: AI-generated health tips based on cycle patterns

### Community & Support
- Anonymous community posts and comments
- AI chatbot for menstrual health questions
- Content moderation using Gemini API
- Notification system (in-app)

### Admin Features
- User management dashboard
- System settings with AI parameter tuning
- Database-driven configuration (no redeploy needed)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy 2.0 |
| **Database** | PostgreSQL 16 |
| **Authentication** | JWT (python-jose), bcrypt |
| **AI/ML** | Scikit-learn (HistGradientBoostingRegressor) |
| **Chatbot** | Google Gemini API |
| **Container** | Docker, Docker Compose |

---

## Prerequisites

### Docker Setup (Recommended)
- [Docker](https://docs.docker.com/get-docker/) v20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+
- [Git](https://git-scm.com/downloads)

### Manual Setup
- Git
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

---

## Quick Start (Docker)

### 1. Clone and Configure

```bash
git clone https://github.com/your-username/period-tracker.git
cd period-tracker

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Start All Services

```bash
docker-compose up -d
```

Services started:
- PostgreSQL on port `5432`
- FastAPI Backend on port `8000`
- Next.js Frontend on port `3000`

### 3. Initialize System

```bash
# Create system settings
docker-compose exec backend python init_settings.py

# Create admin user
docker-compose exec backend python create_admin.py
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000/admin

### 5. Stop Services

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

---

## Manual Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Create database (in psql)
CREATE DATABASE period_tracker;

# Run migrations (if using Alembic)
alembic upgrade head

# Initialize settings
python init_settings.py

# Create admin
python create_admin.py

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start dev server
npm run dev
```

---

## Post-Installation

### 1. System Settings Initialization

The AI prediction engine requires system settings to be initialized:

```bash
# With Docker
docker-compose exec backend python init_settings.py

# Without Docker
cd backend
python init_settings.py
```

Key AI settings created:
- `ai_regularity_strict_sd`: 2.0 (SD threshold for "Very Regular")
- `ai_regularity_moderate_sd`: 4.0 (SD threshold for "Moderate Variation")
- `ai_symptom_base_prob`: 30 (base probability for symptom predictions)
- `ovulation_offset_days`: 14 (standard luteal phase length)

### 2. Create Admin User

```bash
# With Docker
docker-compose exec backend python create_admin.py

# Without Docker
cd backend
python create_admin.py
```

Follow prompts to enter email and password.

### 3. Configure Gemini API (Optional)

For AI chatbot functionality, add your Gemini API key:

```bash
# Edit backend/.env
GEMINI_API_KEY=your-api-key-here
```

Get a key from: https://ai.google.dev/

---

## Project Structure

```
period-tracker/
│
├── README.md                 # This file
├── ARCHITECTURE.md          # Detailed engineering documentation
├── docker-compose.yml       # Docker orchestration
├── requirements.txt         # Python dependencies
│
├── frontend/                # Next.js 16 Application
│   ├── app/                 # App Router (Next.js 16)
│   │   ├── (app)/           # Protected routes
│   │   │   ├── dashboard/   # User dashboard
│   │   │   ├── daily-log/   # Symptom tracking
│   │   │   ├── community/   # Community features
│   │   │   ├── admin/       # Admin dashboard
│   │   │   └── ...
│   │   ├── components/      # React components
│   │   └── lib/             # API utilities
│   ├── package.json
│   └── Dockerfile
│
├── backend/                 # FastAPI Application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── tests/              # Test suite
│   ├── init_settings.py    # Initialize system settings
│   ├── create_admin.py     # Create admin user
│   └── Dockerfile
│
└── ml/                     # Machine Learning
    ├── base_model/         # Training & prediction
    ├── data/               # Datasets
    └── saved_models/       # Trained models
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/period_tracker` |
| `SECRET_KEY` | JWT signing key | Change in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifetime | `60` |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

---

## API Documentation

Interactive API documentation is available when the backend is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login (returns JWT) |
| `GET /cycles` | List user cycles |
| `POST /cycles` | Create new cycle |
| `GET /cycles/insights` | Get AI insights |
| `GET /predict` | Get next cycle prediction |
| `GET /daily-logs` | List daily logs |
| `POST /daily-logs` | Create daily log |
| `POST /chat` | Chat with AI assistant |
| `GET /community/posts` | List community posts |
| `GET /admin/settings` | Get system settings |
| `PUT /admin/settings/{key}` | Update setting |

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs db

# Reset database (WARNING: deletes data)
docker-compose down -v
docker-compose up -d
docker-compose exec backend python init_settings.py
```

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Rebuild containers
docker-compose up -d --build
```

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port Conflicts

If ports 3000, 8000, or 5432 are in use, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Use 3001 on host
  backend:
    ports:
      - "8001:8000"  # Use 8001 on host
```

---

## Architecture Documentation

For detailed technical documentation including:
- Mathematical formulas (WMA, Bayesian Shrinkage)
- Architecture decisions
- Database schema details
- ML model specifications

See **[ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## Future Roadmap

| Feature | Status | Priority |
|---------|--------|----------|
| Email Notifications | ⚠️ Partial | High |
| Mobile App (React Native) | ❌ Planned | Medium |
| Advanced ML Personalization | ⚠️ Scaffolding | Medium |
| Wearable Device Integration | ❌ Planned | Low |

---

## Support

For issues or questions:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
2. Review API documentation at `/docs` endpoint
3. Contact the CPE STUDENTS development team

---

**License:** Private - For educational purposes only

**Developed By:** CPE STUDENTS | April 2026


---

