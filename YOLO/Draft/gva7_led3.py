from datetime import date
from io import BytesIO
import threading
import queue
import time
import os
import requests
import sounddevice as sd
import soundfile as sf   # menggantikan wavio

# turn off the welcome message from pygame package
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"

import google.generativeai as genai
from gtts import gTTS
from gpiozero import LED
from pygame import mixer

# =====================
# KONFIGURASI API KEY
# =====================
# Lebih aman kalau set via environment variables. Jika tidak, masukkan langsung.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyB96Iyqu3P0Ht5RRg9GIpKHcSFPD_6Wn-M")
PROSA_API_KEY = os.getenv("PROSA_API_KEY", "eyJhbGciOiJSUzI1NiIsImtpZCI6Ik5XSTBNemRsTXprdE5tSmtNaTAwTTJZMkxXSTNaamN0T1dVMU5URmxObVF4Wm1KaSIsInR5cCI6IkpXVCJ9.eyJhcHBsaWNhdGlvbl9pZCI6NDQxODk4LCJsaWNlbnNlX2tleSI6IjdmMjcwYmFmLWVjYTgtNDIwNC04MTc5LWFhZWJiYWQzZWI2ZCIsInVuaXF1ZV9rZXkiOiJhNDJjZWJjYS04YTYwLTRlMGMtODBkMi01ZTg1MzIwNTgwMzciLCJwcm9kdWN0X2lkIjo1LCJhdWQiOiJhcGktc2VydmljZSIsInN1YiI6ImY3ZTI1YzUzLWNmOTYtNDc5Ny1hODEyLTVkOTMzMWRmNjlmYyIsImlzcyI6ImNvbnNvbGUiLCJpYXQiOjE3NTMwMDcyMDd9.FydNT6RS4yWzFDjEagyhMRfzbQnqLFpX9FrV2I0iiNAYUjC4nW-QbpBtIMxcCbq_iF1b6lmc0xKCkfvSAom7073Kw2LtUwvb7i0jx1fyV9B-nzoqomQGYAJznfrffs1aed-FgCB4UzZ3sv3LXu1ux1c0Ddfww_l1IdfqOUYNjKPKe_TA2_z2QkS8zXmK7MPr4chSXiJSDPBKIVd2ocj4f_GDYKn5OjuQrCIUc5XJVFzkqLdYkKdo7qUTgWbT-7vROMTu9IMidzzeuSBbi5L_EpUvys84r2vTdKSDJ2NT_QF4G_CRNU2iJ5NShdMLYozuHNKqj5YL9xu5ALeDjetOwQ")

# =====================
# KONFIGURASI GPIO
# =====================
gled = LED(24)
rled = LED(25)

mixer.pre_init(frequency=24000, buffer=2048)
mixer.init()

# Set API Key Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Model Gemini (sama seperti kode awal)
model = genai.GenerativeModel('models/gemini-1.5-flash-latest',
    generation_config=genai.GenerationConfig(
        candidate_count=1,
        top_p = 0.95,
        top_k = 64,
        max_output_tokens=120,   # sedikit diperbesar
        temperature = 0.9,
    ))

chat = model.start_chat(history=[])

today = str(date.today())

numtext = 0
numtts = 0
numaudio = 0
slang = "id-ID"

# =====================
# FUNGSI PROSA.AI STT
# =====================
def prosa_speech_to_text(wav_path, timeout=20):
    """
    Kirim audio WAV ke Prosa.ai STT menggunakan token JWT.
    Mengembalikan string transkrip atau "" jika gagal.
    """
    url = "https://api.prosa.ai/v2/speech-to-text"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {PROSA_API_KEY}"
    }

    # Pastikan file exist
    if not os.path.exists(wav_path):
        print("File audio tidak ditemukan:", wav_path)
        return ""

    files = {"file": open(wav_path, "rb")}

    try:
        resp = requests.post(url, headers=headers, files=files, timeout=timeout)
    except requests.exceptions.Timeout:
        print("Error STT Prosa: request timeout")
        return ""
    except Exception as e:
        print("Error STT Prosa (request exception):", str(e))
        return ""
    finally:
        files["file"].close()

    # Debug: status code dan respons text ringkas
    if resp.status_code != 200:
        print(f"Error STT Prosa: status {resp.status_code} -> {resp.text}")
        return ""

    try:
        data = resp.json()
    except ValueError:
        print("Error STT Prosa: response bukan JSON ->", resp.text)
        return ""

    # Prosa mungkin mengembalikan field 'text' atau struktur lain.
    # Coba ambil 'text' atau 'transcript' atau gabungkan kandidat jika ada.
    text = ""
    if isinstance(data, dict):
        # cek kemungkinan key
        if "text" in data and data["text"]:
            text = data["text"].strip()
        elif "transcript" in data and data["transcript"]:
            text = data["transcript"].strip()
        elif "results" in data and isinstance(data["results"], list):
            # gabungkan hasil jika struktur array
            parts = []
            for r in data["results"]:
                if isinstance(r, dict):
                    if "text" in r:
                        parts.append(r["text"])
                    elif "alternatives" in r and isinstance(r["alternatives"], list):
                        a0 = r["alternatives"][0]
                        if isinstance(a0, dict) and "text" in a0:
                            parts.append(a0["text"])
            text = " ".join(parts).strip()
        else:
            # fallback: coba cari value string pertama
            for v in data.values():
                if isinstance(v, str) and len(v) > 0:
                    text = v.strip()
                    break

    if not text:
        print("STT Prosa sukses (200) tapi tidak menemukan text pada response:", data)
        return ""

    return text

