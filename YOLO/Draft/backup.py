# Google Gemini-Powered Voice Assistant
# Tested and working on Raspberry Pi 4
# By TechMakerAI on YouTube
# Modified: Added dB boost to audio output

from datetime import date
from io import BytesIO
import threading
import queue
import time
import os

# turn off the welcome message from pygame package
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"

import google.generativeai as genai
from gtts import gTTS
from gpiozero import LED

from pygame import mixer
import speech_recognition as sr

from pydub import AudioSegment  # For dB boost

# =============================
# SETTINGS
# =============================
VOLUME = 1.0   # pygame mixer volume (0.0 - 1.0, tapi kita boost pakai dB di pydub)
BOOST_DB = 8   # dB boost (positif = lebih keras)

# Using Raspberry Pi's GPIO pins for LEDs
gled = LED(24)
rled = LED(25)

mixer.pre_init(frequency=24000, buffer=2048)
mixer.init()
mixer.music.set_volume(VOLUME)

# add your Google Gemini API key here
my_api_key = "AIzaSyBgzzr2_rUez3Y8yhTfRUypkcQNw4LczeM"

if len(my_api_key) < 5:
    print(f"Please add your Google Gemini API key in the program. \n ")
    quit()

# set Google Gemini API key
genai.configure(api_key=my_api_key)

# model of Google Gemini API
model = genai.GenerativeModel(
    'models/gemini-1.5-flash-latest',
    generation_config=genai.types.GenerationConfig(
        candidate_count=1,
        top_p=0.95,
        top_k=64,
        max_output_tokens=60,
        temperature=0.9,
    )
)

# start the chat model
chat = model.start_chat(history=[])

today = str(date.today())

# Initialize counters
numtext = 0
numtts = 0
numaudio = 0

# =============================
# THREAD 1: LLM RESPONSE HANDLER
# =============================
def chatfun(request, text_queue, llm_done, stop_event):
    global numtext, chat

    response = chat.send_message(request, stream=True)

    shortstring = ''
    ctext = ''

    for chunk in response:
        try:
            if chunk.candidates[0].content.parts:
                ctext = chunk.candidates[0].content.parts[0].text
                ctext = ctext.replace("*", "")

                if len(shortstring) > 10 or len(ctext) > 10:
                    shortstring = "".join([shortstring, ctext])
                    text_queue.put(shortstring)
                    print(shortstring, end='')
                    shortstring = ''
                    ctext = ''
                    numtext += 1
                else:
                    shortstring = "".join([shortstring, ctext])
                    ctext = ''

        except Exception:
            continue

    if len(ctext) > 0:
        shortstring = "".join([shortstring, ctext])

    if len(shortstring) > 0:
        print(shortstring, end='')
        text_queue.put(shortstring)
        numtext += 1

    if numtext > 0:
        append2log(f"AI: {response.candidates[0].content.parts[0].text} \n")
    else:
        llm_done.set()
        stop_event.set()

    llm_done.set()

# =============================
# TEXT TO SPEECH AND PLAYBACK
# =============================
def boost_audio_bytesio(mp3_bytesio):
    """Boost audio in BytesIO by BOOST_DB and return new BytesIO"""
    mp3_bytesio.seek(0)
    audio = AudioSegment.from_file(mp3_bytesio, format="mp3")
    boosted = audio + BOOST_DB
    out_bytesio = BytesIO()
    boosted.export(out_bytesio, format="mp3")
    out_bytesio.seek(0)
    return out_bytesio

def speak_text(text):
    global slang, rled
    mp3file = BytesIO()
    tts = gTTS(text, lang='id', tld='co.id')
    tts.write_to_fp(mp3file)

    mp3file = boost_audio_bytesio(mp3file)  # Apply dB boost

    rled.on()
    print("AI: ", text)

    try:
        mixer.music.load(mp3file, "mp3")
        mixer.music.set_volume(VOLUME)
        mixer.music.play()

        while mixer.music.get_busy():
            time.sleep(0.2)

    except KeyboardInterrupt:
        mixer.music.stop()
        mp3file = None
        rled.off()

    mp3file = None
    rled.off()

