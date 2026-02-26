# backend/main.py

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import ee

# ---- Initialize Earth Engine ----
ee.Initialize(project="croporbit-ee")

# ---- Import ML Model ----
from ml.model import predict_stress

app = FastAPI()

# ---- Enable CORS (React frontend) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------
# REQUEST MODEL
# ---------------------------------------------------
class PolygonRequest(BaseModel):
    polygon: Dict

# ---------------------------------------------------
# NDVI + VEGETATION MASK + STRESS LOGIC
# ---------------------------------------------------
def run_ndvi_analysis(polygon):

    region = ee.Geometry.Polygon(polygon)

    # Sentinel-2 SR collection
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(region)
        .filterDate("2024-01-01", "2024-12-31")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        .select(["B8", "B4"])   # 🔥 FORCE HOMOGENEOUS BANDS
    )

    image = collection.median()
    # NDVI calculation
    ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")

    # Vegetation mask (NDVI > 0.2)
    vegetation_mask = ndvi.gt(0.2)
    masked_ndvi = ndvi.updateMask(vegetation_mask)

    # Mean NDVI
    stats = masked_ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10,
        maxPixels=1e9
    )

    mean_ndvi = stats.get("NDVI").getInfo()
    if mean_ndvi is None:
        mean_ndvi = 0

    health_score = round(mean_ndvi * 100, 2)
    stress_percentage = round(100 - health_score, 2)

    # Vegetation coverage %
    vegetation_area = vegetation_mask.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10,
        maxPixels=1e9
    ).getInfo()

    vegetation_percent = round(
        vegetation_area.get("NDVI", 0) * 100,
        2
    )

    area_under_stress = round(100 - vegetation_percent, 2)

    confidence_score = 0.9

    return {
        "health_score": health_score,
        "stress_percentage": stress_percentage,
        "area_under_stress": area_under_stress,
        "confidence_score": confidence_score
    }


# ---------------------------------------------------
# ANALYZE ENDPOINT (NDVI + ML)
# ---------------------------------------------------
@app.post("/analyze")
def analyze(data: PolygonRequest):

    # Extract GeoJSON coordinates
    geojson = data.polygon

    if geojson["type"] != "Polygon":
        return {"error": "Only Polygon type supported"}

    # GeoJSON format: [ [ [lng, lat], [lng, lat], ... ] ]
    coordinates = geojson["coordinates"][0]

    # Run NDVI using extracted coordinates
    summary = run_ndvi_analysis(coordinates)

    avg_ndvi = summary["health_score"] / 100
    stress = summary["stress_percentage"]
    vegetation = 100 - summary["area_under_stress"]
    slope = 0

    predicted = predict_stress([
        avg_ndvi,
        stress,
        vegetation,
        slope
    ])

    if predicted < 30:
        risk = "Low"
    elif predicted < 60:
        risk = "Moderate"
    else:
        risk = "High"

    return {
        "summary": summary,
        "prediction": {
            "predicted_stress_next_7_days": predicted,
            "risk_level": risk
        }
    }

# ---------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "CropOrbit Backend Running with NDVI + ML 🚀"
    }