from flask import Flask, request, jsonify
import threading
import time

app = Flask(__name__)

# Route baru untuk chat-input
@app.route("/chat-input", methods=["POST"])
def chat_input():
    data = request.get_json()
    print("📩 Pesan masuk dari HTTP request:", data)
    # di sini bisa langsung dipanggil TTS atau logic lain
    return jsonify({"status": "ok", "received": data}), 200


def run_flask():
    """Jalankan server Flask di thread terpisah"""
    app.run(host="0.0.0.0", port=5678, debug=True, use_reloader=False)


def mic_listener():
    """Simulasi mic listener (ini bisa diganti dengan kode asli kamu)"""
    while True:
        print("🎤 listening...")
        time.sleep(3)


if __name__ == "__main__":
    # Jalankan Flask di thread terpisah
    threading.Thread(target=run_flask, daemon=True).start()

    # Jalankan mic listener di thread utama
    mic_listener()
