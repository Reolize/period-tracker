# Period Tracker - Engineering Playbook / เอกสารสถาปัตยกรรมระบบ

> **สำหรับ:** Thesis Defense / การส่งมอบโปรเจกต์  
> **จัดทำโดย:** CPE STUDENTS  
> **วันที่:** April 2026

---

## 1. Project Overview & Tech Stack

### 1.1 ภาพรวมโปรเจกต์

**Period Tracker with Personalized AI** เป็นแอปพลิเคชันติดตามรอบเดือน (Menstrual Cycle Tracking) ที่มีระบบ AI ส่วนบุคคลสำหรับทำนายรอบเดือน อาการที่คาดว่าจะเกิด และให้คำแนะนำเฉพาะบุคคล ระบบถูกออกแบบมาเพื่อแก้ปัญหา **Cold Start Problem** ที่ผู้ใช้ใหม่ยังไม่มีข้อมูลมากพอสำหรับการทำนายที่แม่นยำ

### 1.2 Tech Stack ที่ใช้

| Layer | Technology | เหตุผลในการเลือกใช้ |
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

### 4.2 Hybrid Prediction Architecture (3-Tier Strategy)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     HYBRID PREDICTION PIPELINE                          │
│                                                                         │
│   User Cycles    │   Strategy                │   Confidence           │
│   ───────────────┼───────────────────────────┼────────────────        │
│   0-3 cycles     │   Global ML Model         │   Low (40-50%)         │
│   (Cold Start)   │   (HistGradientBoosting)  │                        │
│                  │                           │                        │
│   4-5 cycles     │   Bayesian Shrinkage      │   Medium (50-70%)      │
│   (Sparse Data)  │   + Global Priors         │                        │
│                  │                           │                        │
│   6+ cycles      │   Weighted Moving Average │   High (70-90%)        │
│   (Rich Data)    │   (Recent data weighted)  │                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Tier 1: Global ML Model (HistGradientBoostingRegressor)

**สำหรับ:** ผู้ใช้ใหม่ที่ยังไม่มีประวัติรอบเดือน (Cold Start Problem)

**Code Location:** `backend/app/services/prediction_engine.py:12-15`

```python
# Import ML model (graceful fallback if ML module not available)
try:
    from base_model.predict import predict_next_cycle as ml_predict_next_cycle
except ImportError:
    ml_predict_next_cycle = None
```

**Why HistGradientBoosting?**
- รองรับ Missing Values (NaN) ได้โดยไม่ต้อง impute data
- ไม่ overfit ง่ายเมื่อเทียบกับ Neural Networks
- Training รวดเร็ว ไม่ต้องใช้ GPU

**Training Pipeline:** `ml/base_model/train.py`

```python
# ml/base_model/train.py:41-43
from sklearn.ensemble import HistGradientBoostingRegressor

cycle_model = HistGradientBoostingRegressor(random_state=42, max_iter=150, max_depth=10)
cycle_model.fit(Xc_train, yc_train)
```

**Features ที่ใช้:**
- Age, BMI (จาก UserSetup)
- Stress Level, Exercise Frequency
- Sleep Hours, Diet type

#### Tier 2: Bayesian Shrinkage (Empirical Bayes)

**สำหรับ:** ผู้ใช้ที่มีข้อมูล 4-5 รอบ (ข้อมูลน้อย แต่พอมี pattern)

**Code Location:** `backend/app/services/prediction_engine.py:85-140`

```python
# Concept: User Mean ← Shrink toward → Global Prior
# Formula: Posterior = (n × UserMean + k × GlobalPrior) / (n + k)

@classmethod
def predict(cls, db, user_id, cycles):
    if len(cycles) < cls.MIN_REQUIRED:  # < 4 cycles
        # Use ML Model + Global Priors
        return ml_prediction
    elif len(cycles) < cls.WINDOW_SIZE:  # 4-5 cycles
        # Use Bayesian Shrinkage
        user_avg = mean(cycle_lengths)
        global_prior = load_global_priors()  # From ml/global_priors.py
        posterior = cls._bayesian_shrinkage(user_avg, global_prior, n=len(cycles))
        return posterior
```

**Why Bayesian Shrinkage?**
- ป้องกัน overfitting เมื่อมีข้อมูลน้อย
- "Pull" ค่าเฉลี่ยของผู้ใช้ไปหา population mean ตามสัดส่วนของ sample size
- ถ้าผู้ใช้มีข้อมูลมาก → ค่าเฉลี่ยส่วนตัวมีน้ำหนักมาก
- ถ้าผู้ใช้มีข้อมูลน้อย → ให้น้ำหนักกับค่าเฉลี่ยทั่วไปมากขึ้น

#### Tier 3: Weighted Moving Average

**สำหรับ:** ผู้ใช้ที่มีข้อมูล 6+ รอบ (ข้อมูลมากพอสำหรับ pattern ส่วนตัว)

**Code Location:** `backend/app/services/prediction_engine.py:63-83`

```python
@staticmethod
def weighted_prediction(values):
    avg = mean(values)
    sd = stdev(values) if len(values) > 1 else 0
    
    # 1. Remove outliers (>2 SD from mean)
    if sd > 0:
        values = [v for v in values if abs((v - avg) / sd) <= 2]
    
    # 2. Weighted average (recent cycles have higher weight)
    weights = list(range(1, len(values) + 1))  # [1, 2, 3, ..., n]
    weighted_sum = sum(v * w for v, w in zip(values, weights))
    weighted_avg = round(weighted_sum / sum(weights))
    
    return weighted_avg, std_dev, len(values)
```

**Why Weighted Average?**
- รอบเดือนล่าสุดมีความสำคัญมากกว่ารอบเก่า
- ชีวิตคนเปลี่ยนไปตามเวลา (อายุ, สุขภาพ, ความเครียด)
- ลดผลกระทบจาก outliers โดยการตัดค่าที่เกิน 2 SD

---

### 4.3 Architecture Decision Record (ADR)

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
