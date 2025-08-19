import cv2
from picamera2 import Picamera2
from ultralytics import YOLO
import easyocr
import torch

# ===============================
# 0. Setup EasyOCR & YOLO
# ===============================
reader = easyocr.Reader(['en', 'id'], gpu=False)   # GPU off di Raspberry Pi
model = YOLO("obat.pt")  # gunakan model YOLO kecil
DEVICE = "cpu"

# ===============================
# 1. Setup Kamera
# ===============================
picam2 = Picamera2()

# Turunkan resolusi supaya Raspberry Pi kuat
config = picam2.create_video_configuration(
    main={"size": (960, 540), "format": "RGB888"},
    buffer_count=3
)
picam2.configure(config)
picam2.start()

print("[INFO] Mulai deteksi... tekan 'q' untuk keluar.")

# ===============================
# 2. Loop Capture
# ===============================
while True:
    frame = picam2.capture_array()

    # Jalankan YOLO (pakai input kecil biar enteng)
    results = model(frame, imgsz=416, conf=0.4, device=DEVICE, verbose=False)

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            conf = float(box.conf[0])
            cls = int(box.cls[0])

            if conf > 0.5:  # threshold confidence
                roi = frame[y1:y2, x1:x2]
                if roi.size > 0:
                    ocr_results = reader.readtext(roi)
                    for (bbox, text, prob) in ocr_results:
                        # === Ubah hasil OCR jadi lowercase ===
                        text_lower = text.lower()
                        cv2.putText(frame, text_lower, (x1, y1 - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    # Tampilkan hasil
    cv2.imshow("YOLO + OCR", frame)

    # Tombol keluar
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

picam2.stop()
cv2.destroyAllWindows()