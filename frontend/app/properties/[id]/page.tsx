"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Heart, MapPin, Bed, Bath, Compass, Calendar, User, Eye, CheckCircle, ChevronLeft, ChevronRight, X, Phone, MessageSquare, Maximize, Car, MessageCircle,
  Waves, Dumbbell, Shield, Wifi, Coffee, TreePine, Tv, Wind, Lock, Zap, Droplet, Flame, Sun, Star, Building, Share2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import PropertySlider from "@/components/PropertySlider";
import { useAuth } from "@/context/authContext";
import { apiRequest, getImageUrl } from "@/utils/api";
import { getIconForField } from "@/utils/iconMap";
import styles from "./page.module.css";

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/>
  </svg>
);

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
  listingType?: string;
  rentFrequency?: string;
  keyPoints?: string[];
  amenities?: string[];
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Interest Modal state
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [queryText, setQueryText] = useState("Hi, I am interested in this property and would like to schedule a call or viewing. Please share more details.");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState("");
  const [interestError, setInterestError] = useState("");

  const openFullscreen = () => {
    window.history.pushState({ isModalOpen: true }, '');
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (window.history.state?.isModalOpen) {
      window.history.back();
    }
  };

  const openInterestModal = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    window.history.pushState({ isModalOpen: true }, '');
    setIsInterestModalOpen(true);
  };

  const closeInterestModal = () => {
    setIsInterestModalOpen(false);
    if (window.history.state?.isModalOpen) {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isFullscreen) setIsFullscreen(false);
      if (isInterestModalOpen) setIsInterestModalOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isFullscreen, isInterestModalOpen]);
  
  // Custom Alert Modal state removed

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
      router.push("/login");
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
        closeInterestModal();
        setInterestSuccess("");
      }, 3000);
    } catch (err: any) {
      setInterestError(err.message || "Failed to submit interest query.");
    } finally {
      setInterestLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const formatPriceLakhCrore = (value: number) => {
    if (!value) return "Rs 0";
    if (value >= 10000000) {
      return `Rs ${(value / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
    }
    if (value >= 100000) {
      return `Rs ${(value / 100000).toFixed(2).replace(/\.00$/, "")} Lakh`;
    }
    return `Rs ${value.toLocaleString("en-IN")}`;
  };

  const formattedPrice = formatPriceLakhCrore(property.price);



  const getIconForText = (text: string, iconSize = 18) => {
    const t = text.toLowerCase();
    if (t.includes("pool") || t.includes("swim") || t.includes("water")) return <Waves size={iconSize} />;
    if (t.includes("gym") || t.includes("fitness") || t.includes("workout")) return <Dumbbell size={iconSize} />;
    if (t.includes("secur") || t.includes("guard") || t.includes("cctv") || t.includes("camera") || t.includes("safe")) return <Shield size={iconSize} />;
    if (t.includes("wifi") || t.includes("internet") || t.includes("broadband") || t.includes("fiber")) return <Wifi size={iconSize} />;
    if (t.includes("park") || t.includes("garden") || t.includes("tree") || t.includes("nature") || t.includes("green") || t.includes("lawn")) return <TreePine size={iconSize} />;
    if (t.includes("ac") || t.includes("air condition") || t.includes("cool")) return <Wind size={iconSize} />;
    if (t.includes("heat") || t.includes("fire") || t.includes("warm")) return <Flame size={iconSize} />;
    if (t.includes("power") || t.includes("backup") || t.includes("electric") || t.includes("generator") || t.includes("invert")) return <Zap size={iconSize} />;
    if (t.includes("tv") || t.includes("television") || t.includes("cable") || t.includes("dish") || t.includes("dth")) return <Tv size={iconSize} />;
    if (t.includes("water") || t.includes("plumb") || t.includes("ro") || t.includes("purifier") || t.includes("bore")) return <Droplet size={iconSize} />;
    if (t.includes("sun") || t.includes("light") || t.includes("bright") || t.includes("solar")) return <Sun size={iconSize} />;
    if (t.includes("lock") || t.includes("smart") || t.includes("keyless")) return <Lock size={iconSize} />;
    if (t.includes("star") || t.includes("premium") || t.includes("luxury") || t.includes("club")) return <Star size={iconSize} />;
    if (t.includes("coffee") || t.includes("cafe") || t.includes("tea")) return <Coffee size={iconSize} />;
    if (t.includes("car") || t.includes("garage") || t.includes("parking")) return <Car size={iconSize} />;
    if (t.includes("face") || t.includes("direction") || t.includes("vastu") || t.includes("facing")) return <Compass size={iconSize} />;
    return <CheckCircle size={iconSize} />;
  };

  const getAbsoluteImageUrl = (path: string) => {
    const url = getImageUrl(path);
    if (url.startsWith('/')) {
      return typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
    }
    return url;
  };

  const whatsappHref = property 
    ? `https://wa.me/919964496644?text=${encodeURIComponent(`Hi, I am interested in this property:\n\n*${property.title}*\nRef ID: #${property.propertyId}\n\nProperty Link:\n${typeof window !== 'undefined' ? window.location.href : ''}\n\nPlease share more details.`)}`
    : "#";

  return (
    <>
      <div className={styles.desktopNavbar}>
        <Navbar />
      </div>
      <main className={styles.container}>
        <div className={styles.grid}>
          {/* Left Column: Image Slider */}
          <div>
            <div 
              className={styles.carousel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {property.images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`${property.title} - View ${idx + 1}`}
                  className={`${styles.carouselImage} ${idx === activeImageIdx ? styles.activeImage : ""}`}
                  onClick={openFullscreen}
                  style={{ cursor: "pointer" }}
                />
              ))}

              <button 
                onClick={(e) => {
                  e.preventDefault();
                  router.back();
                }} 
                className={styles.floatingBackBtn} 
                aria-label="Go back"
                style={{ zIndex: 100 }}
              >
                <ArrowLeft size={18} color="#000" />
              </button>

              <div className={styles.topRightActions}>
                <button 
                  className={styles.iconBtn} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle();
                  }}
                  aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart 
                    size={18} 
                    fill={isWishlisted ? "var(--color-primary)" : "none"} 
                    color={isWishlisted ? "var(--color-primary)" : "#000"} 
                  />
                </button>
                <button 
                  className={styles.iconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: property.title,
                        url: window.location.href,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  }}
                  aria-label="Share property"
                >
                  <Share2 size={18} color="#000" />
                </button>
              </div>
              
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
                  {/* Dot Indicators */}
                  <div className={styles.dotsContainer}>
                    {property.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`${styles.dot} ${idx === activeImageIdx ? styles.activeDot : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIdx(idx);
                        }}
                      />
                    ))}
                  </div>
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
                <span className={styles.price}>
                  {formattedPrice}
                  {property.listingType?.toLowerCase() === "rent" && (
                    <span style={{ fontSize: "0.5em", fontWeight: 400, marginLeft: "6px", color: "var(--color-dark-muted)" }}>
                      / {property.rentFrequency || "Month"}
                    </span>
                  )}
                </span>
                <h1 className={styles.title}>{property.title}</h1>
              </div>
              {user && (
                <span className={styles.location}>
                  <MapPin size={16} style={{ color: "var(--color-primary)" }} strokeWidth={1.5} />
                  {property.location}
                </span>
              )}
            </div>

            {/* Features Grid (Mobile UI style) */}
            <div className={styles.featuresGrid}>
              {property.customFields && Object.entries(property.customFields).slice(0, 3).map(([key, value]) => {
                const IconComponent = getIconForField(key);
                return (
                  <div key={key} className={styles.featureCard}>
                    <IconComponent size={18} className={styles.featureIcon} />
                    <div className={styles.featureData}>
                      <span className={styles.featureVal}>{String(value)}</span>
                      <span className={styles.featureLabel}>{key}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.descriptionSection}>
              <h3 className={styles.descriptionTitle}>Overview</h3>
              <p className={styles.description}>{property.description}</p>
            </div>

            {/* Key Points Section */}
            {property.keyPoints && property.keyPoints.length > 0 && (
              <div className={styles.descriptionSection} style={{ marginTop: '2rem' }}>
                <h3 className={styles.descriptionTitle}>Features</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.8rem' }}>
                  {property.keyPoints.map((kp, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', backgroundColor: '#f7f8fa', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.03)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
                      <div style={{ color: '#7a7a7a', display: 'flex', alignItems: 'center' }}>
                        {getIconForText(kp, 14)}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}>{kp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities Section */}
            {property.amenities && property.amenities.length > 0 && (
              <div className={styles.descriptionSection} style={{ marginTop: '2rem' }}>
                <h3 className={styles.descriptionTitle}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.8rem' }}>
                  {property.amenities.map((am, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', backgroundColor: '#f7f8fa', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.03)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
                      <div style={{ color: '#7a7a7a', display: 'flex', alignItems: 'center' }}>
                        {getIconForText(am, 14)}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a' }}>{am}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className={styles.actionGroup}>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.actionBtn} ${styles.whatsappBtn}`}
              >
                <WhatsAppIcon size={20} />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={openInterestModal}
                className={`${styles.actionBtn} ${styles.chatBtn}`}
                disabled={property.status === "sold"}
              >
                <MessageSquare size={18} />
                <span>Chat</span>
              </button>

              <a href="tel:+919964496644" className={`${styles.actionBtn} ${styles.callBtn}`}>
                <Phone size={18} />
                <span>Call</span>
              </a>


            </div>
          </div>
        </div>

        {/* Similar Properties / Property Slider */}
        <div style={{ marginTop: "4rem" }}>
          <PropertySlider showAll={true} excludeId={property._id} />
        </div>
      </main>
      <Footer />

      {/* Interest Submission Modal */}
      {isInterestModalOpen && (
        <div className={styles.modalOverlay} onClick={closeInterestModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeInterestModal}>
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle}>Express Interest</h2>
            <p className={styles.modalSubtitle}>Inquire about Ref: #{property.propertyId}</p>
              <form onSubmit={handleInterestSubmit}>
                {interestError && <div className={styles.errorBox}>{interestError}</div>}
                {interestSuccess && <div className={styles.successBox}>{interestSuccess}</div>}

                {/* Prepopulated user profile summary */}
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>Name: <strong>{user?.name}</strong></div>
                  <div className={styles.metaItem}>Phone: <strong>{user?.phone}</strong></div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-dark)", marginBottom: "0.5rem", fontWeight: "600" }}>
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
                <p style={{ fontSize: "0.75rem", color: "var(--color-dark)", marginTop: "1rem", textAlign: "center", opacity: 0.8 }}>
                  Note: Our team will contact you once they view your inquiry.
                </p>
              </form>
          </div>
        </div>
      )}


      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div className={styles.fullscreenOverlay} onClick={closeFullscreen}>
          <button className={styles.closeFullscreenBtn} onClick={closeFullscreen}>
            <X size={32} />
          </button>
          
          <div 
            className={styles.fullscreenContent} 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={getImageUrl(property.images[activeImageIdx])}
              alt="Fullscreen View"
              className={styles.fullscreenImage}
            />
            
            {property.images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className={`${styles.fullscreenControl} ${styles.fullscreenPrev}`}>
                  <ChevronLeft size={36} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className={`${styles.fullscreenControl} ${styles.fullscreenNext}`}>
                  <ChevronRight size={36} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}
