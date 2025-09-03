from flask import Flask, Response, request, abort
import cv2
from ultralytics import YOLO
import easyocr
import torch
import pandas as pd
from rapidfuzz import process, fuzz
from picamera2 import Picamera2
import os
from dotenv import load_dotenv

# ===============================
# 0. Load .env
# ===============================
load_dotenv()

API_TOKEN = os.getenv("API_TOKEN", "vismed-raspberry123")
YOLO_MODEL = os.getenv("YOLO_MODEL", "obatt.pt")
OBAT_CSV = os.getenv("OBAT_CSV", "dummy_obat.csv")

# ===============================
# 1. Load YOLO Model
# ===============================
model = YOLO(YOLO_MODEL)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Running on: {device}")

# ===============================
# 2. EasyOCR
# ===============================
reader = easyocr.Reader(['en'], gpu=(device == "cuda"))

# ===============================
# 3. Load Daftar Obat
# ===============================
try:
    df = pd.read_csv(OBAT_CSV)
    daftar_obat = df["nama_obat"].dropna().astype(str).tolist()
    print(f"✅ Loaded {len(daftar_obat)} obat dari {OBAT_CSV}")
except Exception as e:
    print(f"❌ Gagal load CSV: {e}")
    daftar_obat = []

# ===============================
# 4. Kamera (Picamera2)
# ===============================
picam2 = Picamera2()
picam2.configure(
    picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)})
)
picam2.start()

# Flask App
app = Flask(__name__)

# ===============================
# 5. Security: API Token
# ===============================
def require_token(func):
    def wrapper(*args, **kwargs):
        token = request.args.get("token")
        if token != API_TOKEN:
            abort(403)  # Forbidden
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

# ===============================
# 6. Streaming + YOLO + OCR
# ===============================
frame_count = 0

def gen_frames():
    global frame_count
    while True:
        try:
            frame = picam2.capture_array()
        except Exception as e:
            print(f"❌ Kamera error: {e}")
            continue

        results = model(frame, imgsz=640, device=device, verbose=False)

        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            clss = result.boxes.cls.cpu().numpy()

            for box, conf, cls in zip(boxes, confs, clss):
                x1, y1, x2, y2 = map(int, box)
                label = model.names[int(cls)]

                detected_text = "Tidak terbaca"
                best_match, score = None, 0

                if frame_count % 10 == 0 and (y2 > y1 and x2 > x1):
                    roi = frame[y1:y2, x1:x2]
                    try:
                        ocr_result = reader.readtext(roi)
                        if ocr_result:
                            detected_text = max(ocr_result, key=lambda x: x[2])[1]
                            match = process.extractOne(
                                detected_text.lower(),
                                daftar_obat,
                                scorer=fuzz.ratio,
                            )
                            if match:
                                best_match, score, _ = match
                                print(f"{detected_text} => {best_match}, {score}")
                    except Exception as e:
                        print(f"OCR error: {e}")

                display_text = f"{label} ({conf:.2f}) - {detected_text}"
                if best_match:
                    display_text += f" -> {best_match} ({score}%)"

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    frame, display_text,
                    (x1, max(0, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, (0, 255, 0), 2
                )

        frame_count += 1
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

# ===============================
# 7. Flask Routes
# ===============================
@app.route('/video_feed')
@require_token
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def home():
    return "✅ Raspberry Pi Camera Server jalan! Akses stream di /video_feed?token=vismed-raspberry123"

# ===============================
# 8. Run Flask
# ===============================
if __name__ == "__main__":
    # Run on Raspberry Pi's IP, port 8000
    app.run(host="0.0.0.0", port=8000, debug=True)