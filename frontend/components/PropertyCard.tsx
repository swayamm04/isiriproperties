import Image from "next/image";
import Link from "next/link";
import { MapPin, Bed, Bath, Compass } from "lucide-react";
import { Property } from "@/data/properties";
import { getImageUrl } from "@/utils/api";
import styles from "./PropertyCard.module.css";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div className={styles.card}>
      {/* Image Block */}
      <div className={styles.imageWrapper}>
        <Image
          src={getImageUrl(property.image)}
          alt={property.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized // To allow loading external URLs or local backend development server uploads
        />
        <div className={styles.badge}>{property.type}</div>
      </div>

      {/* Details Block */}
      <div className={styles.details}>
        <div className={styles.header}>
          <h3 className={styles.title}>{property.title}</h3>
          <span className={styles.location}>
            <MapPin size={14} className={styles.locationIcon} strokeWidth={1.5} />
            {property.location}
          </span>
        </div>

        {/* Specifications */}
        <div className={styles.specs}>
          <div className={styles.specItem}>
            <Bed size={16} className={styles.specIcon} strokeWidth={1.5} />
            <span>{property.beds} Beds</span>
          </div>
          <div className={styles.specItem}>
            <Bath size={16} className={styles.specIcon} strokeWidth={1.5} />
            <span>{property.baths} Baths</span>
          </div>
          <div className={styles.specItem}>
            <Compass size={16} className={styles.specIcon} strokeWidth={1.5} />
            <span>{property.area}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className={styles.footer}>
          <div>
            <span className={styles.priceLabel}>Price</span>
            <span className={styles.price}>{formattedPrice}</span>
          </div>
          <Link 
            href={`/properties/${property.id}`}
            className={styles.button}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
