"""
Test suite for PredictionEngine
Validates strict isolation between prediction modes and mathematical correctness.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.prediction_engine import PredictionEngine


class MockCycle:
    """Mock cycle object for testing."""
    def __init__(self, start_date, end_date, cycle_length, period_length=5):
        self.start_date = start_date
        self.end_date = end_date
        self.cycle_length = cycle_length
        self.period_length = period_length


def create_mock_cycles(days_list, base_date=None):
    """Create mock cycles with given cycle lengths."""
    if base_date is None:
        base_date = date.today() - timedelta(days=sum(days_list))
    
    cycles = []
    current_date = base_date
    for cycle_length in days_list:
        end_date = current_date + timedelta(days=5)  # Assume 5-day periods
        cycles.append(MockCycle(
            start_date=current_date,
            end_date=end_date,
            cycle_length=cycle_length,
            period_length=5
        ))
        current_date = current_date + timedelta(days=cycle_length)
    
    return cycles


class TestPredictionEngine:
    """Test suite for PredictionEngine isolation and correctness."""
    
    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return MagicMock()
    
    @pytest.fixture
    def mock_user_setup(self):
        """Create a mock user setup."""
        setup = MagicMock()
        setup.last_period_start_date = date.today() - timedelta(days=30)
        return setup


class TestFixedMode(TestPredictionEngine):
    """Test Fixed Number mode returns exact manual_cycle_length."""
    
    def test_fixed_mode_returns_exact_manual_length(self, mock_db, mock_user_setup):
        """Test 1: Fixed mode should return exact manual_cycle_length."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=[],  # No cycles needed for fixed mode
            prediction_mode="fixed",
            manual_cycle_length=35
        )
        
        assert result is not None
        assert result["cycle_length_prediction"] == 35
        assert result["prediction_mode"] == "fixed"
        assert result["mode_label"] == "Fixed Number (User-defined)"
    
    def test_fixed_mode_with_different_values(self, mock_db, mock_user_setup):
        """Test fixed mode works with various manual lengths."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        for length in [21, 28, 35, 45]:
            result = PredictionEngine.predict(
                db=mock_db,
                user_id=1,
                cycles=[],
                prediction_mode="fixed",
                manual_cycle_length=length
            )
            assert result["cycle_length_prediction"] == length


class TestSmartModeColdStart(TestPredictionEngine):
    """Test Smart AI mode ignores manual_cycle_length with 0 cycles (cold start)."""
    
    @patch('app.services.prediction_engine.load_global_priors')
    def test_smart_mode_cold_start_ignores_manual_length(self, mock_load_priors, mock_db, mock_user_setup):
        """Test 2: Smart mode with 0 cycles should ignore manual_cycle_length and use GLOBAL_BASELINE."""
        # Mock global priors
        mock_priors = MagicMock()
        mock_priors.cycle_mean = 28.5
        mock_priors.period_mean = 5
        mock_priors.cycle_std = 4.26
        mock_priors.period_std = 1.10
        mock_load_priors.return_value = mock_priors
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Pass manual_cycle_length=40 - this should be IGNORED in smart mode
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=[],  # 0 cycles - cold start
            prediction_mode="smart",
            manual_cycle_length=40  # Should be ignored!
        )
        
        assert result is not None
        # Should use global baseline (~28.5), NOT the manual 40
        assert result["cycle_length_prediction"] != 40
        assert result["cycle_length_prediction"] == 28  # Rounded from 28.5
        assert result["prediction_mode"] == "smart"
    
    @patch('app.services.prediction_engine.load_global_priors')
    def test_smart_mode_cold_start_with_various_manual_lengths(self, mock_load_priors, mock_db, mock_user_setup):
        """Test smart mode ignores various manual lengths during cold start."""
        mock_priors = MagicMock()
        mock_priors.cycle_mean = 28.5
        mock_priors.period_mean = 5
        mock_priors.cycle_std = 4.26
        mock_priors.period_std = 1.10
        mock_load_priors.return_value = mock_priors
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Test with multiple manual lengths - all should be ignored
        for manual_length in [21, 35, 45, 60, 100]:
            result = PredictionEngine.predict(
                db=mock_db,
                user_id=1,
                cycles=[],
                prediction_mode="smart",
                manual_cycle_length=manual_length
            )
            assert result["cycle_length_prediction"] != manual_length
            assert result["cycle_length_prediction"] == 28  # Always uses global baseline


class TestSmartModeWMATier(TestPredictionEngine):
    """Test Smart AI mode uses WMA with 6+ cycles and ignores manual_cycle_length."""
    
    @patch('app.services.prediction_engine.load_global_priors')
    def test_smart_mode_wma_tier_ignores_manual_length(self, mock_load_priors, mock_db, mock_user_setup):
        """Test 3: Smart mode with 6 cycles should use WMA and ignore manual_cycle_length."""
        # Mock global priors for light smoothing
        mock_priors = MagicMock()
        mock_priors.cycle_mean = 28.5
        mock_priors.period_mean = 5
        mock_priors.cycle_std = 4.26
        mock_priors.period_std = 1.10
        mock_load_priors.return_value = mock_priors
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Create 6 cycles of exactly 30 days each
        cycles = create_mock_cycles([30, 30, 30, 30, 30, 30])
        
        # Pass manual_cycle_length=21 - this should be IGNORED in smart mode
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="smart",
            manual_cycle_length=21  # Should be ignored!
        )
        
        assert result is not None
        # Should be around 30 (from WMA), NOT 21
        assert result["cycle_length_prediction"] != 21
        # WMA of [30,30,30,30,30,30] should be ~30 (with light smoothing maybe slightly different)
        assert 28 <= result["cycle_length_prediction"] <= 31
        assert result["prediction_mode"] == "smart"
    
    @patch('app.services.prediction_engine.load_global_priors')
    def test_smart_mode_wma_with_varying_cycles(self, mock_load_priors, mock_db, mock_user_setup):
        """Test smart mode WMA calculates correctly with varying cycle lengths."""
        mock_priors = MagicMock()
        mock_priors.cycle_mean = 28.5
        mock_priors.period_mean = 5
        mock_priors.cycle_std = 4.26
        mock_priors.period_std = 1.10
        mock_load_priors.return_value = mock_priors
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Create 6 cycles with varying lengths
        cycles = create_mock_cycles([28, 29, 30, 28, 29, 30])
        
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="smart",
            manual_cycle_length=45  # Should be ignored!
        )
        
        assert result is not None
        # Result should be around 28-30 (weighted average), NOT 45
        assert result["cycle_length_prediction"] != 45
        assert 27 <= result["cycle_length_prediction"] <= 31


class TestStrictMode(TestPredictionEngine):
    """Test Strict (Regular Calendar) mode ignores manual_cycle_length."""
    
    def test_strict_mode_ignores_manual_length(self, mock_db, mock_user_setup):
        """Test 4: Strict mode should calculate WMA and ignore manual_cycle_length."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Create 3 cycles of exactly 28 days each
        cycles = create_mock_cycles([28, 28, 28])
        
        # Pass manual_cycle_length=45 - this should be IGNORED in strict mode
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="strict",
            manual_cycle_length=45  # Should be ignored!
        )
        
        assert result is not None
        # Should be around 28 (from WMA), NOT 45
        assert result["cycle_length_prediction"] != 45
        assert result["cycle_length_prediction"] == 28  # Pure WMA of [28,28,28]
        assert result["prediction_mode"] == "strict"
        assert result["mode_label"] == "Regular Calendar (Weighted Average)"
    
    def test_strict_mode_with_varied_cycles(self, mock_db, mock_user_setup):
        """Test strict mode calculates weighted average correctly."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Create cycles with more variation
        cycles = create_mock_cycles([26, 28, 30])
        
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="strict",
            manual_cycle_length=40  # Should be ignored!
        )
        
        assert result is not None
        # Weighted average of [26, 28, 30] with weights [1, 2, 3] = (26*1 + 28*2 + 30*3) / 6 = 28.33
        assert result["cycle_length_prediction"] != 40
        assert result["cycle_length_prediction"] == 28  # Rounded
    
    def test_strict_mode_insufficient_data(self, mock_db, mock_user_setup):
        """Test strict mode returns None with <3 cycles."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Only 2 cycles - strict mode requires >= 3
        cycles = create_mock_cycles([28, 30])
        
        result = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="strict",
            manual_cycle_length=35  # Should be ignored, but also no result
        )
        
        # Strict mode requires at least 3 cycles
        assert result is None


