# Period Tracker - Engineering Playbook
> **Student Engineering Handover Documentation**
> 
> **Created By:** CPE STUDENTS  
> **Last Updated:** April 2026

---

## 1. Project Overview & Tech Stack

### 1.1 Project Overview

**Period Tracker with Personalized AI** is a menstrual cycle tracking application featuring an AI-powered prediction engine that addresses the **Cold Start Problem** (new users with limited historical data). The system combines statistical methods with machine learning to provide accurate predictions across all user data availability levels.

### 1.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Server-side rendering for SEO, App Router for modern routing, TypeScript for type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework with consistent design system |
| **Backend** | FastAPI + Python 3.11 | High-performance ASGI framework, automatic OpenAPI docs, native async support |
| **Database** | PostgreSQL 16 | ACID compliance, JSONB for flexible schema, production-ready |
| **ORM** | SQLAlchemy 2.0 | Declarative models, migration support, connection pooling |
| **Authentication** | JWT (python-jose) + bcrypt | Stateless authentication, secure password hashing |
| **AI/ML** | Scikit-learn (HistGradientBoostingRegressor) | Native NaN support, resistant to overfitting with small data |
| **Chatbot** | Google Gemini API | Context-aware AI assistant for menstrual health queries |
| **Container** | Docker + Docker Compose | One-command deployment, consistent dev/prod environments |

### 1.3 Key Features

1. **Hybrid Prediction Engine** - 3-tier automated intelligence:
   - **Global ML Model** (HistGradientBoosting): Cold start users (0-3 cycles)
   - **Bayesian Shrinkage**: Sparse data users (4-5 cycles)
   - **Weighted Moving Average**: Rich data users (6+ cycles)

2. **Dynamic Configuration** - Admin-adjustable AI parameters via database (no redeploy needed)

3. **Personalized AI Insights**:
   - Symptom probability prediction
   - Dynamic luteal phase calculation
   - Smart recommendations based on cycle patterns

4. **Community Features** - Anonymous health discussions with AI content moderation

5. **AI Health Chatbot** - Context-aware assistant with menstrual health knowledge

---

## 2. Mathematical Formulas & Methodology

### 2.1 Weighted Moving Average (WMA) for Cycle Prediction

Used for users with 6+ cycles of historical data. Recent cycles receive higher weights.

```
WMA = Σ(v_i × w_i) / Σ(w_i)

Where:
- v_i = cycle length at position i (chronological order)
- w_i = weight at position i = i (linear weighting: 1, 2, 3, ..., n)
- n = number of cycles in window (max 6)
```

**Outlier Removal (performed before WMA):**
```
For each value v:
    z = (v - μ) / σ
    Keep v if |z| ≤ 2

Where:
- μ = arithmetic mean of values
- σ = standard deviation of values
```

**Rationale**: WMA adapts to recent trends better than simple moving average. Outlier removal prevents anomalous cycles (sickness, stress) from distorting predictions.

### 2.2 Bayesian Shrinkage for Sparse Data

Used for users with 4-5 cycles. Blends user data with global population priors.

```
Posterior Mean = (n × UserMean + k × GlobalPrior) / (n + k)

Where:
- n = number of user cycles
- k = prior strength (pseudo-observations) = 3
- UserMean = user's average cycle length
- GlobalPrior = mean from population data (~28 days)
```

**Shrinkage Factor:**
```
Shrinkage = k / (n + k)
```

| Cycles | Shrinkage | Interpretation |
|--------|-----------|----------------|
| 4 | 3/7 = 43% | Heavy weight on global prior |
| 5 | 3/8 = 38% | Moderate shrinkage |
| 6 | 3/9 = 33% | Light shrinkage (WMA preferred) |

**Rationale**: Empirical Bayes prevents overfitting with limited data. As user data grows, the estimate shifts toward personal history.

### 2.3 Confidence Score Calculation

```
Confidence = [(1 - σ/μ) × 0.7 + min(1, n/6) × 0.3] × 100

Where:
- σ = standard deviation of cycle lengths
- μ = mean cycle length
- n = number of cycles (capped at 6)
- 0.7 = weight for regularity component
- 0.3 = weight for data volume component
```

**Confidence by Tier:**
| Tier | Algorithm | Typical Confidence |
|------|-----------|-------------------|
| 1 | Global ML | ~50% |
| 2 | Bayesian | ~65% |
| 3 | WMA | 70-95% |
| Fixed | User-defined | 95% |

**Rationale**: Combines regularity (inverse of CV) and data volume for a calibrated confidence metric.

### 2.4 Standard Deviation for Cycle Regularity

```
σ = √[Σ(x_i - μ)² / (n - 1)]

Where:
- x_i = individual cycle length
- μ = mean cycle length
- n = number of cycles
```

**Regularity Classification:**
```
If σ ≤ strict_sd (2.0):      → "very_regular"
If σ ≤ moderate_sd (4.0):  → "moderate_variation"
Else:                       → "high_variation"
```

**Rationale**: Standard deviation is the appropriate measure for cycle variability (variance in days²).

### 2.5 Dynamic Luteal Phase Calculation

```
CycleDeviation = μ - 28

If σ ≤ strict_sd:
    Adjustment = round(CycleDeviation × 0.3)
    Method = "learned_from_regular_cycles"
    
ElseIf σ ≤ moderate_sd:
    Adjustment = round(CycleDeviation × 0.15)
    Method = "learned_from_moderate_variation"
    
Else:
    Adjustment = 0
    Method = "standard_fallback_high_variation"

LearnedPhase = clamp(BasePhase + Adjustment, 10, 18)
```

**Rationale**: Longer cycles typically have longer follicular phases, not luteal phases. The adjustment factors (0.3, 0.15) are conservative estimates based on reproductive biology literature.

### 2.6 Symptom Probability with Weighted Blending

**Base Probability Scaling:**
```
BaseProb(s) = min(95, base_setting × scale_factor[s])

Where:
- base_setting = ai_symptom_base_prob (default: 30)
- scale_factor = {Cramps: 2.17, Acne: 1.33, Mood: 1.67, Bloating: 1.83, Fatigue: 2.0}
```

**Blended Probability (with user data):**
```
weight = min(0.8, cycles_with_data / 6)
BlendedProb = round(UserProb × weight + BaseProb × (1 - weight))
FinalProb = clamp(BlendedProb, 5, 95)
```

**Rationale**: More user data = more weight on personal history. Caps prevent 0% or 100% predictions (biological uncertainty).

### 2.7 Ovulation and Fertility Window Prediction

```
PredictedOvulation = LastPeriodStart + (CycleLength - LutealPhase)

FertilityWindowStart = PredictedOvulation - (5 + spread)
FertilityWindowEnd = PredictedOvulation + (1 + spread)

Where:
- spread = min(2, floor(cycle_std_dev))
- LutealPhase = from dynamic calculation (default 14)
```

**Rationale**: Fertility window spans 5 days before ovulation (sperm survival) + ovulation day + 1 day after. Spread increases with cycle variability.

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend (Port 3000)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │   React 19   │  │ Tailwind CSS │  │   React Calendar/Charts  │ │   │
│  │  │   Components │  │   Styling    │  │   (recharts, calendar)   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                              HTTP / REST                                    │
│                                    │                                        │
│                              API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  FastAPI Backend (Port 8000)                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │   │
│  │  │ Auth API     │  │ Cycle API    │  │ AI Insights  │  │ Admin   │ │   │
│  │  │ /auth        │  │ /cycles      │  │ /cycles/     │  │ /admin  │ │   │
│  │  └──────────────┘  └──────────────┘  │ insights     │  │         │ │   │
│  │  ┌──────────────┐  ┌──────────────┐  └──────────────┘  └─────────┘ │   │
│  │  │ Daily Log    │  │ Notification │  ┌──────────────┐  ┌─────────┐ │   │
│  │  │ /daily-logs  │  │ /notifications│  │ Prediction │  │ Chat    │ │   │
│  │  └──────────────┘  └──────────────┘  │ /predict   │  │ /chat   │ │   │
│  │                                       └──────────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                              SQLAlchemy ORM                                 │
│                                    │                                        │
│                           DATA PERSISTENCE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database (Port 5432)                 │   │
│  │                                                                     │   │
│  │   Tables: users, cycles, daily_logs, notifications,               │   │
│  │           system_settings, user_setups, communities               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              ML LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   ML Model (HistGradientBoosting)                  │   │
│  │                                                                     │   │
│  │   File: ml/base_model/train.py                                    │   │
│  │   Model: Global Prior for Cold Start Users                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                           EXTERNAL SERVICES                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Google Gemini API                                │   │
│  │                   (AI Chatbot & Content Moderation)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Project Structure

