"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "./Loader.module.css";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Loader() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/loader.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load Lottie JSON:", err));
  }, []);

  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderAnimation}>
        {animationData ? (
          <Lottie animationData={animationData} loop={true} />
        ) : (
          <p style={{ color: "var(--color-primary)" }}>Loading...</p>
        )}
      </div>
    </div>
  );
}
