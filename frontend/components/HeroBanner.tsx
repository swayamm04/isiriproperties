"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/authContext";
import styles from "./HeroBanner.module.css";

const SLIDES = [
  {
    image: "/hero-1.png",
    subtitle: "I Siri Properties",
    title: "Exquisite Architectural Spaces Crafted For You",
    description: "Discover curated modern estates and minimalist residences designed for elevated living.",
  },
  {
    image: "/hero-2.png",
    subtitle: "Luxury Urban Living",
    title: "Penthouse Residences With Skyline Panoramas",
    description: "Experience the pinnacle of high-rise living with luxury floor plans and panoramic vistas.",
  },
  {
    image: "/hero-3.png",
    subtitle: "Exclusive Estates",
    title: "Serene Retreats Harmonized With Nature",
    description: "Escape to private estates that offer absolute tranquility and state-of-the-art architecture.",
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.hero}>
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}
      <div className={styles.overlay} />

      <div className={styles.contentContainer}>
        {/* Dynamic Welcome Greeting */}
        {user && (
          <div>
            <span className={styles.welcomeBanner}>
              Welcome, {user.name}
            </span>
          </div>
        )}

        {/* Render slide text dynamically based on the current slide, key helps re-trigger CSS animations */}
        <div className={styles.textBlock} key={currentSlide}>
          <span className={styles.subtitle}>{SLIDES[currentSlide].subtitle}</span>
          <h1 className={styles.title}>{SLIDES[currentSlide].title}</h1>
          <p className={styles.description}>{SLIDES[currentSlide].description}</p>
          <div className={styles.ctaContainer}>
            <button onClick={() => router.push("/properties")} className={styles.ctaBtn}>
              Explore Properties
              <ArrowRight size={16} strokeWidth={1.5} className={styles.ctaIcon} />
            </button>
          </div>
        </div>

      </div>

      {/* Slide Indicators */}
      <div className={styles.indicators}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`${styles.indicator} ${idx === currentSlide ? styles.indicatorActive : ""}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
