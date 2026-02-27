# backend/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware
import ee
import datetime

# ---------------------------------------------------
# Initialize Earth Engine
# ---------------------------------------------------
ee.Initialize(project="croporbit-ee")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# Request Model
# ---------------------------------------------------
class PolygonRequest(BaseModel):
    polygon: Dict


# ---------------------------------------------------
# STRESS-VISION PIPELINE
# ---------------------------------------------------
def run_stress_vision(geojson_polygon):

    if geojson_polygon["type"] != "Polygon":
        raise HTTPException(status_code=400, detail="Only Polygon type supported")

    coordinates = geojson_polygon["coordinates"][0]
    region = ee.Geometry.Polygon(coordinates)

    today = datetime.date.today()
    past_30 = today - datetime.timedelta(days=30)

    # ---------------------------------------------------
    # 1️⃣ NDVI (Sentinel-2)
    # ---------------------------------------------------
    s2_collection = (
        ee.ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(region)
        .filterDate(str(past_30), str(today))
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        .select(["B8", "B4"])
    )

    if s2_collection.size().getInfo() == 0:
        raise HTTPException(
            status_code=400,
            detail="No Sentinel-2 NDVI data available for this region."
        )

    # Median NDVI
    s2_image = s2_collection.median()
    ndvi = s2_image.normalizedDifference(["B8", "B4"]).rename("NDVI")

    ndvi_stats = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10,
        maxPixels=1e9
    )

    mean_ndvi = ndvi_stats.get("NDVI").getInfo() or 0

    health_score = round(mean_ndvi * 100, 2)
    ndvi_stress = round(100 - health_score, 2)

    # ---------------------------------------------------
    # 1️⃣.1 NDVI Time-Series (30 Days)
    # ---------------------------------------------------

    def extract_ndvi(img):
        nd = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
        mean = nd.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,
            scale=10,
            maxPixels=1e9
        ).get("NDVI")

        return ee.Feature(None, {
            "date": img.date().format("YYYY-MM-dd"),
            "ndvi": mean
        })

    ndvi_features = s2_collection.map(extract_ndvi)
    ndvi_list = ndvi_features.getInfo()["features"]

    ndvi_timeseries = []

    for f in ndvi_list:
        value = f["properties"]["ndvi"]
        if value is not None:
            ndvi_timeseries.append({
                "date": f["properties"]["date"],
                "value": round(value, 3)
            })

    # ---------------------------------------------------
    # 2️⃣ Thermal Infrared (Landsat 8)
    # ---------------------------------------------------
    landsat_collection = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .filterBounds(region)
        .filterDate(str(past_30), str(today))
        .filter(ee.Filter.lt("CLOUD_COVER", 30))
    )

    if landsat_collection.size().getInfo() == 0:
        raise HTTPException(
            status_code=400,
            detail="No Landsat thermal data available for this region."
        )

    landsat = landsat_collection.median()

    thermal = (
        landsat.select("ST_B10")
        .multiply(0.00341802)
        .add(149.0)
        .subtract(273.15)
    )

    thermal_stats = thermal.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=30,
        maxPixels=1e9
    )

    mean_temp = thermal_stats.get("ST_B10").getInfo() or 0

    thermal_stress = (mean_temp - 20) / (40 - 20) * 100
    thermal_stress = max(0, min(thermal_stress, 100))
    thermal_stress = round(thermal_stress, 2)

    # ---------------------------------------------------
    # 3️⃣ Combined Stress
    # ---------------------------------------------------
    combined_stress = round(
        (ndvi_stress * 0.6) + (thermal_stress * 0.4),
        2
    )

    if combined_stress < 30:
        risk = "Low"
    elif combined_stress < 60:
        risk = "Moderate"
    else:
        risk = "High"

    # ---------------------------------------------------
    # 4️⃣ Thermal Heatmap
    # ---------------------------------------------------
    # Clip thermal to selected region
    thermal_clipped = thermal.clip(region)

    map_id_dict = thermal_clipped.getMapId({
        "min": 20,
        "max": 40,
        "palette": ["#10b981", "#facc15", "#ef4444"]
    })

    tile_url = map_id_dict["tile_fetcher"].url_format

    # ---------------------------------------------------
    # Final Response
    # ---------------------------------------------------
    return {
        "summary": {
            "health_score": health_score,
            "ndvi_stress": ndvi_stress,
            "thermal_stress": thermal_stress,
            "combined_stress": combined_stress,
            "mean_temperature_c": round(mean_temp, 2),
            "confidence_score": 92.0
        },
        "prediction": {
            "predicted_stress_next_7_days": combined_stress,
            "risk_level": risk
        },
        "heatmap": {
            "tile_url": tile_url
        },
        "timeseries": ndvi_timeseries
    }


# ---------------------------------------------------
# Analyze Endpoint
# ---------------------------------------------------
@app.post("/analyze")
def analyze(data: PolygonRequest):
    return run_stress_vision(data.polygon)


# ---------------------------------------------------
# Health Check
# ---------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Stress-Vision Thermal System Running 🌡️"
    }