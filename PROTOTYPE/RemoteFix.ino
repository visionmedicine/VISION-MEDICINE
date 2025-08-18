#include <DFRobotDFPlayerMini.h>

// ----------- Konfigurasi Pin ----------- 
#define REMOTE_VT_PIN   13   // Pin VT dari modul remote
#define BUZZER_PIN      15   // Pin buzzer

// DFPlayer pakai UART2 (pin RX = 16, TX = 17 di ESP32)
HardwareSerial mySerial(2);
DFRobotDFPlayerMini myDFPlayer;

bool sound1Played = false;  // supaya Sound 1 hanya main sekali saat boot

void setup() {
  Serial.begin(115200);

  // Setup DFPlayer
  mySerial.begin(9600, SERIAL_8N1, 16, 17);  
  if (!myDFPlayer.begin(mySerial)) {
    Serial.println("Gagal konek DFPlayer, cek wiring & SD card!");
    while (true);
  }
  Serial.println("DFPlayer siap!");
  myDFPlayer.volume(40);  // Set volume 0-30 (maksimal 40)

  // Setup tombol & buzzer
  pinMode(REMOTE_VT_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // --- Mainkan Sound 1 saat ESP32 nyala ---
  myDFPlayer.play(1);  // Play file 001.mp3
  sound1Played = true;
  Serial.println("Sound 1 dimainkan (saat power ON)");
}

void loop() {
  // --- Remote VT ditekan ---
  if (digitalRead(REMOTE_VT_PIN) == HIGH) {
    Serial.println("Remote VT ditekan -> Buzzer + Sound 2");

    // Buzzer bunyi dulu
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);

    // Baru mainkan Sound 2
    myDFPlayer.play(2);  // Play file 002.mp3
    delay(500); // biar gak kepencet terus
  }

  delay(50);
}