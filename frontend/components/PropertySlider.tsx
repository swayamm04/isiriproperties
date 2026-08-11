"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
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
  type: "Villa" | "Chalet" | "Penthouse" | "Site";
  description: string;
}

interface PropertySliderProps {
  excludeId?: string;
  showAll?: boolean;
}

export default function PropertySlider({ excludeId, showAll }: PropertySliderProps = {}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const listingType = sessionStorage.getItem("homeListingType") || "All";
        
        let url = `/properties?status=available`;
        if (!showAll) {
          url += `&isPremium=true&listingType=${listingType}`;
        }
        
        let data = await apiRequest(url);
        
        if (excludeId) {
          data = data.filter((p: any) => p._id !== excludeId);
        }
        
        setProperties(showAll ? data : data.slice(0, 4));
      } catch (err) {
        console.error("Failed to load properties for slider:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
    
    window.addEventListener("homeListingTypeChanged", loadProperties);
    return () => {
      window.removeEventListener("homeListingTypeChanged", loadProperties);
    };
  }, [excludeId, showAll]);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // Slider items mapped below

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
            <span className={styles.subtitle}>{showAll ? "OTHER PROPERTIES" : "FEATURED PROPERTIES"}</span>
            <h2 className={styles.title}>{showAll ? "Explore Similar Properties" : "Explore Our Best Properties"}</h2>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.navArrows}>
              <button onClick={scrollLeft} className={styles.arrowBtn} aria-label="Previous">
                <ArrowLeft size={20} />
              </button>
              <button onClick={scrollRight} className={styles.arrowBtn} aria-label="Next">
                <ArrowRight size={20} />
              </button>
            </div>
            {!showAll && (
              <Link href="/properties" className={styles.viewAllBtn}>
                All <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Horizontal Slider container */}
        <div className={styles.sliderContainer} ref={sliderRef}>
          {properties.map((property) => {
            const mappedProp = {
              id: property.propertyId || property._id,
              title: property.title,
              location: property.location,
              price: property.price,
              image: property.images[0] || "/prop-1.png",
              beds: property.beds,
              baths: property.baths,
              area: property.area,
              type: property.type,
              description: property.description,
              customFields: (property as any).customFields,
              listingType: property.listingType,
            };

            return (
              <div key={property._id} className={styles.slideItem}>
                <PropertyCard property={mappedProp} />
              </div>
            );
          })}


        </div>
      </div>
    </section>
  );
}
