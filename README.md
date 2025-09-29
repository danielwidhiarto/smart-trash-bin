# 🗑️ Smart Trash Bin (IoT Project)

This project is a **Smart Trash Bin prototype** built with **ESP32**, **DHT11**, and **HC-SR04 ultrasonic sensor**.  
It monitors the **temperature, humidity, and fill level** of a trash bin, and sends the data to a **Blynk dashboard** in real time.

---

## 🚀 Setup Instructions

### 1. Credentials Configuration
1. Copy `secrets_template.h` to `secrets.h`
2. Edit `secrets.h` with your actual credentials:
   ```cpp
   #define WIFI_SSID "your_wifi_name"
   #define WIFI_PASSWORD "your_wifi_password"
   #define BLYNK_TEMPLATE_ID "your_template_id"
   #define BLYNK_TEMPLATE_NAME "your_template_name"
   #define BLYNK_AUTH_TOKEN "your_auth_token"
   ```

### 2. Hardware Setup
- **DHT11**: Pin 4
- **HC-SR04 Trigger**: Pin 5  
- **HC-SR04 Echo**: Pin 18
- **Trash bin height**: 13.5cm (when empty)

### 3. Upload to ESP32
1. Open `code.ino` in Arduino IDE
2. Make sure `secrets.h` is properly configured
3. Upload to your ESP32

---

## ✨ Features
- Measure **temperature** and **humidity** using DHT11 sensor  
- Detect **trash fill level** using HC-SR04 ultrasonic sensor  
- Data transmission to **Blynk IoT platform** via WiFi  
- **Time-series graphs** for monitoring temperature, humidity, and fill level  
- **Status indicators**: EMPTY / LOW / MEDIUM / HIGH / FULL  
- **Alerts** when trash level is high or full  
- Adjustable **refresh interval** from Blynk (5–60 seconds)  
- Manual refresh button on Blynk app  

---

## 🛠️ Hardware Used
- ESP32 (DevKit V1)  
- DHT11 sensor (temperature & humidity)  
- HC-SR04 ultrasonic sensor (fill level)  
- Breadboard, jumper wires, power source  
- Trash bin (13.5 cm height, calibrated)  

---

## ⚙️ Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/smart-trash-bin.git
   ```
2. Open the project in **Arduino IDE** or **PlatformIO**  
3. Install required libraries:
   - `Blynk` (latest)  
   - `DHT sensor library`  
   - `Adafruit Unified Sensor` (if needed)  
4. Update the following values in `main.ino`:
   ```cpp
   #define BLYNK_TEMPLATE_ID "YOUR_TEMPLATE_ID"
   #define BLYNK_TEMPLATE_NAME "YOUR_TEMPLATE_NAME"
   #define BLYNK_AUTH_TOKEN "YOUR_BLYNK_TOKEN"
   
   const char* SSID = "YOUR_WIFI_NAME";
   const char* PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
5. Upload the code to your ESP32.  

---

## 📊 Dashboard (Blynk)
The Blynk dashboard includes:
- **Temperature Graph** (°C)  
- **Humidity Graph** (%)  
- **Fill Level Graph** (%)  
- **Status Indicator** (OK / Warning / Full)  
- **Manual Refresh Button**  
- **Interval Slider**  

*(Insert screenshot of your dashboard here)*

---

## 🚀 How it Works
1. Sensors (DHT11 & HC-SR04) collect data from the trash bin  
2. ESP32 processes the data and sends it to Blynk every 5–60 seconds  
3. Blynk dashboard displays the data as graphs and status indicators  
4. Alerts are triggered when trash level reaches high/full  

---

## 📜 License
This project is open-source and available under the MIT License.  
Feel free to use, modify, and improve it!  
