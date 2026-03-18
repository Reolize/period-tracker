# ML datasets (CSV) — where to put files

This project supports training a **global/base model** from multiple sources, then **personalizing** per user later.

## Folder layout

Put your 3 source CSV datasets here (raw, unchanged):

- `ml/data/raw/source_1/*.csv`
- `ml/data/raw/source_2/*.csv`
- `ml/data/raw/source_3/*.csv`

After you normalize them into a single canonical structure, write the outputs here:

- `ml/data/processed/`

Recommended processed files (canonical):

- `ml/data/processed/cycles.csv`
- `ml/data/processed/daily_logs.csv`

> Note: `raw/`, `processed/`, and `ml/saved_models/` are gitignored so you don’t accidentally commit real user data or large artifacts.
> If you need repo-safe examples, commit only `sample_*.csv` (sanitized).

## Canonical CSV schemas (recommended)

### 1) `cycles.csv` (one row per cycle)

Required columns:

- `user_id`: string (can be `"global"` for public datasets)
- `cycle_start_date`: `YYYY-MM-DD`

Optional but recommended:

- `cycle_end_date`: `YYYY-MM-DD`
- `period_start_date`: `YYYY-MM-DD`
- `period_end_date`: `YYYY-MM-DD`
- `cycle_length_days`: int
- `period_length_days`: int
- `source`: string (e.g. `source_1`)

### 2) `daily_logs.csv` (one row per user per date)

Required columns:

- `user_id`: string (can be `"global"` for public datasets)
- `date`: `YYYY-MM-DD`

Optional (use what you have; keep consistent types):

- `bleeding_level`: int (e.g. 0–4)
- `pain_level`: int (e.g. 0–10)
- `mood`: string (or categorical)
- `symptoms`: string (e.g. comma-separated tokens)
- `notes`: string
- `source`: string

## How to use the 3 different source schemas

For each source dataset:

1. Read the raw CSV(s) from `ml/data/raw/source_X/`
2. Map/rename columns into the canonical schema above
3. Write canonical outputs into `ml/data/processed/`
4. Train the **global model** from `ml/data/processed/*.csv`
5. For personalization, start from the global model and fine-tune per user (store per-user artifacts outside git)

