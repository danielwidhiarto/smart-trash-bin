import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCBtnWYuT0v4Pfb3VisI4dFdH3Mm_jGQ6E",
  authDomain: "smart-trash-bin-6eee9.firebaseapp.com",
  databaseURL:
    "https://smart-trash-bin-6eee9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-trash-bin-6eee9",
  storageBucket: "smart-trash-bin-6eee9.firebasestorage.app",
  messagingSenderId: "106057883558",
  appId: "1:106057883558:web:e5724129f5d73c6b563967",
  measurementId: "G-2WXMSF3DQ2",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

export interface TrashData {
  temperature: number;
  humidity: number;
  fillPercent: number;
  status: string;
  distance: number;
  dateTime: string; // Changed from timestamp to dateTime
}

export interface HistoryData {
  temp: number;
  humidity: number;
  fillPercent: number;
  status: string;
  distance: number;
  dateTime: string; // Changed from timestamp to dateTime
}

// Get current real-time data
export const getCurrentData = (callback: (data: TrashData) => void) => {
  const dataRef = ref(database, "current");
  return onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) callback(data);
  });
};

// Get history data from nested structure (by date)
export const getHistoryData = (callback: (data: HistoryData[]) => void) => {
  const historyRef = ref(database, "history");
  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Flatten nested structure: history/date/uniqueId -> array
      const historyArray: HistoryData[] = [];

      Object.keys(data).forEach((date) => {
        const dateData = data[date];
        Object.keys(dateData).forEach((uniqueId) => {
          historyArray.push(dateData[uniqueId]);
        });
      });

      // Sort by dateTime descending (newest first)
      historyArray.sort((a, b) => {
        return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
      });

      callback(historyArray);
    }
  });
};

// Get today's history only
export const getTodayHistory = (callback: (data: HistoryData[]) => void) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const todayRef = ref(database, `history/${today}`);

  return onValue(todayRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const historyArray: HistoryData[] = Object.values(data);

      // Sort by dateTime
      historyArray.sort((a, b) => {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      });

      callback(historyArray);
    } else {
      callback([]);
    }
  });
};

// Get specific date history
export const getHistoryByDate = (
  date: string,
  callback: (data: HistoryData[]) => void
) => {
  const dateRef = ref(database, `history/${date}`);

  return onValue(dateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const historyArray: HistoryData[] = Object.values(data);

      // Sort by dateTime
      historyArray.sort((a, b) => {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      });

      callback(historyArray);
    } else {
      callback([]);
    }
  });
};
