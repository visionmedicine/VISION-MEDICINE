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
String BASE_URL = "http://192.168.1.4:5000/api/bell";
String ESP32_SHARED_TOKEN = "vismed-bell";

// ===============================
// 🎵 DFPlayer Mini Setup (UART2 RX=16, TX=17)
// ===============================
HardwareSerial mySerial(2);  
DFRobotDFPlayerMini dfPlayer;

// ===============================
// 📌 Konfigurasi Pin
// ===============================
#define REMOTE_VT_PIN   13   // Pin VT dari modul remote
#define BUZZER_PIN      15   // Pin buzzer

bool sound1Played = false;  

// timer variabel
unsigned long lastBuzzTime = 0;
unsigned long lastServerCheck = 0;
bool buzzerActive = false;
int buzzerState = 0;

// ===============================
// ⚙ Setup
// ===============================
void setup() {
  Serial.begin(115200);

  // --- WiFi ---
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🔌 Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(100); // sekali aja di awal biar konek
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
  Serial.print("📡 ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // --- DFPlayer ---
  mySerial.begin(9600, SERIAL_8N1, 16, 17);  
  Serial.println("🎵 Initializing DFPlayer...");
  if (!dfPlayer.begin(mySerial)) {
    Serial.println("❌ DFPlayer not found! Cek wiring & SD card!");
    while (true);
  }
  dfPlayer.volume(40);  // 0-30
  Serial.println("✅ DFPlayer ready!");

  // --- Pin setup ---
  pinMode(REMOTE_VT_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // --- Mainkan Sound 1 saat ESP32 nyala ---
  dfPlayer.play(1);  // file 0001.mp3
  sound1Played = true;
  Serial.println("▶ Sound 1 dimainkan (saat power ON)");
}

// ===============================
// 🔁 Fungsi Buzzer tanpa delay
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
// 🔁 Fungsi Remote
// ===============================
void handleRemote() {
  if (digitalRead(REMOTE_VT_PIN) == HIGH && !buzzerActive) {
    Serial.println("📲 Remote VT ditekan -> Buzzer + Sound 2");
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerActive = true;
    lastBuzzTime = millis();
    dfPlayer.play(2);  // file 0002.mp3
  }
}

// ===============================
// 🔁 Fungsi Server
// ===============================
void handleServer() {
  unsigned long now = millis();
  if (now - lastServerCheck < 5000) return; // cek setiap 5 detik
  lastServerCheck = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    return;
  }

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
          Serial.println("▶ Playing halo-vismed-disini.mp3 (track #2)");
          dfPlayer.play(2);  // file 0002.mp3

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
        Serial.println("ℹ No pending command.");
      }
    } else {
      Serial.println("⚠ JSON parse error / invalid payload.");
    }
  } else {
    Serial.printf("❌ HTTP GET failed, code: %d\n", httpCode);
  }

  http.end();
}

// ===============================
// 🔁 Main Loop
// ===============================
void loop() {
  handleRemote();
  handleBuzzer();
  handleServer();
}