# =====================
# RECORD AUDIO MIC (menggunakan soundfile)
# =====================
def record_audio(filename="temp.wav", duration=4, fs=16000):
    """
    Rekam dari mic dengan sounddevice, simpan ke WAV via soundfile (sf.write)
    duration dalam detik, fs sampling rate
    """
    try:
        print("🎙️ Mulai merekam... (durasi:", duration, "detik)")
        audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
        sd.wait()
        # soundfile expects float or int arrays; kita simpan langsung int16
        sf.write(filename, audio, fs, subtype='PCM_16')
        print("✅ Rekaman selesai:", filename)
    except Exception as e:
        print("Gagal rekam audio:", str(e))

# =====================
# SIMPAN LOG
# =====================
def append2log(text):
    global today
    fname = 'chatlog-' + today + '.txt'
    with open(fname, "a", encoding='utf-8') as f:
        f.write(text + "\n")

# =====================
# GEMINI CHAT FUN (streaming)
# =====================
def chatfun(request, text_queue, llm_done, stop_event):
    global numtext, chat
    try:
        response = chat.send_message(request, stream=True)
    except Exception as e:
        print("Error memanggil Gemini:", str(e))
        llm_done.set()
        stop_event.set()
        return

    shortstring = ''
    ctext = ''
    try:
        for chunk in response:
            try:
                if chunk.candidates and chunk.candidates[0].content.parts:
                    ctext = chunk.candidates[0].content.parts[0].text
                    ctext = ctext.replace("*", "")
                    if len(shortstring) > 10 or len(ctext) > 10:
                        shortstring += ctext
                        text_queue.put(shortstring)
                        print(shortstring, end='')
                        shortstring = ''
                        ctext = ''
                        numtext += 1
                    else:
                        shortstring += ctext
                        ctext = ''
            except Exception:
                continue
    except Exception as e:
        print("Error streaming dari Gemini:", str(e))

    if len(ctext) > 0:
        shortstring += ctext
    if len(shortstring) > 0:
        print(shortstring, end='')
        text_queue.put(shortstring)
        numtext += 1
    if numtext > 0:
        try:
            append2log(f"AI: {response.candidates[0].content.parts[0].text } \n")
        except Exception:
            pass
    else:
        llm_done.set()
        stop_event.set()
    llm_done.set()

# =====================
# TEXT TO SPEECH
# =====================
def speak_text(text):
    mp3file = BytesIO()
    try:
        tts = gTTS(text, lang='id', tld='co.id')
        tts.write_to_fp(mp3file)
    except Exception as e:
        print("Gagal membuat TTS:", str(e))
        return
    mp3file.seek(0)
    rled.on()
    print("\nAI:", text)
    try:
        mixer.music.load(mp3file, "mp3")
        mixer.music.play()
        while mixer.music.get_busy():
            time.sleep(0.2)
    except Exception as e:
        print("Error playback TTS:", str(e))
    rled.off()

# =====================
# MAIN LOOP
# =====================
def main():
    global numtext, numtts, numaudio, chat
    sleeping = True
    print("=== Voice Assistant (Gemini + Prosa.ai STT) ===")
    print("Wake word:", "'vidmate' (ucapkan saat ingin mulai berbicara)")
    while True:
        try:
            # LED indikator listening
            gled.on()
            # rekam (atur durasi sesuai kebutuhan)
            record_audio("temp.wav", duration=4, fs=16000)
            gled.off()

            # kirim ke Prosa.ai
            text = prosa_speech_to_text("temp.wav")
            if not text:
                # tidak dapat transkrip, ulangi loop
                continue

            print(f"You: {text}")

            # wake/sleep logic
            if sleeping:
                if "vidmate" in text.lower():
                    # user mengaktifkan assistant
                    request = text.lower().split("vidmate", 1)[1].strip()
                    sleeping = False
                    chat = model.start_chat(history=[])
                    append2log("_" * 40)
                    if not request:
                        speak_text("Halo, ada yang bisa vismed bantu?")
                        continue
                else:
                    # belum sebut wake word -> abaikan
                    continue
            else:
                request = text.lower()
                if "that's all" in request or "selesai" in request or "dadah" in request:
                    append2log(f"You: {request}")
                    speak_text("Bye now")
                    sleeping = True
                    continue
                if "vidmate" in request:
                    request = request.split("vidmate", 1)[1].strip()

            if not request:
                continue

            append2log(f"You: {request}")
            # reset counters
            numtext = numtts = numaudio = 0
            text_queue = queue.Queue()
            audio_queue = queue.Queue()
            llm_done = threading.Event()
            tts_done = threading.Event()
            stop_event = threading.Event()

            # start Gemini thread (streaming)
            llm_thread = threading.Thread(target=chatfun, args=(request, text_queue, llm_done, stop_event,))
            llm_thread.start()

            # tunggu selesai streaming
            llm_done.wait()
            llm_thread.join()

            # main: keluarkan semua potongan teks yang ada
            while not text_queue.empty():
                speak_text(text_queue.get())

            print("\n--- end response ---\n")

        except KeyboardInterrupt:
            print("Interrupted by user, exiting...")
            break
        except Exception as e:
            print("Main loop error:", str(e))
            # loop terus untuk robustness
            continue

if __name__ == "__main__":
    # cek apakah token di-set
    if "ISI_API_KEY_GEMINI_DISINI" in GEMINI_API_KEY or GEMINI_API_KEY == "":
        print("Warning: GEMINI_API_KEY belum diset. Silakan set environment variable GEMINI_API_KEY atau masukkan di kode.")
    if "ISI_PROSA_JWT_TOKEN_DISINI" in PROSA_API_KEY or PROSA_API_KEY == "":
        print("Warning: PROSA_API_KEY belum diset. Silakan set environment variable PROSA_API_KEY atau masukkan di kode.")
    main()
