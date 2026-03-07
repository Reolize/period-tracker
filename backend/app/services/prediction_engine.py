from statistics import mean, stdev
from datetime import timedelta
from app.models.cycle import Cycle


class PredictionEngine:

    WINDOW_SIZE = 6
    MIN_REQUIRED = 4

    @staticmethod
    def weighted_prediction(values):
        avg = mean(values)
        sd = stdev(values)

        # Remove outliers
        if sd > 0:
            values = [
                v for v in values
                if abs((v - avg) / sd) <= 2
            ]

        if len(values) < 3:
            return None

        weights = list(range(1, len(values) + 1))
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        weighted_avg = round(weighted_sum / sum(weights))
        std_dev = round(stdev(values), 2)

        return weighted_avg, std_dev, len(values)

    @classmethod
    def predict(cls, cycles):
        if len(cycles) < cls.MIN_REQUIRED:
            return None

        cycles = cycles[-cls.WINDOW_SIZE:]

        cycle_lengths = [c.cycle_length for c in cycles if c.cycle_length]
        period_lengths = [c.period_length for c in cycles if c.period_length]

        cycle_result = cls.weighted_prediction(cycle_lengths)
        period_result = cls.weighted_prediction(period_lengths)

        if not cycle_result or not period_result:
            return None

        cycle_avg, cycle_sd, cycle_n = cycle_result
        period_avg, period_sd, _ = period_result

        last_cycle = cycles[-1]

        predicted_start = last_cycle.start_date + timedelta(days=cycle_avg)
        predicted_end = predicted_start + timedelta(days=period_avg)

        # Ovulation prediction
        ovulation_offset = cycle_avg - 14
        predicted_ovulation = last_cycle.start_date + timedelta(days=ovulation_offset)

        # Fertility window
        spread = min(2, int(cycle_sd))
        fertile_start = predicted_ovulation - timedelta(days=5 + spread)
        fertile_end = predicted_ovulation + timedelta(days=1 + spread)

        variability = max(0, 1 - (cycle_sd / cycle_avg))
        data_score = min(1, cycle_n / cls.WINDOW_SIZE)

        confidence = round((variability * 0.7 + data_score * 0.3) * 100, 2)

        return {
            "predicted_next_start": predicted_start,
            "predicted_next_end": predicted_end,
            "cycle_length_prediction": cycle_avg,
            "period_length_prediction": period_avg,
            "cycle_std_dev": cycle_sd,
            "period_std_dev": period_sd,
            "confidence_score": confidence,
            "predicted_ovulation": predicted_ovulation,
            "fertile_window_start": fertile_start,
            "fertile_window_end": fertile_end,
        }
    
    