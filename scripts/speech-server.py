"""Loopback whisper.cpp adapter. No transcript/audio logging or retention."""
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODEL = Path(os.environ.get('PIP_WHISPER_MODEL', str(Path.home() / '.local/share/pip-tools/models/ggml-base.en.bin')))
BINARY = os.environ.get('PIP_WHISPER_CLI', 'whisper-cli')
DEVICE = os.environ.get('WHISPER_DEVICE', 'auto')
WARM = False
CPU_FALLBACK = DEVICE == 'cpu'
LAST_DEVICE = 'Not tested'
LOCK = threading.Lock()
ENGINE = os.environ.get('PIP_SPEECH_ENGINE', 'whisper.cpp')
FASTER_MODEL_PATH = os.environ.get('PIP_FASTER_WHISPER_MODEL', '')
FASTER_MODEL = None

def speech_available():
    return Path(FASTER_MODEL_PATH, 'model.bin').is_file() if ENGINE == 'faster-whisper' else bool(MODEL.is_file() and shutil.which(BINARY))

def transcribe(audio, timeout=7):
    global CPU_FALLBACK, LAST_DEVICE, WARM, FASTER_MODEL
    if ENGINE == 'faster-whisper':
        from faster_whisper import WhisperModel
        import numpy as np
        if FASTER_MODEL is None:
            FASTER_MODEL = WhisperModel(FASTER_MODEL_PATH, device='cpu', compute_type='int8', cpu_threads=6, local_files_only=True)
        with wave.open(io.BytesIO(audio)) as wav:
            samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        segments, _ = FASTER_MODEL.transcribe(samples, language='en', beam_size=3, condition_on_previous_text=False, vad_filter=True)
        text = ' '.join(segment.text.strip() for segment in segments).strip()[:800]
        LAST_DEVICE = 'CPU / int8'
        WARM = True
        return text
    with tempfile.TemporaryDirectory(prefix='pip-voice-') as folder:
        source = Path(folder) / 'idea.wav'
        source.write_bytes(audio)
        output = Path(folder) / 'transcript'
        args = [BINARY, '-m', str(MODEL), '-f', str(source), '-l', 'en', '-otxt', '-of', str(output), '-nt']
        if CPU_FALLBACK:
            args.append('-ng')
        try:
            result = subprocess.run(args, check=True, capture_output=True, timeout=timeout)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            if CPU_FALLBACK:
                raise
            CPU_FALLBACK = True
            result = subprocess.run(args + ['-ng'], check=True, capture_output=True, timeout=timeout)
        diagnostics = result.stderr.decode(errors='replace').lower()
        LAST_DEVICE = 'CPU' if CPU_FALLBACK else 'Metal backend' if 'metal' in diagnostics else 'CUDA backend' if 'cuda' in diagnostics else 'CPU / automatic backend'
        WARM = True
        return output.with_suffix('.txt').read_text().strip()[:800]

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def reply(self, status, body):
        content = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        try:
            self.wfile.write(content)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        self.reply(200 if self.path == '/health' else 404, {'available': speech_available(), 'engine': ENGINE, 'model': Path(FASTER_MODEL_PATH).name if ENGINE == 'faster-whisper' else MODEL.name, 'device': LAST_DEVICE, 'warm': WARM})

    def do_POST(self):
        if self.path not in ['/transcribe', '/warmup'] or self.headers.get('Origin'):
            return self.reply(403, {'error': 'not_allowed'})
        if not LOCK.acquire(blocking=False):
            return self.reply(503, {'error': 'voice_busy'})
        try:
            if self.path == '/warmup':
                if not WARM:
                    data = io.BytesIO()
                    with wave.open(data, 'wb') as wav:
                        wav.setnchannels(1)
                        wav.setsampwidth(2)
                        wav.setframerate(16000)
                        wav.writeframes(bytes(16000))
                    transcribe(data.getvalue(), timeout=12)
                return self.reply(200, {'available': True, 'warm': WARM, 'device': LAST_DEVICE})
            size = int(self.headers.get('Content-Length', '0'))
            if size < 44 or size > 1000000:
                raise ValueError('audio size')
            audio = self.rfile.read(size)
            with wave.open(io.BytesIO(audio)) as wav:
                if wav.getnchannels() != 1 or wav.getsampwidth() != 2 or wav.getframerate() != 16000 or wav.getnframes() > 31 * 16000:
                    raise ValueError('unsupported PCM')
            self.reply(200, {'text': transcribe(audio)})
        except Exception:
            self.reply(503, {'error': 'voice_unavailable'})
        finally:
            LOCK.release()

if __name__ == '__main__':
    print('Pip local speech: http://127.0.0.1:8178 (temporary audio deleted)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8178), Handler).serve_forever()
