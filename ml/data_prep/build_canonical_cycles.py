import csv
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable, Optional


ROOT = Path(__file__).resolve().parents[2]
ML_DIR = ROOT / "ml"
DATA_DIR = ML_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"


@dataclass(frozen=True)
class CanonicalCycleRow:
    user_id: str
    start_date: date
    end_date: Optional[date]
    cycle_length: Optional[int]
    period_length: Optional[int]
    source: str


def _safe_int(v: str) -> Optional[int]:
    if v is None:
        return None
    v = str(v).strip()
    if v == "":
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def _parse_yyyy_mm_dd_or_datetime(v: str) -> Optional[date]:
    if v is None:
        return None
    v = str(v).strip()
    if not v:
        return None
    # Accept: "2024-11-13 20:52:34.915012" or "2024-11-13"
    try:
        return datetime.fromisoformat(v).date()
    except ValueError:
        try:
            return datetime.strptime(v[:10], "%Y-%m-%d").date()
        except ValueError:
            return None


def _parse_m_d_yy(v: str) -> Optional[date]:
    if v is None:
        return None
    v = str(v).strip()
    if not v:
        return None
    for fmt in ("%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    return None


def _cycle_end_from_start_and_length(start: date, cycle_length: Optional[int]) -> Optional[date]:
    if not start or not cycle_length or cycle_length <= 0:
        return None
    return start + timedelta(days=cycle_length - 1)


def _scan_raw_csv_paths() -> list[Path]:
    candidates: list[Path] = []
    # Support both the recommended layout (ml/data/raw/**) and the current one (ml/data/*.csv)
    if (DATA_DIR / "raw").exists():
        candidates.extend((DATA_DIR / "raw").rglob("*.csv"))
    candidates.extend(DATA_DIR.glob("*.csv"))
    # Filter out any processed outputs if someone placed them in data root
    return sorted({p for p in candidates if p.is_file() and "processed" not in p.parts})


def _read_csv_dicts(path: Path) -> Iterable[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row


def _from_cleaned_fedcycle(path: Path) -> list[CanonicalCycleRow]:
    # Columns: ClientID, CycleNumber, LengthofCycle, LengthofMenses, ...
    # No real dates in this dataset, so we synthesize a timeline per user for training purposes.
    per_user_next_start: dict[str, date] = {}
    base_start = date(2000, 1, 1)
    rows: list[CanonicalCycleRow] = []
    for r in _read_csv_dicts(path):
        user_id = str(r.get("ClientID", "")).strip()
        if not user_id:
            continue
        cycle_len = _safe_int(r.get("LengthofCycle"))
        period_len = _safe_int(r.get("LengthofMenses"))

        start = per_user_next_start.get(user_id, base_start)
        end = _cycle_end_from_start_and_length(start, cycle_len)

        rows.append(
            CanonicalCycleRow(
                user_id=user_id,
                start_date=start,
                end_date=end,
                cycle_length=cycle_len,
                period_length=period_len,
                source="Cleaned_FedCycleData",
            )
        )

        if cycle_len and cycle_len > 0:
            per_user_next_start[user_id] = start + timedelta(days=cycle_len)
        else:
            per_user_next_start[user_id] = start + timedelta(days=28)
    return rows


def _from_factors_dataset(path: Path) -> list[CanonicalCycleRow]:
    # Columns: User ID, Cycle Start Date, Cycle Length, Period Length, ...
    rows: list[CanonicalCycleRow] = []
    for r in _read_csv_dicts(path):
        user_id = str(r.get("User ID", "")).strip()
        start = _parse_yyyy_mm_dd_or_datetime(r.get("Cycle Start Date"))
        if not user_id or not start:
            continue
        cycle_len = _safe_int(r.get("Cycle Length"))
        period_len = _safe_int(r.get("Period Length"))
        end = _cycle_end_from_start_and_length(start, cycle_len)
        rows.append(
            CanonicalCycleRow(
                user_id=user_id,
                start_date=start,
                end_date=end,
                cycle_length=cycle_len,
                period_length=period_len,
                source="menstrual_cycle_dataset_with_factors",
            )
        )
    return rows


def _from_menstural_cyclelength(path: Path) -> list[CanonicalCycleRow]:
    # Columns: new_id, age, cycle_start_date, cycle_end_date, cycle_length, ...
    rows: list[CanonicalCycleRow] = []
    for r in _read_csv_dicts(path):
        user_id = str(r.get("new_id", "")).strip()
        start = _parse_m_d_yy(r.get("cycle_start_date"))
        if not user_id or not start:
            continue
        cycle_len = _safe_int(r.get("cycle_length"))
        end = _parse_m_d_yy(r.get("cycle_end_date")) or _cycle_end_from_start_and_length(start, cycle_len)
        rows.append(
            CanonicalCycleRow(
                user_id=user_id,
                start_date=start,
                end_date=end,
                cycle_length=cycle_len,
                period_length=None,
                source="Menstural_cyclelength",
            )
        )
    return rows


def build_canonical_cycles() -> list[CanonicalCycleRow]:
    rows: list[CanonicalCycleRow] = []
    for p in _scan_raw_csv_paths():
        name = p.name.lower()
        if name == "cleaned_fedcycledata.csv":
            rows.extend(_from_cleaned_fedcycle(p))
        elif name == "menstrual_cycle_dataset_with_factors.csv":
            rows.extend(_from_factors_dataset(p))
        elif name == "menstural_cyclelength.csv":
            rows.extend(_from_menstural_cyclelength(p))
    rows.sort(key=lambda r: (r.user_id, r.start_date))
    return rows


def write_cycles_csv(rows: list[CanonicalCycleRow], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "user_id",
                "cycle_start_date",
                "cycle_end_date",
                "cycle_length_days",
                "period_length_days",
                "source",
            ],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow(
                {
                    "user_id": r.user_id,
                    "cycle_start_date": r.start_date.isoformat(),
                    "cycle_end_date": r.end_date.isoformat() if r.end_date else "",
                    "cycle_length_days": r.cycle_length if r.cycle_length is not None else "",
                    "period_length_days": r.period_length if r.period_length is not None else "",
                    "source": r.source,
                }
            )


def main() -> None:
    rows = build_canonical_cycles()
    if not rows:
        raise SystemExit(
            "No supported raw CSVs found in ml/data/raw/** or ml/data/*.csv"
        )

    out = PROCESSED_DIR / "cycles.csv"
    write_cycles_csv(rows, out)
    print(f"Wrote {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()