def text2speech(text_queue, tts_done, llm_done, audio_queue, stop_event):
    global numtext, numtts
    time.sleep(1.0)

    while not stop_event.is_set():
        if not text_queue.empty():
            text = text_queue.get(timeout=1)
            if len(text) > 0:
                try:
                    mp3file1 = BytesIO()
                    tts = gTTS(text, lang='id', tld='co.id')
                    tts.write_to_fp(mp3file1)

                    mp3file1 = boost_audio_bytesio(mp3file1)  # Apply dB boost

                except Exception:
                    continue

                audio_queue.put(mp3file1)
                numtts += 1
                text_queue.task_done()

        if llm_done.is_set() and numtts == numtext:
            tts_done.set()
            mp3file1 = None
            break

def play_audio(audio_queue, tts_done, stop_event):
    global numtts, numaudio, rled
    while not stop_event.is_set():
        mp3audio1 = audio_queue.get()
        mp3audio1.seek(0)
        rled.on()

        mixer.music.load(mp3audio1, "mp3")
        mixer.music.set_volume(VOLUME)
        mixer.music.play()

        while mixer.music.get_busy():
            time.sleep(0.2)

        numaudio += 1
        audio_queue.task_done()
        rled.off()

        if tts_done.is_set() and numtts == numaudio:
            mp3audio1 = None
            break

# =============================
# UTILS
# =============================
def append2log(text):
    global today
    fname = 'chatlog-' + today + '.txt'
    with open(fname, "a", encoding='utf-8') as f:
        f.write(text + "\n")

# =============================
# MAIN
# =============================
slang = "id-ID"

def main():
    global today, slang, numtext, numtts, numaudio, messages, rled, gled
    rec = sr.Recognizer()
    mic = sr.Microphone()
    rec.dynamic_energy_threshold = False
    rec.energy_threshold = 400

    sleeping = True
    while True:
        with mic as source:
            rec.adjust_for_ambient_noise(source, duration=0.5)
            try:
                gled.on()
                print("Listening ...")
                audio = rec.listen(source, timeout=10)
                text = rec.recognize_google(audio, language=slang)
                if len(text) > 0:
                    print(f"You: {text}\n ")
                else:
                    continue

                gled.off()

                if sleeping:
                    if "vidmate" in text.lower():
                        request = text.lower().split("vidmate")[1]
                        sleeping = False
                        chat = model.start_chat(history=[])
                        append2log(f"_" * 40)
                        today = str(date.today())
                        messages = []

                        if len(request) < 2:
                            speak_text("Hallo, ada yang bisa vismed bantu?")
                            continue
                    else:
                        continue
                else:
                    request = text.lower()
                    if "that's all" in request:
                        append2log(f"You: {request}\n")
                        speak_text("Bye now")
                        append2log(f"AI: Bye now. \n")
                        sleeping = True
                        continue
                    if "vidmate" in request:
                        request = request.split("vidmate")[1]

                if len(request) == 0:
                    continue

                append2log(f"You: {request}\n ")
                numtext = 0
                numtts = 0
                numaudio = 0

                text_queue = queue.Queue()
                audio_queue = queue.Queue()

                llm_done = threading.Event()
                tts_done = threading.Event()
                stop_event = threading.Event()

                llm_thread = threading.Thread(target=chatfun, args=(request, text_queue, llm_done, stop_event,))
                tts_thread = threading.Thread(target=text2speech, args=(text_queue, tts_done, llm_done, audio_queue, stop_event,))
                play_thread = threading.Thread(target=play_audio, args=(audio_queue, tts_done, stop_event,))

                llm_thread.start()
                tts_thread.start()
                play_thread.start()

                llm_done.wait()
                llm_thread.join()
                tts_done.wait()
                audio_queue.join()

                stop_event.set()
                tts_thread.join()
                play_thread.join()

                print('\n')

            except Exception:
                continue

if __name__ == "__main__":
    main()
