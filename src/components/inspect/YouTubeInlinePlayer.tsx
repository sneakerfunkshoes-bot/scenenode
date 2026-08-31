'use client';

import { useEffect, useRef } from 'react';

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return ytApiPromise;
}

interface YouTubeInlinePlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

export function YouTubeInlinePlayer({
  videoId,
  isPlaying,
  currentTime,
  onTimeChange,
  onPlayingChange,
}: YouTubeInlinePlayerProps) {
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2, 9)}`);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const lastSeekRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let cancelled = false;
    let pollId = 0;

    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;

      const player = new window.YT.Player(containerId.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            playerRef.current = player;
            if (currentTime > 0) {
              player.seekTo(currentTime, true);
              lastSeekRef.current = currentTime;
            }
            if (isPlayingRef.current) player.playVideo();
          },
          onStateChange: (event) => {
            const { PLAYING, PAUSED, ENDED } = window.YT!.PlayerState;
            if (event.data === PLAYING) onPlayingChange(true);
            if (event.data === PAUSED || event.data === ENDED) onPlayingChange(false);
          },
        },
      });

      pollId = window.setInterval(() => {
        if (!readyRef.current || !playerRef.current) return;
        onTimeChange(playerRef.current.getCurrentTime());
      }, 100);
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
  }, [videoId, onTimeChange, onPlayingChange]);

  useEffect(() => {
    const player = playerRef.current;
    if (!readyRef.current || !player) return;
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying]);

  useEffect(() => {
    const player = playerRef.current;
    if (!readyRef.current || !player) return;
    if (Math.abs(currentTime - lastSeekRef.current) < 0.12) return;
    player.seekTo(currentTime, true);
    lastSeekRef.current = currentTime;
  }, [currentTime]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div id={containerId.current} className="h-full w-full" />
    </div>
  );
}
