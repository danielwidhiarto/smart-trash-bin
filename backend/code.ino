#include "secrets.h"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <FirebaseESP32.h>
#include "DHT.h"

// Pin definitions
#define DHTPIN 4
#define DHTTYPE DHT11
#define TRIG_PIN 5
#define ECHO_PIN 18

// Trash bin configuration
#define TRASH_BIN_HEIGHT 13.5
#define MIN_TRASH_DISTANCE 2.0

DHT dht(DHTPIN, DHTTYPE);
BlynkTimer timer;
int dataTimerID;

// Firebase objects
FirebaseData firebaseData;
FirebaseAuth firebaseAuth;
FirebaseConfig firebaseConfig;

unsigned long dataCounter = 0; // For unique data entries

float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  
  float distance = duration * 0.034 / 2;
  return distance;
}

String getTrashStatus(float distance) {
  if (distance > TRASH_BIN_HEIGHT + 2) {
    return "LID OPEN";
  }
  
  float fillPercent = ((TRASH_BIN_HEIGHT - distance) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
  
  if (fillPercent >= 90) return "FULL";
  else if (fillPercent >= 70) return "HIGH";
  else if (fillPercent >= 40) return "MEDIUM";
  else if (fillPercent >= 10) return "LOW";
  else return "EMPTY";
}

// Send to Firebase for historical data & ML
void sendToFirebase(float temp, float humidity, float fillPercent, String status, float distance) {
  if (Firebase.ready()) {
    // Current readings (latest data)
    Firebase.setFloat(firebaseData, "/current/temperature", temp);
    Firebase.setFloat(firebaseData, "/current/humidity", humidity);
    Firebase.setFloat(firebaseData, "/current/fillPercent", fillPercent);
    Firebase.setString(firebaseData, "/current/status", status);
    Firebase.setFloat(firebaseData, "/current/distance", distance);
    Firebase.setInt(firebaseData, "/current/timestamp", millis() / 1000);
    
    // Historical data (for ML training)
    String path = "/history/" + String(dataCounter);
    Firebase.setFloat(firebaseData, path + "/temp", temp);
    Firebase.setFloat(firebaseData, path + "/humidity", humidity);
    Firebase.setFloat(firebaseData, path + "/fillPercent", fillPercent);
    Firebase.setString(firebaseData, path + "/status", status);
    Firebase.setFloat(firebaseData, path + "/distance", distance);
    Firebase.setInt(firebaseData, path + "/timestamp", millis() / 1000);
    
    dataCounter++;
    
    Serial.println("🔥 Firebase: Data saved!");
  } else {
    Serial.println("❌ Firebase: Not ready");
  }
}

void sendSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float dist = readDistance();
  
  Serial.println("📡 Sending data...");
  
  // DHT11 Data
  if (!isnan(h) && !isnan(t)) {
    Blynk.virtualWrite(V0, t);
    Blynk.virtualWrite(V1, h);
    Serial.println("✅ DHT11: " + String(t, 1) + "°C, " + String(h, 1) + "%");
  } else {
    Serial.println("❌ DHT11 Error");
    Blynk.virtualWrite(V0, 0);
    Blynk.virtualWrite(V1, 0);
    t = 0;
    h = 0;
  }
  
  // Ultrasonic Data
  float fillPercent = 0;
  String status = "ERROR";
  
  if (dist > 0 && dist <= 400) {
    if (dist > TRASH_BIN_HEIGHT + 2) {
      Blynk.virtualWrite(V2, 0);
      Blynk.virtualWrite(V3, "LID OPEN");
      status = "LID OPEN";
      Serial.println("🚨 Trash bin lid is OPEN! Distance: " + String(dist, 1) + "cm");
    } else {
      fillPercent = ((TRASH_BIN_HEIGHT - dist) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
      
      if (fillPercent < 0) fillPercent = 0;
      if (fillPercent > 100) fillPercent = 100;
      
      status = getTrashStatus(dist);
      
      Blynk.virtualWrite(V2, fillPercent);
      Blynk.virtualWrite(V3, status);
      
      Serial.println("✅ Trash: " + String(dist, 1) + "cm (" + String(fillPercent, 0) + "% full) - " + status);
      
      // Blynk alerts
      if (fillPercent >= 90) {
        Blynk.logEvent("trash_full", "🗑️ Trash is " + String(fillPercent, 0) + "% FULL!");
        Serial.println("🚨 ALERT: Trash bin is full!");
      }
      
      if (fillPercent >= 70 && fillPercent < 90) {
        Blynk.logEvent("trash_high", "⚠️ Trash level is getting HIGH (" + String(fillPercent, 0) + "%)");
      }
    }
    
    // Send to Firebase for ML & analytics
    sendToFirebase(t, h, fillPercent, status, dist);
    
  } else {
    Serial.println("❌ Ultrasonic Error");
    Blynk.virtualWrite(V2, 0);
    Blynk.virtualWrite(V3, "ERROR");
  }
  
  Serial.println("📊 Data sent successfully!");
}

BLYNK_WRITE(V4) {
  int buttonState = param.asInt();
  if (buttonState == 1) {
    Serial.println("🔄 Manual refresh triggered from Blynk");
    sendSensorData();
  }
}

BLYNK_WRITE(V5) {
  int interval = param.asInt();
  timer.deleteTimer(dataTimerID);
  dataTimerID = timer.setInterval(interval * 1000L, sendSensorData);
  Serial.println("⏱️ Refresh interval set to: " + String(interval) + " seconds");
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== Smart Trash Bin (Firebase + Blynk) ===");
  Serial.println("Trash bin height: " + String(TRASH_BIN_HEIGHT) + " cm (empty)");
  Serial.println("Minimum distance: " + String(MIN_TRASH_DISTANCE) + " cm (full)");
  
  // Initialize sensors
  dht.begin();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.println("🔧 Sensors initialized");
  
  // Connect to WiFi & Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD);
  Serial.println("📶 WiFi Connected: " + WiFi.localIP().toString());
  Serial.println("📱 Blynk Connected!");
  
  // Configure Firebase
  firebaseConfig.host = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  Serial.println("🔥 Firebase initialized!");
  
  // Setup timer
  dataTimerID = timer.setInterval(10000L, sendSensorData);
  timer.setTimeout(3000L, sendSensorData);
  
  Serial.println("✅ Setup complete - Ready to monitor!");
  Serial.println("===========================================");
}

void loop() { 
  Blynk.run();
  timer.run();
  
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 30000) {
    lastHeartbeat = millis();
    
    if (Blynk.connected()) {
      Serial.println("💚 Blynk connection healthy");
    } else {
      Serial.println("💔 Blynk disconnected - trying to reconnect...");
    }
    
    if (Firebase.ready()) {
      Serial.println("🔥 Firebase connection healthy");
    } else {
      Serial.println("❌ Firebase connection issue");
    }
  }
}