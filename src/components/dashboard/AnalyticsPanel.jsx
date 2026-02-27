import React from 'react';
import { useAppContext } from '../../context/AppContext';
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Thermometer,
  Brain,
  Flame,
  Droplets
} from 'lucide-react';

const COLORS = ['#10b981', '#ef4444'];

const AnalyticsPanel = () => {

  const { stressResults } = useAppContext();

  const summary = stressResults?.summary ?? null;
  const prediction = stressResults?.prediction ?? null;
  const timeseries = stressResults?.timeseries ?? [];

  if (!summary) {
    return (
      <div className="w-96 bg-white border-l border-slate-200 p-6 flex items-center justify-center">
        <p className="text-slate-500 text-sm">
          Run analysis to see Stress-Vision insights
        </p>
      </div>
    );
  }

  const healthScore = summary.health_score ?? 0;
  const ndviStress = summary.ndvi_stress ?? 0;
  const thermalStress = summary.thermal_stress ?? 0;
  const moistureStress = summary.moisture_stress ?? 0;
  const meanNDWI = summary.mean_ndwi ?? 0;
  const combinedStress = summary.combined_stress ?? 0;
  const meanTemp = summary.mean_temperature_c ?? 0;
  const confidenceScore = summary.confidence_score ?? 0;
  const stressCause = summary.stress_cause ?? "Unknown";

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

    doc.text(`NDVI Health: ${healthScore.toFixed(2)}%`, 20, 50);
    doc.text(`NDVI Stress: ${ndviStress.toFixed(2)}%`, 20, 60);
    doc.text(`Thermal Stress: ${thermalStress.toFixed(2)}%`, 20, 70);
    doc.text(`Moisture Stress: ${moistureStress.toFixed(2)}%`, 20, 80);
    doc.text(`Combined Stress: ${combinedStress.toFixed(2)}%`, 20, 90);
    doc.text(`Stress Cause: ${stressCause}`, 20, 100);
    doc.text(`Mean Temp: ${meanTemp.toFixed(2)} °C`, 20, 110);
    doc.text(`Mean NDWI: ${meanNDWI.toFixed(3)}`, 20, 120);

    doc.save("StressVision_Report.pdf");
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 p-6 flex flex-col overflow-y-auto max-h-screen">

      <h2 className="text-lg font-bold bg-gradient-to-r from-agri-green to-emerald-500 bg-clip-text text-transparent mb-4">
        Stress-Vision Analytics
      </h2>

      <button
        onClick={downloadPDF}
        className="mb-6 w-full bg-agri-green text-white py-2 rounded-lg hover:bg-agri-dark transition-colors text-sm font-semibold"
      >
        Download Stress Report
      </button>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">

        <MetricCard
          icon={<TrendingUp size={16} className="text-green-600" />}
          label="NDVI Health"
          value={`${healthScore.toFixed(2)}%`}
        />

        <MetricCard
          icon={<AlertTriangle size={16} className="text-red-600" />}
          label="NDVI Stress"
          value={`${ndviStress.toFixed(2)}%`}
        />

        <MetricCard
          icon={<Flame size={16} className="text-orange-600" />}
          label="Thermal Stress"
          value={`${thermalStress.toFixed(2)}%`}
        />

        <MetricCard
          icon={<Droplets size={16} className="text-blue-600" />}
          label="Moisture Stress"
          value={`${moistureStress.toFixed(2)}%`}
        />

      </div>

      {/* Combined Stress */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={16} className="text-purple-600" />
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            Combined Stress Index
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

        <p className="text-sm text-slate-500 mt-2">
          Primary Driver: <span className="font-semibold">{stressCause}</span>
        </p>
      </div>

      {/* Pie Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* NDVI Trend Chart */}
      {timeseries.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase mb-2">
            NDVI Trend (30 Days)
          </p>

          <ResponsiveContainer width="100%" height={200}>
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
          <ShieldCheck size={16} className="text-indigo-600" />
          <p className="text-xs text-slate-500">Confidence Score</p>
        </div>
        <p className="text-lg font-semibold text-indigo-600">
          {confidenceScore.toFixed(2)}%
        </p>
      </div>

    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="p-4 rounded-xl bg-slate-50 border">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <p className="text-xs text-slate-500">{label}</p>
    </div>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export default AnalyticsPanel;