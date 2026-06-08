"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Force play for autoplay policies
      videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
    }
  }, []);

  return (
    <div className="video-background">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="object-cover"
        style={{ pointerEvents: 'none' }}
        // This removes the download button in some browsers
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />
    </div>
  );
}
