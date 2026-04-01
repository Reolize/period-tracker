# Prediction Engine Performance Report

> **Evaluation Date:** April 02, 2026  
> **Test Accounts:** 11 seeded personas  
> **Evaluation Method:** Backtesting (Hide-1-Predict methodology)

---

## Executive Summary

### Overall Performance Metrics

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **Average Absolute Error** | 4.8 days | Mean deviation from actual cycle length |
| **Overall Accuracy** | 87.0% | Average prediction accuracy across all profiles |
| **Best Case Accuracy** | 100.0% | Regular Cycles (avg=28d, σ=0.0d) |
| **Worst Case Accuracy** | 57.7% | Regular Cycles (avg=27d, σ=1.4d) |

### Performance by Prediction Tier

| Tier | Users | Avg Accuracy | Avg Error | Description |
|------|-------|--------------|-----------|-------------|
| Tier 1: Global ML Model | 1 | 57.7% | 11.0d | Users with insufficient data (< 4 cycles) |
| Tier 1: Global Baseline Fallback | 1 | 98.2% | 0.5d | Cold-start users with 0-1 cycles |
| Tier 2: Bayesian Shrinkage | 1 | 96.6% | 1.0d | Sparse data users (4-5 cycles) |
| Tier 3: Weighted Moving Average | 8 | 88.1% | 5.0d | Rich data users (6+ cycles) |

---

## Detailed Case Analysis

### Case 1: PCOS - Moderate (σ=5.4d)

**User:** `irregular.moderate@test.com` | **ID:** 14 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=31d, σ=5.4d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 31 days |
| **Actual Length** | 37 days |
| **Absolute Error** | 6.0 days |
| **Accuracy** | ⚡ 83.8% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

⚡ **Moderate Accuracy:** 5+ days error. User may have external factors (stress, illness) affecting regularity.

---

### Case 2: PCOS - Severe Irregularity (σ=14.2d)

**User:** `pcos.severe@test.com` | **ID:** 15 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=36d, σ=13.9d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 31 days |
| **Actual Length** | 53 days |
| **Absolute Error** | 22.0 days |
| **Accuracy** | 📊 58.5% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

⚠️ **High Variance Detected:** Cycle lengths vary significantly (σ=13.9 days). Engine treated this as irregular pattern and may have applied outlier filtering.

📊 **Low Accuracy:** Significant deviation (22 days). Consider if user has irregular cycles or external disruptions.

---

### Case 3: New User (1 Cycle)

**User:** `newuser.1cycle@test.com` | **ID:** 17 | **Cycles:** 1

#### Input Pattern
```
1 cycle (New User)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 28 days |
| **Actual Length** | 28 days |
| **Absolute Error** | 0.5 days |
| **Accuracy** | 🎯 98.2% |
| **Engine Tier** | Tier 1: Global Baseline Fallback |

#### Engine Behavior Rationale

**Global Baseline (28.5 days)**
Engine detected only 1 cycle and fell back to global population baseline of 28.5 days (average menstrual cycle length). No personal data available for customization. This is expected behavior for cold-start users.

---

### Case 4: Long Cycles - Regular (avg=38d)

**User:** `long.35days@test.com` | **ID:** 12 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=37d, σ=1.6d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 36 days |
| **Actual Length** | 42 days |
| **Absolute Error** | 6.0 days |
| **Accuracy** | 👍 85.7% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=1.6 days). Engine had high confidence in predictions.

👍 **Good Accuracy:** Within 3-4 days. Acceptable for menstrual health tracking.

---

### Case 5: Moderate Variation (σ=3.3d)

**User:** `irregular.mild@test.com` | **ID:** 13 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=27d, σ=3.4d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 27 days |
| **Actual Length** | 29 days |
| **Absolute Error** | 2.0 days |
| **Accuracy** | 👍 93.1% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

👍 **Good Accuracy:** Within 3-4 days. Acceptable for menstrual health tracking.

---

### Case 6: Regular Cycles (avg=27d, σ=1.4d)

**User:** `newuser.2cycles@test.com` | **ID:** 16 | **Cycles:** 2

#### Input Pattern
```
1 cycles (insufficient for stats)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 37 days |
| **Actual Length** | 26 days |
| **Absolute Error** | 11.0 days |
| **Accuracy** | 📊 57.7% |
| **Engine Tier** | Tier 1: Global ML Model |

#### Engine Behavior Rationale

**Tier 1: Global ML Model**
Engine detected insufficient personal data (< 4 cycles or missing values) and automatically fell back to the Global ML Model trained on population data. Uses demographic features (Age, BMI, Lifestyle) to predict cycle length.

