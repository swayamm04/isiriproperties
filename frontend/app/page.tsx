import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import MobileCategoryGrid from "@/components/MobileCategoryGrid";
import NormalProperties from "@/components/NormalProperties";
import AboutUs from "@/components/AboutUs";
import PropertySlider from "@/components/PropertySlider";
import Testimonials from "@/components/Testimonials";
import ScheduleVisitBanner from "@/components/ScheduleVisitBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="fade-in">
        <HeroBanner />
        <PropertySlider />
        <MobileCategoryGrid />
        <NormalProperties />
        <AboutUs />

        <Testimonials />
        <ScheduleVisitBanner />
      </main>
      <Footer />
    </>
  );
}
