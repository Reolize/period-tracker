from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, stdev
from typing import Iterable, List, Optional

from app.models.cycle import Cycle


@dataclass
class CycleStats:
    cycle_lengths: List[int]
    period_lengths: List[int]
    avg_cycle: Optional[float]
    avg_period: Optional[float]
    cycle_sd: Optional[float]
    period_sd: Optional[float]


@dataclass
class HealthAlert:
    code: str
    level: str  # "info" | "warning" | "critical"
    message: str


def _compute_stats(cycles: Iterable[Cycle]) -> CycleStats:
    cycle_lengths = [c.cycle_length for c in cycles if c.cycle_length]
    period_lengths = [c.period_length for c in cycles if c.period_length]

    avg_cycle = mean(cycle_lengths) if cycle_lengths else None
    avg_period = mean(period_lengths) if period_lengths else None

    cycle_sd = stdev(cycle_lengths) if len(cycle_lengths) > 1 else None
    period_sd = stdev(period_lengths) if len(period_lengths) > 1 else None

    return CycleStats(
        cycle_lengths=cycle_lengths,
        period_lengths=period_lengths,
        avg_cycle=avg_cycle,
        avg_period=avg_period,
        cycle_sd=cycle_sd,
        period_sd=period_sd,
    )


def assess_cycle_health(cycles: Iterable[Cycle]) -> list[HealthAlert]:
    """
    Basic, non-diagnostic health checks inspired by apps like Flo.
    Does NOT replace medical advice.
    """
    cycles = list(cycles)
    alerts: list[HealthAlert] = []

    if len(cycles) == 0:
        return alerts

    stats = _compute_stats(cycles)

    # 1) Average cycle length
    if stats.avg_cycle is not None:
        if stats.avg_cycle < 21:
            alerts.append(
                HealthAlert(
                    code="cycle_too_short",
                    level="warning",
                    message="Your average cycle length is shorter than 21 days. This can sometimes be a sign of hormonal imbalance. Consider tracking closely and consulting a healthcare provider if it continues.",
                )
            )
        elif stats.avg_cycle > 35:
            alerts.append(
                HealthAlert(
                    code="cycle_too_long",
                    level="warning",
                    message="Your average cycle length is longer than 35 days. Long cycles can be normal for some people but may also signal conditions like PCOS.",
                )
            )

    # 2) Cycle variability
    if stats.avg_cycle and stats.cycle_sd:
        cv = stats.cycle_sd / stats.avg_cycle  # coefficient of variation
        if cv > 0.25:
            alerts.append(
                HealthAlert(
                    code="cycle_irregular",
                    level="warning",
                    message="Your cycles vary quite a lot in length. Irregular cycles can affect ovulation timing and predictions.",
                )
            )

    # 3) Period length
    if stats.avg_period is not None:
        if stats.avg_period < 3:
            alerts.append(
                HealthAlert(
                    code="period_very_short",
                    level="info",
                    message="Your average period lasts fewer than 3 days. This can be normal but is shorter than typical ranges.",
                )
            )
        elif stats.avg_period > 8:
            alerts.append(
                HealthAlert(
                    code="period_very_long",
                    level="warning",
                    message="Your average period lasts longer than 8 days. Prolonged bleeding can warrant medical attention.",
                )
            )

    # 4) Data sufficiency
    if len(stats.cycle_lengths) < 3 or len(stats.period_lengths) < 3:
        alerts.append(
            HealthAlert(
                code="limited_history",
                level="info",
                message="You don't have much cycle history yet. Predictions and insights will improve as you add more cycles.",
            )
        )

    return alerts

