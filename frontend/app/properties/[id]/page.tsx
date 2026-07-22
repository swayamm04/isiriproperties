"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Bed, Bath, Compass, Calendar, User, Eye, CheckCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/authContext";
import { apiRequest, getImageUrl } from "@/utils/api";
import styles from "./page.module.css";

interface PropertyDetail {
  _id: string;
  propertyId: string;
  title: string;
  description: string;
  location: string;
  price: number;
  images: string[];
  beds: number;
  baths: number;
  area: string;
  type: string;
  addedBy: string;
  addedByName: string;
  status: "available" | "sold";
  customFields?: Record<string, any>;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, toggleWishlist } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carousel state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Interest Modal state
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [queryText, setQueryText] = useState("Hi, I am interested in this property and would like to schedule a call or viewing. Please share more details.");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState("");
  const [interestError, setInterestError] = useState("");
  
  // Custom Alert Modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/properties/${id}`);
        setProperty(data);
      } catch (err: any) {
        console.error("Error loading property:", err);
        setError(err.message || "Failed to load property details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
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

  if (error || !property) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "80vh" }}>
          <p style={{ color: "#e05e5e", marginBottom: "2rem" }}>{error || "Property not found."}</p>
          <Link href="/properties" className={styles.interestBtn} style={{ display: "inline-block" }}>
            Return to Listings
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const isWishlisted = user ? user.wishlist.includes(property._id) : false;

  const handleWishlistToggle = async () => {
    if (!user) {
      setIsAlertModalOpen(true);
      return;
    }
    await toggleWishlist(property._id);
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setInterestLoading(true);
    setInterestError("");
    setInterestSuccess("");

    try {
      await apiRequest("/interest", {
        method: "POST",
        body: JSON.stringify({
          propertyId: property._id,
          queryText,
        }),
      });
      setInterestSuccess("Your request has been successfully submitted to the Super Admin. Our office will reach out shortly.");
      setTimeout(() => {
        setIsInterestModalOpen(false);
        setInterestSuccess("");
      }, 3000);
    } catch (err: any) {
      setInterestError(err.message || "Failed to submit interest query.");
    } finally {
      setInterestLoading(false);
    }
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <>
      <Navbar />
      <main className={styles.container}>
        <Link href="/properties" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to Portfolio
        </Link>

        <div className={styles.grid}>
          {/* Left Column: Image Slider */}
          <div>
            <div className={styles.carousel}>
              {property.images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`${property.title} - View ${idx + 1}`}
                  className={`${styles.carouselImage} ${idx === activeImageIdx ? styles.activeImage : ""}`}
                />
              ))}

              <div className={styles.badge}>{property.type}</div>
              
              {property.status === "sold" && (
                <div className={styles.soldBadge}>Sold Out</div>
              )}

              {/* Prev / Next controls if multiple images */}
              {property.images.length > 1 && (
                <>
                  <button onClick={prevImage} className={`${styles.carouselControl} ${styles.prevBtn}`} aria-label="Previous image">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextImage} className={`${styles.carouselControl} ${styles.nextBtn}`} aria-label="Next image">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails grid */}
            {property.images.length > 1 && (
              <div className={styles.thumbnailGrid}>
                {property.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`${styles.thumbnail} ${idx === activeImageIdx ? styles.activeThumbnail : ""}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt="thumbnail"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Detail Information */}
          <div className={styles.infoPanel}>
            <div className={styles.headerSection}>
              <span className={styles.refNumber}>Ref ID: #{property.propertyId}</span>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{property.title}</h1>
                <span className={styles.price}>{formattedPrice}</span>
              </div>
              {user && (
                <span className={styles.location}>
                  <MapPin size={16} style={{ color: "var(--color-primary)" }} strokeWidth={1.5} />
                  {property.location}
                </span>
              )}
            </div>

            {/* Specifications Table */}
            <div className={styles.specsTable}>
              {property.customFields && Object.keys(property.customFields).length > 0 ? (
                Object.entries(property.customFields).map(([key, value]) => (
                  <div key={key} className={styles.specRow}>
                    <span className={styles.specLabel}>
                      <CheckCircle size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} /> {key}
                    </span>
                    <span className={styles.specVal}>{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>
                    <CheckCircle size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} /> Details
                  </span>
                  <span className={styles.specVal}>Available upon inquiry</span>
                </div>
              )}
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.descriptionTitle}>Architectural Review</h3>
              <p className={styles.description}>{property.description}</p>
            </div>

            {/* Action buttons */}
            <div className={styles.actionGroup}>
              <button
                onClick={() => setIsInterestModalOpen(true)}
                className={styles.interestBtn}
                disabled={property.status === "sold"}
                style={property.status === "sold" ? { backgroundColor: "#888", borderColor: "#888", cursor: "not-allowed" } : {}}
              >
                {property.status === "sold" ? "Sold Out" : "I am Interested"}
              </button>
              
              {(!user || user.role === "user") && (
                <button
                  onClick={handleWishlistToggle}
                  className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistedActive : ""}`}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label="Wishlist"
                >
                  <Heart size={20} fill={isWishlisted ? "#e05e5e" : "transparent"} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Interest Submission Modal */}
      {isInterestModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsInterestModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setIsInterestModalOpen(false)}>
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle}>Express Interest</h2>
            <p className={styles.modalSubtitle}>Inquire about Ref: #{property.propertyId}</p>

            {user ? (
              <form onSubmit={handleInterestSubmit}>
                {interestError && <div className={styles.errorBox}>{interestError}</div>}
                {interestSuccess && <div className={styles.successBox}>{interestSuccess}</div>}

                {/* Prepopulated user profile summary */}
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>Name: <strong>{user.name}</strong></div>
                  <div className={styles.metaItem}>Phone: <strong>{user.phone}</strong></div>
                  <div className={styles.metaItem}>City: <strong>{user.city}</strong></div>
                  <div className={styles.metaItem}>Mail ID: <strong>{user.email}</strong></div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(252,251,250,0.6)", marginBottom: "0.5rem" }}>
                    Your Inquiry / Query
                  </label>
                  <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    className={styles.textArea}
                    placeholder="Enter your query details..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.modalBtn}
                  disabled={interestLoading || !!interestSuccess}
                >
                  {interestLoading ? "Submitting Inquiry..." : "Submit Inquiry"}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p className={styles.loginPromptText}>
                  Please sign in or register an account before submitting purchase inquiries.
                </p>
                <button
                  onClick={() => {
                    setIsInterestModalOpen(false);
                    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { mode: "login" } }));
                  }}
                  className={styles.modalBtn}
                >
                  Login to Inquire
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert Modal for Unauthenticated Users */}
      {isAlertModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAlertModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
            <button className={styles.closeBtn} onClick={() => setIsAlertModalOpen(false)}>
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle} style={{ marginBottom: "1.5rem" }}>Authentication Required</h2>
            <p className={styles.loginPromptText}>
              Please sign in or register an account before adding properties to your wishlist.
            </p>

            <button
              onClick={() => {
                setIsAlertModalOpen(false);
                window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { mode: "login" } }));
              }}
              className={styles.modalBtn}
              style={{ marginTop: "1rem" }}
            >
              Login / Register
            </button>
          </div>
        </div>
      )}
    </>
  );
}
