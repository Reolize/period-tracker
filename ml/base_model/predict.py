import os
import joblib
import pandas as pd

def predict_next_cycle(user_data: dict) -> dict:
    """
    Predict next cycle and period length based on user characteristics.
    user_data example:
    {
        "Age": 25,
        "BMI": 22.5,
        "Stress Level": 2, # e.g. 0=Low, 1=Medium, 2=High
        "Exercise Frequency": "Moderate",
        "Sleep Hours": 7.5,
        "Diet": "Balanced"
    }
    """
    save_dir = os.path.join(os.path.dirname(__file__), "..", "saved_models", "global")
    
    try:
        cycle_model = joblib.load(os.path.join(save_dir, "cycle_model.pkl"))
        period_model = joblib.load(os.path.join(save_dir, "period_model.pkl"))
        label_encoders = joblib.load(os.path.join(save_dir, "label_encoders.pkl"))
    except FileNotFoundError:
        print("Models not found. Please run train.py first.")
        # Fallback to standard means if models are missing
        return {"predicted_cycle_length": 28, "predicted_period_length": 5}

    # Prepare input DataFrame
    df_input = pd.DataFrame([user_data])
    
    # Encode categorical variables using the saved encoders
    for col, le in label_encoders.items():
        if col in df_input.columns:
            # Handle unknown categories by mapping them to the most frequent or a default
            # Here we just try to transform, if it fails, fallback to 0
            try:
                df_input[col] = df_input[col].astype(str)
                df_input[col] = le.transform(df_input[col])
            except ValueError:
                df_input[col] = 0

    # Ensure all required features are present
    feature_cols = ['Age', 'BMI', 'Stress Level', 'Exercise Frequency', 'Sleep Hours', 'Diet']
    for col in feature_cols:
        if col not in df_input.columns:
            df_input[col] = 0
            
    X_input = df_input[feature_cols]

    # Predict
    pred_cycle = cycle_model.predict(X_input)[0]
    pred_period = period_model.predict(X_input)[0]

    return {
        "predicted_cycle_length": round(pred_cycle),
        "predicted_period_length": round(pred_period)
    }

if __name__ == "__main__":
    # Test Prediction
    sample_user = {
        "Age": 28,
        "BMI": 24.1,
        "Stress Level": 3,
        "Exercise Frequency": "Low",
        "Sleep Hours": 6.5,
        "Diet": "High Sugar"
    }
    
    result = predict_next_cycle(sample_user)
    print("Prediction for sample user:")
    print(result)

