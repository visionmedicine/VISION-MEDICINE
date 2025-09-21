#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hotword + ElevenLabs Conversational AI
Mode: One-Shot → 1 Wakeword = 1 Question = 1 Answer → End Session
"""

import os
import time
import io
import queue
import threading
import numpy as np
import sounddevice as sd
from eff_word_net.streams import SimpleMicStream
from eff_word_net.engine import HotwordDetector
from eff_word_net.audio_processing import Resnet50_Arc_loss

from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import (
    Conversation,
    ConversationInitiationData,
)
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface

from pydub import AudioSegment
from dotenv import load_dotenv

# =========================================================
# ====== LOAD ENV FILE ====================================
# =========================================================
load_dotenv()

api_key = os.getenv("ELEVENLABS_API_KEY")
agent_id = os.getenv("ELEVENLABS_AGENT_ID")

if not api_key or not agent_id:
    raise ValueError("⚠️ API Key atau Agent ID belum diset di file .env")

# =========================================================
# ====== GLOBAL STATE =====================================
# =========================================================
convai_active = False
agent_speaking = False
last_agent_response = ""
conversation_done = False     # trigger end setelah agent jawab sekali
first_response_done = False   # pastikan agent cuma jawab sekali

# =========================================================
# ====== ELEVEN SETUP =====================================
# =========================================================
elevenlabs = ElevenLabs(api_key=api_key)

config = ConversationInitiationData(
    dynamic_variables={
        "user_name": "Kak",
        "greeting": "Halo",
    }
)

# Hotword detector
base_model = Resnet50_Arc_loss()
eleven_hw = HotwordDetector(
    hotword="hey_eleven",
    model=base_model,
    reference_file=os.path.join("hotword_refs", "hey_eleven_ref.json"),
    threshold=0.7,
    relaxation_time=2,
)

# =========================================================
# ====== CUSTOM AUDIO INTERFACE ===========================
# =========================================================
class ControlledAudioInterface(DefaultAudioInterface):
    def __init__(self):
        super().__init__()
        self.audio_queue = queue.Queue()
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def play_audio(self, audio_bytes: bytes):
        self.audio_queue.put(audio_bytes)

    def _worker(self):
        global agent_speaking, conversation_done
        while True:
            audio_bytes = self.audio_queue.get()
            if audio_bytes is None:
                break
            try:
                agent_speaking = True
                print("[DEBUG] Agent mulai bicara...")

                segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
                normalized = segment.apply_gain(-segment.max_dBFS)
                louder_segment = normalized + 12

                samples = np.array(louder_segment.get_array_of_samples()).astype(np.float32)
                samples /= np.iinfo(louder_segment.array_type).max
                if louder_segment.channels == 2:
                    samples = samples.reshape((-1, 2))

                sd.play(samples, samplerate=louder_segment.frame_rate)
                sd.wait()

            except Exception as e:
                print(f"[Audio ERROR] {e}")
            finally:
                agent_speaking = False
                conversation_done = True   # mark selesai setelah agent jawab
                print("[DEBUG] Agent selesai bicara")

# =========================================================
# ====== CALLBACKS ========================================
# =========================================================
def safe_agent_response(response: str):
    global last_agent_response, first_response_done, conversation_done
    if first_response_done:
        print("[DEBUG] Respon tambahan diabaikan (one-shot mode).")
        return
    if response.strip() and response.strip() != last_agent_response.strip():
        print(f"[Agent Txt] {response}")
        last_agent_response = response.strip()
        first_response_done = True
        conversation_done = True  # langsung tandai selesai
    else:
        print("[DEBUG] Duplikat respon di-skip")

def safe_user_transcript(transcript: str):
    print(f"[User Txt] {transcript}")

# =========================================================
# ====== CONVERSATION CREATOR =============================
# =========================================================
def create_conversation():
    conv = Conversation(
        elevenlabs,
        agent_id,
        config=config,
        requires_auth=bool(api_key),
        audio_interface=ControlledAudioInterface(),
        callback_agent_response=safe_agent_response,
        callback_agent_response_correction=lambda o, c: None,
        callback_user_transcript=safe_user_transcript,
    )
    try:
        conv.config.max_output_tokens = 512
    except Exception:
        pass
    return conv

# =========================================================
# ====== MIC STREAM HANDLING ==============================
# =========================================================
def start_mic_stream():
    global mic_stream
    try:
        mic_stream = SimpleMicStream(
            window_length_secs=1.5,
            sliding_window_secs=0.75,
        )
        mic_stream.start_stream()
        print("🎙️ Microphone stream started")
    except Exception as e:
        print(f"Error starting microphone stream: {e}")
        mic_stream = None
        time.sleep(1)

def stop_mic_stream():
    global mic_stream
    try:
        if mic_stream:
            mic_stream = None
            print("🛑 Microphone stream stopped")
    except Exception as e:
        print(f"Error stopping microphone stream: {e}")

# =========================================================
# ====== MAIN LOOP ========================================
# =========================================================
mic_stream = None
start_mic_stream()

print("Say 'Hey Eleven' to wake the agent...")

while True:
    if not convai_active:
        try:
            if mic_stream is None:
                start_mic_stream()
                continue

            frame = mic_stream.getFrame()
            result = eleven_hw.scoreFrame(frame)
            if result and result["match"]:
                print("✅ Wakeword uttered!", result["confidence"])

                stop_mic_stream()
                convai_active = True
                print("🚀 Start ConvAI Session")

                try:
                    # Reset state untuk sesi baru
                    conversation_done = False
                    first_response_done = False

                    conversation = create_conversation()
                    conversation.start_session()

                    # Tunggu sampai agent selesai jawab sekali
                    while not conversation_done:
                        time.sleep(0.5)

                    # End session setelah jawaban pertama selesai
                    conversation.end_session()
                    print("✅ One-shot Q&A selesai, sesi ditutup.")

                except Exception as e:
                    print(f"Error during conversation: {e}")
                finally:
                    convai_active = False
                    print("🧹 Conversation ended, back to standby...")
                    time.sleep(1)  # ✅ kasih jeda 1 detik sebelum standby lagi
                    start_mic_stream()
                    print("✨ Ready for next wake word...")

        except Exception as e:
            print(f"Error in wake word detection: {e}")
            mic_stream = None
            time.sleep(1)
            start_mic_stream()
