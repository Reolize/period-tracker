# ARCHITECTURE.md - เอกสารสถาปัตยกรรมระบบ | System Architecture Documentation

> **พัฒนาโดย | Developed By:** **CPE STUDENTS**  
> **อัปเดตล่าสุด | Last Updated:** April 2026

---

## สารบัญแบบโต้ตอบ | Interactive Table of Contents

| ภาษาไทย | English |
|---------|---------|
| [1. ภาพรวมโครงการ](#section1) | [1. Project Overview](#section1) |
| [2. สถาปัตยกรรมเทคโนโลยี](#section2) | [2. Tech Stack](#section2) |
| [3. โครงสร้างโครงการ](#section3) | [3. Project Structure](#section3) |
| [4. สูตรคณิตศาสตร์และตรรกะการทำนาย](#section4) | [4. Mathematical Formulas](#section4) |
| [5. หลักการเลือกใช้วิธีการ](#section5) | [5. Methodology Rationale](#section5) |
| [6. กระแสข้อมูลในระบบ](#section6) | [6. System Data Flow](#section6) |
| [7. โมดูลหลักของระบบ](#section7) | [7. Core Modules](#section7) |
| [8. แผนงานในอนาคต](#section8) | [8. Future Roadmap](#section8) |
| [9. การติดตั้งและใช้งาน](#section9) | [9. Deployment](#section9) |
| [10. เครดิตและการรับรอง](#section10) | [10. Credits](#section10) |

---

## <a id="section1">1. ภาพรวมโครงการ | Project Overview</a>

### ภาษาไทย

**Period Tracker with Personalized AI** เป็นแอปพลิเคชันติดตามรอบเดือนที่ใช้ปัญญาประดิษฐ์ (AI) สำหรับการทำนายแบบเฉพาะบุคคล ระบบถูกออกแบบมาเพื่อแก้ไขปัญหา **Cold Start** (ผู้ใช้ใหม่ที่ยังไม่มีข้อมูลย้อนหลัง) โดยใช้สถาปัตยกรรมแบบไฮบริด 3 ระดับ (3-Tier Hybrid Architecture)

**จุดเด่นของระบบ:**
- **เครื่องยนต์ทำนายแบบไฮบริด (Hybrid Prediction Engine):** ผสมผสานระหว่าง ค่าเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก (Weighted Moving Average), การหดเก็บแบบเบย์ (Bayesian Shrinkage) และโมเดล ML สำหรับผู้ใช้ใหม่
- **การวิเคราะห์อาการแบบเฉพาะบุคคล (Personalized Symptom Analysis):** คำนวณความน่าจะเป็นของอาการจากประวัติการใช้งาน
- **การคำนวณวันตกไข่แบบไดนามิก (Dynamic Ovulation Calculation):** ปรับค่าตามความสม่ำเสมอของรอบเดือน
- **แชทบอท AI:** ผู้ช่วยด้านสุขภาพที่ขับเคลื่อนโดย Google Gemini API

---

### English

**Period Tracker with Personalized AI** is a menstrual cycle tracking application featuring AI-powered personalized predictions. The system is designed to solve the **Cold Start Problem** (new users with limited historical data) using a 3-Tier Hybrid Architecture.

**Key System Features:**
- **Hybrid Prediction Engine:** Combines Weighted Moving Average, Bayesian Shrinkage, and ML models for cold-start users
- **Personalized Symptom Analysis:** Calculates symptom probabilities from user history
- **Dynamic Ovulation Calculation:** Adjusts based on cycle regularity
- **AI Chatbot:** Health assistant powered by Google Gemini API

---

## <a id="section2">2. สถาปัตยกรรมเทคโนโลยี | Tech Stack</a>

### ภาษาไทย

| ชั้นการทำงาน (Layer) | เทคโนโลยี | เหตุผลการเลือกใช้ |
|----------------------|-----------|-------------------|
| **ส่วนหน้าบ้าน (Frontend)** | Next.js 16 + React 19 + TypeScript | การเรนเดอร์ฝั่งเซิร์ฟเวอร์ (SSR) เพื่อ SEO, App Router สำหรับการนำทางสมัยใหม่ |
| **การจัดการสไตล์ (Styling)** | Tailwind CSS 4 | ระบบ CSS แบบ utility-first ที่ช่วยให้พัฒนา UI ได้รวดเร็ว |
| **ส่วนหลังบ้าน (Backend)** | FastAPI + Python 3.11 | กรอบงาน ASGI ประสิทธิภาพสูง, เอกสาร API อัตโนมัติ |
| **ฐานข้อมูล (Database)** | PostgreSQL 16 | ACID compliance, รองรับ JSONB สำหรับโครงสร้างข้อมูลที่ยืดหยุ่น |
| **ORM** | SQLAlchemy 2.0 | การกำหนดโมเดลแบบ declarative, รองรับการทำ migration |
| **การยืนยันตัวตน (Authentication)** | JWT (python-jose) + bcrypt | การยืนยันตัวตนแบบ stateless, การแฮชรหัสผ่านที่ปลอดภัย |
| **AI/ML** | Scikit-learn (HistGradientBoostingRegressor) | รองรับค่า NaN โดยธรรมชาติ, ต้านทานการ overfitting กับข้อมูลขนาดเล็ก |
| **แชทบอท (Chatbot)** | Google Gemini API | ระบบสนทนา AI ที่เข้าใจบริบทสำหรับคำถามด้านสุขภาพ |
| **คอนเทนเนอร์ (Container)** | Docker + Docker Compose | การปรับใช้ด้วยคำสั่งเดียว, สภาพแวดล้อมที่สม่ำเสมอ |

---

### English

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Server-side rendering for SEO, App Router for modern routing |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework for rapid UI development |
| **Backend** | FastAPI + Python 3.11 | High-performance ASGI framework, automatic API documentation |
| **Database** | PostgreSQL 16 | ACID compliance, JSONB support for flexible schemas |
| **ORM** | SQLAlchemy 2.0 | Declarative model definition, migration support |
| **Authentication** | JWT (python-jose) + bcrypt | Stateless authentication, secure password hashing |
| **AI/ML** | Scikit-learn (HistGradientBoostingRegressor) | Native NaN support, resistant to overfitting with small data |
| **Chatbot** | Google Gemini API | Context-aware AI for health queries |
| **Container** | Docker + Docker Compose | One-command deployment, consistent environments |

---

## <a id="section3">3. โครงสร้างโครงการ | Project Structure</a>

```
period-tracker/
│
├── README.md                      # คู่มือการใช้งาน | User guide
├── ARCHITECTURE.md               # เอกสารสถาปัตยกรรม | Architecture doc
├── docker-compose.yml            # การประสานงาน Docker | Docker orchestration
├── requirements.txt              # ไลบรารี Python | Python dependencies
│
├── frontend/                     # แอปพลิเคชัน Next.js 16
│   ├── app/
│   │   ├── (app)/               # เส้นทางที่ต้องยืนยันตัวตน | Protected routes
│   │   │   ├── dashboard/       # แดชบอร์ดผู้ใช้ | User dashboard
│   │   │   ├── daily-log/       # การบันทึกอาการ | Symptom tracking
│   │   │   ├── community/       # คุณลักษณะชุมชน | Community features
│   │   │   └── admin/           # แดชบอร์ดผู้ดูแล | Admin dashboard
│   │   ├── components/          # คอมโพเนนต์ React
│   │   └── lib/                 # ยูทิลิตี API | API utilities
│   ├── package.json
│   └── Dockerfile
│
├── backend/                      # แอปพลิเคชัน FastAPI
│   ├── app/
│   │   ├── api/                 # เส้นทาง API | API routes
│   │   ├── core/                # ฐานข้อมูล, ความปลอดภัย | Database, security
│   │   ├── models/              # โมเดล SQLAlchemy
│   │   ├── schemas/             # สคีมา Pydantic
│   │   └── services/            # ตรรกะธุรกิจ | Business logic
│   ├── tests/                   # ชุดทดสอบ | Test suite
│   ├── init_settings.py         # เริ่มต้นการตั้งค่า | Initialize settings
│   ├── create_admin.py          # สร้างผู้ดูแล | Create admin user
│   └── Dockerfile
│
└── ml/                           # โมดูล Machine Learning
    ├── base_model/              # การฝึกและทำนาย | Training & prediction
    ├── data/                    # ชุดข้อมูล | Datasets
    └── saved_models/            # โมเดลที่ผ่านการฝึก | Trained models
```

---

## <a id="section4">4. สูตรคณิตศาสตร์และตรรกะการทำนาย | Mathematical Formulas</a>

### 4.1 ระบบเครื่องยนต์ทำนายแบบไฮบริด 3 ระดับ | 3-Tier Hybrid Prediction System

#### ภาษาไทย

ระบบจะเลือกอัลกอริทึมโดยอัตโนมัติตามจำนวนรอบเดือนที่ผู้ใช้บันทึก:

| จำนวนรอบเดือน | อัลกอริทึมที่ใช้ | ความเชื่อมั่น |
|--------------|------------------|---------------|
| 0-3 รอบ | โมเดล ML ส่วนกลาง (Global ML Model) | ~50% |
| 4-5 รอบ | การหดเก็บแบบเบย์ (Bayesian Shrinkage) | ~65% |
| 6+ รอบ | ค่าเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก (Weighted Moving Average) | 70-90% |

---

#### English

The system automatically selects the algorithm based on the user's cycle count:

| Cycle Count | Algorithm Used | Confidence |
|-------------|----------------|------------|
| 0-3 cycles | Global ML Model | ~50% |
| 4-5 cycles | Bayesian Shrinkage | ~65% |
| 6+ cycles | Weighted Moving Average | 70-90% |

---

### 4.2 ค่าเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก (Weighted Moving Average - WMA)

#### ภาษาไทย

ใช้สำหรับผู้ใช้ที่มีข้อมูล 6+ รอบ ให้น้ำหนักกับรอบล่าสุดมากกว่ารอบเก่า

**ขั้นตอนการคำนวน:**
1. ลบค่าผิดปกติ (outliers) ที่เกิน 2 ส่วนเบี่ยงเบนมาตรฐาน (SD)
2. คำนวณค่าเฉลี่ยถ่วงน้ำหนัก

---

#### English

Used for users with 6+ cycles. Gives more weight to recent cycles.

**Calculation Steps:**
1. Remove outliers beyond 2 standard deviations
2. Calculate weighted average

**Formula:**

$$\text{WMA} = \frac{\sum_{i=1}^{n} w_i \cdot x_i}{\sum_{i=1}^{n} w_i}$$

Where:
- $w_i = i$ (weight increases linearly with recency)
- $x_i$ = cycle length at position $i$
- $n$ = number of cycles (max 6, configurable)

**Outlier Removal:**

$$\text{Filtered} = \{x \in \text{cycles} : |\frac{x - \mu}{\sigma}| \leq 2\}$$

---

### 4.3 การหดเก็บแบบเบย์ (Bayesian Shrinkage)

#### ภาษาไทย

ใช้สำหรับผู้ใช้ที่มีข้อมูล 4-5 รอบ ผสมผสานข้อมูลส่วนบุคคลกับค่าเฉลี่ยของประชากร (global priors) เพื่อป้องกันการ overfitting

**หลักการ:** ใช้ค่าเฉลี่ยแบบถ่วงน้ำหนักระหว่างข้อมูลผู้ใช้และข้อมูลประชากร โดยมี "พลัง" (strength) ของค่าก่อนหน้า (prior) เท่ากับ 3 การสังเกต (k = 3)

---

#### English

Used for users with 4-5 cycles. Blends personal data with population averages to prevent overfitting.

**Principle:** Weighted average between user data and population data, with prior strength of 3 observations.

**Formula (Empirical Bayes):**

$$\text{Posterior Mean} = \frac{n \cdot \bar{x}_{\text{user}} + k \cdot \mu_{\text{prior}}}{n + k}$$

Where:
- $n$ = number of user cycles
- $\bar{x}_{\text{user}}$ = user average cycle length
- $k = 3$ (prior strength in pseudo-observations)
- $\mu_{\text{prior}}$ = global population mean

**Shrinkage Factor:**

$$\text{Shrinkage} = \frac{n}{n + k}$$

| Cycles (n) | User Data Weight | Prior Weight |
|------------|------------------|--------------|
| 4 | 57% | 43% |
| 5 | 63% | 37% |

---

### 4.4 คะแนนความเชื่อมั่น (Confidence Score)

#### ภาษาไทย

คะแนนความเชื่อมั่นขึ้นอยู่กับ:
1. จำนวนข้อมูล (น้อย = ความเชื่อมั่นต่ำ)
2. ความสม่ำเสมอ (SD สูง = ความเชื่อมั่นต่ำ)
3. ความเก่าของข้อมูล (ข้อมูลเก่า = ความเชื่อมั่นลดลง)

---

#### English

Confidence depends on: data volume, consistency, and data freshness.

**Formula:**

$$\text{Confidence} = \text{base} \times \text{data_quality} \times \text{freshness}$$

**Data Quality Penalty:**

$$\text{Penalty} = \min(1.0, \frac{1}{1 + \frac{\sigma}{5}})$$

Where $\sigma$ = standard deviation of cycle lengths

---

### 4.5 การคำนวณคาบเวลาลูทีอัลแบบไดนามิก (Dynamic Luteal Phase Calculation)

#### ภาษาไทย

ระบบปรับจำนวนวันระหว่างวันตกไข่ (ovulation) ถึงมีประจำเดือน (luteal phase) ตามความสม่ำเสมอของรอบเดือน

**การจำแนกความสม่ำเสมอ:**
- สม่ำเสมอมาก (Very Regular): SD < 2.0 วัน
- สม่ำเสมอปานกลาง (Moderate): SD 2.0-4.0 วัน
- ไม่สม่ำเสมอ (Irregular): SD > 4.0 วัน

---

#### English

The system adjusts the luteal phase (ovulation to period) based on cycle regularity.

**Regularity Classification:**
- Very Regular: SD < 2.0 days
- Moderate: SD 2.0-4.0 days
- Irregular: SD > 4.0 days

**Formula:**

$$\text{LutealPhase} = \begin{cases} \text{offset} - 1 & \text{if Very Regular} \\ \text{offset} & \text{if Moderate} \\ \text{offset} + 2 & \text{if Irregular} \end{cases}$$

Where `offset` = `ovulation_offset_days` setting (default: 14)

---

### 4.6 ความน่าจะเป็นของอาการ (Symptom Probability)

#### ภาษาไทย

คำนวณความน่าจะเป็นที่ผู้ใช้จะมีอาการใดอาการหนึ่งในระยะต่าง ๆ ของรอบเดือน โดยผสมผสาน:
1. ความถี่ที่พบอาการในประชากรทั่วไป (base probability)
2. ประวัติการมีอาการของผู้ใช้ (user history)
3. น้ำหนักความน่าเชื่อถือตามจำนวนข้อมูล

---

#### English

Calculates probability of experiencing a symptom during cycle phases, blending population base rates with user history.

**Formula:**

$$\text{FinalProbability} = \frac{n_{\text{user}} \cdot p_{\text{user}} + k_{\text{prior}} \cdot p_{\text{base}}}{n_{\text{user}} + k_{\text{prior}}}$$

Where:
- $p_{\text{user}}$ = observed probability from user's history
- $p_{\text{base}}$ = base probability from system settings (default: 30%)
- $n_{\text{user}}$ = number of cycles with this symptom logged
- $k_{\text{prior}} = 3$ (prior strength)

---

## <a id="section5">5. หลักการเลือกใช้วิธีการ | Methodology Rationale</a>

### ภาษาไทย

#### ทำไมถึงเลือกค่าเฉลี่ยเคลื่อนที่แบบถ่วงน้ำหนัก (WMA) แทนค่าเฉลี่ยธรรมดา?

รอบเดือนของผู้หญิงมีแนวโน้มเปลี่ยนแปลงตามอายุ, ความเครียด, และปัจจัยชีวิตอื่น ๆ การให้น้ำหนักรอบล่าสุดมากกว่าช่วยให้การทำนายสะท้อนสภาวะปัจจุบันของผู้ใช้มากขึ้น

#### ทำไมถึงใช้การหดเก็บแบบเบย์ (Bayesian Shrinkage) ด้วย k=3?

- **k=3** หมายถึงเทียบเท่ากับมีข้อมูลก่อนหน้า 3 รอบ
- เมื่อผู้ใช้มี 4-5 รอบ ข้อมูลส่วนบุคคลจะมีน้ำหนัก ~57-63%
- ช่วยป้องกันการ overfitting เมื่อข้อมูลยังน้อย แต่ยังให้ความสำคัญกับข้อมูลส่วนบุคคล

#### ทำไมถึงเลือกสถาปัตยกรรมแบบ 3 ระดับ แทน Deep Learning?

| ปัจจัย | สถาปัตยกรรมไฮบริด | Deep Learning |
|--------|------------------|---------------|
| ปัญหา Cold Start | ✅ รองรับ (ใช้ ML ส่วนกลาง) | ❌ ไม่รองรับ |
| ข้อมูลขนาดเล็ก | ✅ ทนทาน | ❌ Overfit ง่าย |
| การอธิบายได้ (Interpretability) | ✅ สูง (อธิบายสูตรได้) | ❌ กล่องดำ |
| ต้นทุนการฝึก | ✅ CPU อย่างเดียว | ❌ ต้องใช้ GPU |
| ความเร็วในการทำนาย | ✅ มิลลิวินาที | ⚠️ ช้ากว่า |

#### ทำไมถึงเลือก HistGradientBoostingRegressor?

- **รองรับค่าหายไป (NaN) โดยธรรมชาติ:** ข้อมูลผู้ใช้มักมีช่องว่าง (เช่น ไม่ได้บันทึก BMI)
- **ต้านทานการ overfitting:** ไม่จำข้อมูลการฝึกแบบ decision tree ธรรมดา
- **เบา:** ไม่ต้องใช้ GPU หรือทรัพยากรมาก

---

### English

#### Why Weighted Moving Average (WMA) instead of Simple Average?

Menstrual cycles change with age, stress, and lifestyle. Weighting recent cycles more captures the user's current state better.

#### Why Bayesian Shrinkage with k=3?

- **k=3** equals 3 pseudo-observations of prior data
- With 4-5 user cycles, personal data has ~57-63% weight
- Prevents overfitting with sparse data while valuing personal information

#### Why 3-Tier Architecture over Deep Learning?

| Factor | Hybrid Architecture | Deep Learning |
|--------|---------------------|---------------|
| Cold Start | ✅ Supported (Global ML) | ❌ Not supported |
| Small Data | ✅ Robust | ❌ Overfits easily |
| Interpretability | ✅ High (explainable formulas) | ❌ Black box |
| Training Cost | ✅ CPU only | ❌ Requires GPU |
| Inference Speed | ✅ Milliseconds | ⚠️ Slower |

#### Why HistGradientBoostingRegressor?

- **Native NaN support:** User data often has gaps (e.g., missing BMI)
- **Overfitting resistant:** Doesn't memorize training data like regular decision trees
- **Lightweight:** No GPU or heavy resources needed

---

## <a id="section6">6. กระแสข้อมูลในระบบ | System Data Flow</a>

### 6.1 การไหลของการทำนายรอบเดือน | Cycle Prediction Flow

#### ภาษาไทย

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. ผู้ใช้บันทึกรอบเดือนใหม่                                                  │
│     → POST /cycles (Frontend → Backend)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. ระบบนับจำนวนรอบเดือนที่มี                                               │
│     → SELECT COUNT(*) FROM cycles WHERE user_id = ?                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. เลือกอัลกอริทึมตามจำนวนข้อมูล                                           │
│     ┌─────────────────┬─────────────────┬─────────────────┐                │
│     │   0-3 รอบ       │   4-5 รอบ       │   6+ รอบ        │                │
│     │   ↓             │   ↓             │   ↓             │                │
│     │ โมเดล ML        │  การหดเก็บ      │   WMA           │                │
│     │ ส่วนกลาง        │  แบบเบย์        │  (ข้อมูล        │                │
│     │                 │                 │   ส่วนบุคคล)    │                │
│     └─────────────────┴─────────────────┴─────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. คำนวณวันที่คาดการณ์                                                     │
│     → next_period = last_period_start + predicted_cycle_length             │
│     → ovulation_date = next_period - luteal_phase                          │
│     → fertility_window = [ovulation-5, ovulation+1]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. ส่งผลลัพธ์กลับไปยัง Frontend                                            │
│     → JSON: {predicted_date, confidence_score, algorithm_used}             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ไฟล์ที่เกี่ยวข้อง:**
- `backend/app/services/prediction_engine.py` - ตรรกะการทำนายหลัก
- `backend/app/services/prediction_service.py` - การห่อหุ้มการทำนาย
- `backend/app/api/prediction.py` - จุดสิ้นสุด API

---

#### English

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. User logs new cycle                                                     │
│     → POST /cycles (Frontend → Backend)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  2. System counts user's cycles                                             │
│     → SELECT COUNT(*) FROM cycles WHERE user_id = ?                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  3. Select algorithm based on data count                                     │
│     ┌─────────────────┬─────────────────┬─────────────────┐                │
│     │   0-3 cycles    │   4-5 cycles    │   6+ cycles     │                │
│     │   ↓             │   ↓             │   ↓             │                │
│     │ Global ML       │  Bayesian       │  WMA            │                │
│     │ Model           │  Shrinkage      │  (Personal      │                │
│     │                 │                 │   Data)         │                │
│     └─────────────────┴─────────────────┴─────────────────┘                │
├─────────────────────────────────────────────────────────────────────────────┤
│  4. Calculate predicted dates                                                │
│     → next_period = last_period_start + predicted_cycle_length             │
│     → ovulation_date = next_period - luteal_phase                          │
│     → fertility_window = [ovulation-5, ovulation+1]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  5. Return results to Frontend                                              │
│     → JSON: {predicted_date, confidence_score, algorithm_used}             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `backend/app/services/prediction_engine.py` - Core prediction logic
- `backend/app/services/prediction_service.py` - Prediction facade
- `backend/app/api/prediction.py` - API endpoints

---

### 6.2 การไหลของข้อมูล AI Insights | AI Insights Flow

#### ภาษาไทย

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI INSIGHTS PIPELINE                                │
│                                                                             │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐      │
│  │  ข้อมูลรอบเดือน  │────→│  การคำนวณ       │────→│  การทำนาย       │      │
│  │  (Cycle Data)   │     │  ความสม่ำเสมอ   │     │  อาการ          │      │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘      │
│                                    │                      │                 │
│                                    ↓                      ↓                 │
│                          ┌──────────────────┐     ┌──────────────────┐      │
│                          │  การจำแนก        │     │  การคำนวณ       │      │
│                          │  ประเภท          │     │  วันตกไข่       │      │
│                          │  (Regularity      │     │  แบบไดนามิก     │      │
│                          │   Category)      │     │                  │      │
│                          └──────────────────┘     └──────────────────┘      │
│                                    │                      │                 │
│                                    ↓                      ↓                 │
│                          ┌───────────────────────────────────────┐           │
│                          │      การสร้างคำแนะนำอัจฉริยะ         │           │
│                          │      (Smart Recommendation)           │           │
│                          └───────────────────────────────────────┘           │
│                                             │                               │
│                                             ↓                               │
│                          ┌───────────────────────────────────────┐           │
│                          │      การตอบกลับ JSON                   │           │
│                          │      (API Response)                     │           │
│                          └───────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**องค์ประกอบหลัก:**
1. **เครื่องยนต์คำนวณความน่าจะเป็นของอาการ (SymptomProbabilityEngine)**
   - ไฟล์: `backend/app/services/ai_insights_service.py`
   - ฟังก์ชัน: `calculate_symptom_probabilities()`

2. **เครื่องคำนวณคาบเวลาลูทีอัลแบบไดนามิก (DynamicLutealPhaseCalculator)**
   - ฟังก์ชัน: `calculate_dynamic_luteal_phase()`
   - ปรับค่าตาม SD ของรอบเดือน

3. **เครื่องยนต์คำแนะนำอัจฉริยะ (SmartRecommendationEngine)**
   - สร้างคำแนะนำจากรูปแบบที่ตรวจพบ

---

#### English

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI INSIGHTS PIPELINE                                │
│                                                                             │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐      │
│  │   Cycle Data    │────→│   Regularity     │────→│   Symptom       │      │
│  │                 │     │   Calculation    │     │   Predictions   │      │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘      │
│                                    │                      │                 │
│                                    ↓                      ↓                 │
│                          ┌──────────────────┐     ┌──────────────────┐      │
│                          │   Regularity     │     │   Dynamic       │      │
│                          │   Category       │     │   Ovulation     │      │
│                          │   Classification │     │   Calculation   │      │
│                          └──────────────────┘     └──────────────────┘      │
│                                    │                      │                 │
│                                    ↓                      ↓                 │
│                          ┌───────────────────────────────────────┐           │
│                          │      Smart Recommendation Generation  │           │
│                          └───────────────────────────────────────┘           │
│                                             │                               │
│                                             ↓                               │
│                          ┌───────────────────────────────────────┐           │
│                          │      JSON API Response                  │           │
│                          └───────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Components:**
1. **SymptomProbabilityEngine**
   - File: `backend/app/services/ai_insights_service.py`
   - Function: `calculate_symptom_probabilities()`

2. **DynamicLutealPhaseCalculator**
   - Function: `calculate_dynamic_luteal_phase()`
   - Adjusts based on cycle SD

3. **SmartRecommendationEngine**
   - Generates recommendations from detected patterns

---

## <a id="section7">7. โมดูลหลักของระบบ | Core Modules</a>

### 7.1 ระบบยืนยันตัวตน (Authentication System)

| คอมโพเนนต์ | ไฟล์ | คีย์ฟังก์ชัน |
|-----------|------|-------------|
| การแฮชรหัสผ่าน | `backend/app/core/security.py` | `hash_password()`, `verify_password()` |
| JWT Token | `backend/app/core/security.py` | `create_access_token()`, `decode_access_token()` |
| API ยืนยันตัวตน | `backend/app/api/auth.py` | `register()`, `login()` |
| JWT Dependency | `backend/app/api/auth_deps.py` | `get_current_user()` |

**รายละเอียดความปลอดภัย:**
- อัลกอริทึม JWT: HS256
- ระยะเวลา token: 60 นาที
- การแฮชรหัสผ่าน: bcrypt

---

### 7.2 ระบบตั้งค่าแบบไดนามิก (Dynamic Configuration System)

**ปัญหาที่แก้:** การปรับค่า AI Parameters ต้องแก้โค้ดและ redeploy

**วิธีแก้:** ใช้ตาราง `SystemSetting` เก็บค่า configuration ทั้งหมด

**การตั้งค่า AI หลัก:**

| คีย์การตั้งค่า | ค่าเริ่มต้น | คำอธิบาย |
|----------------|-------------|----------|
| `ai_regularity_strict_sd` | 2.0 | SD threshold สำหรับ "สม่ำเสมอมาก" |
| `ai_regularity_moderate_sd` | 4.0 | SD threshold สำหรับ "สม่ำเสมอปานกลาง" |
| `ai_symptom_base_prob` | 30 | ความน่าจะเป็นพื้นฐานของอาการ (%) |
| `ovulation_offset_days` | 14 | ค่ามาตรฐานของคาบเวลาลูทีอัล |

---

### 7.3 โมดูลแชทบอท AI (AI Chatbot Module)

**การทำงาน:**
1. รับข้อความจากผู้ใช้ + บริบทสุขภาพ
2. สร้าง prompt ระบบจากบริบท
3. ส่งไปยัง Google Gemini API
4. คืนค่าการตอบกลับ

**ไฟล์:** `backend/app/services/llm_service.py`

**คุณสมบัติพิเศษ:**
- การปรับเนื้อหา (Content Moderation) โดยใช้ Gemini
- การตอบกลับสำรอง (Fallback) เมื่อ API ไม่พร้อมใช้งาน

---

## <a id="section8">8. แผนงานในอนาคต | Future Roadmap</a>

### ภาษาไทย

#### ฟีเจอร์ที่ยังไม่สมบูรณ์ | Partially Implemented

| ฟีเจอร์ | สถานะ | สิ่งที่ต้องทำ |
|---------|-------|---------------|
| **การแจ้งเตือนทางอีเมล** | ⚠️ บางส่วน | สคีมาฐานข้อมูลและ API มีอยู่แล้ว แต่ยังไม่มีการเชื่อมต่อกับบริการ SMTP หรือการส่งอีเมลจริง |
| **การปรับแต่ง ML ขั้นสูง** | ⚠️ โครงสร้าง | มีโฟลเดอร์ `ml/personalization/` และไฟล์ `fine_tune.py` แต่ยังไม่มีการใช้งานจริง |

#### ฟีเจอร์ที่วางแผนไว้ | Planned Features

| ฟีเจอร์ | สถานะ | ลำดับความสำคัญ |
|---------|-------|----------------|
| **แอปมือถือ (React Native)** | ❌ ยังไม่เริ่ม | ปานกลาง |
| **การเชื่อมต่ออุปกรณ์สวมใส่** | ❌ ยังไม่เริ่ม | ต่ำ |
| **FHIR Integration** | ❌ ยังไม่เริ่ม | ต่ำ |
| **การวิเคราะห์รูปแบบขั้นสูง** | ❌ ยังไม่เริ่ม | ปานกลาง |

---

### English

#### Partially Implemented Features

| Feature | Status | What Needs To Be Done |
|---------|--------|----------------------|
| **Email Notifications** | ⚠️ Partial | Database schema and API exist, but SMTP service integration and actual email sending not implemented |
| **Advanced ML Personalization** | ⚠️ Scaffolding | Folder `ml/personalization/` and `fine_tune.py` exist but not functional |

#### Planned Features

| Feature | Status | Priority |
|---------|--------|----------|
| **Mobile App (React Native)** | ❌ Not Started | Medium |
| **Wearable Device Integration** | ❌ Not Started | Low |
| **FHIR Integration** | ❌ Not Started | Low |
| **Advanced Pattern Analysis** | ❌ Not Started | Medium |

---

### 8.1 รายละเอียดสิ่งที่ขาดหาย | Detailed Missing Components

#### ระบบแจ้งเตือนอีเมล (Email Notification System)

**สิ่งที่มีแล้ว:**
- ✅ โมเดล `Notification` และ `NotificationSetting` ในฐานข้อมูล
- ✅ API endpoints สำหรับการตั้งค่าการแจ้งเตือน
- ✅ คอลัมน์ `enable_email` ในตาราง `notification_settings`

**สิ่งที่ยังขาด:**
- ❌ การกำหนดค่า SMTP (host, port, username, password)
- ❌ บริการส่งอีเมล (Email service)
- ❌ การตั้งเวลาแจ้งเตือนอัตโนมัติ (Cron job / scheduler)
- ❌ เทมเพลตอีเมล (Email templates)

**ไฟล์ที่ต้องสร้าง/แก้ไข:**
- `backend/app/services/email_service.py` (ใหม่)
- `backend/app/core/config.py` - เพิ่มการตั้งค่า SMTP
- `backend/app/tasks/scheduled_notifications.py` (ใหม่)

---

#### การปรับแต่ง ML ส่วนบุคคล (ML Personalization)

**สิ่งที่มีแล้ว:**
- ✅ โครงสร้างโฟลเดอร์ `ml/personalization/`
- ✅ ไฟล์ `fine_tune.py` และ `hybrid_strategy.py` (โครง)

**สิ่งที่ยังขาด:**
- ❌ การฝึกโมเดลสำหรับผู้ใช้แต่ละราย (Per-user model training)
- ❌ กลไกการอัปเดตโมเดลเมื่อมีข้อมูลใหม่
- ❌ การจัดเก็บโมเดลที่ปรับแต่งแล้ว (Model storage)

---

## <a id="section9">9. การติดตั้งและใช้งาน | Deployment</a>

### ภาษาไทย

#### การติดตั้งด้วย Docker (แนะนำ)

```bash
# 1. โคลนและกำหนดค่า
git clone <repository-url>
cd period-tracker
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. เริ่มบริการทั้งหมด
docker-compose up -d

# 3. เริ่มต้นการตั้งค่าระบบ
docker-compose exec backend python init_settings.py

# 4. สร้างผู้ใช้ผู้ดูแล
docker-compose exec backend python create_admin.py
```

**พอร์ตที่ใช้:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

---

### English

#### Docker Deployment (Recommended)

```bash
# 1. Clone and configure
git clone <repository-url>
cd period-tracker
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start all services
docker-compose up -d

# 3. Initialize system settings
docker-compose exec backend python init_settings.py

# 4. Create admin user
docker-compose exec backend python create_admin.py
```

**Ports:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

---

## <a id="section10">10. เครดิตและการรับรอง | Credits</a>

### ภาษาไทย

**พัฒนาโดย:** **CPE STUDENTS**

**การตัดสินใจทางเทคนิคหลัก:**
- ใช้ FastAPI เพื่อประสิทธิภาพแบบ async
- สถาปัตยกรรม ML แบบไฮบริดสำหรับการจัดการปัญหา Cold Start
- การตั้งค่าผ่านฐานข้อมูลเพื่อความยืดหยุ่น
- Google Gemini สำหรับ AI สนทนา

**แหล่งข้อมูล:**
- ชุดข้อมูลรอบเดือน (Kaggle)
- FedCycleData สำหรับสถิติประชากร
- การเพิ่มข้อมูลสังเคราะห์สำหรับการฝึก

---

### English

**Developed By:** **CPE STUDENTS**

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

*เอกสารนี้เป็นเอกสารอ้างอิงหลักสำหรับการพัฒนา Period Tracker หากมีคำถามหรือต้องการคำชี้แจง กรุณาติดต่อทีมพัฒนา CPE STUDENTS*

*This document serves as the primary engineering reference for the Period Tracker application. For questions or clarifications, please contact the CPE STUDENTS development team.*

