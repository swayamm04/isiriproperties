"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/authContext";
import { apiRequest } from "@/utils/api";
import Link from "next/link";
import styles from "./page.module.css";

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
  status: "available" | "sold";
}

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const [wishlistedProps, setWishlistedProps] = useState<Property[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;

    const fetchWishlist = async () => {
      try {
        setWishlistLoading(true);
        // Fetch all properties
        const properties: Property[] = await apiRequest("/properties");
        
        // Filter by what is in user's wishlist
        const filtered = properties.filter((prop) => 
          user.wishlist.includes(prop._id)
        );
        setWishlistedProps(filtered);
      } catch (err: any) {
        console.error("Error loading wishlist:", err);
        setError("Failed to load wishlist properties.");
      } finally {
        setWishlistLoading(false);
      }
    };

    fetchWishlist();
  }, [user, loading]);

  if (loading || wishlistLoading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <div className={styles.header}>
          <span className={styles.subtitle}>Reserved Listings</span>
          <h1 className={styles.title}>Your Wishlist</h1>
        </div>

        {!user ? (
          <div className={styles.unauthorizedState}>
            <p className={styles.unauthorizedText}>
              Please sign in or register to view and manage your curated wishlist.
            </p>
          </div>
        ) : wishlistedProps.length > 0 ? (
          <div className={styles.grid}>
            {wishlistedProps.map((prop) => {
              // Map backend schema to what PropertyCard expects
              const mappedProp = {
                id: prop._id,
                title: prop.title,
                location: prop.location,
                price: prop.price,
                image: prop.images[0] || "/prop-1.png",
                beds: prop.beds,
                baths: prop.baths,
                area: prop.area,
                type: prop.type,
                description: prop.description,
                listingType: prop.listingType,
              };
              return <PropertyCard key={mappedProp.id} property={mappedProp} />;
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Your Wishlist is Empty</h2>
            <p className={styles.emptyText}>
              You have not saved any residences to your profile yet. Browse our curated collection to reserve your favorite luxury properties.
            </p>
            <Link href="/properties" className={styles.exploreBtn}>
              Explore Portfolio
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
