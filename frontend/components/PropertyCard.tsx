"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Bath, Square, Heart } from "lucide-react";
import { Property } from "@/data/properties";
import { getImageUrl } from "@/utils/api";
import { useAuth } from "@/context/authContext";
import { formatIndianPrice } from "@/utils/formatPrice";
import { getIconForField } from "@/utils/iconMap";
import styles from "./PropertyCard.module.css";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {

  const { user, toggleWishlist } = useAuth();
  const [currentFilter, setCurrentFilter] = useState("All");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentFilter(sessionStorage.getItem("homeListingType") || "All");

      const handleTypeChange = () => {
        setCurrentFilter(sessionStorage.getItem("homeListingType") || "All");
      };

      window.addEventListener("homeListingTypeChanged", handleTypeChange);
      return () => window.removeEventListener("homeListingTypeChanged", handleTypeChange);
    }
  }, []);

  const isWishlisted = user?.wishlist?.includes(property.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login?mode=login";
      return;
    }
    await toggleWishlist(property.id);
  };
  const formattedPrice = formatIndianPrice(property.price);

  return (
    <Link href={`/properties/${property.id}`} className={styles.card}>
      {/* Image Block */}
      <div className={styles.imageWrapper}>
        <Image
          src={getImageUrl(property.image)}
          alt={property.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className={styles.badgesWrapper}>
          <div className={styles.badge}>{property.type.toUpperCase()}</div>
          {currentFilter === "All" && property.listingType && (
            <div className={styles.badge}>
              {property.listingType.toLowerCase() === "sell" ? "BUY" : property.listingType.toUpperCase()}
            </div>
          )}
        </div>
        <div
          className={styles.favoriteBtn}
          onClick={handleWishlistClick}
          role="button"
          tabIndex={0}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "var(--color-primary)" : "none"}
            color={isWishlisted ? "var(--color-primary)" : "currentColor"}
          />
        </div>
      </div>

      {/* Details Block */}
      <div className={styles.details}>
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <h3 className={styles.title}>{property.title}</h3>
            {user && (
              <span className={styles.location}>
                <MapPin size={14} className={styles.locationIcon} />
                {property.location}
              </span>
            )}
          </div>
          <div className={styles.priceInfo}>
            <span className={styles.price}>
              {formattedPrice}
              {property.listingType === "Rent" && property.rentFrequency && (
                <span style={{ fontSize: "0.6em", fontWeight: 400, marginLeft: "4px", color: "var(--color-dark-muted)" }}>
                  / {property.rentFrequency}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Specifications */}
        <div className={styles.specs}>
          {property.customFields && Object.keys(property.customFields).length > 0 ? (
            Object.entries(property.customFields).slice(0, 3).map(([key, value]) => {
              const IconComponent = getIconForField(key);
              return (
                <div key={key} className={styles.specItem}>
                  <IconComponent size={16} className={styles.specIcon} />
                  <span>{String(value)} {key}</span>
                </div>
              );
            })
          ) : (
            <>
              {property.beds ? (
                <div className={styles.specItem}>
                  <BedDouble size={16} className={styles.specIcon} />
                  <span>{property.beds} Beds</span>
                </div>
              ) : null}
              {property.baths ? (
                <div className={styles.specItem}>
                  <Bath size={16} className={styles.specIcon} />
                  <span>{property.baths} Baths</span>
                </div>
              ) : null}
              {property.area ? (
                <div className={styles.specItem}>
                  <Square size={16} className={styles.specIcon} />
                  <span>{property.area} Sq Ft</span>
                </div>
              ) : null}
            </>
          )}
        </div>

      </div>
    </Link>
  );
}
