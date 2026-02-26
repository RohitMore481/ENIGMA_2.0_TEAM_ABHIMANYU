import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { runAnalysis } from '../../services/api';
import {
  Play,
  Layers,
  Map,
  Activity,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';

const Sidebar = () => {

  const {
    selectedFields,
    fields,
    setStressResults,
    loadingState,
    setLoadingState,
    analysisType,
    setAnalysisType,
    isOverlayVisible,
    setIsOverlayVisible,
    setReports
  } = useAppContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleRunAnalysis = async () => {

    if (selectedFields.length === 0) return;

    setLoadingState(true);

    try {

      const fieldId = selectedFields[0];

      const fieldObj = fields.find(f => f.id === fieldId);

      if (!fieldObj || !fieldObj.geometry) {
        console.error("No geometry found for selected field");
        setLoadingState(false);
        return;
      }

      const data = await runAnalysis(fieldObj.geometry);

      setStressResults({
        summary: data.summary,
        prediction: data.prediction,   // 🔥 ADD THIS
        fields: {
          [fieldId]: {
            stress_matrix: data.stress_matrix
          }
        }
      });

      setReports(prev => [
        {
          id: Date.now(),
          fieldId,
          date: new Date().toLocaleString(),
          summary: data.summary,
          prediction: data.prediction   // 🔥 ADD THIS
        },
        ...prev
      ]);

    } catch (err) {
      console.error("Analysis error:", err);
    }

    setLoadingState(false);
  };

  const analysisOptions = ['Water', 'Nutrient', 'Combined'];

  return (
    <div className="w-80 bg-white h-full border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6">

        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Activity size={20} className="text-agri-green" />
          Field Analysis
        </h2>

        {/* Selected Fields */}
        <div className="mb-8">

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Selected Fields ({selectedFields.length})
            </h3>

            <button
              onClick={() => setIsOverlayVisible(!isOverlayVisible)}
              className="text-slate-400 hover:text-agri-green transition-colors"
              title={isOverlayVisible ? "Hide Heatmap" : "Show Heatmap"}
            >
              {isOverlayVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="space-y-2">
            {selectedFields.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                <p className="text-sm text-slate-500">
                  Draw and select a field for analysis
                </p>
              </div>
            ) : (
              selectedFields.map(fieldId => {
                const fieldName =
                  fields.find(f => f.id === fieldId)?.name || fieldId;

                return (
                  <div
                    key={fieldId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-agri-light bg-opacity-30 border border-agri-light"
                  >
                    <Map size={16} className="text-agri-dark" />
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {fieldName}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Model Type */}
        <div className="mb-8 relative">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Model Type
          </h3>

          <button
            type="button"
            disabled={loadingState}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-agri-green/50 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-slate-400" />
              {analysisType}
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
              {analysisOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setAnalysisType(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                    analysisType === option
                      ? 'bg-agri-light/20 text-agri-dark font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run Button */}
        <div className="mt-auto">
          <button
            onClick={handleRunAnalysis}
            disabled={selectedFields.length === 0 || loadingState}
            className="w-full flex items-center justify-center gap-2 bg-agri-green text-white hover:bg-agri-dark transition-colors font-semibold rounded-xl py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingState ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play size={18} />
                Run AI Analysis
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;