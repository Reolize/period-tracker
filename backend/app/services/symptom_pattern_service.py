"""
Service for analyzing symptom patterns from daily logs.
"""
from sqlalchemy.orm import Session
from collections import Counter
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.models.daily_log import DailyLog
from app.models.cycle import Cycle


class SymptomPatternService:
    """Service to analyze and extract symptom patterns from user logs."""

    @staticmethod
    def get_top_symptoms_patterns(
        db: Session,
        user_id: int,
        top_n: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Analyze user's daily logs to find top symptoms and their patterns.
        
        Returns list of symptoms with:
        - name: symptom name
        - days: total days logged with this symptom
        - timeframe: typical cycle day range (e.g., "Usually Days 1-3")
        - percentage: occurrence percentage relative to total cycles
        """
        # Get all daily logs with symptoms for this user
        logs = db.query(DailyLog).filter(
            DailyLog.user_id == user_id,
        ).order_by(DailyLog.log_date.asc()).all()

        if not logs:
            return []

        # Get all cycles for this user to calculate cycle days
        cycles = db.query(Cycle).filter(
            Cycle.user_id == user_id
        ).order_by(Cycle.start_date.asc()).all()

        if not cycles:
            return []

        # Build a map of date -> cycle info
        cycle_map = {}  # date -> (cycle_start_date, cycle_day)
        for cycle in cycles:
            current_date = cycle.start_date
            # Handle ongoing cycles
            end_date = cycle.end_date or datetime.now().date()
            cycle_day = 1
            while current_date <= end_date:
                cycle_map[current_date] = (cycle.start_date, cycle_day)
                current_date = datetime.fromordinal(current_date.toordinal() + 1).date()
                cycle_day += 1

        # Count symptoms and track cycle days
        symptom_counts = Counter()
        symptom_cycle_days: Dict[str, List[int]] = {}

        for log in logs:
            # Get cycle day for this log date
            cycle_info = cycle_map.get(log.log_date)
            if not cycle_info:
                continue  # Skip logs not within any cycle

            _, cycle_day = cycle_info

            # Process physical symptoms
            for symptom in (log.physical_symptoms or []):
                if symptom and symptom != "none":
                    symptom_counts[symptom] += 1
                    if symptom not in symptom_cycle_days:
                        symptom_cycle_days[symptom] = []
                    symptom_cycle_days[symptom].append(cycle_day)

            # Process moods
            for mood in (log.moods or []):
                if mood and mood != "none":
                    # Prefix mood to distinguish from physical symptoms
                    mood_key = f"{mood}"
                    symptom_counts[mood_key] += 1
                    if mood_key not in symptom_cycle_days:
                        symptom_cycle_days[mood_key] = []
                    symptom_cycle_days[mood_key].append(cycle_day)

        if not symptom_counts:
            return []

        # Get top N symptoms by frequency
        top_symptoms = symptom_counts.most_common(top_n)

        # Calculate patterns for each top symptom
        result = []
        total_cycles = len([c for c in cycles if c.cycle_length])
        total_cycles = max(total_cycles, 1)  # Avoid division by zero

        for symptom_name, count in top_symptoms:
            cycle_days = symptom_cycle_days.get(symptom_name, [])
            if not cycle_days:
                continue

            # Calculate typical cycle day range
            min_day = min(cycle_days)
            max_day = max(cycle_days)
            avg_day = sum(cycle_days) // len(cycle_days)

            # Format timeframe description
            if min_day == max_day:
                timeframe = f"Usually Day {min_day}"
            elif max_day - min_day <= 3:
                timeframe = f"Usually Days {min_day}-{max_day}"
            else:
                # Group into phase
                if avg_day <= 5:
                    timeframe = f"Usually Period Phase (Day {min_day}-{max_day})"
                elif avg_day <= 14:
                    timeframe = f"Usually Follicular Phase (Day {min_day}-{max_day})"
                elif avg_day <= 16:
                    timeframe = f"Usually Ovulation (Day {min_day}-{max_day})"
                else:
                    timeframe = f"Usually Luteal Phase (Day {min_day}-{max_day})"

            # Calculate percentage (relative to total cycles)
            percentage = min(100, round((count / total_cycles) * 100))

            # Format symptom name for display
            display_name = symptom_name.replace("_", " ").title()

            result.append({
                "name": display_name,
                "days": count,
                "timeframe": timeframe,
                "percentage": percentage,
                "raw_symptom": symptom_name,
            })

        return result


symptom_pattern_service = SymptomPatternService()
