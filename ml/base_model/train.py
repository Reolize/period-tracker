import csv
import json
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, pstdev
from typing import Optional


ROOT = Path(__file__).resolve().parents[2]
PROCESSED_CYCLES = ROOT / "ml" / "data" / "processed" / "cycles.csv"
OUT_DIR = ROOT / "ml" / "saved_models" / "global"


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


@dataclass(frozen=True)
class Priors:
    cycle_length_mean: float
    cycle_length_std: float
    period_length_mean: float
    period_length_std: float
    n_cycles: int
    n_periods: int


def _compute_priors() -> Priors:
    if not PROCESSED_CYCLES.exists():
        raise SystemExit(
            f"Missing {PROCESSED_CYCLES}. Run: python -m ml.data_prep.build_canonical_cycles"
        )

    cycle_lengths: list[int] = []
    period_lengths: list[int] = []

    with PROCESSED_CYCLES.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            cl = _safe_int(r.get("cycle_length_days"))
            pl = _safe_int(r.get("period_length_days"))
            if cl is not None and 10 <= cl <= 90:
                cycle_lengths.append(cl)
            if pl is not None and 1 <= pl <= 20:
                period_lengths.append(pl)

    if len(cycle_lengths) < 10:
        raise SystemExit("Not enough cycle_length data to build priors.")

    # population std (pstdev) gives stable results for small samples
    cl_mean = float(mean(cycle_lengths))
    cl_std = float(pstdev(cycle_lengths)) if len(cycle_lengths) > 1 else 0.0

    if period_lengths:
        pl_mean = float(mean(period_lengths))
        pl_std = float(pstdev(period_lengths)) if len(period_lengths) > 1 else 0.0
    else:
        # fallback if a dataset doesn't include period length
        pl_mean, pl_std = 5.0, 1.5

    return Priors(
        cycle_length_mean=cl_mean,
        cycle_length_std=cl_std,
        period_length_mean=pl_mean,
        period_length_std=pl_std,
        n_cycles=len(cycle_lengths),
        n_periods=len(period_lengths),
    )


def main() -> None:
    priors = _compute_priors()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / "priors.json"
    out_path.write_text(
        json.dumps(
            {
                "cycle_length": {
                    "mean": priors.cycle_length_mean,
                    "std": priors.cycle_length_std,
                    "n": priors.n_cycles,
                },
                "period_length": {
                    "mean": priors.period_length_mean,
                    "std": priors.period_length_std,
                    "n": priors.n_periods,
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote global priors to {out_path}")


if __name__ == "__main__":
    main()

