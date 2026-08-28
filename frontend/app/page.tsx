import Script from 'next/script';
import Navbar from "@/components/Navbar";
import IntroVideo from "@/components/IntroVideo";
import HeroBanner from "@/components/HeroBanner";
import MobileCategoryGrid from "@/components/MobileCategoryGrid";
import NormalProperties from "@/components/NormalProperties";
import AboutUs from "@/components/AboutUs";
import PropertySlider from "@/components/PropertySlider";
import ScheduleVisitBanner from "@/components/ScheduleVisitBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Script
        id="intro-video-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (!sessionStorage.getItem('hasSeenIntro')) {
              document.body.classList.add('intro-playing');
            }
          `,
        }}
      />
      <IntroVideo />
      <Navbar />
      <main className="fade-in">
        <HeroBanner />
        <PropertySlider />
        <MobileCategoryGrid />
        <NormalProperties />
        <AboutUs />
        <ScheduleVisitBanner />
      </main>
      <Footer />
    </>
  );
}
