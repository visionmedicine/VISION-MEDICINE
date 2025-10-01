#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DFRobotDFPlayerMini.h>
#include <HardwareSerial.h>

// ===============================
// 🔑 Konfigurasi WiFi
// ===============================
const char* WIFI_SSID = "Kos 57 Alkautsar";
const char* WIFI_PASS = "57alkautsar";

// ===============================
// 🌐 Konfigurasi Server & Token
// ===============================
String BELL_URL = "http://192.168.1.8:5000/api/bell";   // Bell command
String MAPS_URL = "http://192.168.1.8:5000/api/maps";  // GPS upload
String ESP32_SHARED_TOKEN = "vismed-esp32";

// ===============================
// 🎵 DFPlayer Mini Setup (UART2)
// ===============================
HardwareSerial dfSerial(2);  // UART2 untuk DFPlayer
DFRobotDFPlayerMini dfPlayer;

// ===============================
// 📌 Pin
// ===============================
#define REMOTE_VT_PIN   13
#define BUZZER_PIN      15

bool sound1Played = false;
unsigned long lastBuzzTime = 0;
unsigned long lastServerCheck = 0;
bool buzzerActive = false;
int buzzerState = 0;

// ===============================
// 📡 GPS Setup (UART1)
// ===============================
TinyGPSPlus gps;
HardwareSerial gpsSerial(1);  // UART1 untuk GPS
#define GPS_RX 32
#define GPS_TX 34
unsigned long lastGPSUpload = 0;

// ===============================
// ⚙ Setup
// ===============================
void setup() {
  Serial.begin(115200);

  // --- WiFi ---
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.print("📡 ESP32 IP Address: "); Serial.println(WiFi.localIP());

  // --- DFPlayer ---
  dfSerial.begin(9600, SERIAL_8N1, 16, 17);  
  Serial.println("🎵 Initializing DFPlayer...");
  if (!dfPlayer.begin(dfSerial)) {
    Serial.println("❌ DFPlayer not found! Cek wiring & SD card!");
    while (true);
  }
  dfPlayer.volume(40);
  Serial.println("✅ DFPlayer ready!");
  dfPlayer.play(1);  // Sound 1 saat startup
  sound1Played = true;

  // --- Pins ---
  pinMode(REMOTE_VT_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // --- GPS ---
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("⏳ Waiting for GPS fix and satellites...");
}

// ===============================
// 🔁 Fungsi Buzzer
// ===============================
void handleBuzzer() {
  if (buzzerActive) {
    unsigned long now = millis();
    if (buzzerState == 0 && now - lastBuzzTime >= 200) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerState = 1;
      lastBuzzTime = now;
    } 
    else if (buzzerState == 1 && now - lastBuzzTime >= 200) {
      buzzerActive = false;
      buzzerState = 0;
      Serial.println("🔔 Buzzer selesai");
    }
  }
}

// ===============================
// 🔁 Remote
// ===============================
void handleRemote() {
  if (digitalRead(REMOTE_VT_PIN) == HIGH && !buzzerActive) {
    Serial.println("📲 Remote VT ditekan -> Buzzer + Sound 2");
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerActive = true;
    lastBuzzTime = millis();
    dfPlayer.play(2);
  }
}

// ===============================
// 🔁 Server Bell
// ===============================
void handleServer() {
  unsigned long now = millis();
  if (now - lastServerCheck < 5000) return;
  lastServerCheck = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    return;
  }

  HTTPClient http;
  String url = BELL_URL + "/esp32/command?token=" + ESP32_SHARED_TOKEN;
  http.begin(url);

  int httpCode = http.GET();
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("📩 Server Response:"); Serial.println(payload);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error && doc["ok"] == true && !doc["command"].isNull()) {
      String cmdId = doc["command"]["id"];
      String type = doc["command"]["type"];
      Serial.println("📌 Command received: " + cmdId + " / Type: " + type);

      if (type == "bell") {
        Serial.println("▶ Playing Sound 2");
        dfPlayer.play(2);  // Sound 2

        // Kirim ACK
        HTTPClient httpAck;
        String ackUrl = BELL_URL + "/esp32/ack/" + cmdId + "?token=" + ESP32_SHARED_TOKEN;
        httpAck.begin(ackUrl);
        int ackCode = httpAck.POST("");
        if (ackCode > 0) Serial.println("✅ ACK sent");
        else Serial.printf("❌ Failed ACK. Code %d\n", ackCode);
        httpAck.end();
      }
    }
  } else {
    Serial.printf("❌ HTTP GET failed, code: %d\n", httpCode);
  }
  http.end();
}

// ===============================
// 🔁 GPS Upload
// ===============================
void readGPS() {
  while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());

  if (gps.location.isUpdated() && millis() - lastGPSUpload > 10000) {
    lastGPSUpload = millis();
    Serial.println(F("🌍 GPS Data Updated:"));
    Serial.print("Lat: "); Serial.print(gps.location.lat(),6);
    Serial.print(" / Lng: "); Serial.println(gps.location.lng(),6);
    Serial.print("Satellites: "); Serial.println(gps.satellites.value());

    // Upload to server
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String gpsUrl = MAPS_URL + "/update?token=" + ESP32_SHARED_TOKEN;
      http.begin(gpsUrl);
      http.addHeader("Content-Type","application/json");

      StaticJsonDocument<256> doc;
      doc["lat"] = gps.location.lat();
      doc["lng"] = gps.location.lng();
      doc["sat"] = gps.satellites.value();

      String payload;
      serializeJson(doc,payload);
      int code = http.POST(payload);
      if (code > 0) Serial.printf("✅ GPS uploaded (code %d)\n", code);
      else Serial.println("❌ GPS upload failed");

      http.end();
    }
  }
}

// ===============================
// 🔁 Main Loop
// ===============================
void loop() {
  handleRemote();
  handleBuzzer();
  handleServer();
  readGPS();
}