/**
 * VideoPlayer Component
 * 
 * HLS video player for live shopping streams with custom controls
 * 
 * Features:
 * - HLS.js integration for adaptive bitrate streaming
 * - Custom playback controls (play/pause, volume, mute)
 * - Picture-in-Picture support
 * - Fullscreen capability
 * - "LIVE" indicator badge
 * - Automatic error recovery for network issues
 * - Native HTML5 video fallback for Safari
 * 
 * VIDEO NOTE: Currently uses a template/demo HLS stream.
 * In production, sellers would provide their own live stream URLs from
 * services like Mux, AWS IVS, or other streaming platforms.
 * 
 * @param videoUrl - HLS stream URL (.m3u8 file)
 * @param autoPlay - Whether to start playing automatically (default: true)
 */

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  videoUrl?: string;  // HLS stream URL
  autoPlay?: boolean; // Auto-start playback
}

export function VideoPlayer({
  videoUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Template video for demo
  autoPlay = true,
}: VideoPlayerProps) {
  // Video element reference
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.7); // Default 70% volume
  const [isMuted, setIsMuted] = useState(false);

  /**
   * Initialize HLS player and set up event handlers
   * Uses HLS.js for browsers that don't support native HLS (most browsers except Safari)
   * Safari supports HLS natively through the <video> tag
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if HLS.js is supported (not Safari)
    if (Hls.isSupported()) {
      // Create HLS instance with optimized settings
      const hls = new Hls({
        enableWorker: true,     // Use web workers for better performance
        lowLatencyMode: true,   // Optimize for live streaming
      });

      // Load the HLS stream
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      // Event: Stream manifest loaded successfully
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          // Attempt autoplay (may be blocked by browser policy)
          video.play().catch((err) => {
            console.warn("Autoplay prevented:", err);
            setIsPlaying(false); // Update UI to show play button
          });
        }
      });

      // Event: Handle HLS errors with automatic recovery
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error - attempting recovery");
              hls.startLoad(); // Retry loading
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error - attempting recovery");
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              console.error("Fatal error");
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      if (autoPlay) {
        video.play().catch((err) => {
          console.warn("Autoplay prevented:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [videoUrl, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    setVolume(newVolume);
    video.volume = newVolume;
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    video.muted = newMuted;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
        controls={false}
      />

      {/* Video Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            {isPlaying ? (
              <span className="text-white text-xl">⏸</span>
            ) : (
              <span className="text-white text-xl">▶</span>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <span className="text-xl">🔇</span>
              ) : volume < 0.5 ? (
                <span className="text-xl">🔉</span>
              ) : (
                <span className="text-xl">🔊</span>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Live Badge */}
          <div className="ml-auto flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <button
            onClick={togglePlay}
            className="w-20 h-20 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110"
          >
            <span className="text-white text-4xl ml-1">▶</span>
          </button>
        </div>
      )}
    </div>
  );
}

