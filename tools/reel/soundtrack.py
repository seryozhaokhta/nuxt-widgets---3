"""Temp track for a reel: a small synthesized score plus sound design placed on
the reel's cues, then muxed into the video.

    python3 tools/reel/soundtrack.py timeline     # out/reels/timeline.cues.json + timeline.silent.mp4
                                                  # → out/reels/timeline.wav and timeline.mp4

It's a placeholder to edit against: replace it with a licensed track (or the
platform's audio) before publishing. Needs numpy and scipy.
"""

import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "out" / "reels"
SR = 44100
rng = np.random.default_rng(7)


# ── Building blocks ──────────────────────────────────────────────────────────

def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def env_ad(n, attack, decay):
    """Attack (s) then exponential decay (time constant, s)."""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


def lowpass(x, freq, order=2):
    return sosfilt(butter(order, min(freq, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def highpass(x, freq, order=2):
    return sosfilt(butter(order, freq, "high", fs=SR, output="sos"), x)


def bandpass(x, low, high, order=2):
    return sosfilt(butter(order, [low, high], "band", fs=SR, output="sos"), x)


def saw(freq, t):
    phase = (freq * t) % 1.0
    return 2 * phase - 1


def noise(n):
    return rng.standard_normal(n)


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def add(buffer, signal, at, gain=1.0, pan=0.0):
    """Mixes a mono signal into a stereo buffer at time `at` (s), with constant-power pan."""
    start = int(at * SR)
    if start >= buffer.shape[1] or start + len(signal) <= 0:
        return
    if start < 0:
        signal = signal[-start:]
        start = 0
    end = min(buffer.shape[1], start + len(signal))
    signal = signal[: end - start] * gain
    angle = (pan + 1) * np.pi / 4
    buffer[0, start:end] += signal * np.cos(angle)
    buffer[1, start:end] += signal * np.sin(angle)


def reverb(stereo, seconds=2.2, mix=0.25, tone=5000):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(stereo)
    for ch in range(2):
        ir = noise(n) * np.exp(-t / (seconds / 5))
        ir = lowpass(ir, tone)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        ir /= np.sqrt(np.sum(ir**2))
        out[ch] = fftconvolve(stereo[ch], ir)[: stereo.shape[1]]
    return stereo * (1 - mix) + out * mix * 1.6


# ── Instruments ──────────────────────────────────────────────────────────────

def kick(punch=1.0, length=0.45):
    t = t_axis(length)
    freq = 45 + 110 * punch * np.exp(-t / 0.03)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t / (0.16 + 0.08 * punch))
    click = highpass(noise(len(t)), 2500) * np.exp(-t / 0.004) * 0.25 * punch
    return np.tanh((body + click) * 1.4)


def clap():
    t = t_axis(0.35)
    n = bandpass(noise(len(t)), 900, 4000)
    e = np.zeros(len(t))
    for offset in (0, 0.011, 0.022):
        e += np.exp(-np.maximum(t - offset, 0) / 0.012) * (t >= offset)
    e += 0.5 * np.exp(-t / 0.12)
    return n * e * 0.6


def hat(open_=False):
    t = t_axis(0.25 if open_ else 0.06)
    return highpass(noise(len(t)), 7000) * np.exp(-t / (0.08 if open_ else 0.012)) * 0.35


def pluck(note, length=0.35, cutoff=2400, bright=1.0):
    t = t_axis(length)
    f = midi(note)
    x = saw(f, t) + 0.6 * saw(f * 1.004, t)
    x = lowpass(x * env_ad(len(t), 0.002, length / 4), cutoff * bright)
    return x * 0.35


def bass(note, length, drive=1.0):
    t = t_axis(length)
    f = midi(note)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * drive
    e = env_ad(len(t), 0.005, length * 0.6)
    e *= np.clip((length - t) / 0.02, 0, 1)
    return np.tanh(x * e * 1.5 * drive) * 0.5


def pad(notes, length, cutoff=1400, attack=0.8):
    t = t_axis(length)
    x = np.zeros(len(t))
    for i, note in enumerate(notes):
        f = midi(note)
        for detune in (-0.12, 0.0, 0.13):
            x += saw(f * 2 ** (detune / 12), t + i * 0.37)
    x = lowpass(x / (len(notes) * 3), cutoff, order=2)
    e = np.clip(t / attack, 0, 1) * np.clip((length - t) / 0.9, 0, 1)
    return x * e * 0.5


def bell(note, length=2.8, gain=1.0):
    """Two-operator FM bell."""
    t = t_axis(length)
    f = midi(note)
    index = 2.4 * np.exp(-t / 0.5)
    x = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * 3.5 * t))
    x += 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.3)
    return x * env_ad(len(t), 0.003, length / 3.5) * 0.3 * gain


# ── Sound design on cues ─────────────────────────────────────────────────────

