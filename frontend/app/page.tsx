import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ContactForm from "@/components/ContactForm";

import AboutUs from "@/components/AboutUs";
import PropertySlider from "@/components/PropertySlider";
import CorporateSolutions from "@/components/CorporateSolutions";
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
        <AboutUs />
        <CorporateSolutions />

        <Testimonials />
        <ScheduleVisitBanner />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
