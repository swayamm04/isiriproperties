import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";

import AboutUs from "@/components/AboutUs";
import PropertySlider from "@/components/PropertySlider";
import Testimonials from "@/components/Testimonials";
import ContactForm from "@/components/ContactForm";
import ScheduleVisitBanner from "@/components/ScheduleVisitBanner";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="fade-in">
        <HeroBanner />
        <AboutUs />

        <PropertySlider />
        <Testimonials />
        <ContactForm />
        <ScheduleVisitBanner />
      </main>
      <Footer />
    </>
  );
}
