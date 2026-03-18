import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SpeakBetterEffect } from "@/components/ui/text-effect";

interface SpeakBetterInterstitialProps {
  onComplete: () => void;
}

type Phase = "black" | "white" | "done";

export default function SpeakBetterInterstitial({ onComplete }: SpeakBetterInterstitialProps) {
  const [phase, setPhase] = useState<Phase>("black");

  useEffect(() => {
    // Black screen with animation holds for 8 seconds
    const blackTimer = setTimeout(() => setPhase("white"), 8000);
    return () => clearTimeout(blackTimer);
  }, []);

  useEffect(() => {
    if (phase === "white") {
      // White screen holds for 3 seconds then completes
      const whiteTimer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 3000);
      return () => clearTimeout(whiteTimer);
    }
  }, [phase, onComplete]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80 }}>
      <AnimatePresence mode="wait">
        {phase === "black" && (
          <motion.div
            key="black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SpeakBetterEffect speed={1} />
          </motion.div>
        )}

        {phase === "white" && (
          <motion.div
            key="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#fff",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
