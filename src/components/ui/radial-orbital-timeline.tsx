import { useState, useEffect, useRef, useCallback } from "react";

interface OrbitalNode {
  id: string;
  label: string;
  icon: string;
  description: string;
  slug: string;
}

interface RadialOrbitalTimelineProps {
  nodes: OrbitalNode[];
  onNodeClick: (node: OrbitalNode) => void;
  centerContent: React.ReactNode;
  visible: boolean;
}

export default function RadialOrbitalTimeline({
  nodes,
  onNodeClick,
  centerContent,
  visible,
}: RadialOrbitalTimelineProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.15) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, [visible]);

  const getNodePosition = useCallback(
    (index: number, total: number) => {
      const angle = ((index / total) * 360 + rotationAngle) % 360;
      const radian = (angle * Math.PI) / 180;
      // Responsive radius
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.28;
      const x = radius * Math.cos(radian);
      const y = radius * Math.sin(radian);
      const scale = 0.7 + 0.3 * ((1 + Math.sin(radian)) / 2);
      const opacity = 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2);
      const zIndex = Math.round(10 + 10 * Math.cos(radian));
      return { x, y, scale, opacity, zIndex, angle };
    },
    [rotationAngle]
  );

  return (
    <div
      ref={containerRef}
      className="orbital-timeline-container"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* Orbit rings */}
      <div className="orbital-rings">
        <div className="orbital-ring ring-1" />
        <div className="orbital-ring ring-2" />
        <div className="orbital-ring ring-3" />
      </div>

      {/* Center content */}
      <div className="orbital-center">{centerContent}</div>

      {/* Orbital connection lines */}
      <svg className="orbital-lines" viewBox="-400 -400 800 800">
        {nodes.map((node, index) => {
          const pos = getNodePosition(index, nodes.length);
          return (
            <line
              key={`line-${node.id}`}
              x1="0"
              y1="0"
              x2={pos.x}
              y2={pos.y}
              stroke="var(--pg-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity={hoveredId === node.id ? 0.6 : 0.15}
              style={{ transition: "opacity 0.3s" }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => {
        const pos = getNodePosition(index, nodes.length);
        const isHovered = hoveredId === node.id;

        return (
          <button
            key={node.id}
            className="orbital-node"
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onNodeClick(node)}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${isHovered ? 1.15 : pos.scale})`,
              opacity: isHovered ? 1 : pos.opacity,
              zIndex: isHovered ? 50 : pos.zIndex,
            }}
          >
            <span className="orbital-node-icon">{node.icon}</span>
            <span className="orbital-node-label">{node.label}</span>
            {isHovered && (
              <span className="orbital-node-desc">{node.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
