import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

type CardData = {
  src: string;
  caption: string;
  /** rest position relative to viewport center: x in px, y in px (negative = up) */
  restX: number;
  restY: number;
  /** rest rotation in degrees */
  restRotZ: number;
  /** rest tilt in 3D (degrees) — keeps cards looking slightly faceted */
  restRotX: number;
  restRotY: number;
  /** which side it flies in from (offset from rest pos in px) */
  startOffsetX: number;
  startOffsetY: number;
  startRotZ: number;
  /** stagger order */
  delay: number;
};

const PHOTOS: CardData[] = [
  {
    src: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=640&q=80&auto=format&fit=crop",
    caption: "Cairo",
    restX: -240,
    restY: -20,
    restRotZ: -8,
    restRotX: 6,
    restRotY: -4,
    startOffsetX: -900,
    startOffsetY: -600,
    startRotZ: -180,
    delay: 0.0,
  },
  {
    src: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=640&q=80&auto=format&fit=crop",
    caption: "Giza Pyramids",
    restX: -90,
    restY: 60,
    restRotZ: 5,
    restRotX: -4,
    restRotY: 3,
    startOffsetX: 900,
    startOffsetY: -500,
    startRotZ: 220,
    delay: 0.12,
  },
  {
    src: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=640&q=80&auto=format&fit=crop",
    caption: "Sharm el-Sheikh",
    restX: 80,
    restY: -50,
    restRotZ: -4,
    restRotX: 5,
    restRotY: -2,
    startOffsetX: 0,
    startOffsetY: -1000,
    startRotZ: -90,
    delay: 0.22,
  },
  {
    src: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=640&q=80&auto=format&fit=crop",
    caption: "Luxor",
    restX: 230,
    restY: 40,
    restRotZ: 9,
    restRotX: -6,
    restRotY: 4,
    startOffsetX: 1000,
    startOffsetY: 400,
    startRotZ: 260,
    delay: 0.34,
  },
  {
    src: "https://images.unsplash.com/photo-1583161181100-6dd2403fa44d?w=640&q=80&auto=format&fit=crop",
    caption: "Hurghada",
    restX: -30,
    restY: -130,
    restRotZ: -2,
    restRotX: 3,
    restRotY: -1,
    startOffsetX: -700,
    startOffsetY: 800,
    startRotZ: -270,
    delay: 0.46,
  },
];

