"use client";

import { Brain, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { predictFillLevel, analyzeTimePattern } from "@/lib/ml";
import { HistoryData } from "@/lib/firebase";

interface PredictionCardProps {
  history: HistoryData[];
}

export default function PredictionCard({ history }: PredictionCardProps) {
  const prediction = predictFillLevel(history);
  const pattern = analyzeTimePattern(history);

  if (prediction.hoursUntilFull === -1 && prediction.confidence === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="text-purple-400" size={24} />
          <h2 className="text-xl font-bold text-white">AI Prediction</h2>
        </div>
        <p className="text-gray-400">
          📊 Collecting data for AI prediction... Need at least 10 data points.
        </p>
      </div>
    );
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-red-400";
      case "decreasing":
        return "text-green-400";
      default:
        return "text-yellow-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "📈";
      case "decreasing":
        return "📉";
      default:
        return "➡️";
    }
  };

  return (
    <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-xl border border-purple-500/30">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="text-purple-400" size={24} />
        <h2 className="text-xl font-bold text-white">🤖 AI Prediction</h2>
        <span className="ml-auto text-sm px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-semibold">
          {prediction.confidence}% confidence
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Until Full */}
        {prediction.hoursUntilFull > 0 ? (
          <div className="bg-slate-700/50 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-orange-400" size={20} />
              <span className="text-gray-300 font-semibold">
                Time Until Full
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {prediction.hoursUntilFull < 1
                ? `${Math.round(prediction.hoursUntilFull * 60)} min`
                : `${prediction.hoursUntilFull} hrs`}
            </p>
            {prediction.hoursUntilFull < 2 && (
              <div className="flex items-center gap-2 mt-2 text-red-400">
                <AlertTriangle size={16} />
                <span className="text-sm font-semibold">
                  Urgent! Empty soon!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-700/50 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-green-400" size={20} />
              <span className="text-gray-300 font-semibold">Status</span>
            </div>
            <p className="text-xl font-bold text-green-400">✅ Stable Level</p>
            <p className="text-sm text-gray-400 mt-1">
              No immediate action needed
            </p>
          </div>
        )}

        {/* Trend */}
        <div className="bg-slate-700/50 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={getTrendColor(prediction.trend)} size={20} />
            <span className="text-gray-300 font-semibold">Fill Trend</span>
          </div>
          <p
            className={`text-2xl font-bold ${getTrendColor(prediction.trend)}`}
          >
            {getTrendIcon(prediction.trend)} {prediction.trend.toUpperCase()}
          </p>
        </div>

        {/* Predicted Fill Levels */}
        <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/30">
          <h3 className="text-gray-300 font-semibold mb-3 flex items-center gap-2">
            <Brain size={18} className="text-purple-400" />
            Predicted Fill Levels
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">In 1 hour:</span>
              <span className="text-white font-bold">
                {prediction.predictedFillAt.oneHour}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">In 2 hours:</span>
              <span className="text-white font-bold">
                {prediction.predictedFillAt.twoHours}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">In 6 hours:</span>
              <span className="text-white font-bold">
                {prediction.predictedFillAt.sixHours}%
              </span>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-slate-700/50 rounded-lg p-4 border border-yellow-500/30">
          <h3 className="text-gray-300 font-semibold mb-3">📊 Usage Pattern</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Peak Hours:</span>
              <span className="text-white font-bold">
                {pattern.peakHours.length > 0
                  ? pattern.peakHours.map((h) => `${h}:00`).join(", ")
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Fill Rate:</span>
              <span className="text-white font-bold">
                {pattern.averageFillRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
        <p className="text-sm text-purple-300">
          💡 AI uses Linear Regression on last 100 data points (~16-17 minutes)
          to predict fill rates and trends.
        </p>
      </div>
    </div>
  );
}
