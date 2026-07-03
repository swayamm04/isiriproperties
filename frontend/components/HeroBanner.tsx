"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Home, IndianRupee } from "lucide-react";
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

  // Search form state
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (location) query.set("location", location);
    if (type) query.set("type", type);
    if (price) query.set("price", price);
    router.push(`/properties?${query.toString()}`);
  };

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
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className={styles.searchBar}>
          <div className={styles.searchField}>
            <MapPin className={styles.searchFieldIcon} size={20} strokeWidth={1.5} />
            <div style={{ width: "100%" }}>
              <label className={styles.searchLabel}>Location</label>
              <input
                type="text"
                placeholder="e.g. Ocean Drive, Baker Street"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.searchFieldInput}
              />
            </div>
          </div>

          <div className={styles.searchField}>
            <Home className={styles.searchFieldIcon} size={20} strokeWidth={1.5} />
            <div style={{ width: "100%" }}>
              <label className={styles.searchLabel}>Property Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">All Types</option>
                <option value="Villa">Villa</option>
                <option value="Chalet">Chalet</option>
                <option value="Penthouse">Penthouse</option>
              </select>
            </div>
          </div>

          <div className={styles.searchField}>
            <IndianRupee className={styles.searchFieldIcon} size={20} strokeWidth={1.5} />
            <div style={{ width: "100%" }}>
              <label className={styles.searchLabel}>Max Price</label>
              <select
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Any Price</option>
                <option value="40000000">₹4.0 Crores</option>
                <option value="50000000">₹5.0 Crores</option>
                <option value="60000000">₹6.0 Crores</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.searchBtn}>
            Search
          </button>
        </form>
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
