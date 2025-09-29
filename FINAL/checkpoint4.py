from datetime import date
import threading
import queue
import time
import os
import requests   # buat webhook

# turn off the welcome message from pygame package
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"

import sounddevice as sd
import soundfile as sf
import speech_recognition as sr
from gtts import gTTS
from pydub import AudioSegment   

# === Webhook config ===
WEBHOOK_URL = "https://7a4a8124d486.ngrok-free.app/webhook/chat-input"

# === Wake words & End word ===
WAKE_WORDS = ["halo vidmate", "halo vismed", "halo fismed", "halo biznet", "halo bizned"]
END_WORD = "thank you"

# === Vars ===
today = str(date.today())
numtts = 0
numaudio = 0

# === Auto detect device ===
print("?? Deteksi Microphone:")
mic_list = sr.Microphone.list_microphone_names()
for i, name in enumerate(mic_list):
    print(f"[{i}] {name}")
MIC_DEVICE = next((i for i, n in enumerate(mic_list) if "USB" in n.upper()), 0)
print(f"? Pakai mic index {MIC_DEVICE}: {mic_list[MIC_DEVICE]}")

print("\n?? Deteksi Speaker:")
devices = sd.query_devices()
for i, dev in enumerate(devices):
    if dev['max_output_channels'] > 0:
        print(f"[{i}] {dev['name']}")
SPK_DEVICE = next((i for i, d in enumerate(devices) if "USB" in d['name'].upper() and d['max_output_channels'] > 0), sd.default.device[1])
print(f"? Pakai speaker index {SPK_DEVICE}: {devices[SPK_DEVICE]['name']}")

# === save conversation to log ===
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
    sound.export(filename, format="wav")
    os.remove("temp.mp3")

# === Play audio ===
def play_wav(filename):
    data, samplerate = sf.read(filename, dtype="float32")
    sd.play(data, samplerate, device=SPK_DEVICE)
    sd.wait()
    os.remove(filename)

# === Webhook ===
def process_webhook_response(resp, text_queue=None):
    try:
        data = resp.json()
        if "output" in data:
            webhook_text = data["output"]
            print(f"[Webhook Parsed Output] {webhook_text}")
            append2log(f"AI (webhook): {webhook_text}\n")
            if text_queue is not None:
                text_queue.put(webhook_text.strip())
    except Exception as e:
        print(f"[Webhook Parse Error] {e}")

def send_to_webhook(role, text, text_queue=None):
    try:
        payload = {"role": role, "text": text, "timestamp": str(time.time())}
        resp = requests.post(WEBHOOK_URL, json=payload, timeout=20)
        print(f"[Webhook] Sent ? {payload}")
        print(f"[Webhook] Response: {resp.status_code} {resp.text}")

        if resp.status_code == 200:
            process_webhook_response(resp, text_queue)
    except Exception as e:
        print(f"[Webhook Error] {e}")

# === TTS thread ===
def text2speech(text_queue, tts_done, audio_queue, stop_event):
    global numtts
    while not stop_event.is_set():
        if not text_queue.empty():
            text = text_queue.get(timeout=1).strip()
            if len(text) > 0:
                try:
                    audio_file = f"temp_audio_{int(time.time())}.wav"
                    tts_to_wav(text, audio_file)
                    audio_queue.put(audio_file)
                    numtts += 1
                    text_queue.task_done()
                except Exception as e:
                    print(f"Error in text-to-speech: {e}")
                    continue
            else:
                text_queue.task_done()
        if tts_done.is_set():
            break

# === Audio playback thread ===
def play_audio(audio_queue, tts_done, stop_event):
    global numaudio
    while not stop_event.is_set():
        audio_file = audio_queue.get()
        try:
            play_wav(audio_file)
            numaudio += 1
            audio_queue.task_done()
        except Exception as e:
            print(f"Error during audio playback: {e}")
        if tts_done.is_set() and numtts == numaudio:
            break

# === MAIN ===
def main():
    global today, numtts, numaudio
    rec = sr.Recognizer()
    slang = "id-ID"
    mic = sr.Microphone(device_index=MIC_DEVICE)
    rec.dynamic_energy_threshold = False
    rec.energy_threshold = 400

    session_active = False

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

                # === Cek wake word ===
                if not session_active:
                    if any(text.startswith(w) for w in WAKE_WORDS):
                        print("[Wake Word Detected] Session started!")
                        session_active = True

                        # === Callback suara wake word ===
                        cb_file = f"callback_wake_{int(time.time())}.wav"
                        tts_to_wav("Halo, vismed di sini. Ada yang bisa dibantu?", cb_file)
                        play_wav(cb_file)

                        continue
                    else:
                        continue

                # === End word ===
                if END_WORD in text:
                    print("[End Word Detected] Session ended.")

                    # === Callback suara end word ===
                    cb_file = f"callback_end_{int(time.time())}.wav"
                    tts_to_wav("Sama sama kak", cb_file)
                    play_wav(cb_file)

                    session_active = False
                    continue

                # === Queue untuk respon dari webhook ===
                text_queue = queue.Queue()
                audio_queue = queue.Queue()
                tts_done = threading.Event()
                stop_event = threading.Event()

                # Kirim user input ke webhook
                send_to_webhook("User", text, text_queue)
                append2log(f"You: {text}\n")

                # Jalanin thread TTS + Audio
                tts_thread = threading.Thread(target=text2speech, args=(text_queue, tts_done, audio_queue, stop_event))
                play_thread = threading.Thread(target=play_audio, args=(audio_queue, tts_done, stop_event))

                tts_thread.start()
                play_thread.start()

                text_queue.join()
                tts_done.set()
                audio_queue.join()
                stop_event.set()
                tts_thread.join()
                play_thread.join()
                print("\n")

            except Exception as e:
                print(f"Error: {e}")
                continue


if __name__ == "__main__":
    main()