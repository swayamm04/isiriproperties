import styles from "./Testimonials.module.css";

const TESTIMONIALS = [
  {
    quote: "The level of professionalism and dedication shown by Plot&Acre is unmatched. They understood our architectural taste perfectly and found our dream beachfront home within weeks.",
    author: "Dr. Sophia Bennett",
    role: "Ocean Breeze Villa Owner",
  },
  {
    quote: "Working with Plot&Acre was a masterclass in luxury brokerage. They valued our time and privacy above all, presenting only highly curated properties that aligned with our investment goals.",
    author: "Rajan Malhotra",
    role: "Tech Entrepreneur",
  },
  {
    quote: "Their curation of modern architecture is exceptional. They helped us secure an off-market penthouse residence with incredible terms. A flawless experience from negotiation to keys.",
    author: "Karen & Marcus Vance",
    role: "Penthouse Residents",
  },
  {
    quote: "Securing a quiet forest chalet was simple and stress-free. The advisers at Plot&Acre showed excellent knowledge of off-market land holdings and constructions.",
    author: "Aditya Verma",
    role: "Chalet Resident & Artist",
  },
  {
    quote: "Their focus on symmetry, space, and lighting matches our design requirements. A highly recommended advisory office for premium structural investments in Karnataka.",
    author: "Nisha Rao",
    role: "Principal Architect, NRA Studio",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section} id="testimonials">
      <div className={styles.container}>
        {/* Header Block */}
        <div className={styles.header}>
          <span className={styles.subtitle}>Client Experiences</span>
          <h2 className={styles.title}>Trusted By Connoisseurs</h2>
        </div>

        {/* Marquee Slider Container */}
        <div className={styles.sliderContainer}>
          <div className={styles.marqueeTrack}>
            {/* Set 1: Original Testimonials */}
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={`set1-${idx}`} className={styles.slideItem}>
                <div className={styles.card}>
                  <span className={styles.quoteIcon}>“</span>
                  <p className={styles.quoteText}>{testimonial.quote}</p>
                  <div className={styles.client}>
                    <span className={styles.clientName}>{testimonial.author}</span>
                    <span className={styles.clientRole}>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Set 2: Duplicated set for seamless loop */}
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={`set2-${idx}`} className={styles.slideItem}>
                <div className={styles.card}>
                  <span className={styles.quoteIcon}>“</span>
                  <p className={styles.quoteText}>{testimonial.quote}</p>
                  <div className={styles.client}>
                    <span className={styles.clientName}>{testimonial.author}</span>
                    <span className={styles.clientRole}>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
