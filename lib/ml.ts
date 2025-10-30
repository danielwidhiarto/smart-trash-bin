import { HistoryData } from "./firebase";

export interface PredictionResult {
  hoursUntilFull: number;
  trend: "increasing" | "stable" | "decreasing";
  confidence: number;
  predictedFillAt: {
    oneHour: number;
    twoHours: number;
    sixHours: number;
  };
}

// Simple Linear Regression untuk prediksi fill rate
export function predictFillLevel(historyData: HistoryData[]): PredictionResult {
  if (historyData.length < 10) {
    return {
      hoursUntilFull: -1,
      trend: "stable",
      confidence: 0,
      predictedFillAt: { oneHour: 0, twoHours: 0, sixHours: 0 },
    };
  }

  // Sort by time (oldest first) - Use last 100 data points for better accuracy
  const sorted = [...historyData]
    .filter((d) => d.fillPercent != null && d.dateTime)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    )
    .slice(-100); // Last 100 data points (~16-17 minutes of data at 10s interval)

  if (sorted.length < 10) {
    return {
      hoursUntilFull: -1,
      trend: "stable",
      confidence: 0,
      predictedFillAt: { oneHour: 0, twoHours: 0, sixHours: 0 },
    };
  }

  // Extract time (hours since first data point) and fill levels
  const firstTime = new Date(sorted[0].dateTime).getTime();
  const timePoints = sorted.map(
    (d) => (new Date(d.dateTime).getTime() - firstTime) / (1000 * 60 * 60) // Convert to hours
  );
  const fillPoints = sorted.map((d) => d.fillPercent ?? 0);

  // Calculate linear regression: y = mx + b
  const n = timePoints.length;
  const sumX = timePoints.reduce((a, b) => a + b, 0);
  const sumY = fillPoints.reduce((a, b) => a + b, 0);
  const sumXY = timePoints.reduce((sum, x, i) => sum + x * fillPoints[i], 0);
  const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Current fill level
  const currentFill = fillPoints[fillPoints.length - 1];
  const currentTime = timePoints[timePoints.length - 1];

  // Calculate hours until 100%
  let hoursUntilFull = -1;
  if (slope > 0.1) {
    // Only if increasing
    hoursUntilFull = (100 - currentFill) / slope;
    if (hoursUntilFull < 0) hoursUntilFull = 0;
  }

  // Determine trend
  let trend: "increasing" | "stable" | "decreasing" = "stable";
  if (slope > 0.5) trend = "increasing";
  else if (slope < -0.5) trend = "decreasing";

  // Confidence based on R-squared
  const yMean = sumY / n;
  const ssTotal = fillPoints.reduce(
    (sum, y) => sum + Math.pow(y - yMean, 2),
    0
  );
  const ssResidual = timePoints.reduce((sum, x, i) => {
    const predicted = slope * x + intercept;
    return sum + Math.pow(fillPoints[i] - predicted, 2);
  }, 0);
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
  const confidence = Math.max(0, Math.min(100, rSquared * 100));

  // Predict fill levels at future times
  const predictedFillAt = {
    oneHour: Math.min(100, Math.max(0, slope * (currentTime + 1) + intercept)),
    twoHours: Math.min(100, Math.max(0, slope * (currentTime + 2) + intercept)),
    sixHours: Math.min(100, Math.max(0, slope * (currentTime + 6) + intercept)),
  };

  return {
    hoursUntilFull:
      hoursUntilFull > 0 ? Math.round(hoursUntilFull * 10) / 10 : -1,
    trend,
    confidence: Math.round(confidence),
    predictedFillAt: {
      oneHour: Math.round(predictedFillAt.oneHour * 10) / 10,
      twoHours: Math.round(predictedFillAt.twoHours * 10) / 10,
      sixHours: Math.round(predictedFillAt.sixHours * 10) / 10,
    },
  };
}

// Get time-based pattern (e.g., fill faster during lunch time)
export function analyzeTimePattern(historyData: HistoryData[]): {
  peakHours: number[];
  averageFillRate: number;
} {
  const hourlyData: { [hour: number]: number[] } = {};

  historyData.forEach((item) => {
    if (!item.dateTime || item.fillPercent == null) return;

    const hour = new Date(item.dateTime).getHours();
    if (!hourlyData[hour]) hourlyData[hour] = [];
    hourlyData[hour].push(item.fillPercent);
  });

  // Calculate average fill per hour
  const hourlyAvg = Object.entries(hourlyData).map(([hour, fills]) => ({
    hour: parseInt(hour),
    avgFill: fills.reduce((a, b) => a + b, 0) / fills.length,
  }));

  // Find peak hours (top 3 highest fill rates)
  const sorted = hourlyAvg.sort((a, b) => b.avgFill - a.avgFill);
  const peakHours = sorted.slice(0, 3).map((h) => h.hour);

  // Calculate overall average fill rate
  const allFills = Object.values(hourlyData).flat();
  const averageFillRate =
    allFills.length > 0
      ? allFills.reduce((a, b) => a + b, 0) / allFills.length
      : 0;

  return {
    peakHours,
    averageFillRate: Math.round(averageFillRate * 10) / 10,
  };
}
