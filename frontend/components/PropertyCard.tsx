import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Bath, Square, Heart } from "lucide-react";
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
        <div className={styles.badge}>{property.type.toUpperCase()}</div>
        <div 
          className={styles.favoriteBtn} 
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            /* handle wishlist */ 
          }}
          role="button"
          tabIndex={0}
        >
          <Heart size={18} />
        </div>
      </div>

      {/* Details Block */}
      <div className={styles.details}>
        <div className={styles.header}>
          <div className={styles.titleInfo}>
            <h3 className={styles.title}>{property.title}</h3>
            <span className={styles.location}>
              <MapPin size={14} className={styles.locationIcon} />
              {property.location}
            </span>
          </div>
          <div className={styles.priceInfo}>
            <span className={styles.price}>{formattedPrice}</span>
          </div>
        </div>

        {/* Specifications */}
        <div className={styles.specs}>
          <div className={styles.specItem}>
            <BedDouble size={16} className={styles.specIcon} />
            <span>{property.beds} Beds</span>
          </div>
          <div className={styles.specItem}>
            <Bath size={16} className={styles.specIcon} />
            <span>{property.baths} Baths</span>
          </div>
          <div className={styles.specItem}>
            <Square size={16} className={styles.specIcon} />
            <span>{property.area} Sq Ft</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
