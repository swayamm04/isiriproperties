"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Handshake, Key } from "lucide-react";
import Loader from "@/components/Loader";
import { apiRequest } from "@/utils/api";
import styles from "./HeroBanner.module.css";

const SLIDES = [
  {
    image: "/banner1.png",
    subtitle: "Find Your Dream Home",
    title: "Find The Perfect <span>Property</span> For You",
    description: "Explore our handpicked properties and find a place you'll love to call home.",
  },
  {
    image: "/banner2.png",
    subtitle: "Premium Plots & Land",
    title: "Build Your Vision From The <span>Ground Up</span>",
    description: "Discover prime locations and exclusive plots perfectly suited for your custom architectural masterpiece.",
  },
  {
    image: "/banner3.png",
    subtitle: "Start Your Journey",
    title: "Unlock The Door To <span>Extraordinary</span> Living",
    description: "Explore our full portfolio of exclusive properties, luxury villas, and premium plots to find your perfect match.",
  },
];

export default function HeroBanner() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedType, setSelectedType] = useState("Sell");
  const [isFakingLoad, setIsFakingLoad] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedType(sessionStorage.getItem("homeListingType") || "Sell");
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        apiRequest(`/properties?status=available&search=${searchQuery}`)
          .then((data) => {
            setSuggestions(data);
            setIsDropdownOpen(true);
          })
          .catch((err) => console.error(err))
          .finally(() => setIsSearching(false));
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelection = (type: string) => {
    if (type === selectedType) return;
    
    setIsFakingLoad(true);
    setSelectedType(type);
    sessionStorage.setItem("homeListingType", type);
    
    // Dispatch event so other components update their fetch
    window.dispatchEvent(new Event("homeListingTypeChanged"));
    
    setTimeout(() => {
      setIsFakingLoad(false);
    }, 3000);
  };

  return (
    <section className={styles.hero}>
      {isFakingLoad && (
        <div className={styles.fullScreenLoader}>
          <Loader />
        </div>
      )}

      {/* Mobile Top Actions */}
      <div className={styles.mobileTopActions}>
        <div className={styles.mobileSearchBarWrapper}>
          <div className={styles.mobileSearchBar}>
            <Search size={20} className={styles.searchIconMobile} />
            <input 
              type="text" 
              placeholder="Search for city, locality, or project..." 
              className={styles.searchInputMobile} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 2) setIsDropdownOpen(true);
              }}
            />
            {isSearching && <div className={styles.searchSpinner}></div>}
          </div>
          
          {isDropdownOpen && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {suggestions.map((prop) => (
                <div 
                  key={prop._id} 
                  className={styles.suggestionItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setSearchQuery("");
                    router.push(`/properties/${prop.propertyId || prop._id}`);
                  }}
                >
                  <div className={styles.suggestionImage}>
                    <img src={prop.images?.[0] || "/prop-1.png"} alt={prop.title} />
                  </div>
                  <div className={styles.suggestionTextContainer}>
                    <div className={styles.suggestionTitle}>{prop.title}</div>
                    <div className={styles.suggestionSubtitle}>{prop.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isDropdownOpen && suggestions.length === 0 && searchQuery.length >= 2 && !isSearching && (
            <div className={styles.suggestionsDropdown}>
              <div className={styles.suggestionNoResults}>No results found</div>
            </div>
          )}
        </div>
        
        <div className={styles.mobileActionButtons}>
          <button 
            className={`${styles.circleBtn} ${selectedType === 'Sell' ? styles.circleBtnActive : ''}`} 
            onClick={() => handleSelection('Sell')}
          >
            <div className={styles.circleIconWrapper}>
              <Handshake size={20} strokeWidth={1.5} />
            </div>
            <span>Buy</span>
          </button>
          <button 
            className={`${styles.circleBtn} ${selectedType === 'Rent' ? styles.circleBtnActive : ''}`} 
            onClick={() => handleSelection('Rent')}
          >
            <div className={styles.circleIconWrapper}>
              <Key size={20} strokeWidth={1.5} />
            </div>
            <span>Rent</span>
          </button>
        </div>
      </div>

      <div className={styles.sliderContainer}>
        {/* Background Slider */}
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
        
        <div className={styles.overlay} />

        <div className={styles.contentContainer}>
          {/* Text Section */}
          <div className={styles.textContainer}>
            <div className={styles.slidesWrapper}>
              {SLIDES.map((slide, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.textBlock} ${idx === currentSlide ? styles.textActive : ""}`}
                >
                  <span className={styles.subtitle}>{slide.subtitle}</span>
                  <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: slide.title }}></h1>
                  <p className={styles.description}>{slide.description}</p>
                </div>
              ))}
            </div>
            
            <div className={styles.staticCta}>
              <button onClick={() => router.push("/properties")} className={styles.ctaBtn}>
                Explore Properties
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
