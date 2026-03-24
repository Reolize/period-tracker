import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from features import prepare_features

def train_global_model():
    print("Starting ML Model Training with Fused Data...")
    
    # 1. Feature Engineering (Loads all 3 datasets internally)
    X, Y_cycle, Y_period, label_encoders = prepare_features()
    
    print(f"Total rows after data fusion: {len(X)}")

    # 2. Since Period Length has NaNs, we need to drop them ONLY for the Period Model training
    # For Cycle Model, we drop rows where Cycle Length is NaN
    
    # --- Prepare Data for Cycle Model ---
    valid_cycle_mask = Y_cycle.notna()
    X_cycle = X[valid_cycle_mask]
    Y_cycle_clean = Y_cycle[valid_cycle_mask]
    
    # --- Prepare Data for Period Model ---
    valid_period_mask = Y_period.notna()
    X_period = X[valid_period_mask]
    Y_period_clean = Y_period[valid_period_mask]

    print(f"Rows used for Cycle Length Model: {len(X_cycle)}")
    print(f"Rows used for Period Length Model: {len(X_period)}")

    # 3. Train/Test Split (80/20)
    Xc_train, Xc_test, yc_train, yc_test = train_test_split(
        X_cycle, Y_cycle_clean, test_size=0.2, random_state=42
    )
    
    Xp_train, Xp_test, yp_train, yp_test = train_test_split(
        X_period, Y_period_clean, test_size=0.2, random_state=42
    )

    # 4. Initialize Models (HistGradientBoosting supports NaNs natively)
    cycle_model = HistGradientBoostingRegressor(random_state=42, max_iter=150, max_depth=10)
    period_model = HistGradientBoostingRegressor(random_state=42, max_iter=150, max_depth=10)

    # 5. Train Models
    print("\nTraining Cycle Length Model...")
    cycle_model.fit(Xc_train, yc_train)
    
    print("Training Period Length Model...")
    period_model.fit(Xp_train, yp_train)

    # 6. Evaluation (MAE)
    cycle_pred = cycle_model.predict(Xc_test)
    period_pred = period_model.predict(Xp_test)
    
    mae_cycle = mean_absolute_error(yc_test, cycle_pred)
    mae_period = mean_absolute_error(yp_test, period_pred)
    
    print("\n--- Model Evaluation Results ---")
    print(f"Cycle Length MAE:  ±{mae_cycle:.2f} days")
    print(f"Period Length MAE: ±{mae_period:.2f} days")
    print("--------------------------------")

    # 7. Save Models and Encoders
    save_dir = os.path.join(os.path.dirname(__file__), "..", "saved_models", "global")
    os.makedirs(save_dir, exist_ok=True)
    
    joblib.dump(cycle_model, os.path.join(save_dir, "cycle_model.pkl"))
    joblib.dump(period_model, os.path.join(save_dir, "period_model.pkl"))
    joblib.dump(label_encoders, os.path.join(save_dir, "label_encoders.pkl"))
    
    print(f"\nModels successfully saved to {save_dir}")

if __name__ == "__main__":
    train_global_model()

