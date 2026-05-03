import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUpRight, Shield, User, ArrowDown } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  const goAuth = () => navigate("/auth");

  // ticker nodes (left + right)
  const leftNodes = [
    { sym: "BTC", val: "64,210", x: 6, y: 28 },
    { sym: "ETH", val: "3,182", x: 11, y: 56 },
    { sym: "SOL", val: "172.4", x: 4, y: 78 },
  ];
  const rightNodes = [
    { sym: "ARB", val: "1.24", x: 88, y: 24 },
    { sym: "LDO", val: "2.05", x: 93, y: 50 },
    { sym: "AAVE", val: "98.7", x: 86, y: 74 },
  ];

  // ghost candlestick data
  const candles = Array.from({ length: 64 }, (_, i) => {
    const seed = Math.sin(i * 1.7) * 0.5 + 0.5;
    const seed2 = Math.cos(i * 0.9) * 0.5 + 0.5;
    const h = 18 + seed * 70;
    const top = 30 + seed2 * 40;
    const up = i % 3 !== 0;
    return { h, top, up, wick: h + 14 };
  });

  return (
    <div className="ld-root">
      <style>{`
        .ld-root {
          --bg:#0a0a0a; --surface:#111111; --line:#1a1a1a; --line2:#222;
          --muted:rgba(255,255,255,0.55); --muted2:rgba(255,255,255,0.35);
          --green:#9bbf6a;
          background:var(--bg); color:#fff; min-height:100vh;
          font-family:'Inter','DM Sans',sans-serif; overflow-x:hidden; position:relative;
        }
        /* radial bloom upper-right */
        .ld-bloom { position:fixed; top:-20%; right:-10%; width:75vw; height:75vw;
          background: radial-gradient(circle at 60% 40%, rgba(120,150,80,0.45) 0%, rgba(80,110,55,0.18) 28%, rgba(40,60,30,0.06) 50%, transparent 70%);
          filter: blur(40px); pointer-events:none; z-index:0; }
        .ld-grain { position:fixed; inset:0; pointer-events:none; z-index:50; opacity:0.04;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

        /* NAV */
        .ld-nav-wrap { position:fixed; top:18px; left:0; right:0; z-index:100; display:flex; justify-content:center; padding:0 24px; }
        .ld-nav { display:flex; align-items:center; gap:8px; background:rgba(17,17,17,0.85); backdrop-filter:blur(18px);
          border:1px solid var(--line2); border-radius:999px; padding:6px 8px 6px 22px; width:100%; max-width:1180px; }
        .ld-brand { display:flex; align-items:center; gap:8px; font-family:'Inter',sans-serif; font-weight:600; font-size:13px; letter-spacing:0.02em; color:#fff; text-decoration:none; cursor:pointer; }
        .ld-brand-shield { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border:1px solid var(--line2); border-radius:6px; color:var(--green); }
        .ld-nav-links { display:flex; align-items:center; gap:4px; margin-left:18px; }
        .ld-nav-links a { color:rgba(255,255,255,0.7); text-decoration:none; font-size:12.5px; padding:8px 14px; border-radius:999px; display:inline-flex; align-items:center; gap:6px; transition:background 0.2s,color 0.2s; }
        .ld-nav-links a:hover { color:#fff; background:rgba(255,255,255,0.04); }
        .ld-nav-spacer { flex:1; }
        .ld-nav-cta { display:inline-flex; align-items:center; gap:8px; background:#fff; color:#0a0a0a; font-size:12.5px; font-weight:500; padding:8px 16px; border-radius:999px; text-decoration:none; cursor:pointer; border:none; transition:opacity 0.2s; }
        .ld-nav-cta:hover { opacity:0.88; }
        .ld-sign-in { color:rgba(255,255,255,0.7); font-size:12.5px; padding:8px 14px; background:none; border:none; cursor:pointer; }
        .ld-sign-in:hover { color:#fff; }

        /* HERO */
        .ld-hero { position:relative; z-index:2; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:140px 24px 100px; text-align:center; }
        .ld-eyebrow { font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:0.22em; text-transform:uppercase; color:var(--muted2); margin-bottom:36px; display:inline-flex; align-items:center; gap:10px; }
        .ld-eyebrow::before, .ld-eyebrow::after { content:''; width:28px; height:1px; background:var(--line2); }
        .ld-headline { font-family:'Inter',sans-serif; font-size:clamp(2.6rem, 7vw, 5.8rem); line-height:1.02; letter-spacing:-0.035em; max-width:980px; margin:0; }
        .ld-headline .lt { font-weight:200; color:rgba(255,255,255,0.92); }
        .ld-headline .md { font-weight:300; color:rgba(255,255,255,0.7); font-style:italic; }
        .ld-headline .hv { font-weight:900; color:#fff; letter-spacing:-0.05em; }
        .ld-sub { margin:30px auto 0; max-width:520px; font-size:14.5px; line-height:1.7; color:rgba(255,255,255,0.55); }
        .ld-actions { margin-top:40px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
        .ld-btn-out { background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.18); border-radius:999px; padding:11px 22px; font-size:13px; font-family:inherit; cursor:pointer; transition:border-color 0.2s,background 0.2s; }
        .ld-btn-out:hover { border-color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.04); }
        .ld-btn-solid { background:#fff; color:#0a0a0a; border:none; border-radius:999px; padding:11px 22px; font-size:13px; font-weight:500; font-family:inherit; cursor:pointer; transition:opacity 0.2s; }
        .ld-btn-solid:hover { opacity:0.88; }

        /* TICKER NODES */
        .ld-nodes { position:absolute; inset:0; pointer-events:none; z-index:1; }
        .ld-node { position:absolute; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:6px; animation:ldFloat 6s ease-in-out infinite; }
        .ld-node-badge { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,0.22); background:rgba(15,15,15,0.6); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; font-size:9px; color:rgba(255,255,255,0.85); letter-spacing:0.02em; box-shadow:0 0 24px rgba(0,0,0,0.6); }
        .ld-node-label { display:flex; align-items:center; gap:5px; font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:rgba(255,255,255,0.6); letter-spacing:0.08em; text-transform:uppercase; }
        .ld-node-bullet { width:3px; height:3px; border-radius:50%; background:var(--green); }
        .ld-node-num { font-family:'IBM Plex Mono',monospace; font-size:10px; color:rgba(255,255,255,0.4); letter-spacing:0.04em; }
        @keyframes ldFloat { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-50%,calc(-50% - 6px))} }

        /* SVG arc lines */
        .ld-arcs { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; }
        .ld-arcs path { stroke:rgba(255,255,255,0.08); stroke-width:1; fill:none; }

        /* GHOST CHART */
        .ld-chart { position:absolute; left:0; right:0; bottom:140px; height:140px; display:flex; align-items:flex-end; gap:3px; padding:0 56px; opacity:0.18; pointer-events:none; z-index:1; }
        .ld-candle { flex:1; position:relative; }
        .ld-candle-wick { position:absolute; left:50%; transform:translateX(-50%); width:1px; background:rgba(255,255,255,0.5); }
        .ld-candle-body { position:absolute; left:0; right:0; border-radius:1px; }
        .ld-candle-body.up { background:rgba(255,255,255,0.7); }
        .ld-candle-body.dn { background:rgba(255,255,255,0.3); }

        /* UTILITY BARS */
        .ld-util-l { position:absolute; left:56px; bottom:48px; display:flex; align-items:center; gap:14px; font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--muted2); letter-spacing:0.14em; text-transform:uppercase; z-index:3; }
        .ld-util-l-arrow { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border:1px solid var(--line2); border-radius:50%; color:rgba(255,255,255,0.5); animation:ldBob 2.4s ease-in-out infinite; }
        @keyframes ldBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
        .ld-util-r { position:absolute; right:56px; bottom:48px; text-align:right; z-index:3; }
        .ld-util-r-title { font-family:'Inter',sans-serif; font-size:13px; color:#fff; font-weight:500; letter-spacing:-0.01em; }
        .ld-util-r-accent { display:inline-block; width:38px; height:1px; background:var(--green); margin-top:8px; }

        @media (max-width: 720px) {
          .ld-nav-links { display:none; }
          .ld-chart { padding:0 16px; bottom:170px; }
          .ld-util-l, .ld-util-r { left:16px; right:16px; }
          .ld-node { display:none; }
        }
      `}</style>

      <div className="ld-bloom" />
      <div className="ld-grain" />

      {/* NAV */}
      <div className="ld-nav-wrap">
        <nav className="ld-nav">
          <a className="ld-brand" onClick={() => navigate("/landing")}>
            <span className="ld-brand-shield"><Shield size={12} /></span>
            SYNTERICA
          </a>
          <div className="ld-nav-links">
            <a>Platform</a>
            <a>Vaults</a>
            <a>Research <ArrowUpRight size={11} /></a>
            <a>Docs</a>
          </div>
          <div className="ld-nav-spacer" />
          <button className="ld-sign-in" onClick={goAuth}>Sign in</button>
          <button className="ld-nav-cta" onClick={goAuth}>
            <User size={12} /> Create Account
          </button>
        </nav>
      </div>

      {/* HERO */}
      <section className="ld-hero">
        {/* SVG arcs */}
        <svg className="ld-arcs" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M120 250 Q 500 380 720 460" />
          <path d="M80 420 Q 480 520 720 490" />
          <path d="M140 680 Q 520 560 720 510" />
          <path d="M1320 220 Q 980 380 720 460" />
          <path d="M1380 460 Q 1000 510 720 490" />
          <path d="M1300 700 Q 960 580 720 510" />
        </svg>

        {/* Ticker nodes */}
        <div className="ld-nodes">
          {[...leftNodes, ...rightNodes].map((n) => (
            <div key={n.sym} className="ld-node" style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${(n.y % 7) * 0.3}s` }}>
              <div className="ld-node-badge">{n.sym}</div>
              <div className="ld-node-label"><span className="ld-node-bullet" />{n.sym}/USD</div>
              <div className="ld-node-num">{n.val}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", zIndex: 4 }}>
          <div className="ld-eyebrow">02 — Voice Intelligence</div>
          <h1 className="ld-headline">
            <span className="lt">One-click</span><br />
            <span className="md">for </span><span className="hv">Asset Defense</span>
          </h1>
          <p className="ld-sub">
            A premium voice coach engineered for the modern operator. Train, refine, and command attention with surgical precision — before the room ever notices.
          </p>
          <div className="ld-actions">
            <button className="ld-btn-out" onClick={goAuth}>Explore platform</button>
            <button className="ld-btn-solid" onClick={goAuth}>Get started</button>
          </div>
        </div>

        {/* Ghost candlestick chart */}
        <div className="ld-chart">
          {candles.map((c, i) => (
            <div key={i} className="ld-candle" style={{ height: "100%" }}>
              <div className="ld-candle-wick" style={{ bottom: `${c.top - 6}%`, height: `${c.wick * 0.4}%` }} />
              <div className={`ld-candle-body ${c.up ? "up" : "dn"}`} style={{ bottom: `${c.top}%`, height: `${c.h * 0.4}%` }} />
            </div>
          ))}
        </div>

        {/* Bottom-left utility */}
        <div className="ld-util-l">
          <span className="ld-util-l-arrow"><ArrowDown size={12} /></span>
          02/03 · Scroll down
        </div>

        {/* Bottom-right card */}
        <div className="ld-util-r">
          <div className="ld-util-r-title">DeFi horizons</div>
          <span className="ld-util-r-accent" />
        </div>
      </section>
    </div>
  );
}
