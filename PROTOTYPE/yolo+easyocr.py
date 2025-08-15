import cv2
from picamera2 import Picamera2
from ultralytics import YOLO
import easyocr
import torch
import time
import threading

# ===============================
# 0. Setup EasyOCR
# ===============================
reader = easyocr.Reader(['en', 'id'], gpu=torch.cuda.is_available())

# ===============================
# 1. Load Model YOLOv11
# ===============================
model_path = "yolov11.pt"  # Ganti dengan model kamu
model = YOLO(model_path)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Running on: {device}")

# ===============================
# 2. Setup PiCamera2 (Resolusi Tinggi)
# ===============================
picam2 = Picamera2()
picam2.preview_configuration.main.size = (640, 480)  # Naikkan resolusi
picam2.preview_configuration.main.format = "RGB888"
picam2.preview_configuration.align()
picam2.configure("preview")
picam2.start()

# ===============================
# 3. Variabel global untuk OCR
# ===============================
ocr_result_text = ""
ocr_lock = threading.Lock()

# ===============================
# 4. Fungsi OCR di Thread Terpisah
# ===============================
def run_ocr(roi):
    global ocr_result_text
    if roi.size > 0:
        roi_resized = cv2.resize(roi, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        result = reader.readtext(roi_resized, detail=0)
        with ocr_lock:
            ocr_result_text = " ".join(result) if result else "Tidak terbaca"

# ===============================
# 5. Main Loop
# ===============================
prev_time = time.time()
frame_count = 0
fps = 0
last_ocr_time = 0
ocr_interval_sec = 0.5  # OCR tiap 0.5 detik

while True:
    frame = picam2.capture_array()

    # YOLO detection
    results = model(frame, imgsz=320, conf=0.4, device=device, verbose=False)  # imgsz disesuaikan

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        clss = result.boxes.cls.cpu().numpy()

        for box, conf, cls in zip(boxes, confs, clss):
            x1, y1, x2, y2 = map(int, box)
            label = model.names[int(cls)]

            # Jalankan OCR tiap interval
            if time.time() - last_ocr_time >= ocr_interval_sec:
                roi = frame[y1:y2, x1:x2]
                threading.Thread(target=run_ocr, args=(roi,)).start()
                last_ocr_time = time.time()

            with ocr_lock:
                display_text = ocr_result_text

            # Gambar kotak dan teks
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} ({conf:.2f}) - {display_text}",
                        (x1, max(0, y1 - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

    # Hitung FPS
    frame_count += 1
    if time.time() - prev_time >= 1.0:
        fps = frame_count / (time.time() - prev_time)
        prev_time = time.time()
        frame_count = 0

    # Tampilkan FPS
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Tampilkan frame di VNC
    cv2.imshow("YOLOv11 + EasyOCR (640x480)", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cv2.destroyAllWindows()