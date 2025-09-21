#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);

String medicine = "";
String date = "";
int hour = -1;
int minute = -1;

void handleReminder() {
  if (server.method() == HTTP_POST) {
    StaticJsonDocument<200> doc;
    deserializeJson(doc, server.arg("plain"));

    medicine = doc["medicine"].as<String>();
    date = doc["date"].as<String>();
    hour = doc["hour"].as<int>();
    minute = doc["minute"].as<int>();

    Serial.println("📢 Reminder received:");
    Serial.println("Medicine: " + medicine);
    Serial.println("Date: " + date);
    Serial.printf("Time: %02d:%02d\n", hour, minute);

    server.send(200, "application/json", "{\"status\":\"ok\"}");
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/reminder", handleReminder);
  server.begin();
}

void loop() {
  server.handleClient();
  // TODO: Tambahkan buzzer/LED trigger sesuai jam
}
