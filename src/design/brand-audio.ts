import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

const source = require('../../assets/audio/soma-vinheta.wav');

export function useBrandAudio() {
  const player = useAudioPlayer(source, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const generation = useRef(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    player.volume = .65;
    void setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }).catch(() => setFailed(true));
  }, [player]);

  const stop = useCallback(() => {
    generation.current++;
    try { player.pause(); } catch { /* The hook may already have released the player on unmount. */ }
  }, [player]);

  const play = useCallback(() => {
    const request = ++generation.current;
    if (!player.isLoaded) return;
    void player.seekTo(0).then(() => {
      if (generation.current === request) player.play();
    }).catch(() => setFailed(true));
  }, [player]);

  const prepare = useCallback(async () => player.isLoaded, [player]);
  return { ready: status.isLoaded && !failed, failed, blocked: false, prepare, play, stop };
}
