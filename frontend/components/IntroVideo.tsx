"use client";

import { useState, useEffect } from "react";
import styles from "./IntroVideo.module.css";

export default function IntroVideo() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the intro during this session
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      document.body.classList.add('intro-playing');
      sessionStorage.setItem("hasSeenIntro", "true");
      
      // Safety fallback in case the video doesn't play or end event fails
      const fallbackTimeout = setTimeout(() => {
        skipVideo();
      }, 8000); // Failsafe: hide after 8 seconds maximum
      
      return () => clearTimeout(fallbackTimeout);
    } else {
      // If they already saw it, hide it immediately without fading
      setShow(false);
      document.body.classList.remove('intro-playing');
    }
  }, []);

  const handleVideoEnd = () => {
    skipVideo();
  };

  const skipVideo = () => {
    if (!fade) {
      setFade(true);
      document.body.classList.remove('intro-playing');
      setTimeout(() => {
        setShow(false);
      }, 800); // Match CSS transition duration
    }
  };

  if (!show) return null;

  return (
    <div className={`${styles.overlay} ${fade ? styles.fadeOut : ""}`} onClick={skipVideo}>
      <video
        className={styles.video}
        src="/logo.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
      />
    </div>
  );
}
