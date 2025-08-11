import cv2
from ultralytics import YOLO

# Cek apakah kamera bisa diakses
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1280)

if not cap.isOpened():
    print("❌ Kamera tidak terdeteksi. Pastikan rpicam driver aktif dan /dev/video0 ada.")
    exit()

# Load YOLOv8 NCNN model
model = YOLO("obat_ncnn_model")  # pastikan path model benar

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Gagal mengambil frame dari kamera.")
        break

    # Jalankan YOLO pada frame
    results = model(frame)

    # Annotasi hasil deteksi
    annotated_frame = results[0].plot()

    # Hitung FPS dari waktu inference
    inference_time = results[0].speed["inference"]  # dalam ms
    fps = 1000 / inference_time if inference_time > 0 else 0
    text = f"FPS: {fps:.1f}"

    # Tambahkan teks FPS di kanan atas
    font = cv2.FONT_HERSHEY_SIMPLEX
    text_size = cv2.getTextSize(text, font, 1, 2)[0]
    text_x = annotated_frame.shape[1] - text_size[0] - 10
    text_y = text_size[1] + 10
    cv2.putText(annotated_frame, text, (text_x, text_y), font, 1, (255, 255, 255), 2, cv2.LINE_AA)

    # Tampilkan hasil di jendela
    cv2.imshow("Camera", annotated_frame)

    # Tekan "q" untuk keluar
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
