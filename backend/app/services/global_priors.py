import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class GlobalPriors:
    cycle_mean: float
    cycle_std: float
    period_mean: float
    period_std: float


def _default_priors_path() -> Path:
    # backend/app/services/global_priors.py -> backend/app/services -> backend/app -> backend -> repo_root
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / "ml" / "saved_models" / "global" / "priors.json"


@lru_cache(maxsize=1)
def load_global_priors() -> GlobalPriors | None:
    """
    Load priors produced by `python -m ml.base_model.train`.
    If missing/unreadable, return None and the app will fall back to user-only logic.
    """
    path = Path(os.getenv("GLOBAL_PRIORS_PATH", str(_default_priors_path())))
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return GlobalPriors(
            cycle_mean=float(data["cycle_length"]["mean"]),
            cycle_std=float(data["cycle_length"]["std"]),
            period_mean=float(data["period_length"]["mean"]),
            period_std=float(data["period_length"]["std"]),
        )
    except Exception:
        return None