export default function App() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<"ready" | "playing" | "rest">("ready");

  // run the entrance animation
  const play = useCallback(() => {
    // kill prior timeline + any free-flying tweens
    tlRef.current?.kill();
    cardsRef.current.forEach((el) => {
      if (el) gsap.killTweensOf(el);
    });

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("rest");
        // strip will-change from cards now they're resting to save GPU
        cardsRef.current.forEach((el) => {
          if (el) el.style.willChange = "auto";
        });
        // gentle idle wobble — independent loops per card so they desync
        cardsRef.current.forEach((el, i) => {
          if (!el) return;
          const p = PHOTOS[i];
          gsap.to(el, {
            rotationZ: p.restRotZ + (Math.random() > 0.5 ? 1.2 : -1.2),
            rotationY: p.restRotY + (Math.random() > 0.5 ? 2 : -2),
            duration: 2.6 + Math.random() * 0.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 0.6,
          });
        });
      },
    });

    PHOTOS.forEach((p, i) => {
      const el = cardsRef.current[i];
      if (!el) return;
      el.style.willChange = "transform";
      // place at start pos with extreme z-out + heavy rotation
      gsap.set(el, {
        x: p.restX + p.startOffsetX,
        y: p.restY + p.startOffsetY,
        z: 600,
        rotationZ: p.startRotZ,
        rotationX: 30,
        rotationY: -25,
        scale: 1.25,
        opacity: 0,
      });

      // mid-air fade-in (so they don't pop visible behind a frame)
      tl.to(
        el,
        { opacity: 1, duration: 0.15, ease: "power1.out" },
        p.delay
      );

      // main "flight" — overshoot easing, big arc through z-axis
      tl.to(
        el,
        {
          x: p.restX,
          y: p.restY,
          z: 0,
          rotationZ: p.restRotZ,
          rotationX: p.restRotX,
          rotationY: p.restRotY,
          scale: 1.0,
          // overshoot bezier per OSINT (Codrops): cubic-bezier(.8,-.5,.2,1.8)
          ease: "back.out(1.6)",
          duration: 0.95,
        },
        p.delay + 0.02
      );

      // landing "клац" — squash on touchdown
      tl.to(
        el,
        {
          keyframes: [
            { scale: 1.06, duration: 0.08, ease: "power2.out" },
            { scale: 1.0, duration: 0.18, ease: "back.out(2.2)" },
          ],
        },
        p.delay + 0.92
      );
    });

    tlRef.current = tl;
    setPhase("playing");
  }, []);

  // drop animation — every card falls offscreen with gravity + tumble
  const drop = useCallback(() => {
    tlRef.current?.kill();
    cardsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.killTweensOf(el);
      el.style.willChange = "transform";
      const dir = i % 2 === 0 ? 1 : -1;

      // exit timeline: gravity-y + flutter rotation (coupling per OSINT — lift via rotZ-vs-vy)
      const fall = gsap.timeline({
        onComplete: () => {
          if (el) el.style.willChange = "auto";
        },
      });
      // tilt up first (lift), then accelerate down
      fall.to(el, {
        rotationZ: "+=" + 20 * dir,
        rotationX: "-=10",
        y: "-=40",
        duration: 0.25,
        ease: "power1.out",
      });
      fall.to(el, {
        y: window.innerHeight + 200,
        rotationZ: "+=" + (180 + Math.random() * 180) * dir,
        rotationX: "+=" + (60 + Math.random() * 40) * (Math.random() > 0.5 ? 1 : -1),
        rotationY: "+=" + (40 + Math.random() * 30) * dir,
        x: "+=" + (60 + Math.random() * 80) * dir,
        duration: 1.4 + Math.random() * 0.4,
        ease: "power2.in",
      });
    });
    setPhase("ready");
  }, []);

  // first auto-play after mount, once images decode (so cards don't fly in blank)
  useEffect(() => {
    let cancelled = false;
    const els = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    // preload images so the first reveal looks polished
    Promise.all(
      PHOTOS.map(
        (p) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.src = p.src;
            img.onload = () => res();
            img.onerror = () => res();
          })
      )
    ).then(() => {
      if (cancelled) return;
      // hide before first paint so they don't flash at rest position
      els.forEach((el) => gsap.set(el, { opacity: 0 }));
      play();
    });
    return () => {
      cancelled = true;
    };
  }, [play]);

  return (
    <div className="stage relative w-full h-full">
      <div className="backdrop" />
      <div className="floor" />

      <header className="header">
        <h1>Polaroid POC</h1>
        <p>5 cards · flutter + tumble · GSAP physics</p>
      </header>

      <div className="absolute inset-0 flex items-center justify-center">
        {PHOTOS.map((p, i) => (
          <div
            key={i}
            ref={(el) => (cardsRef.current[i] = el)}
            className="polaroid"
            style={{ opacity: 0, zIndex: 10 + i }}
          >
            <div
              className="photo"
              style={{ backgroundImage: `url("${p.src}")` }}
              role="img"
              aria-label={p.caption}
            />
            <div className="caption">{p.caption}</div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          className="btn btn-accent"
          onClick={play}
          disabled={phase === "playing"}
          aria-label="Запустить анимацию"
        >
          ▶ Запуск
        </button>
        <button
          className="btn"
          onClick={drop}
          disabled={phase !== "rest"}
          aria-label="Сбросить карточки вниз"
        >
          ⬇ Drop
        </button>
      </div>
    </div>
  );
}