def sfx(kind, note, scale):
    if kind == "hit":
        t = t_axis(1.6)
        freq = 38 + 120 * np.exp(-t / 0.05)
        boom = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.45)
        crack = bandpass(noise(len(t)), 1500, 9000) * np.exp(-t / 0.05) * 0.35
        air = lowpass(noise(len(t)), 3000) * np.exp(-t / 0.5) * 0.12
        return np.tanh((boom + crack + air) * 1.2) * 0.9
    if kind == "thud":
        t = t_axis(0.7)
        freq = 42 + 60 * np.exp(-t / 0.04)
        return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.18) * 0.7
    if kind == "tick":
        # A detent of a dial: a dry click, barely pitched.
        t = t_axis(0.025)
        x = bandpass(noise(len(t)), 1800, 7000) * np.exp(-t / 0.0018)
        x += np.sin(2 * np.pi * float(rng.uniform(1500, 2100)) * t) * np.exp(-t / 0.0012) * 0.3
        return x * 0.3
    if kind == "tap":
        t = t_axis(0.12)
        freq = 520 + 900 * np.exp(-t / 0.006)
        x = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.025)
        return x * 0.45
    if kind == "whoosh":
        length = 0.9
        n = int(length * SR)
        t = np.arange(n) / SR
        src = noise(n)
        # Band sweeps up then down, done in short blocks.
        out = np.zeros(n)
        block = 1024
        for start in range(0, n, block):
            p = start / n
            center = 300 + 3200 * np.sin(np.pi * p) ** 2
            seg = bandpass(src[max(0, start - 2048) : start + block], center * 0.6, min(center * 1.6, 18000))
            out[start : start + block] = seg[-min(block, n - start) :]
        return out * np.sin(np.pi * t / length) ** 2 * 0.45
    if kind == "rise":
        length = max(0.4, note or 0.8)
        t = t_axis(length)
        p = t / length
        x = bandpass(noise(len(t)), 800, 9000) * p**2 * 0.35
        x += np.sin(2 * np.pi * np.cumsum(200 + 900 * p**2) / SR) * p**3 * 0.12
        return x
    if kind == "swell":
        length = 2.4
        t = t_axis(length)
        e = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 2
        x = lowpass(noise(len(t)), 900) * 0.12
        x += pad(scale[:3], length, cutoff=900, attack=0.6)[: len(t)] * 0.6
        return x * e
    if kind == "chime":
        degree = int(note or 0)
        return bell(scale[degree % len(scale)] + 12 * (degree // len(scale)) + 12, 3.0)
    raise ValueError(kind)


# ── Scores ───────────────────────────────────────────────────────────────────

def score_pulse(mix, duration, bpm, cues):
    """Documentary pulse in A minor: arpeggio, pad, soft kick from bar 2."""
    beat = 60 / bpm
    bar = beat * 4
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    roots = [45, 41, 36, 43]
    end_hit = next((c["at"] for c in cues if c["kind"] == "hit" and c["at"] > duration * 0.7), duration)
    rise = next((c["at"] for c in cues if c["kind"] == "rise" and c["at"] > duration * 0.7), end_hit)
    bars = int(np.ceil(duration / bar))
    for b in range(bars):
        at = b * bar
        if at >= rise:
            break
        chord, root = chords[b % 4], roots[b % 4]
        add(mix, pad(chord, bar + 0.6, cutoff=1100 + 300 * (b % 2)), at, 0.55)
        for step in range(16):
            s_at = at + step * beat / 4
            if s_at >= rise:
                break
            note = chord[(step * 2 + step // 4) % 3] + 12 * (step % 8 >= 6)
            add(mix, pluck(note, 0.28, cutoff=1600 + 900 * (step % 4 == 0)), s_at, 0.5, pan=0.35 * np.sin(step))
        for k in range(4):
            k_at = at + k * beat
            if k_at >= rise:
                break
            if b >= 1:
                add(mix, kick(0.7), k_at, 0.55)
                add(mix, bass(root, beat * 0.9, 0.8), k_at, 0.45)
            if b >= 2:
                add(mix, hat(), k_at + beat / 2, 0.5, pan=0.3)
    # Final chord after the last hit.
    if end_hit < duration:
        add(mix, pad([57, 60, 64, 71], duration - end_hit + 0.5, cutoff=1800, attack=0.05), end_hit, 0.7)
        add(mix, bass(33, duration - end_hit, 0.6), end_hit, 0.5)


def score_drive(mix, duration, bpm, cues):
    """Club-tight 120 bpm in D minor: four-on-the-floor, claps, offbeat bass."""
    beat = 60 / bpm
    bar = beat * 4
    chords = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]]  # Dm Bb F C
    roots = [38, 34, 41, 36]
    stop = duration - 2.6
    for b in range(int(np.ceil(duration / bar))):
        at = b * bar
        chord, root = chords[b % 4], roots[b % 4]
        if at < stop:
            add(mix, pad(chord, bar, cutoff=900, attack=0.05), at, 0.35)
        for k in range(4):
            k_at = at + k * beat
            if k_at >= stop:
                break
            add(mix, kick(1.0), k_at, 0.8)
            if k % 2 == 1:
                add(mix, clap(), k_at, 0.55, pan=-0.1)
            add(mix, bass(root, beat * 0.4, 1.2), k_at + beat / 2, 0.55)
            for h in range(4):
                add(mix, hat(open_=(h == 2)), k_at + h * beat / 4, 0.35 if h != 2 else 0.25, pan=0.25 * (-1) ** h)
    add(mix, pad([62, 65, 69, 72], 3.0, cutoff=1600, attack=0.02), stop + 0.5, 0.6)
    add(mix, bass(26, 2.5, 0.8), stop + 0.5, 0.6)


def score_ambient(mix, duration, bpm, cues):
    """Slow pads in C: Cmaj7 Am9 Fmaj7 G6, two bars each; a low drone."""
    beat = 60 / bpm
    span = beat * 8
    chords = [[48, 55, 59, 64], [45, 52, 59, 60, 64], [41, 48, 52, 57, 64], [43, 50, 55, 59, 64]]
    for i in range(int(np.ceil(duration / span)) + 1):
        at = i * span - 0.6
        add(mix, pad(chords[i % 4], span + 1.6, cutoff=1300, attack=1.6), at, 0.75, pan=0.15 * (-1) ** i)
    t = t_axis(duration)
    drone = np.sin(2 * np.pi * midi(36) * t) * 0.18 + np.sin(2 * np.pi * midi(43) * t) * 0.06
    drone *= np.clip(t / 3, 0, 1) * np.clip((duration - t) / 2, 0, 1)
    add(mix, drone, 0, 0.8)
    for k in range(int(duration / beat)):
        if k % 4 == 0 and 4 < k * beat < duration - 4:
            add(mix, kick(0.25, 0.6), k * beat, 0.25)


SCORES = {"pulse": score_pulse, "drive": score_drive, "ambient": score_ambient}
SCALES = {
    "pulse": [69, 72, 74, 76, 79],  # A minor pentatonic
    "drive": [62, 65, 67, 69, 72],
    "ambient": [60, 62, 64, 67, 69],
}


def render(variant):
    info = json.loads((OUT / f"{variant}.cues.json").read_text())
    duration = float(info["duration"])
    mood = info["mood"]
    total = duration + 0.3
    music = np.zeros((2, int(total * SR)))
    design = np.zeros_like(music)
    SCORES[mood](music, duration, float(info["bpm"]), info["sounds"])
    scale = SCALES[mood]
    for cue in info["sounds"]:
        kind = cue["kind"]
        signal = sfx(kind, cue.get("note"), scale)
        # A rise starts at its cue and runs `note` seconds into the next hit.
        at = cue["at"]
        pan = 0.0 if kind in ("hit", "thud", "rise", "swell") else float(rng.uniform(-0.3, 0.3))
        add(design, signal, at, cue.get("gain", 1.0), pan)

    space = {"pulse": (1.8, 0.2), "drive": (1.0, 0.12), "ambient": (3.5, 0.4)}[mood]
    mixdown = reverb(music * 0.8, *space) + reverb(design, space[0] * 0.8, space[1] * 0.8)
    mixdown = highpass(mixdown, 28)
    # Fades and level: peak at about -1 dBFS with a soft knee.
    fade_in = np.clip(np.arange(mixdown.shape[1]) / (0.02 * SR), 0, 1)
    fade_out = np.clip((total - np.arange(mixdown.shape[1]) / SR) / 1.2, 0, 1)
    mixdown *= fade_in * fade_out
    mixdown /= np.max(np.abs(mixdown)) + 1e-9
    mixdown = np.tanh(mixdown * 1.3) / np.tanh(1.3) * 0.89

    path = OUT / f"{variant}.wav"
    with wave.open(str(path), "wb") as file:
        file.setnchannels(2)
        file.setsampwidth(2)
        file.setframerate(SR)
        file.writeframes((mixdown.T * 32767).astype(np.int16).tobytes())
    print("wrote", path)

    silent = OUT / f"{variant}.silent.mp4"
    if silent.exists():
        final = OUT / f"{variant}.mp4"
        # Kept under ~26 MB so it can be sent in a message; grain eats bits, so the cap matters.
        video_kbps = int(min(12000, 26 * 8 * 1024 / total - 300))
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(path),
            # The master is near-lossless; this is a size people can send around.
            "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
            "-maxrate", f"{video_kbps}k", "-bufsize", f"{video_kbps * 2}k", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest", "-movflags", "+faststart", str(final),
        ], check=True)
        print("wrote", final)


if __name__ == "__main__":
    for name in sys.argv[1:] or ["timeline", "kinetic", "wall"]:
        render(name)
