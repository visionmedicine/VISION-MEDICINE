import os
import argparse
import torch
from speechbrain.pretrained import EncoderClassifier
import librosa
import json
import numpy as np

def extract_embedding(model, audio_path):
    # Load audio (MP3/WAV) pakai librosa dengan sampling rate 16000
    y, sr = librosa.load(audio_path, sr=16000)
    # Konversi ke tensor [channel=1, time]
    signal = torch.tensor(y).unsqueeze(0)
    with torch.no_grad():
        embedding = model.encode_batch(signal)
    return embedding.squeeze().cpu().numpy().tolist()

def main(input_dir, output_file):
    model = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb", run_opts={"device":"cpu"})

    references = {}
    for file in os.listdir(input_dir):
        if file.lower().endswith((".wav", ".mp3")):
            path = os.path.join(input_dir, file)
            embedding = extract_embedding(model, path)
            references[file] = embedding
            print(f"Processed {file}")

    with open(output_file, "w") as f:
        json.dump(references, f)
    print(f"Saved embeddings references to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate hotword reference embeddings from audio samples.")
    parser.add_argument("--input-dir", required=True, help="Directory with input audio files (.wav, .mp3)")
    parser.add_argument("--output-file", required=True, help="Output JSON file to save embeddings")

    args = parser.parse_args()
    main(args.input_dir, args.output_file)
