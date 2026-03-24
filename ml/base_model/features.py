import os
import pandas as pd
from sklearn.preprocessing import LabelEncoder

def load_and_fuse_data():
    """
    Load data from all 3 CSVs and perform Data Fusion.
    Keep missing values as NaN.
    """
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    
    # 1. Load menstrual_cycle_dataset_with_factors.csv (Modern Dataset)
    df_factors = pd.read_csv(os.path.join(data_dir, "menstrual_cycle_dataset_with_factors.csv"))
    # Rename columns to match canonical names if needed, but let's keep original for now and map others to it
    df1 = df_factors[['Age', 'BMI', 'Stress Level', 'Exercise Frequency', 'Sleep Hours', 'Diet', 'Cycle Length', 'Period Length']].copy()
    
    # 2. Load Menstural_cyclelength.csv (Kaggle Dataset)
    df_cyclelength = pd.read_csv(os.path.join(data_dir, "Menstural_cyclelength.csv"))
    # Map: age -> Age, cycle_length -> Cycle Length
    # Period Length is missing in this dataset directly, but let's see if we can extract or we just leave as NaN
    df2 = pd.DataFrame({
        'Age': df_cyclelength['age'],
        'Cycle Length': df_cyclelength['cycle_length'],
        # Other features are missing -> will be NaN automatically
    })
    
    # 3. Load Cleaned_FedCycleData.csv (FedCycle Dataset)
    df_fedcycle = pd.read_csv(os.path.join(data_dir, "Cleaned_FedCycleData.csv"))
    # Map: Age -> Age, BMI -> BMI, LengthofCycle -> Cycle Length, LengthofMenses -> Period Length
    df3 = pd.DataFrame({
        'Age': df_fedcycle['Age'],
        'BMI': df_fedcycle['BMI'],
        'Cycle Length': df_fedcycle['LengthofCycle'],
        'Period Length': df_fedcycle['LengthofMenses']
    })
    
    # Concat all dataframes
    df_fused = pd.concat([df1, df2, df3], ignore_index=True)
    
    # Drop rows where BOTH targets are NaN (meaningless for training)
    df_fused = df_fused.dropna(subset=['Cycle Length', 'Period Length'], how='all')
    
    return df_fused

def prepare_features():
    """
    Prepare features for training using fused data.
    - Numerical: Age, BMI, Stress Level, Sleep Hours
    - Categorical: Exercise Frequency, Diet
    - Target: Cycle Length, Period Length
    """
    df_processed = load_and_fuse_data()

    # Handle Categorical Variables using Label Encoding
    categorical_cols = ['Exercise Frequency', 'Diet']
    label_encoders = {}
    
    for col in categorical_cols:
        le = LabelEncoder()
        # Convert to string to handle NaN properly (NaN becomes 'nan' category)
        df_processed[col] = df_processed[col].astype(str)
        df_processed[col] = le.fit_transform(df_processed[col])
        label_encoders[col] = le
        # Convert 'nan' back to actual np.nan so HistGradientBoosting can handle it natively
        nan_encoded_value = le.transform(['nan'])[0] if 'nan' in le.classes_ else -1
        import numpy as np
        df_processed[col] = df_processed[col].replace(nan_encoded_value, np.nan)

    # Define feature columns
    feature_cols = ['Age', 'BMI', 'Stress Level', 'Exercise Frequency', 'Sleep Hours', 'Diet']
    
    X = df_processed[feature_cols]
    Y_cycle = df_processed['Cycle Length']
    Y_period = df_processed['Period Length']
    
    return X, Y_cycle, Y_period, label_encoders

