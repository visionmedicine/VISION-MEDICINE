# ===============================
# IMPORTS
# ===============================
from flask import Flask, Response, request, jsonify, abort
import cv2
from ultralytics import YOLO
import easyocr
import torch
import pandas as pd
import textdistance   # 🔄 ganti rapidfuzz dengan textdistance
from picamera2 import Picamera2
import os
from dotenv import load_dotenv
import time
import re
import threading
import requests

# Voice Assistant deps
import speech_recognition as sr
from gtts import gTTS
from pydub import AudioSegment
from pygame import mixer
import vlc
from datetime import date

# Raspberry GPIO
import RPi.GPIO as GPIO

# ===============================
# LOAD ENV + AUTO REFRESH
# ===============================
def load_env_vars():
    """Load environment variables dari .env"""
    load_dotenv(override=True)
    globals()["API_TOKEN"] = os.getenv("API_TOKEN")
    globals()["YOLO_MODEL"] = os.getenv("YOLO_MODEL")
    globals()["OBAT_CSV"] = os.getenv("OBAT_CSV")
    globals()["WEBHOOK_NORMAL"] = os.getenv("WEBHOOK_NORMAL")
    globals()["WEBHOOK_REMINDER"] = os.getenv("WEBHOOK_REMINDER")

    print("🔄 ENV Reloaded:")
    print(f"   API_TOKEN={API_TOKEN}")
    print(f"   YOLO_MODEL={YOLO_MODEL}")
    print(f"   OBAT_CSV={OBAT_CSV}")
    print(f"   WEBHOOK_NORMAL={WEBHOOK_NORMAL}")
    print(f"   WEBHOOK_REMINDER={WEBHOOK_REMINDER}")

# first load
load_env_vars()

# refresher thread
def env_refresher():
    while True:
        time.sleep(30)  # reload tiap 30 detik
        load_env_vars()

threading.Thread(target=env_refresher, daemon=True).start()

# ===============================
# YOLO MODEL
# ===============================
model = YOLO(YOLO_MODEL)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"✅ Running on: {device}")

# ===============================
# EasyOCR
# ===============================
reader = easyocr.Reader(['en'], gpu=(device == "cuda"))

# ===============================
# Daftar Obat
# ===============================
try:
    df = pd.read_csv(OBAT_CSV)
    daftar_obat = df["nama_obat"].dropna().astype(str).tolist()
    print(f"📦 Loaded {len(daftar_obat)} obat dari {OBAT_CSV}")
except Exception as e:
    print(f"⚠️ Gagal load CSV: {e}")
    daftar_obat = []

# ===============================
# Kamera
# ===============================
picam2 = Picamera2()
picam2.configure(
    picam2.create_preview_configuration(main={"format": "RGB888", "size": (640, 480)})
)
picam2.start()

# ===============================
# Voice Assistant Config
# ===============================
WAKE_WORDS = ["halo vidmate", "halo vismed", "halo fismed", "halo biznet", "halo bizned"]
REMINDER_WAKE_WORD = "set reminder"
END_WORD = "thank you"
today = str(date.today())

mixer.pre_init(frequency=48000, buffer=2048)
mixer.init()

# Auto detect mic
print("🎤 Deteksi Microphone:")
mic_list = sr.Microphone.list_microphone_names()
for i, name in enumerate(mic_list):
    print(f"[{i}] {name}")
MIC_DEVICE = next((i for i, n in enumerate(mic_list) if "UACDEMO" in n.upper()), 0)
print(f"👉 Pakai mic index {MIC_DEVICE}: {mic_list[MIC_DEVICE]}")

# ===============================
# GLOBAL FLAG
# ===============================
session_active = False
ultrasonic_active = True   # ✅ Flag global untuk ultrasonic

# ===============================
# GPIO Ultrasonic Config
# ===============================
GPIO.setmode(GPIO.BCM)
TRIG = 23
ECHO = 24
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

def get_distance():
    """Mengukur jarak dengan sensor ultrasonic HC-SR04"""
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    start_time = time.time()
    stop_time = time.time()

    while GPIO.input(ECHO) == 0:
        start_time = time.time()

    while GPIO.input(ECHO) == 1:
        stop_time = time.time()

    elapsed = stop_time - start_time
    distance = (elapsed * 34300) / 2
    return distance

last_warning_time = 0  # cooldown untuk peringatan
warning_cooldown = 3  # detik

# ===============================
# UTILS
# ===============================
def append2log(text):
    global today
    fname = f"chatlog-{today}.txt"
    with open(fname, "a", encoding="utf-8") as f:
        f.write(text + "\n")

