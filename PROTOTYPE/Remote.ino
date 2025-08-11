#include <DFRobotDFPlayerMini.h>
#include <driver/i2s.h>

// ----------- DFPlayer Mini -----------
#define REMOTE_PIN 21  // Pin sinyal dari receiver 433 MHz
HardwareSerial mySerial(2);  // Gunakan UART2
DFRobotDFPlayerMini myDFPlayer;

// ----------- Konfigurasi I2S untuk INMP441 -----------
#define I2S_WS   15
#define I2S_SCK  14
#define I2S_SD   32
#define I2S_PORT I2S_NUM_0

// ----------- Konfigurasi Buzzer & Remote -----------
#define BUZZER_PIN         23
#define BUZZER_REMOTE_PIN  27   // D1

void setupI2SMic() {
  const i2s_config_t i2s_config = {
    .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);
}

void setup() {
  Serial.begin(115200);

  // Setup mic
  setupI2SMic();
  Serial.println("Tes mic INMP441 dengan deteksi frekuensi kasar");

  // Setup DFPlayer
  pinMode(REMOTE_PIN, INPUT);
  mySerial.begin(9600, SERIAL_8N1, 16, 17);  // RX, TX
  if (!myDFPlayer.begin(mySerial)) {
    Serial.println("Gagal konek ke DFPlayer");
    while (true);
  }
  Serial.println("DFPlayer Mini siap!");
  myDFPlayer.volume(40);  // Volume maksimal

  // Setup tombol buzzer
  pinMode(BUZZER_REMOTE_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  // ----------- Deteksi suara dari INMP441 -----------
  const int samples_to_read = 1024;
  int32_t buffer[samples_to_read];
  size_t bytes_read;

  i2s_read(I2S_PORT, buffer, sizeof(buffer), &bytes_read, portMAX_DELAY);
  int samples_read = bytes_read / sizeof(int32_t);

  int zero_crossings = 0;
  for (int i = 1; i < samples_read; i++) {
    if ((buffer[i - 1] > 0 && buffer[i] < 0) || (buffer[i - 1] < 0 && buffer[i] > 0)) {
      zero_crossings++;
    }
  }

  float estimated_frequency = (zero_crossings / 2.0) * (16000.0 / samples_read);

  if (estimated_frequency > 20) {
    Serial.print("Frekuensi Deteksi: ");
    Serial.print(estimated_frequency, 1);
    Serial.println(" Hz");
  } else {
    Serial.println("0"); // Tidak ada suara
  }

  // ----------- Remote DFPlayer 433 MHz pin 21 -----------
  if (digitalRead(REMOTE_PIN) == HIGH) {
    Serial.println("Tombol remote ditekan!");
    myDFPlayer.play(1);  // Mainkan file 001.mp3
    delay(500); // Debounce
  }

  // ----------- Buzzer Tombol D1 -----------
  if (digitalRead(BUZZER_REMOTE_PIN) == HIGH) {
    Serial.println("Tombol buzzer ditekan (D1)");
    for (int i = 0; i < 2; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }
    delay(300);
  }

  delay(100); // Stabilitas loop
}