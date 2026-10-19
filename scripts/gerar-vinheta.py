"""Generate the original SOMA vocal sting with Windows speech and NumPy (build tools only)."""
from pathlib import Path
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.expo' / 'audio-fonte'
OUTPUT = ROOT / 'assets' / 'audio' / 'soma-vinheta.wav'
SOURCE.mkdir(parents=True, exist_ok=True)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

if not (SOURCE / 'soma-daniel.wav').exists() or not (SOURCE / 'ma-daniel.wav').exists():
    destination = str(SOURCE).replace("'", "''")
    subprocess.run(['powershell.exe', '-NoProfile', '-Command', f"""
Add-Type -AssemblyName System.Speech
$somaVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$somaVoice.SelectVoice('Microsoft Daniel')
$somaVoice.Rate = 1
$somaVoice.SetOutputToWaveFile('{destination}\\soma-daniel.wav')
$somaVoice.Speak('Soma!')
$somaVoice.SetOutputToNull()
$somaVoice.SetOutputToWaveFile('{destination}\\ma-daniel.wav')
$somaVoice.Speak('Má!')
$somaVoice.Dispose()
"""], check=True)

def read(name):
    with wave.open(str(SOURCE / name), 'rb') as source:
        assert source.getsampwidth() == 2 and source.getnchannels() == 1
        return np.frombuffer(source.readframes(source.getnframes()), dtype='<i2').astype(float) / 32768, source.getframerate()

word, sample_rate = read('soma-daniel.wav')
vowel, vowel_rate = read('ma-daniel.wav')
assert sample_rate == vowel_rate == 22050

# A pitch-synchronous grain from the open /a/, rather than repeating syllables.
center = int(.19 * sample_rate)
frame = vowel[center - 512:center + 512]
frame -= np.mean(frame)
correlation = np.correlate(frame, frame, mode='full')[len(frame) - 1:]
minimum, maximum = int(sample_rate / 240), int(sample_rate / 80)
period = minimum + np.argmax(correlation[minimum:maximum])
center += int(np.argmax(vowel[center - period // 2:center + period // 2])) - period // 2
grain = vowel[center - period:center + period].copy()
grain -= np.mean(grain)
window = np.hanning(len(grain))
grain *= window

def sustained(frequency, duration, detune):
    result = np.zeros(int(duration * sample_rate) + 2 * period)
    weights = np.zeros_like(result)
    position = float(period)
    while position + period < len(result):
        start = int(round(position)) - period
        result[start:start + len(grain)] += grain
        weights[start:start + len(grain)] += window
        time = position / sample_rate
        vibrato = 1 + .006 * np.sin(2 * np.pi * 5.1 * time + detune)
        position += sample_rate / (frequency * vibrato)
    result = result[period:period + int(duration * sample_rate)] / np.maximum(weights[period:period + int(duration * sample_rate)], .4)
    result /= max(np.sqrt(np.mean(result ** 2)), .001)
    return result

prefix = word[int(.085 * sample_rate):int(.48 * sample_rate)].copy()
prefix[:int(.008 * sample_rate)] *= np.linspace(0, 1, int(.008 * sample_rate))
crossfade = int(.06 * sample_rate)
length = len(prefix) + int(1.1 * sample_rate) - crossfade
mix = np.zeros((length + int(.3 * sample_rate), 2))
for voice, (frequency, gain, pan) in enumerate([(220, 1, -.25), (277.1826, .52, .65), (329.6276, .4, -.65)]):
    # A small timing difference makes a chorus of distinct, original synthetic layers.
    detune = 1 + (voice - 1) * .008
    lead = np.interp(np.arange(len(prefix)) * detune, np.arange(len(prefix)), prefix)
    long_a = sustained(frequency, 1.1, voice) * .085
    long_a *= np.linspace(1.02, .84, len(long_a))
    long_a[-int(.15 * sample_rate):] *= np.linspace(1, 0, int(.15 * sample_rate)) ** .7
    singer = np.concatenate((lead[:-crossfade], lead[-crossfade:] * np.linspace(1, 0, crossfade) + long_a[:crossfade] * np.linspace(0, 1, crossfade), long_a[crossfade:]))
    delay = int(voice * .009 * sample_rate)
    stereo = np.column_stack((singer * np.sqrt((1 - pan) / 2), singer * np.sqrt((1 + pan) / 2))) * gain
    mix[delay:delay + len(singer)] += stereo

# Short stereo reflections, soft saturation and subtle 12-bit texture evoke a console sting.
dry = mix.copy()
for seconds, gain in [(.067, .18), (.113, .12), (.179, .08), (.239, .045)]:
    delay = int(seconds * sample_rate)
    mix[delay:] += dry[:-delay, ::-1] * gain
mix = np.tanh(mix * 2.0)
mix = np.round(mix * 2047) / 2047
mix *= .88 / max(np.max(np.abs(mix)), .001)
mix[-int(.06 * sample_rate):] *= np.linspace(1, 0, int(.06 * sample_rate))[:, None]
with wave.open(str(OUTPUT), 'wb') as destination:
    destination.setnchannels(2)
    destination.setsampwidth(2)
    destination.setframerate(sample_rate)
    destination.writeframes(np.round(mix * 32767).astype('<i2').tobytes())
print(f'{OUTPUT.name}: {len(mix) / sample_rate:.2f}s, {OUTPUT.stat().st_size} bytes, original synthetic vocal, peak {np.max(np.abs(mix)):.2f}')
