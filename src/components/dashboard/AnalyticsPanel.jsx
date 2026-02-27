import React from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import jsPDF from "jspdf";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Thermometer,
  Brain,
  Flame
} from 'lucide-react';

const COLORS = ['#10b981', '#ef4444'];

const AnalyticsPanel = () => {

  const { stressResults } = useAppContext();

  const summary = stressResults?.summary;
  const prediction = stressResults?.prediction;
  const timeseries = stressResults?.timeseries || [];
  const fieldsData = stressResults?.fields || {};

  if (!summary) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 p-6 flex items-center justify-center">
        <p className="text-slate-500 text-sm">
          Run analysis to see Stress-Vision insights
        </p>
      </div>
    );
  }

  const healthScore = summary.health_score || 0;
  const ndviStress = summary.ndvi_stress || 0;
  const thermalStress = summary.thermal_stress || 0;
  const combinedStress = summary.combined_stress || 0;
  const meanTemp = summary.mean_temperature_c || 0;
  const confidenceScore = summary.confidence_score || 0;

  const chartData = [
    { name: 'Healthy', value: 100 - combinedStress },
    { name: 'Stressed', value: combinedStress }
  ];

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-600";
    if (risk === "Moderate") return "text-amber-600";
    return "text-green-600";
  };

  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("CropOrbit Stress-Vision Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);

    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.text("Physiological Stress Analysis", 20, 45);

    doc.setFontSize(12);
    doc.text(`Vegetation Health (NDVI): ${healthScore.toFixed(2)}%`, 20, 55);
    doc.text(`NDVI Stress: ${ndviStress.toFixed(2)}%`, 20, 65);
    doc.text(`Thermal Stress: ${thermalStress.toFixed(2)}%`, 20, 75);
    doc.text(`Combined Stress Index: ${combinedStress.toFixed(2)}%`, 20, 85);
    doc.text(`Mean Canopy Temperature: ${meanTemp.toFixed(2)} °C`, 20, 95);
    doc.text(`Confidence Score: ${confidenceScore.toFixed(2)}%`, 20, 105);

    if (prediction) {
      doc.setFontSize(14);
      doc.text("7-Day Forecast", 20, 120);
      doc.setFontSize(12);
      doc.text(
        `Projected Stress: ${prediction.predicted_stress_next_7_days}%`,
        20,
        130
      );
      doc.text(`Risk Level: ${prediction.risk_level}`, 20, 140);
    }

    doc.save("StressVision_Report.pdf");
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 p-6 flex flex-col overflow-y-auto max-h-screen">

      {/* Title */}
      <h2 className="text-lg font-bold bg-gradient-to-r from-agri-green to-emerald-500 bg-clip-text text-transparent mb-4">
        Stress-Vision Analytics
      </h2>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        className="mb-6 w-full bg-agri-green text-white py-2 rounded-lg hover:bg-agri-dark transition-colors text-sm font-semibold"
      >
        Download Stress Report
      </button>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">

        <MetricCard
          icon={<TrendingUp size={16} className="text-agri-green" />}
          label="NDVI Health"
          value={`${healthScore.toFixed(2)}%`}
          color="text-agri-green"
        />

        <MetricCard
          icon={<AlertTriangle size={16} className="text-red-500" />}
          label="NDVI Stress"
          value={`${ndviStress.toFixed(2)}%`}
          color="text-red-500"
        />

        <MetricCard
          icon={<Flame size={16} className="text-orange-500" />}
          label="Thermal Stress"
          value={`${thermalStress.toFixed(2)}%`}
          color="text-orange-500"
        />

        <MetricCard
          icon={<Thermometer size={16} className="text-orange-600" />}
          label="Mean Temp"
          value={`${meanTemp.toFixed(2)}°C`}
          color="text-orange-600"
        />
      </div>

      {/* Combined Stress */}
      <div className="mb-8 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-purple-600" />
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Combined Physiological Stress
          </p>
        </div>

        <p className="text-3xl font-bold text-purple-700">
          {combinedStress}%
        </p>

        {prediction && (
          <p className={`text-sm font-semibold mt-2 ${getRiskColor(prediction.risk_level)}`}>
            Risk Level: {prediction.risk_level}
          </p>
        )}
      </div>

      {/* Pie Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Stress Distribution
        </h3>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* NDVI Time Series */}
      {timeseries.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            30-Day NDVI Trend
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-auto p-4 rounded-xl bg-slate-50 border">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-indigo-500" />
          <p className="text-xs text-slate-500">Confidence Score</p>
        </div>
        <p className="text-lg font-semibold text-indigo-600">
          {confidenceScore.toFixed(2)}%
        </p>
      </div>

    </div>
  );
};

const MetricCard = ({ icon, label, value, color }) => (
  <div className="p-4 rounded-xl bg-slate-50 border">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs text-slate-500">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${color}`}>
      {value}
    </p>
  </div>
);

export default AnalyticsPanel;