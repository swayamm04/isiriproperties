"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import styles from "./HeroBanner.module.css";

const SLIDES = [
  {
    image: "/hero-1.png",
    subtitle: "Find Your Dream Home",
    title: "Find The Perfect <span>Property</span> For You",
    description: "Explore our handpicked properties and find a place you'll love to call home.",
  },
  {
    image: "/hero-2.png",
    subtitle: "Luxury Urban Living",
    title: "Penthouse Residences With Skyline <span>Panoramas</span>",
    description: "Experience the pinnacle of high-rise living with luxury floor plans and panoramic vistas.",
  },
  {
    image: "/hero-3.png",
    subtitle: "Exclusive Estates",
    title: "Serene Retreats Harmonized With <span>Nature</span>",
    description: "Escape to private estates that offer absolute tranquility and state-of-the-art architecture.",
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.contentContainer}>
        {/* Text Section (Left) */}
        <div className={styles.textBlock} key={currentSlide}>
          <span className={styles.subtitle}>{SLIDES[currentSlide].subtitle}</span>
          <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: SLIDES[currentSlide].title }}></h1>
          <p className={styles.description}>{SLIDES[currentSlide].description}</p>
          
          <div className={styles.ctaContainer}>
            <button onClick={() => router.push("/properties")} className={styles.ctaBtn}>
              Explore Properties
              <ArrowRight size={16} strokeWidth={2} />
            </button>

          </div>
        </div>

        {/* Image Section (Right) */}
        <div className={styles.imageBlock}>
          {SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>

      </div>

    </section>
  );
}
