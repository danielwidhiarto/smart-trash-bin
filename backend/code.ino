// Blynk Template Info (WAJIB untuk Blynk IoT v2.0)
#define BLYNK_TEMPLATE_ID "TMPL6abc123xyz"  // ❗ GANTI ini dari Blynk Console
#define BLYNK_TEMPLATE_NAME "Smart Trash Bin"
#define BLYNK_AUTH_TOKEN "r0YgOcwtRU49Do0lQmX0XJVV0boYIa8b"

// WiFi credentials
#define WIFI_SSID "AyamGulai"
#define WIFI_PASSWORD "ayamgoreng"

// Firebase - FIX: Ganti host sesuai region Asia Southeast
#define FIREBASE_HOST "smart-trash-bin-6eee9-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "v71o4vSy0c2zjYMeRSh29lH2aQsEiqZV2nC4nzFJ"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <FirebaseESP32.h>
#include <time.h>
#include "DHT.h"

// Pin definitions
#define DHTPIN 4
#define DHTTYPE DHT11
#define TRIG_PIN 5
#define ECHO_PIN 18

// Trash bin configuration
#define TRASH_BIN_HEIGHT 13.5
#define MIN_TRASH_DISTANCE 2.0

// NTP Server untuk GMT+7 Jakarta
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200;  // GMT+7 (7 * 3600)
const int daylightOffset_sec = 0;

DHT dht(DHTPIN, DHTTYPE);
BlynkTimer timer;
int dataTimerID;

// Firebase objects
FirebaseData firebaseData;
FirebaseAuth firebaseAuth;
FirebaseConfig firebaseConfig;

float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  
  return duration * 0.034 / 2;
}

String getTrashStatus(float distance) {
  if (distance > TRASH_BIN_HEIGHT + 2) return "LID OPEN";
  
  float fillPercent = ((TRASH_BIN_HEIGHT - distance) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
  
  if (fillPercent >= 90) return "FULL";
  else if (fillPercent >= 70) return "HIGH";
  else if (fillPercent >= 40) return "MEDIUM";
  else if (fillPercent >= 10) return "LOW";
  else return "EMPTY";
}

String getDateTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "N/A";
  
  char dateTimeStr[30];
  strftime(dateTimeStr, sizeof(dateTimeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(dateTimeStr);
}

String getDate() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "N/A";
  
  char dateStr[15];
  strftime(dateStr, sizeof(dateStr), "%Y-%m-%d", &timeinfo);
  return String(dateStr);
}

String getUniqueID() {
  return String(millis());
}

void sendToFirebase(float temp, float humidity, float fillPercent, String status, float distance) {
  if (!Firebase.ready()) return;
  
  String dateTime = getDateTime();
  String date = getDate();
  String uniqueID = getUniqueID();
  
  // Update current data (always overwrite)
  Firebase.setFloat(firebaseData, "/current/temperature", temp);
  Firebase.setFloat(firebaseData, "/current/humidity", humidity);
  Firebase.setFloat(firebaseData, "/current/fillPercent", fillPercent);
  Firebase.setString(firebaseData, "/current/status", status);
  Firebase.setFloat(firebaseData, "/current/distance", distance);
  Firebase.setString(firebaseData, "/current/dateTime", dateTime);
  
  // Save to history with unique ID (NEVER overwrite)
  String historyPath = "/history/" + date + "/" + uniqueID;
  Firebase.setFloat(firebaseData, historyPath + "/temp", temp);
  Firebase.setFloat(firebaseData, historyPath + "/humidity", humidity);
  Firebase.setFloat(firebaseData, historyPath + "/fillPercent", fillPercent);
  Firebase.setString(firebaseData, historyPath + "/status", status);
  Firebase.setFloat(firebaseData, historyPath + "/distance", distance);
  Firebase.setString(firebaseData, historyPath + "/dateTime", dateTime);
}

void sendSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float dist = readDistance();
  
  // DHT11 Data
  if (isnan(h) || isnan(t)) {
    t = h = 0;
  }
  
  Blynk.virtualWrite(V0, (int)t);
  Blynk.virtualWrite(V1, (int)h);
  
  // Ultrasonic Data
  float fillPercent = 0;
  String status = "ERROR";
  
  if (dist > 0 && dist <= 400) {
    if (dist > TRASH_BIN_HEIGHT + 2) {
      status = "LID OPEN";
      Blynk.virtualWrite(V2, 0);
    } else {
      fillPercent = ((TRASH_BIN_HEIGHT - dist) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
      
      if (fillPercent < 0) fillPercent = 0;
      if (fillPercent > 100) fillPercent = 100;
      
      status = getTrashStatus(dist);
      Blynk.virtualWrite(V2, (int)fillPercent);
      
      // Blynk alerts
      if (fillPercent >= 90) {
        Blynk.logEvent("trash_full");
      } else if (fillPercent >= 70) {
        Blynk.logEvent("trash_high");
      }
    }
    
    Blynk.virtualWrite(V3, status);
    sendToFirebase(t, h, fillPercent, status, dist);
    
  } else {
    Blynk.virtualWrite(V2, 0);
    Blynk.virtualWrite(V3, "ERROR");
  }
}

BLYNK_WRITE(V4) {
  if (param.asInt() == 1) sendSensorData();
}

BLYNK_WRITE(V5) {
  timer.deleteTimer(dataTimerID);
  dataTimerID = timer.setInterval(param.asInt() * 1000L, sendSensorData);
}

void setup() {
  Serial.begin(115200);
  
  dht.begin();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD);
  
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  firebaseConfig.host = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  
  dataTimerID = timer.setInterval(10000L, sendSensorData);
  timer.setTimeout(3000L, sendSensorData);
  
  Serial.println("Ready");
}

void loop() { 
  Blynk.run();
  timer.run();
}