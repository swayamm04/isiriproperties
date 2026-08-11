"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { apiRequest } from "@/utils/api";
import { useAuth } from "@/context/authContext";
import { Search, Compass } from "lucide-react";
import Loader from "@/components/Loader";
import styles from "./page.module.css";

interface Property {
  _id: string;
  propertyId: string;
  title: string;
  city?: string;
  location: string;
  price: number;
  images: string[];
  beds: number;
  baths: number;
  area: string;
  type: "Villa" | "Chalet" | "Penthouse";
  description: string;
  listingType?: "Sell" | "Rent";
  isPremium?: boolean;
  status: "available" | "sold";
}

function PropertiesList() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State values for properties
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State values for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListingType, setSelectedListingType] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Sync state with URL search params on mount
  useEffect(() => {
    const loc = searchParams.get("location") || searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const city = searchParams.get("city") || "";
    const storedListingType = typeof window !== "undefined" ? sessionStorage.getItem("homeListingType") : "";
    const listingType = searchParams.get("listingType") || storedListingType || "All";

    if (loc) setSearchQuery(loc);
    if (type) setSelectedType(type);
    if (city) setSelectedCity(city);
    if (listingType) setSelectedListingType(listingType);
    
    // Auto-focus search input if navigated via #search
    if (window.location.hash === "#search") {
      setTimeout(() => {
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.focus();
      }, 100);
    }
  }, [searchParams]);

  // Fetch properties from database on mount or when status view changes
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Load only available properties
        const [propData, catData] = await Promise.all([
          apiRequest(`/properties?status=available`),
          apiRequest("/categories")
        ]);
        setProperties(propData);
        setCategories(catData);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError("Failed to fetch listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filtered properties locally for instantaneous results
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.propertyId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType ? property.type === selectedType : true;
    const matchesListingType = selectedListingType ? property.listingType === selectedListingType : true;
    const matchesCity = selectedCity ? property.city === selectedCity : true;

    return matchesSearch && matchesType && matchesListingType && matchesCity;
  });

  const uniqueCities = Array.from(new Set(properties.map(p => p.city).filter(Boolean)));

  const handleReset = () => {
    setSearchQuery("");
    setSelectedListingType("");
    setSelectedType("");
    setSelectedCity("");
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
      <section className={styles.section} id="search">
        <div className={styles.searchContainer}>
          {/* Keyword Search */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Search Keywords</label>
            <div style={{ position: "relative" }}>
              <input
                id="search-input"
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
        </div>

        <div className={styles.filterBar}>
          {/* Listing Type Select */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Listing Type</label>
            <select
              value={selectedListingType}
              onChange={(e) => setSelectedListingType(e.target.value)}
              className={styles.select}
            >
              <option value="">All (Buy & Rent)</option>
              <option value="Sell">Buy</option>
              <option value="Rent">Rent</option>
            </select>
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
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={styles.select}
            >
              <option value="">Any City</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button onClick={handleReset} className={styles.resetBtn}>
            Reset Filters
          </button>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <Loader />
        ) : error ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", color: "#e05e5e" }}>
            {error}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className={styles.grid}>
            {filteredProperties.map((property) => {
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
                listingType: property.listingType,
                isPremium: property.isPremium,
                description: property.description,
                customFields: (property as any).customFields,
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
      <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader /></div>}>
        <PropertiesList />
      </Suspense>
      <Footer />
    </>
  );
}
