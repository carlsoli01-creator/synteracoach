import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const waveRef = useRef<HTMLDivElement>(null);
  const dimRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLDivElement>(null);
  const scoreCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [user, loading, navigate]);

  const goAuth = useCallback(() => navigate("/auth"), [navigate]);

  // Animated flowing paths
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const allPaths: {el: SVGPathElement;speed: number;offset: number;}[] = [];

    [-1, 1].forEach((pos) => {
      for (let i = 0; i < 36; i++) {
        const d =
        `M-${380 - i * 5 * pos} -${189 + i * 6}` +
        `C-${380 - i * 5 * pos} -${189 + i * 6}` +
        ` -${312 - i * 5 * pos} ${216 - i * 6}` +
        ` ${152 - i * 5 * pos} ${343 - i * 6}` +
        `C${616 - i * 5 * pos} ${470 - i * 6}` +
        ` ${684 - i * 5 * pos} ${875 - i * 6}` +
        ` ${684 - i * 5 * pos} ${875 - i * 6}`;
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", d);
        p.setAttribute("stroke", "white");
        p.setAttribute("stroke-width", (0.3 + i * 0.022).toFixed(3));
        p.setAttribute("stroke-opacity", (0.03 + i * 0.009).toFixed(3));
        p.setAttribute("fill", "none");
        const len = 2200;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len * (0.2 + Math.random() * 0.5));
        svg.appendChild(p);
        allPaths.push({ el: p, speed: 0.05 + Math.random() * 0.06, offset: len * (0.2 + Math.random() * 0.5) });
      }
    });

    let last = performance.now();
    let animId: number;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      allPaths.forEach((p) => {
        p.offset -= p.speed * dt * 0.1;
        if (p.offset < -2200) p.offset = 400;
        p.el.style.strokeDashoffset = String(p.offset);
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    };
  }, []);

  // Letter-by-letter title
  useEffect(() => {
    const words = ["Speak", "with", "conviction.", "Not", "guesswork."];
    let delay = 0.25;
    words.forEach((word, wi) => {
      const el = titleRefs.current[wi];
      if (!el) return;
      el.innerHTML = "";
      word.split("").forEach((ch) => {
        const s = document.createElement("span");
        s.className = "lp-letter";
        s.style.setProperty("--d", delay.toFixed(2) + "s");
        s.textContent = ch;
        el.appendChild(s);
        delay += 0.028;
      });
      if (wi < words.length - 1) {
        const sp = document.createElement("span");
        sp.style.cssText = "display:inline-block;width:0.18em";
        el.appendChild(sp);
      }
      delay += 0.04;
    });
  }, []);

  // Waveform bars
  useEffect(() => {
    const wf = waveRef.current;
    if (!wf) return;
    wf.innerHTML = "";
    for (let i = 0; i < 56; i++) {
      const b = document.createElement("div");
      b.className = "lp-wave-bar";
      b.style.cssText = `--dur:${(0.4 + Math.random() * 0.7).toFixed(2)}s;--delay:${(Math.random() * 0.65).toFixed(2)}s`;
      wf.appendChild(b);
    }
  }, []);

  // Dimension mini bars
  useEffect(() => {
    for (let d = 0; d < 7; d++) {
      const el = dimRefs.current[d];
      if (!el) continue;
      el.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        const b = document.createElement("div");
        b.className = "lp-dim-mini";
        b.style.cssText = `--d:${(0.5 + Math.random() * 0.8).toFixed(2)}s;--dl:${(i * 0.06 + Math.random() * 0.1).toFixed(2)}s;height:${16 + Math.random() * 28}px`;
        el.appendChild(b);
      }
    }
  }, []);

  // Scroll reveal + counter
  useEffect(() => {
    const reveals = document.querySelectorAll(".lp-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-visible");
            e.target.querySelectorAll<HTMLElement>("[data-w]").forEach((b) =>
            setTimeout(() => b.style.width = b.dataset.w || "0%", 300)
            );
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => obs.observe(el));

    // Counter
    const sc = scoreCardRef.current;
    const ce = counterRef.current;
    if (sc && ce) {
      const co = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              document.querySelectorAll<HTMLElement>("[data-w]").forEach((b) =>
              setTimeout(() => b.style.width = b.dataset.w || "0%", 400)
              );
              let n = 0;
              const t = setInterval(() => {
                n += 2;
                if (n >= 84) {n = 84;clearInterval(t);}
                ce.textContent = String(n);
              }, 18);
              co.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      co.observe(sc);
      return () => {obs.disconnect();co.disconnect();};
    }
    return () => obs.disconnect();
  }, []);

  const dimLabels = ["Overall Score", "Pace & Rhythm", "Confidence", "Clarity", "Filler Words", "Power Words", "Persuasion"];

  return (
    <div className="lp-root">
      <style>{`
        .lp-root {
          --lp-bg: #050507; --lp-surface: #0c0c0f; --lp-surface2: #111115;
          --lp-border: #1a1a20; --lp-border2: #232330;
          --lp-text: #f0eee8; --lp-muted: #60606e; --lp-muted2: #38383f;
          --lp-accent: #e8ff47; --lp-white: #ffffff;
          background: var(--lp-bg); color: var(--lp-text);
          font-family: 'DM Sans', sans-serif; overflow-x: hidden;
          min-height: 100vh;
        }
        .lp-root::after {
          content:''; position:fixed; inset:0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events:none; z-index:9999;
        }

        /* NAV */
        .lp-nav { position:fixed; top:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; padding:0 56px; height:68px; background:rgba(5,5,7,0.8); backdrop-filter:blur(28px); border-bottom:1px solid var(--lp-border); }
        .lp-logo { font-family:'Syne',sans-serif; font-size:1.15rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--lp-text); text-decoration:none; cursor:pointer; }
        .lp-logo span { color:var(--lp-white); }
        .lp-nav-links { display:flex; gap:36px; list-style:none; padding:0; margin:0; }
        .lp-nav-links a { color:var(--lp-muted); text-decoration:none; font-size:0.85rem; transition:color 0.2s; }
        .lp-nav-links a:hover { color:var(--lp-text); }
        .lp-nav-right { display:flex; align-items:center; gap:20px; }
        .lp-btn-ghost { color:var(--lp-muted); text-decoration:none; font-size:0.85rem; transition:color 0.2s; cursor:pointer; background:none; border:none; }
        .lp-btn-ghost:hover { color:var(--lp-text); }
        .lp-btn-nav { background:var(--lp-white); color:#050507; font-family:'DM Mono',monospace; font-size:0.72rem; font-weight:500; letter-spacing:0.06em; padding:9px 22px; border-radius:3px; text-decoration:none; border:none; cursor:pointer; transition:opacity 0.2s,transform 0.15s; }
        .lp-btn-nav:hover { opacity:0.85; transform:translateY(-1px); }

        /* HERO */
        .lp-hero { position:relative; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:130px 24px 100px; overflow:hidden; }
        .lp-paths-canvas { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0; transition:opacity 0.3s ease; }
        .lp-hero-content { position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; }
        .lp-hero-content, .lp-section, .lp-footer { position:relative; z-index:1; }
        .lp-hero-eyebrow { display:inline-flex; align-items:center; gap:8px; font-family:'DM Mono',monospace; font-size:0.68rem; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.4); border:1px solid rgba(255,255,255,0.08); padding:6px 16px; border-radius:2px; margin-bottom:40px; animation:lpFadeUp 0.7s ease both; }
        .lp-live-dot { width:5px; height:5px; border-radius:50%; background:var(--lp-accent); animation:lpPulse 2s infinite; }
        @keyframes lpPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .lp-hero-title { font-family:'Syne',sans-serif; font-size:clamp(3rem,8vw,6.5rem); font-weight:400; line-height:0.96; letter-spacing:-0.04em; max-width:900px; }
        .lp-hero-title .lp-word { display:inline-block; margin-right:0.16em; }
        .lp-letter { display:inline-block; background:linear-gradient(160deg,#ffffff 0%,rgba(255,255,255,0.7) 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:lpLetterUp 0.55s ease both; animation-delay:var(--d,0s); }
        @keyframes lpLetterUp { from{opacity:0;transform:translateY(55px)} to{opacity:1;transform:translateY(0)} }
        .lp-hero-sub { margin-top:32px; color:var(--lp-muted); font-size:1.05rem; max-width:460px; line-height:1.8; animation:lpFadeUp 0.75s 0.6s ease both; }
        .lp-hero-actions { margin-top:48px; display:flex; gap:12px; flex-wrap:wrap; justify-content:center; animation:lpFadeUp 0.75s 0.7s ease both; }
        .lp-btn-primary { display:inline-flex; align-items:center; gap:10px; background:var(--lp-white); color:#050507; font-family:'DM Mono',monospace; font-size:0.78rem; font-weight:500; letter-spacing:0.06em; padding:14px 28px; border-radius:3px; text-decoration:none; border:none; cursor:pointer; transition:opacity 0.2s,transform 0.2s; }
        .lp-btn-primary:hover { transform:translateY(-2px); opacity:0.88; }
        .lp-btn-secondary { display:inline-flex; align-items:center; gap:8px; background:transparent; border:1px solid var(--lp-border2); color:var(--lp-muted); font-family:'DM Mono',monospace; font-size:0.78rem; letter-spacing:0.06em; padding:14px 28px; border-radius:3px; text-decoration:none; cursor:pointer; transition:border-color 0.2s,color 0.2s; }
        .lp-btn-secondary:hover { border-color:rgba(255,255,255,0.18); color:var(--lp-text); }

        /* HERO VISUAL */
        .lp-hero-visual { margin-top:80px; width:100%; max-width:860px; animation:lpFadeUp 0.8s 0.8s ease both; }
        .lp-score-card { background:rgba(12,12,15,0.92); border:1px solid var(--lp-border); border-radius:14px; overflow:hidden; box-shadow:0 48px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.04); backdrop-filter:blur(16px); }
        .lp-score-topbar { background:rgba(8,8,11,0.9); border-bottom:1px solid var(--lp-border); padding:13px 20px; display:flex; align-items:center; gap:10px; }
        .lp-tl { width:10px; height:10px; border-radius:50%; }
        .lp-tl-r{background:#ff5f57} .lp-tl-y{background:#ffbd2e} .lp-tl-g{background:#28c840}
        .lp-tl-row { display:flex; gap:6px; }
        .lp-topbar-label { font-family:'DM Mono',monospace; font-size:0.68rem; color:var(--lp-muted2); letter-spacing:0.1em; margin-left:auto; }
        .lp-score-body { padding:36px; display:grid; grid-template-columns:1fr 1fr; gap:36px; align-items:start; }
        .lp-waveform-area { display:flex; flex-direction:column; gap:22px; }
        .lp-wave-label { font-family:'DM Mono',monospace; font-size:0.62rem; color:var(--lp-muted); letter-spacing:0.14em; text-transform:uppercase; }
        .lp-waveform { display:flex; align-items:center; gap:2px; height:52px; }
        .lp-wave-bar { flex:1; border-radius:1px; background:rgba(255,255,255,0.45); animation:lpWaveanim var(--dur,0.8s) ease-in-out infinite alternate; animation-delay:var(--delay,0s); }
        @keyframes lpWaveanim { from{transform:scaleY(0.2)} to{transform:scaleY(1)} }
        .lp-transcript-box { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:14px 16px; font-family:'DM Mono',monospace; font-size:0.74rem; color:var(--lp-muted); line-height:1.75; }
        .lp-transcript-box .hl { color:rgba(255,255,255,0.7); }
        .lp-transcript-box .fil { color:rgba(255,100,100,0.65); text-decoration:underline; text-decoration-style:wavy; }
        .lp-tag-row { display:flex; gap:6px; flex-wrap:wrap; }
        .lp-tag { font-family:'DM Mono',monospace; font-size:0.58rem; letter-spacing:0.08em; padding:3px 9px; border-radius:2px; border:1px solid rgba(255,255,255,0.07); color:rgba(255,255,255,0.3); }
        .lp-tag.on { border-color:rgba(255,255,255,0.14); color:rgba(255,255,255,0.55); }
        .lp-tag.warn { border-color:rgba(255,100,80,0.18); color:rgba(255,100,80,0.55); }
        .lp-scores-area { display:flex; flex-direction:column; gap:16px; }
        .lp-overall-score { display:flex; align-items:baseline; gap:8px; margin-bottom:6px; }
        .lp-overall-num { font-family:'Syne',sans-serif; font-size:4.2rem; font-weight:800; line-height:1; color:var(--lp-white); }
        .lp-overall-sub { display:flex; flex-direction:column; }
        .lp-overall-denom { font-family:'DM Mono',monospace; font-size:1rem; color:var(--lp-muted); }
        .lp-overall-label { font-family:'DM Mono',monospace; font-size:0.6rem; color:var(--lp-muted); letter-spacing:0.12em; text-transform:uppercase; margin-top:2px; }
        .lp-score-row { display:flex; flex-direction:column; gap:7px; }
        .lp-score-row-top { display:flex; justify-content:space-between; }
        .lp-score-row-label { font-family:'DM Mono',monospace; font-size:0.68rem; color:var(--lp-muted); letter-spacing:0.08em; }
        .lp-score-row-val { font-family:'DM Mono',monospace; font-size:0.68rem; color:rgba(255,255,255,0.55); }
        .lp-bar-track { height:2px; background:var(--lp-border); border-radius:2px; overflow:hidden; }
        .lp-bar-fill { height:100%; background:var(--lp-white); border-radius:2px; transition:width 1.2s cubic-bezier(0.4,0,0.2,1); opacity:0.45; }
        .lp-bar-fill.hi { opacity:0.8; }
        .lp-bar-fill.lo { opacity:0.22; }

        /* SECTIONS */
        .lp-section { border-top:1px solid var(--lp-border); }
        .lp-container { max-width:1100px; margin:0 auto; padding:180px 56px; }
        .lp-sec-label { font-family:'DM Mono',monospace; font-size:0.62rem; letter-spacing:0.2em; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-bottom:20px; }
        .lp-sec-title { font-family:'Syne',sans-serif; font-size:clamp(2rem,3.5vw,3rem); font-weight:700; letter-spacing:-0.03em; line-height:1.1; max-width:620px; color:var(--lp-muted); }
        .lp-sec-title .wh { color:var(--lp-white); }

        /* STEPS */
        .lp-steps { display:grid; grid-template-columns:1fr 1fr 1fr; margin-top:100px; border:1px solid var(--lp-border); border-radius:12px; overflow:hidden; }
        .lp-step { background:var(--lp-surface); padding:68px 52px; transition:background 0.3s; }
        .lp-step:hover { background:var(--lp-surface2); }
        .lp-step + .lp-step { border-left:1px solid var(--lp-border); }
        .lp-step-icon { width:28px; height:28px; margin-bottom:32px; color:rgba(255,255,255,0.2); }
        .lp-step h3 { font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:700; letter-spacing:-0.02em; margin-bottom:14px; color:var(--lp-white); }
        .lp-step p { font-size:0.9rem; color:var(--lp-muted); line-height:1.8; }

        /* DIMS */
        .lp-dims-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:14px; margin-top:100px; }
        .lp-dim-card { background:var(--lp-surface); border:1px solid var(--lp-border); border-radius:10px; padding:36px 18px; text-align:center; transition:border-color 0.3s,transform 0.3s; }
        .lp-dim-card:hover { border-color:var(--lp-border2); transform:translateY(-3px); }
        .lp-dim-label { font-family:'DM Mono',monospace; font-size:0.72rem; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,0.28); line-height:1.5; margin-bottom:16px; }
        .lp-dim-bar { height:52px; display:flex; align-items:flex-end; justify-content:center; gap:1.5px; }
        .lp-dim-mini { width:3px; border-radius:2px 2px 0 0; background:rgba(255,255,255,0.22); animation:lpDimwave var(--d,0.6s) ease-in-out infinite alternate; animation-delay:var(--dl,0s); }
        @keyframes lpDimwave { from{transform:scaleY(0.2);opacity:0.15} to{transform:scaleY(1);opacity:0.55} }

        /* FEATURES */
        .lp-features-bento { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:100px; }
        .lp-feat { background:var(--lp-surface); border:1px solid var(--lp-border); border-radius:12px; padding:68px; transition:border-color 0.3s; overflow:hidden; }
        .lp-feat:hover { border-color:var(--lp-border2); }
        .lp-feat.wide { grid-column:span 2; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .lp-feat-label { font-family:'DM Mono',monospace; font-size:0.6rem; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.18); margin-bottom:18px; }
        .lp-feat h3 { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:700; letter-spacing:-0.025em; line-height:1.25; margin-bottom:14px; color:var(--lp-white); }
        .lp-feat p { font-size:0.9rem; color:var(--lp-muted); line-height:1.8; }
        .lp-feat-visual { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:24px; }
        .lp-chat-msg { display:flex; gap:10px; margin-bottom:16px; }
        .lp-chat-msg:last-child { margin-bottom:0; }
        .lp-chat-avatar { width:26px; height:26px; border-radius:3px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:rgba(255,255,255,0.35); flex-shrink:0; font-family:'DM Mono',monospace; }
        .lp-chat-bubble { background:rgba(255,255,255,0.04); border-radius:0 8px 8px 8px; padding:10px 14px; font-size:0.75rem; color:rgba(255,255,255,0.45); line-height:1.7; font-family:'DM Mono',monospace; max-width:90%; }
        .lp-chat-bubble.user { background:rgba(255,255,255,0.07); border-radius:8px 0 8px 8px; margin-left:auto; color:rgba(255,255,255,0.6); }
        .lp-chat-msg.right { flex-direction:row-reverse; }
        .lp-scenario-list { display:flex; flex-direction:column; gap:8px; margin-top:28px; }
        .lp-scenario-item { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:6px; border:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.02); cursor:pointer; transition:all 0.2s; }
        .lp-scenario-item:first-child { border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); }
        .lp-scenario-item:hover { border-color:rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); }
        .lp-sc-icon { width:18px; height:18px; flex-shrink:0; color:rgba(255,255,255,0.2); }
        .lp-sc-name { font-family:'DM Mono',monospace; font-size:0.72rem; color:rgba(255,255,255,0.4); flex:1; }
        .lp-scenario-item:first-child .lp-sc-name { color:rgba(255,255,255,0.7); }
        .lp-sc-go { font-family:'DM Mono',monospace; font-size:0.6rem; color:rgba(255,255,255,0.18); }
        .lp-scenario-item:first-child .lp-sc-go { color:rgba(255,255,255,0.35); }

        /* TESTIMONIALS */
        .lp-testi-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:100px; }
        .lp-testi { background:var(--lp-surface); border:1px solid var(--lp-border); border-radius:12px; padding:56px; display:flex; flex-direction:column; gap:28px; transition:border-color 0.3s; }
        .lp-testi:hover { border-color:var(--lp-border2); }
        .lp-stars { color:rgba(255,255,255,0.25); font-size:0.7rem; letter-spacing:3px; }
        .lp-testi-text { font-size:0.9rem; color:rgba(255,255,255,0.45); line-height:1.85; }
        .lp-testi-author { display:flex; align-items:center; gap:12px; margin-top:auto; }
        .lp-testi-avatar { width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:0.68rem; font-weight:700; color:rgba(255,255,255,0.4); flex-shrink:0; }
        .lp-testi-name { font-size:0.85rem; font-weight:500; color:rgba(255,255,255,0.65); }
        .lp-testi-role { font-family:'DM Mono',monospace; font-size:0.62rem; color:var(--lp-muted); margin-top:2px; }

        /* FOOTER */
        .lp-footer { border-top:1px solid var(--lp-border); padding:44px 56px; display:flex; align-items:center; justify-content:space-between; }
        .lp-footer-logo { font-family:'Syne',sans-serif; font-size:0.9rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:var(--lp-muted); }
        .lp-footer-links { display:flex; gap:32px; }
        .lp-footer-links a { font-family:'DM Mono',monospace; font-size:0.68rem; color:var(--lp-muted2); text-decoration:none; letter-spacing:0.04em; transition:color 0.2s; }
        .lp-footer-links a:hover { color:var(--lp-muted); }
        .lp-footer-copy { font-family:'DM Mono',monospace; font-size:0.62rem; color:var(--lp-muted2); }

        @keyframes lpFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .lp-reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s ease,transform 0.7s ease; }
        .lp-visible { opacity:1; transform:translateY(0); }

        @media (max-width:900px) {
          .lp-nav { padding:0 24px; }
          .lp-nav-links { display:none; }
          .lp-container { padding:80px 24px; }
          .lp-steps { grid-template-columns:1fr; }
          .lp-step + .lp-step { border-left:none; border-top:1px solid var(--lp-border); }
          .lp-dims-grid { grid-template-columns:repeat(4,1fr); }
          .lp-features-bento { grid-template-columns:1fr; }
          .lp-feat.wide { grid-column:span 1; grid-template-columns:1fr; }
          .lp-testi-grid { grid-template-columns:1fr; }
          .lp-score-body { grid-template-columns:1fr; }
          .lp-footer { flex-direction:column; gap:20px; text-align:center; }
          .lp-footer-links { flex-wrap:wrap; justify-content:center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <span className="lp-logo">SYNT<span>E</span>RA</span>
        <ul className="lp-nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#features">Features</a></li>
        </ul>
        <div className="lp-nav-right">
          <button className="lp-btn-ghost" onClick={goAuth}>Sign in</button>
          <button className="lp-btn-nav" onClick={goAuth}>Start free →</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="lp-hero">
        <svg ref={svgRef} className="lp-paths-canvas" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <title>Background Paths</title>
        </svg>

        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <div className="lp-live-dot" />
            AI Voice Coach — Now in Beta
          </div>

          <h1 className="lp-hero-title">
            {["Speak", "with", "conviction.", "Not", "guesswork."].map((_, i) =>
            <span key={i}>
                <span className="lp-word" ref={(el) => {titleRefs.current[i] = el;}} />
                {i === 2 && <br />}
              </span>
            )}
          </h1>

          <p className="lp-hero-sub">
            ​


























  
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={goAuth}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
              Start coaching — it's free
            </button>
            <a href="#how" className="lp-btn-secondary bg-secondary-foreground text-primary-foreground">See how it works ↓</a>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-score-card" ref={scoreCardRef}>
              <div className="lp-score-topbar">
                <div className="lp-tl-row"><div className="lp-tl lp-tl-r" /><div className="lp-tl lp-tl-y" /><div className="lp-tl lp-tl-g" /></div>
                <span className="lp-topbar-label">synterica — live analysis</span>
              </div>
              <div className="lp-score-body">
                <div className="lp-waveform-area">
                  <div className="lp-wave-label">Recording · 0:32</div>
                  <div className="lp-waveform" ref={waveRef} />
                  <div className="lp-transcript-box">
                    "So <span className="fil">um</span> the main thing I wanted to highlight is that <span className="hl">our Q3 results exceeded</span> expectations by <span className="hl">23%</span>, and <span className="fil">like</span> the team really <span className="hl">delivered on every front</span>."
                  </div>
                  <div className="lp-tag-row">
                    <div className="lp-tag on">Strong opener</div>
                    <div className="lp-tag warn">2 filler words</div>
                    <div className="lp-tag on">3 power words</div>
                  </div>
                </div>
                <div className="lp-scores-area">
                  <div className="lp-overall-score">
                    <div className="lp-overall-num" ref={counterRef}>0</div>
                    <div className="lp-overall-sub">
                      <div className="lp-overall-denom">/100</div>
                      <div className="lp-overall-label">Overall Score</div>
                    </div>
                  </div>
                  {[{ label: "PACE", val: "88", w: "88%", cls: "hi" }, { label: "CONFIDENCE", val: "91", w: "91%", cls: "hi" }, { label: "CLARITY", val: "76", w: "76%", cls: "" }, { label: "FILLER WORDS", val: "62", w: "62%", cls: "lo" }, { label: "PERSUASION", val: "84", w: "84%", cls: "hi" }].map((s) => <div className="lp-score-row" key={s.label}>
                      <div className="lp-score-row-top">
                        <span className="lp-score-row-label">{s.label}</span>
                        <span className="lp-score-row-val">{s.val}</span>
                      </div>
                      <div className="lp-bar-track">
                        <div className={`lp-bar-fill ${s.cls}`} style={{ width: "0%" }} data-w={s.w} />
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-section" id="how">
        <div className="lp-container">
          <div className="lp-sec-label">How it works</div>
          <div className="lp-sec-title">Three steps to <span className="wh">a better speaker</span></div>
          <div className="lp-steps lp-reveal">
            <div className="lp-step">
              <svg className="lp-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></svg>
              <h3>Record 15–45s</h3>
              <p>Hit record and speak on any topic — a pitch, a presentation, a job interview answer. No script required.</p>
            </div>
            <div className="lp-step">
              <svg className="lp-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 16 4-4 4 4 4-6" /></svg>
              <h3>AI Scores Your Delivery</h3>
              <p>Our model analyzes 7 dimensions of your speech in real time — not just what you said, but how you said it.</p>
            </div>
            <div className="lp-step">
              <svg className="lp-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
              <h3>Get Coached & Improve</h3>
              <p>Receive specific, actionable feedback and track your progress across sessions with streaks, badges, and scores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7 DIMENSIONS */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-sec-label">7 Dimensions</div>
          <div className="lp-sec-title">Every layer of <span className="wh">your voice, scored</span></div>
          <div className="lp-dims-grid lp-reveal">
            {dimLabels.map((label, i) => <div className="lp-dim-card" key={label}>
                <div className="lp-dim-label">{label}</div>
                <div className="lp-dim-bar" ref={(el) => {dimRefs.current[i] = el;}} />
              </div>)}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-sec-label">Features</div>
          <div className="lp-sec-title">Everything you need to <span className="wh">master your voice</span></div>
          <div className="lp-features-bento">
            {/* AI Coach - wide */}
            <div className="lp-feat wide lp-reveal">
              <div>
                <div className="lp-feat-label">AI Coach</div>
                <h3>Your personal voice<br />coach, always on</h3>
                <p>Chat with your AI coach after every session. Ask why you scored low on clarity and get a specific, honest answer with drills to fix it.</p>
              </div>
              <div className="lp-feat-visual">
                <div className="lp-chat-msg">
                  <div className="lp-chat-avatar">AI</div>
                  <div className="lp-chat-bubble">Your pace was strong at 148 WPM — but I noticed 3 hedging phrases in 30 seconds. "I think", "kind of", "maybe". These undercut your credibility.</div>
                </div>
                <div className="lp-chat-msg right">
                  <div className="lp-chat-avatar">U</div>
                  <div className="lp-chat-bubble user">How do I stop saying "I think"?</div>
                </div>
                <div className="lp-chat-msg">
                  <div className="lp-chat-avatar">AI</div>
                  <div className="lp-chat-bubble">Replace with declaratives. Instead of "I think this is important" → "This is important." Try today's drill: 60 seconds on your work, zero hedges.</div>
                </div>
              </div>
            </div>

            {/* Practice */}
            <div className="lp-feat lp-reveal">
              <div className="lp-feat-label">Practice</div>
              <h3>Real-world scenarios</h3>
              <p>Practice job interviews, sales pitches, TEDx-style talks, and client presentations — all with instant AI scoring.</p>
              <div className="lp-scenario-list">
                {[{ name: "Job Interview Answer", icon: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>, go: true }, { name: "Investor Pitch (60s)", icon: <><path d="M5 12h14M12 5l7 7-7 7" /></> }, { name: "TEDx-style Talk", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></> }, { name: "Sales Call Opener", icon: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.08 3.24 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91" /></> }].map((s) => <div className="lp-scenario-item" key={s.name}>
                    <svg className="lp-sc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">{s.icon}</svg>
                    <span className="lp-sc-name">{s.name}</span>
                    {s.go && <span className="lp-sc-go">START →</span>}
                  </div>)}
              </div>
            </div>

            {/* Progress */}
            <div className="lp-feat lp-reveal">
              <div className="lp-feat-label">Progress</div>
              <h3>Track every session</h3>
              <p>See your scores trend over days and weeks. Streaks, badges, and history keep you accountable and motivated to improve.</p>
              <div className="lp-feat-visual" style={{ marginTop: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6, height: 80, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {[{ h: 28, d: "M" }, { h: 38, d: "T" }, { h: 44, d: "W", o: 0.1 }, { h: 34, d: "T" }, { h: 52, d: "F", o: 0.16 }, { h: 60, d: "S", o: 0.24 }, { h: 72, d: "S", o: 0.38, tc: "rgba(255,255,255,0.45)" }].map((bar, i) => <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                      <div style={{ width: "100%", background: `rgba(255,255,255,${bar.o || 0.07})`, borderRadius: "2px 2px 0 0", height: bar.h }} />
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", color: bar.tc || "var(--lp-muted)" }}>{bar.d}</span>
                    </div>)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "var(--lp-muted)" }}>This week</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>+12 pts avg →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-sec-label">What people say</div>
          <div className="lp-sec-title">Used by speakers <span className="wh">who mean business</span></div>
          <div className="lp-testi-grid lp-reveal">
            {[{ text: "I used to say 'um' constantly in presentations. After two weeks with Synterica, my filler word count dropped from 18 to 4 per minute. My manager noticed.", initials: "JK", name: "Jordan K.", role: "Product Manager · Series B Startup" }, { text: "The 7-dimension breakdown is insane. I always knew I spoke fast, but seeing my confidence score jump from 64 to 89 after 10 sessions? That's real data.", initials: "RL", name: "Rachel L.", role: "Sales Director · Fortune 500" }, { text: "Pitched to investors last month. Used Synterica to practice 20+ times beforehand. Got the term sheet. Probably a coincidence, but probably not.", initials: "MT", name: "Marcus T.", role: "Founder · YC W25" }].map((t) =>
            <div className="lp-testi" key={t.initials}>
                <div className="lp-stars">★★★★★</div>
                <p className="lp-testi-text">"{t.text}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.initials}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">SYNTERICA</div>
        <div className="lp-footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/cookies">Cookies</a>
        </div>
        <div className="lp-footer-copy">© 2026 Synterica. All rights reserved.</div>
      </footer>
    </div>);

}