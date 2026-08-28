"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API request
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 800);
  };

  return (
    <section className={styles.section} id="contact">
      <div className={styles.container}>
        {/* Left Column: Office Details */}
        <div className={styles.leftColumn}>
          <div className={styles.titleBlock}>
            <span className={styles.subtitle}>Inquiries</span>
            <h2 className={styles.title}>Connect With Our Advisory</h2>
          </div>
          <p className={styles.text}>
            Whether listing a premium estate, scheduling a private viewing, or discussing market valuations, our advisors are here to guide you with precision and discretion.
          </p>

          <div className={styles.contactInfo}>
            <div className={styles.infoItem}>
              <MapPin className={styles.infoIcon} size={20} strokeWidth={1.5} />
              <div>
                <h4 className={styles.infoTitle}>Headquarters</h4>
                <p className={styles.infoText}>
                  02, Basaveshwara complex, 60 Feet Rd,<br />
                  near kariyanna building, Adarsh Layout,<br />
                  Vinoba Nagara, Shivamogga, KA 577204
                </p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Phone className={styles.infoIcon} size={20} strokeWidth={1.5} />
              <div>
                <h4 className={styles.infoTitle}>Direct Line</h4>
                <p className={styles.infoText}>+91 99644 96644<br />09964496644</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Mail className={styles.infoIcon} size={20} strokeWidth={1.5} />
              <div>
                <h4 className={styles.infoTitle}>Electronic Mail</h4>
                <p className={styles.infoText}>advisory@plotandacre.com<br />concierge@plotandacre.com</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Clock className={styles.infoIcon} size={20} strokeWidth={1.5} />
              <div>
                <h4 className={styles.infoTitle}>Hours of Operation</h4>
                <p className={styles.infoText}>Monday – Friday: 09:00 – 18:00<br />Saturday: By Appointment Only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form removed as requested */}
      </div>

      {/* Map Embed Block */}
      <div className={styles.mapContainer}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.1354928663654!2d75.5539805!3d13.950537000000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbbaf315277d10d%3A0x9ee29e081fff8d8!2sIsiri%20Properties!5e0!3m2!1sen!2sin!4v1782229426374!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Plot&Acre Location Map"
        />
      </div>
    </section>
  );
}
