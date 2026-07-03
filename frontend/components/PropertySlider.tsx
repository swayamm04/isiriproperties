"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import PropertyCard from "./PropertyCard";
import { apiRequest } from "@/utils/api";
import styles from "./PropertySlider.module.css";

interface Property {
  _id: string;
  propertyId: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  beds: number;
  baths: number;
  area: string;
  type: "Villa" | "Chalet" | "Penthouse";
  description: string;
}

export default function PropertySlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        const data = await apiRequest("/properties");
        setProperties(data.slice(0, 4)); // Get first 4 properties
      } catch (err) {
        console.error("Failed to load featured properties for slider:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProperties();
  }, []);

  const checkScrollLimits = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", checkScrollLimits);
      // Run once initially
      checkScrollLimits();
    }
    return () => {
      if (slider) {
        slider.removeEventListener("scroll", checkScrollLimits);
      }
    };
  }, [properties]); // Trigger when properties are loaded

  const handleScroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const { clientWidth } = sliderRef.current;
      const scrollAmount = direction === "left" ? -(clientWidth * 0.75) : (clientWidth * 0.75);
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--color-primary-dark)" }}>Curating Featured Residences...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="properties">
      <div className={styles.container}>
        {/* Header Block */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <span className={styles.subtitle}>Curated Portfolio</span>
            <h2 className={styles.title}>Most Viewed Properties</h2>
          </div>
          {properties.length > 0 && (
            <div className={styles.controls}>
              <button
                onClick={() => handleScroll("left")}
                className={`${styles.controlBtn} ${!canScrollLeft ? styles.controlBtnDisabled : ""}`}
                disabled={!canScrollLeft}
                aria-label="Scroll Left"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => handleScroll("right")}
                className={`${styles.controlBtn} ${!canScrollRight ? styles.controlBtnDisabled : ""}`}
                disabled={!canScrollRight}
                aria-label="Scroll Right"
              >
                <ArrowRight size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Slider container */}
        <div className={styles.sliderContainer} ref={sliderRef}>
          {properties.map((property) => {
            const mappedProp = {
              id: property._id,
              title: property.title,
              location: property.location,
              price: property.price,
              image: property.images[0] || "/prop-1.png",
              beds: property.beds,
              baths: property.baths,
              area: property.area,
              type: property.type,
              description: property.description,
            };

            return (
              <div key={property._id} className={styles.slideItem}>
                <PropertyCard property={mappedProp} />
              </div>
            );
          })}

          {/* End "View More" Card */}
          <Link href="/properties" className={styles.moreCard}>
            <div className={styles.moreIcon}>
              <Compass size={40} strokeWidth={1.2} />
            </div>
            <h3 className={styles.moreTitle}>Explore All Listings</h3>
            <p className={styles.moreText}>
              Discover our complete collection of villas, chalets, and premium penthouses.
            </p>
            <div className={styles.moreBtn}>
              View More <ArrowUpRight size={14} style={{ display: "inline-block", marginLeft: "4px", verticalAlign: "middle" }} />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