📊 **Low Accuracy:** Significant deviation (11 days). Consider if user has irregular cycles or external disruptions.

---

### Case 7: Regular Cycles (avg=28d, σ=0.0d)

**User:** `regular.28days@test.com` | **ID:** 9 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=28d, σ=0.0d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 28 days |
| **Actual Length** | 28 days |
| **Absolute Error** | 0.0 days |
| **Accuracy** | 🎯 100.0% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=0.0 days). Engine had high confidence in predictions.

🎯 **Excellent Accuracy:** Within 1-2 days of actual. Prediction closely matched real biological cycle.

---

### Case 8: Regular Cycles (avg=29d, σ=0.7d)

**User:** `regular.29days@test.com` | **ID:** 10 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=29d, σ=0.7d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 28 days |
| **Actual Length** | 29 days |
| **Absolute Error** | 1.0 days |
| **Accuracy** | 🎯 96.6% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=0.7 days). Engine had high confidence in predictions.

🎯 **Excellent Accuracy:** Within 1-2 days of actual. Prediction closely matched real biological cycle.

---

### Case 9: Regular Cycles (avg=29d, σ=0.8d)

**User:** `jane.test@example.com` | **ID:** 1 | **Cycles:** 6

#### Input Pattern
```
4 cycles (avg=29d, σ=1.0d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 30 days |
| **Actual Length** | 29 days |
| **Absolute Error** | 1.0 days |
| **Accuracy** | 🎯 96.6% |
| **Engine Tier** | Tier 2: Bayesian Shrinkage |

#### Engine Behavior Rationale

**Tier 2: Bayesian Shrinkage**
Engine detected sparse data (4-5 cycles) and applied Empirical Bayes shrinkage to blend user averages with global population priors (k=3 pseudo-observations). Prevents overfitting while incorporating personal trends.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=1.0 days). Engine had high confidence in predictions.

🎯 **Excellent Accuracy:** Within 1-2 days of actual. Prediction closely matched real biological cycle.

---

### Case 10: Regular Cycles (avg=29d, σ=1.0d)

**User:** `variable.period@test.com` | **ID:** 18 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=29d, σ=0.9d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 29 days |
| **Actual Length** | 28 days |
| **Absolute Error** | 1.0 days |
| **Accuracy** | 🎯 96.4% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=0.9 days). Engine had high confidence in predictions.

🎯 **Excellent Accuracy:** Within 1-2 days of actual. Prediction closely matched real biological cycle.

---

### Case 11: Short Cycles - Regular (avg=23d)

**User:** `short.21days@test.com` | **ID:** 11 | **Cycles:** 12

#### Input Pattern
```
11 cycles (avg=24d, σ=1.0d)
```

#### Prediction Results

| Metric | Value |
|--------|-------|
| **Predicted Length** | 24 days |
| **Actual Length** | 22 days |
| **Absolute Error** | 2.0 days |
| **Accuracy** | 👍 90.9% |
| **Engine Tier** | Tier 3: Weighted Moving Average |

#### Engine Behavior Rationale

**Tier 3: Weighted Moving Average**
Engine detected rich data (6+ cycles) and used Weighted Moving Average with linear recency weighting. Recent cycles weighted more heavily than older ones. Outlier removal (>2 SD) applied before calculation.

✅ **Highly Regular Pattern:** Very consistent cycles (σ=1.0 days). Engine had high confidence in predictions.

👍 **Good Accuracy:** Within 3-4 days. Acceptable for menstrual health tracking.

---

## Conclusions & Recommendations

### Key Findings

1. **Cold Start Handling:** Users with 0-1 cycles fall back to global baseline (28.5 days) with ~50-60% accuracy expected.

2. **Data Richness Impact:** As users accumulate more cycles, accuracy improves significantly:
   - 4-5 cycles (Bayesian): ~65% accuracy
   - 6+ cycles (WMA): 70-90%+ accuracy

3. **Regularity Matters:** Users with consistent cycles (low σ) achieve higher accuracy than irregular users.

4. **Outlier Resilience:** Engine's 2-SD outlier filtering helps maintain accuracy despite occasional anomalous cycles.

### Recommendations

- **For New Users:** Encourage logging at least 4 cycles to move from Global ML to Bayesian tier
- **For Irregular Users:** Consider recommending "strict" mode for manual override when patterns are unpredictable
- **For High-Accuracy Needs:** 6+ months of consistent logging yields best results

---

*Report generated by `evaluate_engine.py` - CPE STUDENTS Prediction Engine Evaluation*  
*Based on hybrid 3-tier architecture: Global ML → Bayesian Shrinkage → Weighted Moving Average*