def tts_to_wav(text, filename):
    tts = gTTS(text, lang="id", tld="co.id")
    tts.save("temp.mp3")
    sound = AudioSegment.from_mp3("temp.mp3")
    sound = sound.set_frame_rate(48000)
    sound.export(filename, format="wav")
    os.remove("temp.mp3")

def play_wav(filename):
    mixer.music.load(filename)
    mixer.music.play()
    while mixer.music.get_busy():
        time.sleep(0.1)
    os.remove(filename)

def play_music_from_url(url):
    try:
        print(f"🎶 Streaming music from: {url}")
        player = vlc.MediaPlayer(url)
        player.play()
        while player.is_playing():
            time.sleep(0.5)
    except Exception as e:
        print(f"[Music Error] {e}")

def extract_music_url(text):
    match = re.search(r"(https?://[^\s]+(?:\.mp3|\.wav))", text)
    if match:
        return match.group(1)
    return None

def send_to_webhook(url, role, text):
    try:
        payload = {"role": role, "text": text, "timestamp": str(time.time())}
        resp = requests.post(url, json=payload, timeout=20)
        print(f"[Webhook] Sent: {payload}")
        print(f"[Webhook] Response: {resp.status_code} {resp.text}")
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("output", "")
            elif isinstance(data, dict):
                return data.get("output") or data.get("message", "")
    except Exception as e:
        print(f"[Webhook Error] {e}")
    return ""

def text2speech_play(text):
    audio_file = f"temp_audio_{int(time.time())}.wav"
    tts_to_wav(text, audio_file)
    play_wav(audio_file)

# ===============================
# Play Warning dari folder sounds/
# ===============================
is_warning_playing = False

def play_warning(file_name):
    """Mainkan file mp3 untuk peringatan jarak dari folder sounds/"""
    global is_warning_playing
    if is_warning_playing:
        return
    is_warning_playing = True
    file_path = os.path.join("sounds", file_name)
    if not os.path.exists(file_path):
        print(f"[Warning File Missing] {file_path}")
        is_warning_playing = False
        return
    try:
        mixer.music.load(file_path)
        mixer.music.play()
        while mixer.music.get_busy():
            time.sleep(0.1)
    except Exception as e:
        print(f"[Play Warning Error] {e}")
    finally:
        is_warning_playing = False

def safe_play_warning(file_name):
    threading.Thread(target=play_warning, args=(file_name,), daemon=True).start()

# ===============================
# Flask App
# ===============================
app = Flask(__name__)

# Security
def require_token(func):
    def wrapper(*args, **kwargs):
        token = request.args.get("token")
        if token != API_TOKEN:
            abort(403)
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

# ===============================
# BACKGROUND CAMERA LOOP
# ===============================
frame_count = 0
last_frame = None

def camera_loop():
    global frame_count, session_active, last_warning_time, last_frame, ultrasonic_active
    while True:
        try:
            frame = picam2.capture_array()
        except Exception as e:
            print(f"⚠️ Kamera error: {e}")
            continue

        results = model(frame, imgsz=640, device=device, verbose=False)
        detected_obats = []  # kumpulin semua hasil OCR
        boxes_exist = False

        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            clss = result.boxes.cls.cpu().numpy()

            if len(boxes) > 0:
                boxes_exist = True

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

                            for obat in daftar_obat:
                                sim = textdistance.levenshtein.normalized_similarity(
                                    detected_text.lower(), obat.lower()
                                )
                                sim_score = int(sim * 100)
                                if sim_score > score:
                                    best_match, score = obat, sim_score

                            if best_match:
                                detected_obats.append((best_match, score))
                                print(f"[OCR] {detected_text} => {best_match}, {score}%")

                    except Exception as e:
                        print(f"OCR error: {e}")

                display_text = f"{label} ({conf:.2f}) - {detected_text}"
                if best_match:
                    display_text += f" -> {best_match} ({score}%)"
                if session_active:
                    display_text += " [mode voice aktif]"

                box_color = (0, 0, 255) if session_active else (0, 255, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
                cv2.putText(frame, display_text,
                            (x1, max(0, y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6, box_color, 2)

        # ✅ ultrasonic check (hanya aktif jika ultrasonic_active True)
        if ultrasonic_active and boxes_exist:
            distance = get_distance()
            print(f"📏 Jarak: {distance:.2f} cm")

            now = time.time()
            if distance > 20 and (now - last_warning_time > warning_cooldown):
                safe_play_warning("Jarak Terlalu Jauh.mp3")
                last_warning_time = now
            elif distance < 15 and (now - last_warning_time > warning_cooldown):
                safe_play_warning("Jarak Terlalu Dekat.mp3")
                last_warning_time = now

        # 🔄 ambil obat dengan rata-rata score tertinggi
        if not session_active and len(detected_obats) >= 1:
            from collections import defaultdict
            score_map = defaultdict(list)
            for obat, score in detected_obats:
                score_map[obat].append(score)

            avg_scores = {obat: sum(scores)/len(scores) for obat, scores in score_map.items()}
            best_obat, best_score = max(avg_scores.items(), key=lambda x: x[1])

            print(f"💊 Obat kandidat: {best_obat} (avg {best_score:.2f}%) dari {len(detected_obats)} deteksi")

            if best_score >= 60:
                detection_sound = "Obat Terdeteksi. Mohon Tunggu Beberapa Saat.mp3"
                if os.path.exists(os.path.join("sounds", detection_sound)):
                    safe_play_warning(detection_sound)
                else:
                    print(f"[Missing Sound] sounds/{detection_sound} tidak ditemukan.")

                time.sleep(3)
                info_text = f"Berikan Informasi Obat {best_obat}"
                response_text = send_to_webhook(WEBHOOK_NORMAL, "System", info_text)
                if response_text:
                    text2speech_play(response_text)

        frame_count += 1
        ret, buffer = cv2.imencode('.jpg', frame)
        if ret:
            last_frame = buffer.tobytes()

# ===============================
# Flask Routes
# ===============================
@app.route('/video_feed')
@require_token
def video_feed():
    def gen_frames():
        global last_frame
        while True:
            if last_frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + last_frame + b'\r\n')
            time.sleep(0.05)
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def home():
    return "📹 Raspberry Pi Camera Server jalan! Akses stream di /video_feed?token=vismed-raspberry123"

@app.route("/chat-input", methods=["POST"])
def chat_input():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "message field required"}), 400

    user_message = data["message"]
    print(f"💬 Pesan masuk dari HTTP request: {user_message}")
    text2speech_play(user_message)
    return jsonify({"status": "ok", "echo": user_message}), 200

