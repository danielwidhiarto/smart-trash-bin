#define BLYNK_TEMPLATE_ID "TMPL6FXY657B-"
#define BLYNK_TEMPLATE_NAME "DHT11 and HCSR04"
#define BLYNK_AUTH_TOKEN "iWNtJsbGXuFaAWP0-qfO4X8tPcnw_ROF"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include "DHT.h"

// Pin definitions
#define DHTPIN 4
#define DHTTYPE DHT11
#define TRIG_PIN 5
#define ECHO_PIN 18

// Trash bin configuration
#define TRASH_BIN_HEIGHT 13.5  // Height when empty (cm)
#define MIN_TRASH_DISTANCE 2.0 // Minimum distance when full (cm)

DHT dht(DHTPIN, DHTTYPE);

const char* SSID = "AyamGulai";
const char* PASSWORD = "ayamgoreng";

BlynkTimer timer;
int dataTimerID; // Store timer ID

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
  // Check if lid is open or invalid reading
  if (distance > TRASH_BIN_HEIGHT + 2) {
    return "LID OPEN";
  }
  
  // Calculate fill percentage
  float fillPercent = ((TRASH_BIN_HEIGHT - distance) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
  
  if (fillPercent >= 90) return "FULL";
  else if (fillPercent >= 70) return "HIGH";
  else if (fillPercent >= 40) return "MEDIUM";
  else if (fillPercent >= 10) return "LOW";
  else return "EMPTY";
}

// Send all sensor data to Blynk
void sendSensorData() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float dist = readDistance();
  
  Serial.println("📡 Sending to Blynk...");
  
  // DHT11 Data
  if (!isnan(h) && !isnan(t)) {
    Blynk.virtualWrite(V0, t);        // Temperature
    Blynk.virtualWrite(V1, h);        // Humidity
    
    Serial.println("✅ DHT11: " + String(t, 1) + "°C, " + String(h, 1) + "%");
  } else {
    Serial.println("❌ DHT11 Error");
    Blynk.virtualWrite(V0, 0);
    Blynk.virtualWrite(V1, 0);
  }
  
  // Ultrasonic Data
  if (dist > 0 && dist <= 400) {
    // Check if lid is open
    if (dist > TRASH_BIN_HEIGHT + 2) {
      Blynk.virtualWrite(V2, 0);           // Fill Percentage
      Blynk.virtualWrite(V3, "LID OPEN");  // Trash Status
      
      Serial.println("🚨 Trash bin lid is OPEN! Distance: " + String(dist, 1) + "cm");
    } else {
      // Calculate fill percentage based on 13.5cm empty height
      float fillPercent = ((TRASH_BIN_HEIGHT - dist) / (TRASH_BIN_HEIGHT - MIN_TRASH_DISTANCE)) * 100;
      
      // Limit percentage between 0-100%
      if (fillPercent < 0) fillPercent = 0;
      if (fillPercent > 100) fillPercent = 100;
      
      Blynk.virtualWrite(V2, fillPercent);           // Fill Percentage
      Blynk.virtualWrite(V3, getTrashStatus(dist));  // Trash Status
      
      Serial.println("✅ Trash: " + String(dist, 1) + "cm (" + String(fillPercent, 0) + "% full) - " + getTrashStatus(dist));
      
      // Alert when almost full
      if (fillPercent >= 90) {
        Blynk.logEvent("trash_full", "🗑️ Trash is " + String(fillPercent, 0) + "% FULL!");
        Serial.println("🚨 ALERT: Trash bin is full!");
      }
      
      // Warning when high
      if (fillPercent >= 70 && fillPercent < 90) {
        Blynk.logEvent("trash_high", "⚠️ Trash level is getting HIGH (" + String(fillPercent, 0) + "%)");
      }
    }
    
  } else {
    Serial.println("❌ Ultrasonic Error");
    Blynk.virtualWrite(V2, 0);
    Blynk.virtualWrite(V3, "ERROR");
  }
  
  Serial.println("📊 Data sent successfully!");
}

// Blynk button to manually refresh (V4)
BLYNK_WRITE(V4) {
  int buttonState = param.asInt();
  if (buttonState == 1) {
    Serial.println("🔄 Manual refresh triggered from Blynk");
    sendSensorData();
  }
}

// Blynk slider to adjust refresh interval (V5)
BLYNK_WRITE(V5) {
  int interval = param.asInt(); // 5-60 seconds
  
  // Delete existing timer and create new one
  timer.deleteTimer(dataTimerID);
  dataTimerID = timer.setInterval(interval * 1000L, sendSensorData);
  
  Serial.println("⏱️ Refresh interval set to: " + String(interval) + " seconds");
}

void setup() {
  Serial.begin(115200);
  Serial.println("=== Smart Trash Bin (Calibrated) ===");
  Serial.println("Trash bin height: " + String(TRASH_BIN_HEIGHT) + " cm (empty)");
  Serial.println("Minimum distance: " + String(MIN_TRASH_DISTANCE) + " cm (full)");
  
  // Initialize sensors
  dht.begin();
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  Serial.println("🔧 Sensors initialized");
  
  // Connect to WiFi & Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, SSID, PASSWORD);
  
  Serial.println("📶 WiFi Connected: " + WiFi.localIP().toString());
  Serial.println("📱 Blynk Connected!");
  
  // Setup timer - send data every 10 seconds and store the timer ID
  dataTimerID = timer.setInterval(10000L, sendSensorData);
  
  // Send initial data after 3 seconds
  timer.setTimeout(3000L, sendSensorData);
  
  Serial.println("✅ Setup complete - Ready to monitor!");
  Serial.println("=====================================");
}

void loop() { 
  Blynk.run();
  timer.run();
  
  // Heartbeat every 30 seconds
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 30000) {
    lastHeartbeat = millis();
    
    if (Blynk.connected()) {
      Serial.println("💚 Blynk connection healthy");
    } else {
      Serial.println("💔 Blynk disconnected - trying to reconnect...");
    }
  }
}