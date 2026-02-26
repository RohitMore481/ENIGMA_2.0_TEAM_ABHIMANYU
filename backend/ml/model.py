import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

MODEL_PATH = "ml/stress_model.pkl"

def get_or_train_model():

    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)

    # --- Synthetic training data ---
    X = []
    y = []

    for _ in range(500):
        avg_ndvi = np.random.uniform(0.2, 0.9)
        stress = 100 - (avg_ndvi * 100)
        vegetation = np.random.uniform(60, 100)
        slope = np.random.uniform(-5, 5)

        features = [avg_ndvi, stress, vegetation, slope]
        target = stress + np.random.uniform(-5, 5)

        X.append(features)
        y.append(target)

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        random_state=42
    )

    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)

    return model


def predict_stress(features):
    model = get_or_train_model()
    prediction = model.predict([features])[0]
    return round(float(prediction), 2)