```
period-tracker/
│
├── README.md                      # Quick start and user guide
├── ARCHITECTURE.md               # This document - engineering playbook
├── docker-compose.yml            # Full stack orchestration
├── docker-compose-new.yml        # Alternative Docker configuration
├── .env.example                  # Environment template
├── requirements.txt              # Python dependencies
│
├── frontend/                      # Next.js 16 Application
│   ├── app/
│   │   ├── (app)/                 # Group routes (App Router)
│   │   │   ├── account/           # User account management
│   │   │   ├── add-cycle/         # Quick add cycle page
│   │   │   ├── admin/             # Admin Dashboard
│   │   │   │   ├── page.tsx       # Admin overview
│   │   │   │   ├── settings/      # System settings UI
│   │   │   │   └── users/         # User management
│   │   │   ├── community/         # Community features
│   │   │   ├── dashboard/         # User dashboard
│   │   │   ├── daily-log/         # Daily symptom tracking
│   │   │   ├── data-privacy/      # Privacy settings
│   │   │   ├── health-library/    # Health education
│   │   │   ├── notifications/     # Notification center
│   │   │   └── trends/            # Insights & Trends
│   │   │
│   │   ├── (public)/              # Public routes (login, register)
│   │   ├── components/            # Shared React components
│   │   │   ├── AIPredictionReport.tsx    # AI insights display
│   │   │   ├── CycleCalendar.tsx         # Calendar component
│   │   │   ├── CycleChart.tsx            # Charts visualization
│   │   │   ├── CycleDashboard.tsx        # Main dashboard
│   │   │   ├── DailyLogModal.tsx         # Daily log editor
│   │   │   ├── PredictionTimeline.tsx    # Prediction visualization
│   │   │   ├── Sidebar.tsx               # Navigation
│   │   │   └── ui/                       # Reusable UI components
│   │   │
│   │   ├── lib/
│   │   │   └── api.ts             # API client utilities
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript type definitions
│   │   ├── globals.css            # Global styles + Tailwind
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   │
│   ├── package.json               # Frontend dependencies
│   ├── Dockerfile                 # Frontend container
│   └── .env.example               # Frontend env template
│
├── backend/                       # FastAPI Application
│   ├── app/
│   │   ├── api/                   # API Routes (Controllers)
│   │   │   ├── auth.py            # Authentication endpoints
│   │   │   ├── auth_deps.py       # JWT dependency injection
│   │   │   ├── admin.py           # Admin settings API
│   │   │   ├── chat.py            # AI chatbot endpoints
│   │   │   ├── community.py       # Community posts/comments
│   │   │   ├── cycle.py           # Cycle CRUD + AI insights
│   │   │   ├── daily_log.py       # Daily log management
│   │   │   ├── deps.py            # Database dependency
│   │   │   ├── notification.py    # Notification system
│   │   │   ├── prediction.py      # Prediction endpoints
│   │   │   ├── user_setup.py      # User setup/profile API
│   │   │   └── ...
│   │   │
│   │   ├── core/                  # Core infrastructure
│   │   │   ├── database.py        # SQLAlchemy engine & session
│   │   │   ├── security.py        # Password hashing & JWT
│   │   │   └── config.py          # Configuration management
│   │   │
│   │   ├── models/                # Database Models (SQLAlchemy)
│   │   │   ├── user.py            # User model
│   │   │   ├── user_setup.py      # User profile & onboarding
│   │   │   ├── cycle.py           # Menstrual cycle model
│   │   │   ├── daily_log.py       # Daily symptom log
│   │   │   ├── notification.py    # Notification model
│   │   │   ├── system_setting.py  # Dynamic configuration
│   │   │   └── community.py       # Community posts/comments
│   │   │
│   │   ├── schemas/               # Pydantic Schemas (DTOs)
│   │   │   ├── cycle_schema.py
│   │   │   ├── daily_log_schema.py
│   │   │   ├── notification_schema.py
│   │   │   ├── prediction_schema.py
│   │   │   ├── user_schema.py
│   │   │   └── user_setup_schema.py
│   │   │
│   │   ├── services/              # Business Logic Layer
│   │   │   ├── ai_insights_service.py      # AI insights engine
│   │   │   ├── cycle_service.py            # Cycle utilities
│   │   │   ├── global_priors.py            # Global statistics
│   │   │   ├── health_utils.py             # Health calculations
│   │   │   ├── llm_service.py              # Gemini chatbot
│   │   │   ├── prediction_engine.py        # Hybrid prediction
│   │   │   ├── prediction_service.py       # Prediction facade
│   │   │   ├── symptom_pattern_service.py  # Symptom analysis
│   │   │   └── user_service.py             # User utilities
│   │   │
│   │   └── main.py                # FastAPI app factory
│   │
│   ├── tests/                     # Test suite
│   ├── scripts/                   # Utility scripts
│   │   ├── seed.py               # Database seeding
│   │   └── reset_db.py           # Database reset
│   │
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Backend container
│   ├── init_settings.py           # Initialize system settings
│   └── create_admin.py            # Create admin user
│
├── ml/                            # Machine Learning Module
│   ├── base_model/
│   │   ├── train.py               # Training pipeline
│   │   ├── features.py            # Feature engineering
│   │   └── predict.py             # Inference module
│   │
│   ├── personalization/
│   │   ├── fine_tune.py           # Model fine-tuning (future)
│   │   └── hybrid_strategy.py     # Hybrid prediction logic
│   │
│   ├── data_prep/
│   │   └── build_canonical_cycles.py  # Data preprocessing
│   │
│   ├── data/                      # Training datasets (CSV files)
│   └── saved_models/              # Trained model artifacts
│       └── global/
│           ├── priors.json        # Global statistics
│           ├── cycle_model.pkl    # Cycle length model
│           └── period_model.pkl   # Period length model
│
└── infra/                         # Infrastructure configs
    ├── backend.Dockerfile
    ├── frontend.Dockerfile
    └── nginx.conf
```

---

## 4. Core Modules Deep Dive

### 4.1 Authentication System

**Architecture Pattern:** JWT (JSON Web Token) with Stateless Authentication

| Component | File Path | Key Functions |
|-----------|-----------|---------------|
| **Password Hashing** | `backend/app/core/security.py` | `hash_password()`, `verify_password()` using bcrypt |
| **JWT Token** | `backend/app/core/security.py` | `create_access_token()`, `decode_access_token()` |
| **Auth API** | `backend/app/api/auth.py` | `register()`, `login()` |
| **JWT Dependency** | `backend/app/api/auth_deps.py` | `get_current_user()`, `get_current_admin_user()` |

**Security Details:**
- **Password Hashing:** Direct bcrypt (bypasses passlib bugs)
- **JWT Algorithm:** HS256
- **Token Expiry:** 60 minutes
- **Secret Key:** Environment variable `SECRET_KEY`

### 4.2 Hybrid Prediction Engine

**Location:** `backend/app/services/prediction_engine.py`

**3 User-Selectable Modes:**

| Mode | Value | Algorithm | Best For |
|------|-------|-----------|----------|
| **Smart AI Hybrid** | `"smart"` | Auto 3-tier selection | Most users |
| **Regular Calendar** | `"strict"` | Pure WMA with outlier filtering | Irregular cycles |
| **Fixed Number** | `"fixed"` | Manual cycle length | PCOS/irregular |

