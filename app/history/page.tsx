"use client";

import { useEffect, useState } from "react";
import { getHistoryByDate, HistoryData } from "@/lib/firebase";
import {
  Calendar,
  Download,
  Trash2,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
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

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = getHistoryByDate(selectedDate, (data) => {
      setHistory(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "DateTime",
      "Temperature (°C)",
      "Humidity (%)",
      "Fill Level (%)",
      "Status",
      "Distance (cm)",
    ];

    const csvData = history.map((item) => [
      item.dateTime,
      item.temp,
      item.humidity,
      item.fillPercent,
      item.status,
      item.distance,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trash-bin-history-${selectedDate}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FULL":
        return "text-red-500";
      case "HIGH":
        return "text-orange-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "LOW":
        return "text-green-500";
      case "EMPTY":
        return "text-blue-500";
      case "LID OPEN":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const chartData = history.map((item) => ({
    time: item.dateTime?.substring(11, 19) || "", // HH:MM:SS
    fill: item.fillPercent ?? 0,
    temp: item.temp ?? 0,
    humidity: item.humidity ?? 0,
  }));

  const avgFillPercent =
    history.length > 0
      ? (
          history.reduce((sum, item) => sum + (item.fillPercent ?? 0), 0) /
          history.length
        ).toFixed(1)
      : "0";

  const avgTemp =
    history.length > 0
      ? (
          history.reduce((sum, item) => sum + (item.temp ?? 0), 0) /
          history.length
        ).toFixed(1)
      : "0";

  const avgHumidity =
    history.length > 0
      ? (
          history.reduce((sum, item) => sum + (item.humidity ?? 0), 0) /
          history.length
        ).toFixed(1)
      : "0";

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-400" size={40} />
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Historical Data
          </h1>
        </div>
        <p className="text-gray-400">
          View and analyze trash bin data from specific dates
        </p>
      </div>

      {/* Date Picker & Actions */}
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="text-white font-semibold">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split("T")[0]}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={history.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all w-full md:w-auto justify-center"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading data...</p>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 shadow-xl border border-slate-700 text-center">
          <Trash2 className="text-gray-600 mx-auto mb-4" size={64} />
          <h3 className="text-xl font-bold text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-400">
            No records found for {selectedDate}. Try selecting a different date.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <h3 className="text-gray-400 text-sm mb-2">Total Records</h3>
              <p className="text-3xl font-bold text-white">{history.length}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <h3 className="text-gray-400 text-sm mb-2">Avg Fill Level</h3>
              <p className="text-3xl font-bold text-white">{avgFillPercent}%</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <h3 className="text-gray-400 text-sm mb-2">Avg Temperature</h3>
              <p className="text-3xl font-bold text-white">{avgTemp}°C</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <h3 className="text-gray-400 text-sm mb-2">Avg Humidity</h3>
              <p className="text-3xl font-bold text-white">{avgHumidity}%</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            {/* Fill Level Chart */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-blue-400" size={24} />
                <h2 className="text-xl font-bold text-white">
                  Fill Level Throughout The Day
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
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
                    dot={{ fill: "#3b82f6", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Temperature & Humidity Chart */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Temperature & Humidity Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
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
                    dot={{ fill: "#ef4444", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Humidity (%)"
                    dot={{ fill: "#3b82f6", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Detailed Records ({history.length} entries)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-gray-400 font-semibold">Time</th>
                    <th className="pb-3 text-gray-400 font-semibold">Temp</th>
                    <th className="pb-3 text-gray-400 font-semibold">
                      Humidity
                    </th>
                    <th className="pb-3 text-gray-400 font-semibold">Fill %</th>
                    <th className="pb-3 text-gray-400 font-semibold">Status</th>
                    <th className="pb-3 text-gray-400 font-semibold">
                      Distance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="py-3 text-white">
                        {item.dateTime?.substring(11, 19) || "N/A"}
                      </td>
                      <td className="py-3 text-white">
                        {item.temp != null ? item.temp.toFixed(1) : "N/A"}°C
                      </td>
                      <td className="py-3 text-white">
                        {item.humidity != null
                          ? item.humidity.toFixed(1)
                          : "N/A"}
                        %
                      </td>
                      <td className="py-3 text-white">
                        {item.fillPercent != null
                          ? item.fillPercent.toFixed(1)
                          : "N/A"}
                        %
                      </td>
                      <td
                        className={`py-3 font-semibold ${getStatusColor(
                          item.status || "ERROR"
                        )}`}
                      >
                        {item.status || "N/A"}
                      </td>
                      <td className="py-3 text-white">
                        {item.distance != null
                          ? item.distance.toFixed(2)
                          : "N/A"}{" "}
                        cm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
