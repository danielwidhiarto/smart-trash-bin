"use client";

import { useEffect, useState } from "react";
import {
  getCurrentData,
  getHistoryData,
  TrashData,
  HistoryData,
} from "@/lib/firebase";
import { checkAndSendEmailNotification } from "@/lib/emailNotification";
import {
  Trash2,
  Thermometer,
  Droplets,
  TrendingUp,
  Activity,
  AlertCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import PredictionCard from "@/components/PredictionCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Home() {
  const [data, setData] = useState<TrashData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [prevFillPercent, setPrevFillPercent] = useState(0);

  // TODO: Ganti dengan email user yang sebenarnya
  const RECIPIENT_EMAIL =
    process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL || "user@example.com";

  useEffect(() => {
    const unsubscribeCurrent = getCurrentData((newData) => {
      setData(newData);
      setLoading(false);

      // Send email notification when trash goes from below 85% to above 85%
      if (newData?.fillPercent) {
        checkAndSendEmailNotification(
          newData.fillPercent,
          prevFillPercent,
          RECIPIENT_EMAIL,
          newData.temperature,
          newData.humidity
        );
        setPrevFillPercent(newData.fillPercent);
      }

      // Show alert when trash reaches 70% or more
      if (newData?.fillPercent && newData.fillPercent >= 70 && !showAlert) {
        setShowAlert(true);
        // Auto hide after 10 seconds
        setTimeout(() => setShowAlert(false), 10000);
      }

      // Update status for other uses
      if (newData?.status && prevStatus !== newData.status) {
        setPrevStatus(newData.status);
      }
    });

    const unsubscribeHistory = getHistoryData((historyData) => {
      setHistory(historyData.slice(0, 50)); // Last 50 data points (newest first)
    });

    return () => {
      unsubscribeCurrent();
      unsubscribeHistory();
    };
  }, [prevStatus, prevFillPercent, RECIPIENT_EMAIL, showAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FULL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      case "EMPTY":
        return "bg-blue-500";
      case "LID OPEN":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "FULL" || status === "HIGH") {
      return <AlertCircle className="text-white" size={20} />;
    }
    return null;
  };

  // Filter out "LID OPEN" status from charts for cleaner visualization
  const chartData = history
    .filter((item) => item.status !== "LID OPEN")
    .slice(0, 30)
    .reverse()
    .map((item, index) => ({
      name: item.dateTime?.substring(11, 16) || `#${index}`, // Show time HH:MM
      fill: item.fillPercent ?? 0,
      temp: item.temp ?? 0,
      humidity: item.humidity ?? 0,
    }));

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="text-blue-400" size={40} />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Smart Trash Bin Dashboard
              </h1>
            </div>
            <p className="text-gray-400">
              Real-time monitoring & analytics powered by IoT
            </p>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            <History size={20} />
            <span className="hidden md:inline">View History</span>
          </Link>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Fill Level Card */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Trash2 className="text-blue-400" size={32} />
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${getStatusColor(
                data?.status || ""
              )}`}
            >
              {getStatusIcon(data?.status || "")}
              {data?.status || "N/A"}
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Fill Level</h3>
          <p className="text-3xl font-bold text-white mb-2">
            {data?.fillPercent?.toFixed(1) || 0}%
          </p>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getStatusColor(
                data?.status || ""
              )}`}
              style={{ width: `${Math.min(data?.fillPercent || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Thermometer className="text-red-400" size={32} />
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Temperature</h3>
          <p className="text-3xl font-bold text-white">
            {data?.temperature?.toFixed(1) || 0}°C
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {data?.temperature && data.temperature > 30
              ? "🔥 High"
              : "✅ Normal"}
          </p>
        </div>

        {/* Humidity Card */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <Droplets className="text-blue-400" size={32} />
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Humidity</h3>
          <p className="text-3xl font-bold text-white">
            {data?.humidity?.toFixed(1) || 0}%
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {data?.humidity && data.humidity > 70 ? "💧 High" : "✅ Normal"}
          </p>
        </div>

        {/* Distance Card */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 hover:border-green-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-green-400" size={32} />
          </div>
          <h3 className="text-gray-400 text-sm mb-2">Distance to Trash</h3>
          <p className="text-3xl font-bold text-white">
            {data?.distance?.toFixed(2) || 0} cm
          </p>
          <p className="text-gray-500 text-sm mt-2">Max: 13.5 cm (empty)</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Fill Level History Chart */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Fill Level History</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="fill"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Fill Level (%)"
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature & Humidity Chart */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white">
              Temperature & Humidity
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#ef4444"
                strokeWidth={2}
                name="Temperature (°C)"
                dot={{ fill: "#ef4444" }}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Humidity (%)"
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Prediction Section */}
      <div className="mb-8">
        <PredictionCard history={history} />
      </div>

      {/* Live Status & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Status */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-green-400" size={24} />
            Live Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last Update:</span>
              <span className="text-white font-semibold">
                {data?.dateTime || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Connection:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">Live</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data Points:</span>
              <span className="text-white font-semibold">{history.length}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">System Info</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Device:</span>
              <span className="text-white font-semibold">ESP32 + Sensors</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sensors:</span>
              <span className="text-white font-semibold">DHT11 + HC-SR04</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cloud:</span>
              <span className="text-white font-semibold">
                Firebase Realtime DB
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Update Interval:</span>
              <span className="text-white font-semibold">10 seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          Smart Trash Bin Dashboard v1.0 | IoT Assignment 2 | Powered by Next.js
          & Firebase
        </p>
      </div>

      {/* Toast Notification - Bottom Right Alert */}
      {showAlert && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-linear-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-400 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">
                  {data?.status === "FULL"
                    ? "🗑️ Trash is Full!"
                    : "⚠️ Trash Almost Full!"}
                </h4>
                <p className="text-sm text-red-100">
                  {data?.status === "FULL"
                    ? "Please empty the trash bin immediately! (100%)"
                    : `Trash level is at ${data?.fillPercent?.toFixed(
                        1
                      )}%. Please empty soon.`}
                </p>
              </div>
              <button
                onClick={() => setShowAlert(false)}
                className="shrink-0 text-white hover:text-red-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
