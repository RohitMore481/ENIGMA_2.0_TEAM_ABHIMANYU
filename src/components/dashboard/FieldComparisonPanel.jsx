import React from "react";
import { useAppContext } from "../../context/AppContext";
import { X } from "lucide-react";

const FieldComparisonPanel = () => {

  const {
    selectedFields,
    stressResults,
    setIsComparisonOpen
  } = useAppContext();

  const fieldsData = stressResults?.fields || {};

  return (
    <div className="absolute top-16 left-0 right-0 bottom-0 z-40 bg-white shadow-2xl overflow-y-auto p-8">

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          Field Stress Comparison
        </h2>

        <button
          onClick={() => setIsComparisonOpen(false)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {selectedFields.map(fieldId => {

          const summary = fieldsData[fieldId]?.summary;

          if (!summary) {
            return (
              <div key={fieldId} className="p-6 border rounded-xl bg-slate-50">
                <p className="text-sm text-slate-500">
                  No analysis data for {fieldId}
                </p>
              </div>
            );
          }

          return (
            <div key={fieldId} className="p-6 border rounded-xl bg-slate-50">

              <h3 className="text-lg font-semibold mb-4">
                {fieldId}
              </h3>

              <Stat label="NDVI Health" value={`${summary.health_score}%`} />
              <Stat label="NDVI Stress" value={`${summary.ndvi_stress}%`} />
              <Stat label="Thermal Stress" value={`${summary.thermal_stress}%`} />
              <Stat label="Combined Stress" value={`${summary.combined_stress}%`} />
              <Stat label="Mean Temp" value={`${summary.mean_temperature_c}°C`} />

            </div>
          );
        })}

      </div>

    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="mb-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-lg font-bold text-purple-700">{value}</p>
  </div>
);

export default FieldComparisonPanel;