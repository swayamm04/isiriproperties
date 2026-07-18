"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import styles from "./HeroBanner.module.css";

const SLIDES = [
  {
    image: "/banner1.png",
    subtitle: "Find Your Dream Home",
    title: "Find The Perfect <span>Property</span> For You",
    description: "Explore our handpicked properties and find a place you'll love to call home.",
  },
  {
    image: "/banner2.png",
    subtitle: "Premium Plots & Land",
    title: "Build Your Vision From The <span>Ground Up</span>",
    description: "Discover prime locations and exclusive plots perfectly suited for your custom architectural masterpiece.",
  },
  {
    image: "/banner3.png",
    subtitle: "Start Your Journey",
    title: "Unlock The Door To <span>Extraordinary</span> Living",
    description: "Explore our full portfolio of exclusive properties, luxury villas, and premium plots to find your perfect match.",
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
      {/* Background Slider */}
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ""}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}
      <div className={styles.overlay} />

      <div className={styles.contentContainer}>
        {/* Text Section (Left) */}
        <div className={styles.textContainer}>
          <div className={styles.slidesWrapper}>
            {SLIDES.map((slide, idx) => (
              <div 
                key={idx} 
                className={`${styles.textBlock} ${idx === currentSlide ? styles.textActive : ""}`}
              >
                <span className={styles.subtitle}>{slide.subtitle}</span>
                <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: slide.title }}></h1>
                <p className={styles.description}>{slide.description}</p>
              </div>
            ))}
          </div>
          
          <div className={styles.staticCta}>
            <button onClick={() => router.push("/properties")} className={styles.ctaBtn}>
              Explore Properties
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
