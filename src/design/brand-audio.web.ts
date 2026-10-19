import { useCallback, useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';

const source = require('../../assets/audio/soma-vinheta.wav');

export function useBrandAudio() {
  const context = useRef<AudioContext | null>(null);
  const buffer = useRef<AudioBuffer | null>(null);
  const node = useRef<AudioBufferSourceNode | null>(null);
  const generation = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const stop = useCallback(() => {
    generation.current++;
    try { node.current?.stop(); } catch { /* The short source may already have ended. */ }
    node.current?.disconnect();
    node.current = null;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) { setFailed(true); return; }
    const audioContext = new Constructor();
    context.current = audioContext;
    void fetch(Asset.fromModule(source).uri, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Áudio indisponível'); return response.arrayBuffer(); })
      .then(bytes => audioContext.decodeAudioData(bytes))
      .then(decoded => { if (!controller.signal.aborted) { buffer.current = decoded; setReady(true); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => {
      controller.abort(); stop(); buffer.current = null; context.current = null;
      void audioContext.close().catch(() => {});
    };
  }, [stop]);

  const prepare = useCallback(async () => {
    const audioContext = context.current;
    if (!audioContext || !buffer.current) return false;
    // resume() runs directly inside the button gesture, before the first await.
    try { await audioContext.resume(); } catch { setBlocked(true); return false; }
    const allowed = audioContext.state === 'running';
    setBlocked(!allowed);
    return allowed;
  }, []);

  const play = useCallback(() => {
    stop();
    const audioContext = context.current;
    const decoded = buffer.current;
    if (!audioContext || !decoded) return;
    const request = generation.current;
    const cue = performance.now();
    const start = () => {
      // Never play a delayed unlock after the letters have already disappeared.
      if (request !== generation.current || performance.now() - cue > 300) return;
      if (audioContext.state !== 'running') { setBlocked(true); return; }
      const voice = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      gain.gain.value = .65;
      voice.buffer = decoded;
      voice.connect(gain); gain.connect(audioContext.destination);
      voice.onended = () => { voice.disconnect(); gain.disconnect(); if (node.current === voice) node.current = null; };
      node.current = voice; voice.start(); setBlocked(false);
    };
    if (audioContext.state === 'running') start();
    else {
      setBlocked(true);
      void audioContext.resume().then(start).catch(() => setBlocked(true));
    }
  }, [stop]);

  return { ready, failed, blocked, prepare, play, stop };
}
