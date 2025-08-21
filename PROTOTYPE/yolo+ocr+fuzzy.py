import cv2
from ultralytics import YOLO
import easyocr
import torch
import pandas as pd
from rapidfuzz import process, fuzz
from picamera2 import Picamera2   # gunakan Picamera2

# ===============================
# 1. Load YOLOv11 Model
# ===============================
model_path = "obatt.pt"
model = YOLO(model_path)

# Cek GPU/CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Running on: {device}")

# ===============================
# 2. Load EasyOCR
# ===============================
reader = easyocr.Reader(['en'], gpu=(device == "cuda"))

# ===============================
# 3. Load Daftar Obat (Dummy CSV)
# ===============================
df = pd.read_csv("dummy_obat.csv")
daftar_obat = df["nama_obat"].tolist()
daftar_obat_lower = [o.lower() for o in daftar_obat]  # versi lowercase

# ===============================
# 4. Buka Kamera (PiCamera2)
# ===============================
picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)}))
picam2.start()

while True:
    # Ambil frame dari kamera
    frame = picam2.capture_array()

    # ===============================
    # 5. Deteksi Objek dengan YOLO
    # ===============================
    results = model(frame, imgsz=640, device=device, verbose=False)

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        clss = result.boxes.cls.cpu().numpy()

        for box, conf, cls in zip(boxes, confs, clss):
            x1, y1, x2, y2 = map(int, box)
            label = model.names[int(cls)]

            # Ambil ROI untuk OCR
            roi = frame[y1:y2, x1:x2]
            detected_text = "Tidak terbaca"
            best_match = None
            score = 0

            if roi.size > 0:
                ocr_result = reader.readtext(roi)
                if ocr_result:
                    detected_text = max(ocr_result, key=lambda x: x[2])[1]

                    # ===============================
                    # 6. Fuzzy Matching (pakai lowercase)
                    # ===============================
                    detected_text_lower = detected_text.lower()

                    match = process.extractOne(
                        detected_text_lower,
                        daftar_obat_lower,
                        scorer=fuzz.ratio
                    )

                    if match:
                        matched_text_lower, score, _ = match
                        idx = daftar_obat_lower.index(matched_text_lower)
                        best_match = daftar_obat[idx]  # ambil nama asli dari CSV
                        print(f"{detected_text} => {best_match}, {score}")

            # Gambar bounding box & teks di frame
            display_text = f"{label} ({conf:.2f}) - {detected_text}"
            if best_match:
                display_text += f" -> {best_match} ({score}%)"

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                frame,
                display_text,
                (x1, max(0, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

    # Tampilkan hasil
    cv2.imshow("Deteksi Nama Obat (YOLOv11 + EasyOCR + Fuzzy Matching)", frame)

    # Tekan 'q' untuk keluar
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()