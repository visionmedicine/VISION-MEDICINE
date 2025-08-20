#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DFRobotDFPlayerMini.h"
#include <HardwareSerial.h>

// ===============================
// 🔑 Konfigurasi WiFi
// ===============================
const char* WIFI_SSID = "Kos 57 Alkautsar";
const char* WIFI_PASS = "57alkautsar";

// ===============================
// 🌐 Konfigurasi Server & Token
// ===============================
String BASE_URL = "http://192.168.1.4:5000/api/bell";
String ESP32_SHARED_TOKEN = "vismed-bell";

// ===============================
// 🎵 DFPlayer Mini Setup
// ===============================
HardwareSerial mySerial(1);
DFRobotDFPlayerMini dfPlayer;

// ===============================
// ⚙️ Setup
// ===============================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // 🔌 Koneksi ke WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.print("📡 ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // 🎵 Inisialisasi DFPlayer
  mySerial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  Serial.println("🎵 Initializing DFPlayer...");
  if (!dfPlayer.begin(mySerial)) {
    Serial.println("❌ DFPlayer not found! Cek wiring & SD card!");
    while (true); // stop program
  }

  // 🎚️ Set volume maksimal (30 = max)
  dfPlayer.volume(30);
  Serial.println("✅ DFPlayer ready! Volume set to MAX (30)");
}

// ===============================
// 🔁 Main Loop
// ===============================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected! Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    delay(2000);
    return;
  }

  // 🌐 Ambil perintah dari server
  HTTPClient http;
  String url = BASE_URL + "/esp32/command?token=" + ESP32_SHARED_TOKEN;
  http.begin(url);

  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("📩 Server Response:");
    Serial.println(payload);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["ok"] == true) {
      if (!doc["command"].isNull()) {
        String cmdId = doc["command"]["id"];
        String type = doc["command"]["type"];

        Serial.println("📌 Command received: " + cmdId);
        Serial.println("🎯 Type: " + type);

        if (type == "bell") {
          Serial.println("▶️ Playing halo-vismed-disini.mp3 (track #1)");
          dfPlayer.play(2);  // Pastikan halo-vismed-disini.mp3 = track pertama (0002.mp3 atau file kedua di SD)

          // ✅ Kirim ACK balik ke server
          HTTPClient httpAck;
          String ackUrl = BASE_URL + "/esp32/ack/" + cmdId + "?token=" + ESP32_SHARED_TOKEN;
          httpAck.begin(ackUrl);
          int ackCode = httpAck.POST("");
          if (ackCode > 0) {
            Serial.println("✅ ACK sent to server.");
          } else {
            Serial.printf("❌ Failed to send ACK. Code: %d\n", ackCode);
          }
          httpAck.end();
        }
      } else {
        Serial.println("ℹ️ No pending command.");
      }
    } else {
      Serial.println("⚠️ JSON parse error / invalid payload.");
    }
  } else {
    Serial.printf("❌ HTTP GET failed, code: %d\n", httpCode);
  }

  http.end();
  delay(5000);
}