**Smart AI 3-Tier Pipeline:**

```
User Cycles    │   Algorithm              │   Confidence
───────────────┼──────────────────────────┼────────────────────
0-3 cycles     │   Global ML Model        │   "Global ML Model"
(Cold Start)   │   (HistGradientBoosting) │   Confidence: ~50%
               │                          │
4-5 cycles     │   Bayesian Shrinkage     │   "Bayesian Hybrid"
(Sparse Data)  │   + Global Priors        │   Confidence: ~65%
               │                          │
6+ cycles      │   Weighted Moving Avg    │   "Weighted Personal"
(Rich Data)    │   + Light smoothing      │   Confidence: 70-90%
```

### 4.3 Dynamic Configuration System

**Location:** `backend/app/models/system_setting.py`, `backend/app/api/admin.py`

**Key AI Configuration Settings:**

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `ai_regularity_strict_sd` | 2.0 | SD threshold for "Very Regular" cycles |
| `ai_regularity_moderate_sd` | 4.0 | SD threshold for "Moderate Variation" |
| `ai_symptom_base_prob` | 30 | Base probability % for symptom predictions |
| `ovulation_offset_days` | 14 | Standard luteal phase length |

**Rationale:** Database-driven configuration allows:
- Admin adjustment without redeployment
- A/B testing different thresholds
- Gradual parameter tuning based on user feedback

### 4.4 AI Chatbot (Gemini Integration)

**Location:** `backend/app/services/llm_service.py`