# ===============================
# MAIN VOICE ASSISTANT LOOP
# ===============================
def main():
    global session_active, ultrasonic_active
    rec = sr.Recognizer()
    slang = "id-ID"
    mic = sr.Microphone(device_index=MIC_DEVICE)
    rec.dynamic_energy_threshold = False
    rec.energy_threshold = 400

    current_webhook = WEBHOOK_NORMAL
    reminder_mode = False

    while True:
        with mic as source:
            rec.adjust_for_ambient_noise(source, duration=0.5)
            try:
                print("🎙️ listening...")
                audio = rec.listen(source, timeout=10)
                text = rec.recognize_google(audio, language=slang).lower().strip()
                if not text:
                    continue

                print(f"You: {text}\n")
                append2log(f"You: {text}\n")

                if not session_active:
                    if any(text.startswith(w) for w in WAKE_WORDS):
                        print("[Wake Word Detected] Normal session started!")
                        session_active = True
                        ultrasonic_active = False
                        current_webhook = WEBHOOK_NORMAL
                        text2speech_play("Halo, vismed di sini. Ada yang bisa dibantu?")
                        continue
                    elif text.startswith(REMINDER_WAKE_WORD):
                        print("[Wake Word Detected] Reminder session started!")
                        session_active = True
                        ultrasonic_active = False
                        reminder_mode = True
                        text2speech_play("Oke, mari kita buat pengingat.")
                        continue
                    else:
                        continue

                if not reminder_mode and END_WORD in text:
                    text2speech_play("Sama sama kak")
                    session_active = False
                    ultrasonic_active = True
                    current_webhook = WEBHOOK_NORMAL
                    continue

                if reminder_mode:
                    response_text = send_to_webhook(WEBHOOK_REMINDER, "User", text)
                    if response_text:
                        text2speech_play(response_text)
                    print("[Reminder session ended]")
                    session_active = False
                    reminder_mode = False
                    ultrasonic_active = True
                    current_webhook = WEBHOOK_NORMAL
                    continue
                else:
                    response_text = send_to_webhook(current_webhook, "User", text)
                    if response_text:
                        music_url = extract_music_url(response_text)
                        if music_url:
                            text2speech_play("Oke kak, ini musiknya")
                            play_music_from_url(music_url)
                        else:
                            text2speech_play(response_text)

            except Exception as e:
                print(f"Error: {e}")
                continue

# ===============================
# RUN APP
# ===============================
def run_flask():
    app.run(host="0.0.0.0", port=8000, debug=False, use_reloader=False)

if __name__ == "__main__":
    try:
        safe_play_warning("Raspberry Ready.mp3")
        threading.Thread(target=camera_loop, daemon=True).start()
        threading.Thread(target=run_flask, daemon=True).start()
        main()
    finally:
        GPIO.cleanup()