class TestModeIsolationBoundaries(TestPredictionEngine):
    """Additional tests for boundary conditions and edge cases."""
    
    @patch('app.services.prediction_engine.load_global_priors')
    def test_nuclear_isolation_forces_none(self, mock_load_priors, mock_db, mock_user_setup):
        """Verify nuclear isolation code forces manual_cycle_length to None for smart/strict."""
        mock_priors = MagicMock()
        mock_priors.cycle_mean = 28.5
        mock_priors.period_mean = 5
        mock_priors.cycle_std = 4.26
        mock_priors.period_std = 1.10
        mock_load_priors.return_value = mock_priors
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        cycles = create_mock_cycles([30, 30, 30, 30, 30, 30])
        
        # Even with explicit manual_length, smart mode should ignore it
        result_smart = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="smart",
            manual_cycle_length=99
        )
        assert result_smart["cycle_length_prediction"] != 99
        
        # Same for strict mode
        result_strict = PredictionEngine.predict(
            db=mock_db,
            user_id=1,
            cycles=cycles,
            prediction_mode="strict",
            manual_cycle_length=99
        )
        assert result_strict["cycle_length_prediction"] != 99
    
    def test_fixed_mode_with_none_manual_length_fallback(self, mock_db, mock_user_setup):
        """Test fixed mode falls back to smart when manual_cycle_length is None."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_setup
        
        # Fixed mode with None should fall back to smart
        cycles = create_mock_cycles([28, 28, 28, 28, 28, 28])
        
        with patch('app.services.prediction_engine.load_global_priors') as mock_load:
            mock_priors = MagicMock()
            mock_priors.cycle_mean = 28.5
            mock_priors.period_mean = 5
            mock_priors.cycle_std = 4.26
            mock_priors.period_std = 1.10
            mock_load.return_value = mock_priors
            
            result = PredictionEngine.predict(
                db=mock_db,
                user_id=1,
                cycles=cycles,
                prediction_mode="fixed",
                manual_cycle_length=None  # Should trigger fallback to smart
            )
            
            # When manual is None, fixed mode falls back to smart tier
            assert result is not None
            assert result["prediction_mode"] == "smart"  # Fallback to smart logic


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
