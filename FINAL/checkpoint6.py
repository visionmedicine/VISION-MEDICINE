from datetime import date
import threading
import queue
import time
import os
import requests   # buat webhook

# Turn off welcome message from pygame
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"

import speech_recognition as sr
from gtts import gTTS
from pydub import AudioSegment
from pygame import mixer

# === Webhook config ===
WEBHOOK_NORMAL = "https://7a4a8124d486.ngrok-free.app/webhook/chat-input"
WEBHOOK_REMINDER = "https://7a4a8124d486.ngrok-free.app/webhook-test/vismed-reminder"

# === Wake words & End word ===
WAKE_WORDS = ["halo vidmate", "halo vismed", "halo fismed", "halo biznet", "halo bizned"]
REMINDER_WAKE_WORD = "set reminder"
END_WORD = "thank you"

# === Vars ===
today = str(date.today())
numtts = 0
numaudio = 0

# === Initialize pygame mixer ===
mixer.pre_init(frequency=48000, buffer=2048)
mixer.init()

# === Auto detect microphone ===
print("🎙️ Deteksi Microphone:")
mic_list = sr.Microphone.list_microphone_names()
for i, name in enumerate(mic_list):
    print(f"[{i}] {name}")
MIC_DEVICE = next((i for i, n in enumerate(mic_list) if "UACDEMO" in n.upper()), 0)
print(f"✅ Pakai mic index {MIC_DEVICE}: {mic_list[MIC_DEVICE]}")

# === Logging ===
def append2log(text):
    global today
    fname = f"chatlog-{today}.txt"
    with open(fname, "a", encoding="utf-8") as f:
        f.write(text + "\n")

# === TTS ===
def tts_to_wav(text, filename):
    tts = gTTS(text, lang="id", tld="co.id")
    tts.save("temp.mp3")
    sound = AudioSegment.from_mp3("temp.mp3")
    sound = sound.set_frame_rate(48000)
    sound.export(filename, format="wav")
    os.remove("temp.mp3")

# === Play audio ===
def play_wav(filename):
    mixer.music.load(filename)
    mixer.music.play()
    while mixer.music.get_busy():
        time.sleep(0.1)
    os.remove(filename)

# === Webhook ===
def send_to_webhook(url, role, text):
    try:
        payload = {"role": role, "text": text, "timestamp": str(time.time())}
        resp = requests.post(url, json=payload, timeout=20)
        print(f"[Webhook] Sent: {payload}")
        print(f"[Webhook] Response: {resp.status_code} {resp.text}")
        if resp.status_code == 200:
            data = resp.json()
            return data.get("output") or data.get("message", "")
    except Exception as e:
        print(f"[Webhook Error] {e}")
    return ""

# === TTS + audio playback threads ===
def text2speech_play(text):
    audio_file = f"temp_audio_{int(time.time())}.wav"
    tts_to_wav(text, audio_file)
    play_wav(audio_file)

# === Main ===
def main():
    rec = sr.Recognizer()
    slang = "id-ID"
    mic = sr.Microphone(device_index=MIC_DEVICE)
    rec.dynamic_energy_threshold = False
    rec.energy_threshold = 400

    session_active = False
    current_webhook = WEBHOOK_NORMAL
    reminder_mode = False

    while True:
        with mic as source:
            rec.adjust_for_ambient_noise(source, duration=0.5)
            try:
                print("Listening ...")
                audio = rec.listen(source, timeout=10)
                text = rec.recognize_google(audio, language=slang).lower().strip()
                if not text:
                    continue

                print(f"You: {text}\n")
                append2log(f"You: {text}\n")

                # === Wake words ===
                if not session_active:
                    if any(text.startswith(w) for w in WAKE_WORDS):
                        print("[Wake Word Detected] Normal session started!")
                        session_active = True
                        current_webhook = WEBHOOK_NORMAL

                        text2speech_play("Halo, vismed di sini. Ada yang bisa dibantu?")
                        continue

                    elif text.startswith(REMINDER_WAKE_WORD):
                        print("[Wake Word Detected] Reminder session started!")
                        session_active = True
                        reminder_mode = True

                        # Immediate response
                        text2speech_play("Oke, mari kita buat pengingat.")
                        print("[Reminder Mode] Awaiting next input for reminder...")
                        continue
                    else:
                        continue

                # === Normal session end word ===
                if not reminder_mode and END_WORD in text:
                    text2speech_play("Sama sama kak")
                    session_active = False
                    current_webhook = WEBHOOK_NORMAL
                    continue

                # === Send to webhook ===
                if reminder_mode:
                    # For reminder mode, send input to reminder webhook
                    response_text = send_to_webhook(WEBHOOK_REMINDER, "User", text)
                    if response_text:
                        text2speech_play(response_text)
                    # End reminder session automatically
                    print("[Reminder session ended]")
                    session_active = False
                    reminder_mode = False
                    current_webhook = WEBHOOK_NORMAL
                    continue

                else:
                    # Normal session webhook
                    response_text = send_to_webhook(current_webhook, "User", text)
                    if response_text:
                        text2speech_play(response_text)

            except Exception as e:
                print(f"Error: {e}")
                continue

if __name__ == "__main__":
    main()