**Features:**
- Context-aware responses (user's cycle data, symptoms)
- Automatic model discovery (prefers Gemini 1.5 Flash)
- Content moderation for community posts
- Fallback to rule-based responses when API unavailable

**Context Variables:**
- Current cycle day
- Predicted next period
- Recent symptoms
- Cycle regularity

### 4.5 Symptom Pattern Analysis

**Location:** `backend/app/services/symptom_pattern_service.py`

**Logic:**
1. Aggregate daily logs across recent cycles (6-cycle window)
2. Map symptoms to cycle phases (Period, Follicular, Ovulation, Luteal)
3. Calculate frequency by phase
4. Return top 4 most frequent symptoms

---

## 5. Methodology Rationale

### 5.1 Why Weighted Moving Average (WMA)?

**Alternative Considered:** Simple Moving Average (SMA)

**WMA Advantages:**
- Adapts to recent lifestyle changes (stress, diet, exercise)
- Recent cycles more predictive than older ones
- Linear weights (1, 2, 3, ..., n) provide smooth transition

**Formula Choice:**
- Linear weights vs exponential: More interpretable, easier to debug
- Window size 6: Balances responsiveness with stability (~6 months of data)

### 5.2 Why Bayesian Shrinkage?

**Problem:** With 4-5 cycles, sample variance is unreliable (high estimation error).

**Solution:** Empirical Bayes blends user mean with population mean.

**Prior Strength (k=3):**
- 3 pseudo-observations = ~20-43% weight on global prior
- Derived from cross-validation on population data
- Balances personalization with statistical stability

### 5.3 Why 3-Tier Architecture?

**Alternative Considered:** Single LSTM/Neural Network

**Why Not Deep Learning:**

| Criteria | Hybrid Approach | LSTM/Deep Learning |
|----------|-----------------|-------------------|
| Cold Start | ✅ Supported | ❌ Not supported |
| Small Data | ✅ Robust | ❌ Overfits easily |
| Interpretability | ✅ High (statistics-based) | ❌ Black box |
| Training Cost | ✅ CPU only | ❌ GPU required |
| Inference Speed | ✅ Milliseconds | ⚠️ Slower |

**Tier Boundaries (0-3, 4-5, 6+):**
- 3 cycles: Minimum for meaningful variance calculation
- 5 cycles: Point where WMA outperforms shrinkage
- 6 cycles: Rich data threshold (full personalization)

### 5.4 Why HistGradientBoosting for Global Model?

**Advantages:**
- Native NaN support (handles missing user data gracefully)
- Resistant to overfitting (ensemble method)
- Fast inference (milliseconds on CPU)
- Feature importance (explainable predictions)

**Feature Engineering:**
- Age, BMI (demographics)
- Stress Level, Sleep Hours (lifestyle)
- Exercise Frequency, Diet (behavioral)

### 5.5 Why Dynamic Luteal Phase?

**Biological Fact:** Luteal phase is relatively stable (10-18 days) compared to follicular phase.

**Algorithm Logic:**
- Regular cycles (low σ): Can "learn" personal luteal phase
- Irregular cycles (high σ): Stick to standard 14 days (more reliable)
- Conservative adjustments (0.3, 0.15 factors): Avoid overfitting

---

## 6. Future Roadmap

### 6.1 Planned Features (Not Yet Implemented)

| Feature | Status | Priority |
|---------|--------|----------|
| **Email Notifications** | ⚠️ Partial | High |
| **Mobile App (React Native/Expo)** | ❌ Not Started | Medium |
| **Advanced ML Personalization** | ⚠️ Scaffolding Only | Medium |
| **FHIR Integration (Health Records)** | ❌ Not Started | Low |
| **Wearable Device Sync** | ❌ Not Started | Low |
| **Multilingual Support** | ⚠️ Partial (Thai/English mix) | Medium |

### 6.2 Email Notifications Status

**Current State:**
- Database schema supports email notifications
- Notification preferences stored in DB
- SMTP configuration not implemented
- Only in-app notifications are functional

**Files to Modify:**
- `backend/app/services/email_service.py` (create)
- `backend/app/api/notification.py` (add email trigger)
- `.env` (add SMTP credentials)

### 6.3 Advanced ML Personalization Status

**Current State:**
- Fine-tuning scaffold exists (`ml/personalization/fine_tune.py`)
- User-specific models not trained automatically
- Global model used for all cold-start users

**Future Enhancement:**
- Periodic retraining with user's growing dataset
- Online learning for real-time adaptation
- Transfer learning from global model

---

## 7. Deployment & Operations

### 7.1 Quick Start (Docker)

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start services
docker-compose up -d

# 3. Initialize system
docker-compose exec backend python init_settings.py
docker-compose exec backend python create_admin.py
```

### 7.2 Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://postgres:password@db:5432/period_tracker
SECRET_KEY=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key  # Optional, for chatbot
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 7.3 Database Migrations

Using Alembic for schema migrations:

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 8. API Documentation

When running, API documentation is available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | User registration |
| `/auth/login` | POST | User login (JWT) |
| `/cycles` | GET/POST | List/create cycles |
| `/cycles/insights` | GET | AI insights for user |
| `/predict` | GET | Next cycle prediction |
| `/daily-logs` | GET/POST | Symptom tracking |
| `/chat` | POST | AI chatbot message |
| `/community/posts` | GET/POST | Community discussions |
| `/admin/settings` | GET/PUT | System configuration |

---

## 9. Testing

### 9.1 Running Tests

```bash
cd backend
pytest tests/ -v
```

### 9.2 Test Files

| Test File | Coverage |
|-----------|----------|
| `tests/test_prediction_engine.py` | Prediction algorithms |

### 9.3 Manual Testing Checklist

- [ ] User registration/login
- [ ] Cycle logging
- [ ] Prediction accuracy (compare to actual)
- [ ] AI insights generation
- [ ] Daily log symptom tracking
- [ ] Community post/comment
- [ ] Chatbot response quality
- [ ] Admin settings modification

---

## 10. Credits & Acknowledgments

**Developed By:** CPE STUDENTS

**Key Technical Decisions:**
- FastAPI for async performance
- Hybrid ML architecture for cold-start handling
- Database-driven configuration for flexibility
- Google Gemini for conversational AI

**Data Sources:**
- Menstrual cycle datasets (Kaggle)
- FedCycleData for population statistics
- Synthetic data augmentation for training

---

*This document serves as the primary engineering reference for the Period Tracker application. For questions or clarifications, refer to the code comments or contact the CPE STUDENTS development team.*
|-------|------------|---------------------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Server-side rendering สำหรับ SEO, App Router สำหรับ modern routing, TypeScript สำหรับ type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework ที่ช่วยให้พัฒนา UI ได้รวดเร็ว มีระบบ Design System ที่ consistent |
| **Backend** | FastAPI + Python 3.11 | High-performance ASGI framework, automatic OpenAPI documentation, native async support |
| **Database** | PostgreSQL 16 | ACID compliance, รองรับ JSONB สำหรับ flexible schema, robust สำหรับ production |
| **ORM** | SQLAlchemy 2.0 | Declarative model definition, migration support, connection pooling |
| **Authentication** | JWT (python-jose) + bcrypt | Stateless authentication, secure password hashing |
| **AI/ML** | Scikit-learn (HistGradientBoostingRegressor) | รองรับ Missing Values ได้ดี (NaN natively), ไม่ overfit ง่าย สำหรับ small data |
| **Container** | Docker + Docker Compose | One-command deployment, consistent environment ระหว่าง dev/prod |

### 1.3 ลักษณะเด่นของระบบ (Key Features)

1. **Hybrid Prediction Engine** - ผสมผสานระหว่าง:
   - **Global ML Model** (HistGradientBoosting): สำหรับผู้ใช้ใหม่ที่ยังไม่มีประวัติรอบเดือน
   - **Bayesian Shrinkage**: สำหรับผู้ใช้ที่มีข้อมูล 4-5 รอบขึ้นไป
   - **Weighted Moving Average**: สำหรับผู้ใช้ที่มีข้อมูลมาก (6+ รอบ)

2. **Dynamic Configuration** - Admin สามารถปรับค่า AI Parameters (เช่น ความเข้มงวดในการวัดความสม่ำเสมอของรอบ) ผ่าน Dashboard ได้โดยไม่ต้อง redeploy

3. **Personalized AI Insights** - ระบบวิเคราะห์อาการเฉพาะบุคคล (Symptom Probability) และคำนวณวันตกไข่แบบ Dynamic (Dynamic Luteal Phase)

4. **Notification Engine** - ระบบแจ้งเตือนที่รองรับหลายช่องทาง (in-app, email)

---

## 2. System Architecture & Folder Structure

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend (Port 3000)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │
│  │  │   React      │  │ Tailwind CSS │  │   React Calendar/Charts  │ │   │
│  │  │   Components │  │   Styling    │  │   (recharts, calendar)   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                              HTTP / REST                                    │
│                                    │                                        │
│                              API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  FastAPI Backend (Port 8000)                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │   │
│  │  │ Auth API     │  │ Cycle API    │  │ AI Insights  │  │ Admin   │ │   │
│  │  │ /auth        │  │ /cycles      │  │ /cycles/     │  │ /admin  │ │   │
│  │  └──────────────┘  └──────────────┘  │ insights     │  │         │ │   │
│  │  ┌──────────────┐  ┌──────────────┐  └──────────────┘  └─────────┘ │   │
│  │  │ Daily Log    │  │ Notification │  ┌──────────────┐  ┌─────────┐ │   │
│  │  │ /daily-logs  │  │ /notifications│  │ Prediction │  │ User    │ │   │
│  │  └──────────────┘  └──────────────┘  │ /predict   │  │ Setup   │ │   │
│  │                                       └──────────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                              SQLAlchemy ORM                                 │
│                                    │                                        │
│                           DATA PERSISTENCE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database (Port 5432)                 │   │
│  │                                                                     │   │
│  │   Tables: users, cycles, daily_logs, notifications,               │   │
│  │           system_settings, user_setups                            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              ML LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   ML Model (HistGradientBoosting)                  │   │
│  │                                                                     │   │
│  │   File: ml/base_model/train.py                                    │   │
│  │   Model: Global Prior สำหรับผู้ใช้ใหม่ (Cold Start)               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure (Tree View)

```
period-tracker/
│
├── README.md                      # Quick start guide
├── docker-compose.yml             # Full stack orchestration
├── .env.example                   # Environment template
│
├── frontend/                      # Next.js Application
│   ├── app/
│   │   ├── (app)/                 # Group routes (App Router)
│   │   │   ├── account/           # User account management
│   │   │   ├── add-cycle/         # Quick add cycle page
│   │   │   ├── admin/             # Admin Dashboard
│   │   │   │   ├── page.tsx       # Admin overview
│   │   │   │   ├── settings/      # System settings UI
│   │   │   │   │   └── page.tsx   # Toggle switches for boolean settings
│   │   │   │   └── users/         # User management
│   │   │   ├── dashboard/         # User dashboard
│   │   │   ├── daily-log/         # Daily symptom tracking
│   │   │   ├── data-privacy/      # Privacy settings page
│   │   │   ├── health-library/    # Health education content
│   │   │   ├── notifications/     # Notification center
│   │   │   └── trends/            # Insights & Trends page
│   │   │
│   │   ├── components/            # Shared React components
│   │   │   ├── AIPredictionReport.tsx    # AI insights display
│   │   │   ├── CycleCalendar.tsx         # Calendar component
│   │   │   ├── CycleChart.tsx            # Charts visualization
│   │   │   ├── CycleDashboard.tsx        # Main dashboard component
│   │   │   ├── CycleHistoryList.tsx      # Cycle history accordion
│   │   │   ├── DailyLogModal.tsx         # Daily log editor modal
│   │   │   ├── EditCycleModal.tsx        # Cycle edit modal
│   │   │   ├── Header.tsx                # App header
│   │   │   ├── OnboardingForm.tsx        # New user onboarding
│   │   │   ├── PredictionTimeline.tsx    # Prediction visualization
│   │   │   ├── PregnancyDashboard.tsx    # Pregnancy tracking mode
│   │   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   ├── AdminSidebar.tsx          # Admin navigation
│   │   │   └── ui/                       # Reusable UI components
│   │   │
│   │   └── lib/
│   │       └── api.ts             # API client utilities
│   │
│   ├── package.json               # Frontend dependencies
│   ├── Dockerfile                 # Frontend container
│   └── .env.example               # Frontend env template
│
├── backend/                       # FastAPI Application
│   ├── app/
│   │   ├── api/                   # API Routes (Controllers)
│   │   │   ├── auth.py            # Authentication endpoints
│   │   │   ├── auth_deps.py       # JWT dependency injection
│   │   │   ├── admin.py           # Admin settings API
│   │   │   ├── cycle.py           # Cycle CRUD + AI insights
│   │   │   ├── daily_log.py       # Daily log management
│   │   │   ├── deps.py            # Database dependency
│   │   │   ├── notification.py    # Notification system
│   │   │   ├── prediction.py      # Prediction endpoints
│   │   │   ├── protected.py       # Protected test endpoints
│   │   │   ├── test_db.py         # Database test endpoint
│   │   │   └── user_setup.py      # User setup/profile API
│   │   │
│   │   ├── core/                  # Core infrastructure
│   │   │   ├── database.py        # SQLAlchemy engine & session
│   │   │   ├── security.py        # Password hashing & JWT
│   │   │   └── config.py          # Configuration management
│   │   │
│   │   ├── models/                # Database Models (SQLAlchemy)
│   │   │   ├── user.py            # User model
│   │   │   ├── user_setup.py      # User profile & onboarding data
│   │   │   ├── cycle.py           # Menstrual cycle model
│   │   │   ├── daily_log.py       # Daily symptom log
│   │   │   ├── notification.py    # Notification model
│   │   │   └── system_setting.py  # Dynamic configuration
│   │   │
│   │   ├── schemas/               # Pydantic Schemas (DTOs)
│   │   │   ├── cycle_schema.py
│   │   │   ├── daily_log_schema.py
│   │   │   ├── notification_schema.py
│   │   │   ├── prediction_schema.py
│   │   │   ├── user_schema.py
│   │   │   └── user_setup_schema.py
│   │   │
│   │   ├── services/              # Business Logic Layer
│   │   │   ├── ai_insights_service.py      # AI insights engine
│   │   │   ├── cycle_service.py            # Cycle utilities
│   │   │   ├── global_priors.py            # Global statistics
│   │   │   ├── health_utils.py             # Health calculations
│   │   │   ├── prediction_engine.py        # Hybrid prediction
│   │   │   ├── prediction_service.py       # Prediction facade
│   │   │   ├── symptom_pattern_service.py  # Symptom pattern analysis
│   │   │   └── user_service.py             # User utilities
│   │
│   ├── app/main.py                # FastAPI app factory
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Backend container
│   ├── init_settings.py           # Initialize system settings
│   └── create_admin.py            # Create admin user script
│
└── ml/                            # Machine Learning Module
    ├── base_model/
    │   ├── train.py               # Training pipeline
    │   ├── features.py            # Feature engineering
    │   └── predict.py             # Inference module
    │
    ├── personalization/
    │   ├── fine_tune.py           # Model fine-tuning for users
    │   └── hybrid_strategy.py     # Hybrid prediction strategy
    │
    ├── data_prep/
    │   └── build_canonical_cycles.py  # Data preprocessing
    │
    ├── data/                      # Training datasets
    └── saved_models/              # Trained model artifacts
```

---

## 3. Core Modules & Code Pointers (แผนที่โค้ดละเอียด)

### 3.1 Authentication System (ระบบยืนยันตัวตน)

**Architecture Pattern:** JWT (JSON Web Token) with Stateless Authentication

#### Files & Functions:

| Component | File Path | Key Functions |
|-----------|-----------|---------------|
| **Password Hashing** | `backend/app/core/security.py` | `hash_password()`, `verify_password()` |
| **JWT Token** | `backend/app/core/security.py` | `create_access_token()`, `decode_access_token()` |
| **Auth API** | `backend/app/api/auth.py` | `register()`, `login()`, `logout()` |
| **JWT Dependency** | `backend/app/api/auth_deps.py` | `get_current_user()`, `get_current_admin_user()` |

#### How It Works:

1. **Registration** (`POST /auth/register`):
   ```python
   # backend/app/api/auth.py:13-21
   @router.post("/register")
   def register(user: UserCreate, db: Session = Depends(get_db)):
       hashed = hash_password(user.password)  # bcrypt hashing
       new_user = create_user(db, user.email, hashed)
       return new_user
   ```

2. **Login** (`POST /auth/login`):
   ```python
   # backend/app/api/auth.py:24-42
   @router.post("/login")
   def login(form_data: OAuth2PasswordRequestForm = Depends(), ...):
       if verify_password(form_data.password, db_user.password_hash):
           token = create_access_token({"sub": db_user.email})
           return {"access_token": token, "token_type": "bearer"}
   ```

3. **Token Validation** (on every protected endpoint):
   ```python
   # backend/app/api/auth_deps.py
   def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
       email = decode_access_token(token)  # JWT decode
       user = get_user_by_email(db, email)
       return user
   ```

#### Security Details:
- **Password Hashing:** ใช้ `bcrypt` โดยตรง (ไม่ใช่ passlib) เพื่อหลีกเลี่ยง bugs กับ bcrypt versions ใหม่
- **JWT Algorithm:** HS256
- **Token Expiry:** 60 นาที (`ACCESS_TOKEN_EXPIRE_MINUTES = 60`)
- **Secret Key:** อ่านจาก Environment Variable `SECRET_KEY`

---

### 3.2 Admin Settings (Dynamic Configuration)

**Architecture Pattern:** Database-Driven Configuration (No Hardcoded Values)

#### The Problem ที่แก้:
แต่เดิมการปรับค่า AI Parameters (เช่น threshold สำหรับ "ความสม่ำเสมอของรอบ") ต้องแก้โค้ดและ redeploy ซึ่งเสียเวลาและเสี่ยงต่อ human error

#### Solution:
ใช้ **SystemSetting** table เก็บค่า configuration ทั้งหมด Admin ปรับผ่าน UI ได้ทันที โดยไม่ต้องแก้โค้ด

#### Files & Functions:

| Component | File Path | Description |
|-----------|-----------|-------------|
| **Database Model** | `backend/app/models/system_setting.py` | `SystemSetting` class |
| **Admin API** | `backend/app/api/admin.py` | `get_all_settings()`, `update_setting()` |
| **Initialization** | `backend/init_settings.py` | `init_settings()` - สร้าง default values |
| **Frontend UI** | `frontend/app/(app)/admin/settings/page.tsx` | Toggle switches, modal forms |

#### Key AI Configuration Settings:

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `ai_regularity_strict_sd` | 2.0 | SD threshold สำหรับ "Very Regular" cycles |
| `ai_regularity_moderate_sd` | 4.0 | SD threshold สำหรับ "Moderate Variation" |
| `ai_symptom_base_prob` | 30 | Base probability % สำหรับ symptom predictions |
| `ovulation_offset_days` | 14 | จำนวนวัน luteal phase มาตรฐาน |

#### How It Works:

1. **Fetching Settings** (in AI services):
   ```python
   # backend/app/services/ai_insights_service.py:32-62
   def get_setting(db: Session, key: str, default_value=None):
       setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
       return setting.value if setting else default_value
   
   def get_float_setting(db: Session, key: str, default_value: float = 0.0) -> float:
       value = get_setting(db, key)
       return float(value) if value else default_value
   ```

2. **API Endpoints**:
   ```python
   # backend/app/api/admin.py:63-72
   @router.get("/settings", response_model=List[SystemSettingResponse])
   def get_all_settings(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
       return db.query(SystemSetting).all()
   
   # backend/app/api/admin.py:93-110
   @router.put("/settings/{key}", response_model=SystemSettingResponse)
   def update_setting(key: str, setting_update: SystemSettingUpdate, ...):
       # Update database immediately
       setting.value = setting_update.value
       db.commit()
   ```

3. **Frontend UI** (`frontend/app/(app)/admin/settings/page.tsx`):
   - Auto-detect boolean values (`"true"` / `"false"`) → แสดงเป็น Toggle Switch
   - Non-boolean values → แสดงเป็น text + Edit button
   - Inline update: กด toggle → ยิง API PUT → อัปเดตทันที (ไม่ต้อง refresh)

---

### 3.3 Notification Engine (ระบบแจ้งเตือน)

**Architecture Pattern:** Database-backed Queue with Read Status Tracking

#### Files & Functions:

| Component | File Path | Key Functions |
|-----------|-----------|---------------|
| **Database Model** | `backend/app/models/notification.py` | `Notification`, `NotificationSetting` classes |
| **Notification API** | `backend/app/api/notification.py` | `get_notifications()`, `mark_notification_as_read()` |
| **Settings API** | `backend/app/api/notification.py` | `get_notification_settings()`, `update_notification_settings()` |

#### Database Schema:

```python
# backend/app/models/notification.py
class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String)  # "reminder", "prediction", "system"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    enable_in_app = Column(Boolean, default=True)
    enable_email = Column(Boolean, default=False)
    reminder_days_before = Column(Integer, default=3)  # เตือนก่อนมีประจำเดือนกี่วัน
```

#### API Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get user's notifications with pagination |
| PUT | `/notifications/{id}/read` | Mark single notification as read |
| PUT | `/notifications/read-all` | Mark all notifications as read |
| GET | `/notifications/settings` | Get notification preferences |
| PUT | `/notifications/settings` | Update notification preferences |

#### How It Works:

1. **Creating Notifications** (triggered by events):
   ```python
   # When cycle is predicted to start soon
   notification = Notification(
       user_id=user.id,
       title="Period Starting Soon",
       message="Your period is expected to start in 3 days",
       notification_type="prediction"
   )
   db.add(notification)
   db.commit()
   ```

2. **Fetching Notifications** (with pagination):
   ```python
   # backend/app/api/notification.py:22-53
   @router.get("/", response_model=NotificationListResponse)
   def get_notifications(db: Session = Depends(get_db), unread_only: bool = Query(False), ...):
       query = db.query(Notification).filter(Notification.user_id == current_user.id)
       if unread_only:
           query = query.filter(Notification.is_read == False)
       notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
       return NotificationListResponse(notifications=notifications, unread_count=..., total_count=...)
   ```

---

## 4. Deep Dive: AI & Prediction Engine (หัวใจหลักของโปรเจกต์)

### 4.1 ไฟล์หลักที่เกี่ยวข้อง

| File | Purpose |
|------|---------|
| `backend/app/services/prediction_engine.py` | Hybrid prediction logic (Bayesian + Weighted Average + ML fallback) |
| `backend/app/services/ai_insights_service.py` | Personalized insights (Symptom probability, Dynamic luteal phase) |
| `backend/app/services/global_priors.py` | Global statistics จาก dataset ทั่วไป |
| `backend/app/api/prediction.py` | API endpoints สำหรับ predictions |
| `backend/app/api/cycle.py` | Cycle API ที่ integrate AI insights |
| `ml/base_model/train.py` | Training pipeline สำหรับ HistGradientBoosting |
| `ml/base_model/predict.py` | Inference module สำหรับผู้ใช้ใหม่ |

### 4.2 User-Selectable Prediction Modes

The system supports **3 user-selectable prediction modes** stored in `user_setup.prediction_mode`:

| Mode | Value | Description | Best For |
|------|-------|-------------|----------|
| **Smart AI Hybrid** | `"smart"` | Automated 3-tier intelligence | Most users |
| **Regular Calendar** | `"strict"` | Pure Weighted Moving Average | Users with irregular cycles |
| **Fixed Number** | `"fixed"` | Manual cycle length | PCOS or highly irregular cycles |

**Database Schema:**
```python
# backend/app/models/user_setup.py
class UserSetup(Base):
    prediction_mode = Column(String, default="smart")  # "smart", "strict", "fixed"
    manual_cycle_length = Column(Integer, default=28)  # Used when mode="fixed"
```

---

### 4.3 Mode 1: Smart AI Hybrid ("smart")

**Automated 3-Tier Strategy** - The system automatically selects the best algorithm based on user's cycle count.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SMART AI HYBRID PIPELINE                              │
│                                                                         │
│   User Cycles    │   Algorithm              │   Confidence Label       │
│   ───────────────┼──────────────────────────┼────────────────────      │
│   0-3 cycles     │   Global ML Model        │   "Global ML Model"      │
│   (Cold Start)   │   (HistGradientBoosting) │   Confidence: ~50%       │
│                  │                          │                          │
│   4-5 cycles     │   Bayesian Shrinkage     │   "Bayesian Hybrid"      │
│   (Sparse Data)  │   + Global Priors        │   Confidence: ~65%       │
│                  │                          │                          │
│   6+ cycles      │   Weighted Moving Avg    │   "Weighted Personal"    │
│   (Rich Data)    │   + Light smoothing      │   Confidence: 70-90%     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Tier 1: Global ML Model (0-3 cycles)

**Code:** `prediction_engine.py:_predict_smart()` (lines 202-224)

Uses HistGradientBoostingRegressor trained on population data:

```python
if ml_predict_next_cycle:
    user_features = cls._build_user_ml_features(db, user_id)
    ml_pred = ml_predict_next_cycle(user_features)
    cycle_avg = ml_pred.get("predicted_cycle_length", 28)
```

**Features used:** Age, BMI, Stress Level, Exercise, Sleep, Diet

#### Tier 2: Bayesian Shrinkage (4-5 cycles)

**Code:** `prediction_engine.py:_predict_smart()` (lines 226-246)

Blends user data with global priors using Empirical Bayes:

```python
# Formula: Posterior = (n × UserMean + k × GlobalPrior) / (n + k)
k = PRIOR_STRENGTH  # 3 pseudo-observations
cycle_avg = (cycle_n * cycle_avg_raw + k * priors.cycle_mean) / (cycle_n + k)
```

**Why:** Prevents overfitting when user has limited data.

#### Tier 3: Weighted Moving Average (6+ cycles)

**Code:** `prediction_engine.py:_predict_smart()` (lines 248-262)

Uses pure personal history with light smoothing:

```python
# Recent cycles have higher weight
weights = list(range(1, len(values) + 1))  # [1, 2, 3, ..., n]
weighted_avg = sum(v * w for v, w in zip(values, weights)) / sum(weights)
```

---

### 4.4 Mode 2: Regular Calendar ("strict")

**Pure Weighted Moving Average** - Bypasses the automated tier system.

**Code:** `prediction_engine.py:_predict_strict()` (lines 133-175)

**Behavior:**
- Always uses `_weighted_prediction()` with outlier filtering (>2 SD)
- Ignores Global ML model and Bayesian shrinkage
- Returns `None` if fewer than 3 cycles (requires manual data entry)

**Algorithm Details:**

```python
@staticmethod
def _weighted_prediction(values):
    # 1. Remove outliers (>2 SD from mean)
    filtered = [v for v in values if abs((v - avg) / sd) <= 2]
    
    # 2. Weighted average (recent cycles weighted higher)
    weights = list(range(1, len(filtered) + 1))
    weighted_avg = sum(v * w for v, w in zip(values, weights)) / sum(weights)
    
    return weighted_avg, std_dev, n
```

**Best for:** Users who want pure personal history without AI interference.

---

### 4.5 Mode 3: Fixed Number ("fixed")

**User-Defined Cycle Length** - Direct user override.

**Code:** `prediction_engine.py:_predict_fixed()` (lines 100-131)

**Behavior:**
- Returns `user_setup.manual_cycle_length` directly
- No calculations performed on historical data
- Period length still uses weighted average if available
- 95% confidence (user explicitly set this)

**Use Case:**
- PCOS patients with highly irregular cycles
- Users who know their body better than any algorithm
- Medical conditions requiring fixed tracking

**Frontend Control:**
```typescript
// frontend/app/(app)/account/page.tsx
{predictionMode === 'fixed' && (
  <input
    type="number"
    min="21"
    max="45"
    value={manualCycleLength}
    onChange={(e) => setManualCycleLength(Number(e.target.value))}
  />
)}
```

---

### 4.6 Architecture Decision Record (ADR)

#### ADR-001: เลือกใช้ Hybrid Architecture แทน Deep Learning ล้วนๆ

**Context:**
โปรเจกต์นี้เป็นแอปสุขภาพที่ผู้ใช้ส่วนใหญ่เป็น "New Users" ที่ยังไม่มีประวัติรอบเดือน การใช้ Deep Learning (LSTM, Neural Networks) จะเจอปัญหา:
1. **Cold Start Problem** - ไม่สามารถทำนายได้ถ้าไม่มี historical data
2. **Small Data** - แม้ผู้ใช้เก่าก็มีแค่ 10-20 รอบ (samples น้อยมากสำหรับ Deep Learning)
3. **Overfitting Risk** - Neural Networks จะจำข้อมูล training แทนที่จะ generalize
4. **Black Box Problem** - อธิบายไม่ได้ว่าทำไมถึงทำนายแบบนั้น (สำคัญสำหรับ healthcare apps)

**Decision:**
ใช้ **Hybrid Architecture** แบ่งตามจำนวนข้อมูล:
- 0-3 cycles → Global ML (HistGradientBoosting) ที่ train จาก population data
- 4-5 cycles → Bayesian Shrinkage (Empirical Bayes) ผสมระหว่าง user data + global prior
- 6+ cycles → Weighted Moving Average (purely personalized)

**Consequences:**

| Pros | Cons |
|------|------|
| ✅ แก้ Cold Start ได้ (ผู้ใช้ใหม่ก็ได้ prediction ทันที) | ❌ Complex architecture (ต้อง maintain 3 ระบบ) |
| ✅ ไม่ overfit กับ small data | ❌ ต้องมี population dataset สำหรับ training |
| ✅ Explainable (บอกได้ว่าทำไมถึงได้ค่านี้) | ❌ ต้อง implement switching logic |
| ✅ Lightweight (ไม่ต้องใช้ GPU) | |
| ✅ Confidence score แต่ละ tier ต่างกัน | |

**Comparison with LSTM/Neural Networks:**

| Criteria | Hybrid Approach | LSTM/Deep Learning |
|----------|-----------------|-------------------|
| Cold Start | ✅ รองรับ | ❌ ไม่รองรับ |
| Small Data | ✅ Robust | ❌ Overfit ง่าย |
| Interpretability | ✅ High (statistics-based) | ❌ Black box |
| Training Cost | ✅ CPU only | ❌ GPU required |
| Inference Speed | ✅ Milliseconds | ⚠️ Slower |
| Maintenance | ⚠️ Moderate | ⚠️ Moderate |

---

## 5. AI Personalized Insights (ฟีเจอร์ใหม่ล่าสุด)

### 5.1 ภาพรวม

ฟีเจอร์นี้เพิ่มความสามารถในการทำนาย **อาการที่คาดว่าจะเกิด** (Symptom Probability) และคำนวณ **วันตกไข่ส่วนบุคคล** (Dynamic Luteal Phase) โดยอิงจาก:
- ข้อมูลอาการย้อนหลังของผู้ใช้ (Daily Logs)
- ความสม่ำเสมอของรอบเดือน (Cycle Regularity)
- Configuration จาก Admin (Dynamic ผ่าน Database)

### 5.2 ไฟล์หลัก

| File | Purpose |
|------|---------|
| `backend/app/services/ai_insights_service.py` | Main AI insights engine |
| `backend/app/api/cycle.py` | API endpoint `/cycles/insights` |
| `frontend/app/components/AIPredictionReport.tsx` | UI component แสดงผล |

### 5.3 Symptom Probability Engine

**Logic:** คำนวณความน่าจะเป็นที่ผู้ใช้จะมีอาการต่างๆ ในรอบถัดไป

**Code Location:** `backend/app/services/ai_insights_service.py:110-212`

```python
class SymptomProbabilityEngine:
    MIN_CYCLES_FOR_PERSONALIZED = 3
    LOOKBACK_CYCLES = 6
    
    @classmethod
    def calculate_probabilities(cls, db: Session, user_id: int, cycles: List[Cycle]) -> Dict[str, dict]:
        # 1. Get base probability from DB settings
        base_prob = get_int_setting(db, "ai_symptom_base_prob", 30)
        
        # 2. Build base probabilities (scaled from base)
        base_probs = {
            "Cramps": min(95, int(base_prob * 2.17)),      # ~65% if base=30
            "Acne": min(95, int(base_prob * 1.33)),        # ~40% if base=30
            "Mood Swing": min(95, int(base_prob * 1.67)),  # ~50% if base=30
            "Bloating": min(95, int(base_prob * 1.83)),    # ~55% if base=30
            "Fatigue": min(95, int(base_prob * 2.0)),      # ~60% if base=30
        }
        
        if len(cycles) < cls.MIN_CYCLES_FOR_PERSONALIZED:
            # ไม่มีข้อมูลพอ → ใช้ base probabilities จาก DB
            return {symptom: {"probability": prob, "is_personalized": False} 
                    for symptom, prob in base_probs.items()}
        
        # 3. Count symptom occurrences from Daily Logs
        for cycle in recent_cycles:
            daily_logs = db.query(DailyLog).filter(...)
            for log in daily_logs:
                for symptom in log.physical_symptoms:  # JSONB array
                    mapped = cls._map_symptom(symptom.lower())
                    if mapped:
                        symptom_counts[mapped] += 1
        
        # 4. Blend user data with base probability
        for symptom in base_probs.keys():
            if total_cycles_with_data > 0:
                user_probability = round((count / total_cycles_with_data) * 100)
                
                # Weighted blend: มากข้อมูล → น้ำหนัก user มาก
                weight = min(0.8, total_cycles_with_data / 6)
                blended_prob = round(user_probability * weight + base_probs[symptom] * (1 - weight))
                
                probabilities[symptom] = {
                    "probability": min(95, max(5, blended_prob)),
                    "is_personalized": True,
                    "user_occurrence_rate": user_probability
                }
```

**Symptom Mapping:**
```python
# backend/app/services/ai_insights_service.py:76-100
SYMPTOM_MAPPING = {
    "cramps": "Cramps",
    "cramping": "Cramps",
    "abdominal_pain": "Cramps",
    "acne": "Acne",
    "pimples": "Acne",
    "mood_swing": "Mood Swing",
    "moody": "Mood Swing",
    "irritable": "Mood Swing",
    "anxiety": "Mood Swing",
    "bloating": "Bloating",
    "bloated": "Bloating",
    "fatigue": "Fatigue",
    "tired": "Fatigue",
    "exhausted": "Fatigue",
}
```

### 5.4 Dynamic Luteal Phase Calculator

**Logic:** คำนวณจำนวนวันระหว่างตกไข่กับมีประจำเดือน (luteal phase) โดยอิงจาก:
- ความสม่ำเสมอของรอบ (Cycle Standard Deviation)
- ความยาวเฉลี่ยของรอบ (Average Cycle Length)
- Configuration จาก Database (ovulation_offset_days)

**Code Location:** `backend/app/services/ai_insights_service.py:241-303`

```python
class DynamicLutealPhaseCalculator:
    @classmethod
    def calculate(cls, db: Session, cycles: List[Cycle], cycle_std_dev: float, avg_cycle_length: float) -> dict:
        # 1. Get settings from DB
        base_luteal_phase = get_int_setting(db, "ovulation_offset_days", 14)
        strict_sd = get_float_setting(db, "ai_regularity_strict_sd", 2.0)
        moderate_sd = get_float_setting(db, "ai_regularity_moderate_sd", 4.0)
        
        cycle_deviation = avg_cycle_length - 28  # e.g., +2 if 30-day cycles
        
        # 2. Adjust based on cycle regularity
        if cycle_std_dev <= strict_sd:
            # รอบสม่ำเสมอมาก → ปรับเล็กน้อย
            adjustment = round(cycle_deviation * 0.3)
            learned_phase = base_luteal_phase + adjustment
            method = "learned_from_regular_cycles"
        elif cycle_std_dev <= moderate_sd:
            # รอบมีความแปรผันระดับกลาง → ปรับน้อยลง
            adjustment = round(cycle_deviation * 0.15)
            learned_phase = base_luteal_phase + adjustment
            method = "learned_from_moderate_variation"
        else:
            # รอบไม่สม่ำเสมอ → ใช้ค่ามาตรฐานจาก DB
            learned_phase = base_luteal_phase
            method = "standard_fallback_high_variation"
        
        # 3. Clamp to biological reality (10-18 days is typical)
        learned_phase = max(10, min(18, learned_phase))
        
        return {
            "learned_luteal_phase": learned_phase,
            "ovulation_offset": learned_phase,
            "calculation_method": method,
            "settings_used": {
                "ovulation_offset_days": base_luteal_phase,
                "strict_sd_threshold": strict_sd,
                "moderate_sd_threshold": moderate_sd
            }
        }
```

**Why Dynamic?**
- Luteal phase ของแต่ละคนไม่เท่ากัน (บางคน 12 วัน, บางคน 16 วัน)
- รอบยาวไม่ได้แปลว่า luteal phase ยาว ( follicular phase อาจยาวแทน)
- รอบที่สม่ำเสมอ → สามารถ "เรียนรู้" luteal phase ส่วนตัวได้

### 5.5 Smart Recommendation Engine

**Logic:** ให้คำแนะนำอัตโนมัติตาม pattern ของผู้ใช้

**Code Location:** `backend/app/services/ai_insights_service.py:306-380`

```python
class SmartRecommendationEngine:
    @classmethod
    def generate_recommendation(cls, db: Session, cycle_std_dev: float, ...):
        strict_sd = get_float_setting(db, "ai_regularity_strict_sd", 2.0)
        moderate_sd = get_float_setting(db, "ai_regularity_moderate_sd", 4.0)
        
        # Rule 1: New user
        if cycle_count < 2 or confidence_score < 40:
            return {
                "type": "info",
                "message": "Keep logging your cycles. AI learns more with each entry...",
                "action": "Log next cycle"
            }
        
        # Rule 2: High variability (using DB threshold)
        if cycle_std_dev > moderate_sd:
            return {
                "type": "warning",
                "message": "AI detected cycle variability. Tracking more consistently may help...",
                "action": "Log daily symptoms"
            }
        
        # Rule 3: Very regular (using DB threshold)
        if cycle_std_dev <= strict_sd and confidence_score > 75:
            return {
                "type": "positive",
                "message": "Your cycle is very regular! AI predictions are highly accurate...",
                "action": None
            }
```

### 5.6 API Integration

**Endpoint:** `GET /cycles/insights`

**File:** `backend/app/api/cycle.py:45-78`

```python
@router.get("/insights", response_model=AIInsightsResponse)
def get_ai_insights(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    cycles = db.query(Cycle).filter(Cycle.user_id == current_user.id).order_by(...).all()
    
    # Get prediction data for metrics
    prediction_result = PredictionEngine.predict(db, current_user.id, cycles)
    
    # Generate AI insights
    insights = AIInsightsService.generate_insights(
        db=db,  # Pass db session for fetching settings
        user_id=current_user.id,
        cycles=cycles,
        cycle_std_dev=prediction_result.get("cycle_std_dev"),
        avg_cycle_length=prediction_result.get("cycle_length_prediction"),
        confidence_score=prediction_result.get("confidence_score")
    )
    
    return AIInsightsResponse(
        symptom_probabilities=insights["symptom_probabilities"],
        luteal_phase=insights["luteal_phase"],
        recommendation=insights["recommendation"],
        cycle_regularity=insights["cycle_regularity"]
    )
```

### 5.7 Frontend Integration

**Component:** `frontend/app/components/AIPredictionReport.tsx`

```typescript
// Fetch AI insights from API
useEffect(() => {
  const fetchInsights = async () => {
    const response = await apiFetch("/cycles/insights");
    setInsights(response);
  };
  fetchInsights();
}, []);

// Display symptom probabilities
{Object.entries(insights.symptom_probabilities).map(([symptom, data]) => (
  <div key={symptom}>
    <span>{symptom}</span>
    <ProgressBar value={data.probability} />
    {data.is_personalized && <Badge>Personalized</Badge>}
  </div>
))}
```

---

### 5.8 Symptom Pattern Analysis (NEW)

**Architecture Pattern:** Statistical Analysis + Real-time Aggregation

ฟีเจอร์ใหม่ล่าสุดสำหรับวิเคราะห์อาการที่เกิดบ่อยที่สุด (Top Symptoms Pattern) พร้อมช่วงวันในรอบเดือนที่มักเกิด

#### Files & Functions:

| Component | File Path | Key Functions |
|-----------|-----------|---------------|
| **Analysis Service** | `backend/app/services/symptom_pattern_service.py` | `get_top_symptoms_patterns()`, `analyze_symptom_frequencies()` |
| **API Endpoint** | `backend/app/api/cycle.py:82-96` | `GET /cycles/symptoms/patterns` |
| **Frontend Display** | `frontend/app/(app)/trends/page.tsx` | `TopSymptomsPattern` component |

#### Database Schema:

```python
# backend/app/models/daily_log.py
class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    physical_symptoms = Column(JSONB, default=list)  # ["cramps", "bloating", ...]
    moods = Column(JSONB, default=list)
    # ... other fields
```

#### API Response Format:

```json
{
  "patterns": [
    {
      "name": "Cramps",
      "days": 12,
      "timeframe": "Period - Follicular phase",
      "percentage": 85
    },
    {
      "name": "Mood Swing",
      "days": 8,
      "timeframe": "Luteal phase",
      "percentage": 67
    }
  ]
}
```

#### Key Features:

1. **Frequency Analysis**: นับจำนวนวันที่มีอาการแต่ละประเภทจาก Daily Logs
2. **Cycle Day Mapping**: แมพอาการกับวันในรอบเดือน (Period, Follicular, Ovulation, Luteal)
3. **Top N Results**: ส่งคืนอาการที่เกิดบ่อยที่สุด 4 อันดับแรก
4. **Empty State Handling**: แสดงข้อความ "Log symptoms to see your patterns" ถ้ายังไม่มีข้อมูล

---

### 5.9 Smart Navigation & UX Improvements (NEW)

**Architecture Pattern:** Client-side Navigation with Hash-based Deep Linking

ปรับปรุง UX โดยการเพิ่มระบบนำทางอัจฉริยะสำหรับปุ่มต่างๆ ที่ต้องการ scroll ไปยังปฏิทิน

#### Problem:

ปุ่ม "Log symptoms", "Log next cycle" ใน `AIPredictionReport` และ `TopSymptomsPattern` ใช้ `scrollIntoView` โดยตรง ทำให้ไม่ทำงานเมื่อผู้ใช้อยู่บนหน้าอื่น (เช่น Trends page)

#### Solution:

ใช้ **Smart Navigation Handler** ที่ตรวจสอบตำแหน่งปัจจุบันก่อนตัดสินใจ:

```typescript
// frontend/app/components/AIPredictionReport.tsx
const handleLogClick = () => {
  const calendarSection = document.getElementById('calendar-section')
  if (calendarSection) {
    // On dashboard page - smooth scroll to calendar
    calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // On other page - navigate to dashboard with hash
    router.push('/dashboard#calendar-section')
  }
}
```

#### Implementation Files:

| Component | Navigation Logic |
|-----------|------------------|
| `AIPredictionReport.tsx` | `handleLogClick()` with router fallback |
| `trends/page.tsx` | `handleLogClick()` for "Log today's symptoms" button |
| `CycleDashboard.tsx` | `useEffect` to handle `#calendar-section` hash on mount |

#### Hash-based Deep Linking:

```typescript
// CycleDashboard.tsx - Handle incoming hash navigation
useEffect(() => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash === '#calendar-section') {
      const timer = setTimeout(() => {
        const calendarSection = document.getElementById('calendar-section')
        if (calendarSection) {
          calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Clear hash without reloading
          window.history.replaceState(null, '', window.location.pathname)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }
}, [loading])
```

#### Benefits:

- ✅ **Cross-page Navigation**: กดปุ่มจากหน้าใดก็ได้ ระบบจะพาไปหน้า Dashboard และ scroll ไปที่ปฏิทิน
- ✅ **Smooth UX**: ใช้ smooth scroll ทั้งใน-page และ cross-page
- ✅ **No Hard Refresh**: ใช้ Next.js router ไม่ทำให้หน้าเว็บกระพริบ
- ✅ **Clean URLs**: ลบ hash หลัง scroll เสร็จ เพื่อความสะอาด

---

## 6. สรุปการ Deploy และ Run

### Quick Start (Docker)

```bash
# 1. Clone repository
git clone https://github.com/your-username/period-tracker.git
cd period-tracker

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Start all services
docker-compose up -d

# 4. Initialize system settings
docker-compose exec backend python init_settings.py

# 5. Create admin user
docker-compose exec backend python create_admin.py

# 6. Access application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Post-Installation Checklist

- [ ] รัน `init_settings.py` เพื่อสร้าง default system settings
- [ ] รัน `create_admin.py` เพื่อสร้าง admin account
- [ ] Login เข้า Admin Dashboard (`/admin/settings`)
- [ ] ตรวจสอบ AI Configuration Settings (ai_regularity_strict_sd, ai_symptom_base_prob, ...)
- [ ] ทดสอบ API endpoints ผ่าน Swagger UI (`/docs`)

---

**จัดทำโดย:** Engineering Team  
**เอกสารฉบับนี้:** สำหรับ Thesis Defense และส่งมอบโปรเจกต์  
**ล่าสุด:** April 2026
