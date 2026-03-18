import json
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PRIORS_PATH = ROOT / "ml" / "saved_models" / "global" / "priors.json"


@dataclass(frozen=True)
class GlobalPrediction:
    cycle_length_days: int
    period_length_days: int


def load_global_prediction() -> GlobalPrediction:
    if not PRIORS_PATH.exists():
        raise FileNotFoundError(
            f"Missing {PRIORS_PATH}. Run: python -m ml.base_model.train"
        )
    data = json.loads(PRIORS_PATH.read_text(encoding="utf-8"))
    cl = round(float(data["cycle_length"]["mean"]))
    pl = round(float(data["period_length"]["mean"]))
    return GlobalPrediction(cycle_length_days=cl, period_length_days=pl)


def main() -> None:
    p = load_global_prediction()
    print(json.dumps({"cycle_length_days": p.cycle_length_days, "period_length_days": p.period_length_days}, indent=2))


if __name__ == "__main__":
    main()

