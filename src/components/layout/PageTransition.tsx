import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

const NO_TRANSITION_ROUTES = ["/profile"];

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"in" | "out">("in");

  useEffect(() => {
    if (NO_TRANSITION_ROUTES.some((r) => location.pathname.startsWith(r))) {
      setDisplayChildren(children);
      setStage("in");
      return;
    }

    // Fade out, swap, fade in
    setStage("out");
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setStage("in");
    }, 350);
    return () => clearTimeout(timer);
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        opacity: stage === "in" ? 1 : 0,
        transition: "opacity 0.35s ease",
        minHeight: "100vh",
      }}
    >
      {displayChildren}
    </div>
  );
}
