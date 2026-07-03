"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { apiRequest } from "@/utils/api";
import { Search, Compass } from "lucide-react";
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
  type: "Villa" | "Chalet" | "Penthouse";
  description: string;
  status: "available" | "sold";
}

function PropertiesList() {
  const searchParams = useSearchParams();

  // State values for properties
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs for Available vs Sold Out
  const [viewStatus, setViewStatus] = useState<"available" | "sold">("available");

  // State values for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Sync state with URL search params on mount
  useEffect(() => {
    const loc = searchParams.get("location") || searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const price = searchParams.get("price") || "";

    if (loc) setSearchQuery(loc);
    if (type) setSelectedType(type);
    if (price) setMaxPrice(price);
  }, [searchParams]);

  // Fetch properties from database on mount or when status view changes
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Load properties matching the desired status (available or sold)
        const data = await apiRequest(`/properties?status=${viewStatus}`);
        setProperties(data);
      } catch (err: any) {
        console.error("Error loading properties:", err);
        setError("Failed to fetch listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [viewStatus]);

  // Filtered properties locally for instantaneous results
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.propertyId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType ? property.type === selectedType : true;
    const matchesPrice = maxPrice ? property.price <= parseInt(maxPrice, 10) : true;

    return matchesSearch && matchesType && matchesPrice;
  });

  const handleReset = () => {
    setSearchQuery("");
    setSelectedType("");
    setMaxPrice("");
  };

  return (
    <main className={styles.main}>
      {/* Page Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.subtitle}>Our Portfolio</span>
          <h1 className={styles.title}>Bespoke Residences</h1>
          <p className={styles.description}>
            Explore our curated catalog of modern estates, concrete brutalist structures, and architectural landmarks.
          </p>
        </div>
      </section>

      {/* Grid and Filters */}
      <section className={styles.section}>
        {/* Toggle between Available and Sold Out */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)", marginBottom: "2.5rem" }}>
          <button
            onClick={() => setViewStatus("available")}
            className={`${styles.resetBtn}`}
            style={{
              background: "none",
              border: "none",
              borderBottom: viewStatus === "available" ? "2px solid var(--color-primary)" : "none",
              padding: "1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: viewStatus === "available" ? "var(--color-primary-dark)" : "var(--color-dark-muted)",
              cursor: "pointer",
            }}
          >
            Available Portfolio
          </button>
          <button
            onClick={() => setViewStatus("sold")}
            className={`${styles.resetBtn}`}
            style={{
              background: "none",
              border: "none",
              borderBottom: viewStatus === "sold" ? "2px solid var(--color-primary)" : "none",
              padding: "1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: viewStatus === "sold" ? "var(--color-primary-dark)" : "var(--color-dark-muted)",
              cursor: "pointer",
            }}
          >
            Sold Out Section
          </button>
        </div>

        <div className={styles.filterBar}>
          {/* Keyword Search */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Search Keywords</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Villa, Malibu, Ref ID..."
                className={styles.input}
                style={{ paddingRight: "2.5rem" }}
              />
              <Search 
                size={16} 
                style={{ 
                  position: "absolute", 
                  right: "1rem", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "var(--color-primary)" 
                }} 
              />
            </div>
          </div>

          {/* Type Select */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Property Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.select}
            >
              <option value="">All Types</option>
              <option value="Villa">Villa</option>
              <option value="Chalet">Chalet</option>
              <option value="Penthouse">Penthouse</option>
            </select>
          </div>

          {/* Max Price */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Maximum Price</label>
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={styles.select}
            >
              <option value="">Any Price</option>
              <option value="35000000">₹3.5 Crores</option>
              <option value="50000000">₹5.0 Crores</option>
              <option value="60000000">₹6.0 Crores</option>
              <option value="70000000">₹7.0 Crores</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button onClick={handleReset} className={styles.resetBtn}>
            Reset Filters
          </button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", color: "var(--color-dark-muted)" }}>
            Retrieving portfolio files...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", color: "#e05e5e" }}>
            {error}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className={styles.grid}>
            {filteredProperties.map((property) => {
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

              return <PropertyCard key={mappedProp.id} property={mappedProp} />;
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Compass size={48} className={styles.emptyIcon} style={{ color: "var(--color-primary)" }} />
            <h3 className={styles.emptyTitle}>No Residences Match Your Search</h3>
            <p className={styles.emptyText}>
              We currently have no properties matching your exact configuration. Try adjusting your keyword search or price parameters, or connect with our advisory office directly.
            </p>
            <button onClick={handleReset} className={styles.resetBtn}>
              Show All Listings
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ padding: "12rem 2rem", textAlign: "center", color: "var(--color-dark)" }}>Loading Portfolio...</div>}>
        <PropertiesList />
      </Suspense>
      <Footer />
    </>
  );
}
