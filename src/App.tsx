import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

type CardData = {
  src: string;
  caption: string;
  region: string;
  description: string;
  /** baseline tilt at rest (deg) */
  hangRotZ: number;
};

const PHOTOS: CardData[] = [
  {
    src: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&q=80&auto=format&fit=crop",
    caption: "Cairo",
    region: "Каир · столица",
    description:
      "Город минаретов и шумных базаров. Хан эль-Халили торгует пряностями уже 700 лет, а сабиль на горизонте подсвечивается на закате.",
    hangRotZ: -3,
  },
  {
    src: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80&auto=format&fit=crop",
    caption: "Giza",
    region: "Пирамиды Гизы",
    description:
      "Последнее из семи чудес света, до сих пор стоящее. Хеопс, Хефрен, Микерин и Сфинкс на одном плато за 30 минут от центра Каира.",
    hangRotZ: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&q=80&auto=format&fit=crop",
    caption: "Sharm",
    region: "Шарм-эль-Шейх",
    description:
      "Курорт Красного моря с коралловыми рифами Рас-Мохаммеда. Дайвинг, гольф, all-inclusive и закаты над Тиранским проливом.",
    hangRotZ: -2,
  },
  {
    src: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&auto=format&fit=crop",
    caption: "Luxor",
    region: "Луксор · древние Фивы",
    description:
      "Карнакский храмовый комплекс, Долина царей, гробница Тутанхамона. Воздушный шар на рассвете над западным берегом Нила.",
    hangRotZ: 4,
  },
  {
    src: "https://images.unsplash.com/photo-1583161181100-6dd2403fa44d?w=800&q=80&auto=format&fit=crop",
    caption: "Hurghada",
    region: "Хургада",
    description:
      "Песчаные пляжи и ветреные кайт-споты. Стартовая точка для дайв-сафари на южные рифы и острова Гифтун.",
    hangRotZ: -4,
  },
  {
    src: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80&auto=format&fit=crop",
    caption: "Dahab",
    region: "Дахаб · Синай",
    description:
      "Расслабленный синайский курорт у Голубой дыры — легендарного дайв-сайта на 100+ метров. Бедуинские кафе на берегу, кайт и сноркл.",
    hangRotZ: 3,
  },
  {
    src: "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=800&q=80&auto=format&fit=crop",
    caption: "Aswan",
    region: "Асуан · нубийский юг",
    description:
      "Фелюки под белым парусом по Нилу, Высотная плотина, остров Элефантина и храм Филе. Самый спокойный город на Ниле.",
    hangRotZ: -3,
  },
  {
    src: "https://images.unsplash.com/photo-1591375372226-1be9efe43d4f?w=800&q=80&auto=format&fit=crop",
    caption: "Alex",
    region: "Александрия",
    description:
      "Средиземноморский порт, основанный Александром Македонским. Современная Bibliotheca Alexandrina и катакомбы Ком-эль-Шукафа.",
    hangRotZ: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&q=80&auto=format&fit=crop",
    caption: "Marsa",
    region: "Марса-Алам",
    description:
      "Нетронутые рифы, дюгони в бухте Абу-Дабаб, тихие пляжи без толп. Долететь сложнее, но дайвинг лучший в Египте.",
    hangRotZ: -2,
  },
  {
    src: "https://images.unsplash.com/photo-1601553267932-1cd2a6c75ba8?w=800&q=80&auto=format&fit=crop",
    caption: "Siwa",
    region: "Оазис Сива",
    description:
      "Берберская оазисная деревня в Западной пустыне, в 50 км от ливийской границы. Солёные озёра, источник Клеопатры и крепость Шали.",
    hangRotZ: 4,
  },
];

// Catenary curve y = a + b * cosh((x - cx) / b) approximated via parabola
// For simplicity: y(x) = ropeBaseY + sag * (1 - cos(pi * (x - x0) / (x1 - x0))) / 2  — sine-shaped dip
function ropeYAt(
  x: number,
  x0: number,
  x1: number,
  baseY: number,
  sag: number
) {
  const t = (x - x0) / (x1 - x0);
  // sin-curve dip — 0 at edges, sag at middle
  return baseY + sag * Math.sin(Math.PI * t);
}

// Slope of the rope at x — used to tilt cards/clips so they look attached
function ropeSlopeAt(x: number, x0: number, x1: number, sag: number) {
  const t = (x - x0) / (x1 - x0);
  const dyDx = sag * Math.PI * Math.cos(Math.PI * t) / (x1 - x0);
  return Math.atan(dyDx) * (180 / Math.PI); // degrees
}

export default function App() {
  const stationsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const idleRef = useRef<gsap.core.Tween[]>([]);
  const [phase, setPhase] = useState<"ready" | "running" | "rest">("ready");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [pulleysSpinning, setPulleysSpinning] = useState(false);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const ropePathRef = useRef<SVGPathElement>(null);

  // measure viewport
  useEffect(() => {
    const m = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    m();
    window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);

  // rope geometry
  const ropePad = 75; // distance from edges (slightly inside pulley center)
  const ropeBaseY = viewport.h * 0.34;
  const ropeSag = Math.min(60, viewport.w * 0.05);
  const x0 = ropePad;
  const x1 = viewport.w - ropePad;

  // SVG path for rope (sin-curve approximation, mirrored)
  const buildRopePath = () => {
    const steps = 24;
    const pts: string[] = [`M ${x0} ${ropeBaseY}`];
    for (let i = 1; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const y = ropeYAt(x, x0, x1, ropeBaseY, ropeSag);
      pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  // card positions evenly spaced along rope
  const cardPositions = PHOTOS.map((_, i) => {
    const t = (i + 1) / (PHOTOS.length + 1);
    const x = x0 + (x1 - x0) * t;
    const y = ropeYAt(x, x0, x1, ropeBaseY, ropeSag);
    const slope = ropeSlopeAt(x, x0, x1, ropeSag);
    return { x, y, slope };
  });

  const killIdle = () => {
    idleRef.current.forEach((t) => t.kill());
    idleRef.current = [];
  };

  const play = useCallback(() => {
    tlRef.current?.kill();
    killIdle();
    stationsRef.current.forEach((el) => {
      if (el) gsap.killTweensOf(el);
    });

    setPulleysSpinning(true);
    setPhase("running");

    const tl = gsap.timeline({
      onComplete: () => {
        setPulleysSpinning(false);
        setPhase("rest");
        // start gentle sway loop per card — each desynced
        stationsRef.current.forEach((el, i) => {
          if (!el) return;
          el.style.willChange = "auto";
          const p = PHOTOS[i];
          const amp = 1.6 + Math.random() * 1.2;
          const dur = 2.6 + Math.random() * 1.2;
          const sway = gsap.to(el, {
            rotationZ: p.hangRotZ + (Math.random() > 0.5 ? amp : -amp),
            duration: dur,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1.0,
          });
          idleRef.current.push(sway);
        });
      },
    });

    PHOTOS.forEach((p, i) => {
      const el = stationsRef.current[i];
      if (!el) return;
      el.style.willChange = "transform";

      const target = cardPositions[i];
      // set anchor pivot at the rope point + start far off right
      // We'll animate `x` via GSAP (relative to base position set by inline style).
      gsap.set(el, {
        x: viewport.w - target.x + 200, // off-screen right
        y: 0, // RESET after Drop pushed cards below viewport
        xPercent: -50, // centers anchor on rope point (replaces inline translateX(-50%))
        rotationZ: p.hangRotZ - 12, // pre-swing (will settle to base)
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        opacity: 0,
      });

      const stagger = i * 0.18; // 180ms between cards leaving the right pulley

      tl.to(
        el,
        { opacity: 1, duration: 0.2, ease: "power1.out" },
        stagger
      );

      // Slide left along the rope to its target. The motion is smooth deceleration
      // (cards SLOW DOWN as they reach their slot, mimicking rope friction).
      tl.to(
        el,
        {
          x: 0,
          ease: "power2.out",
          duration: 1.4,
        },
        stagger
      );

      // Small swing dampening as the card lands — overshoots a touch, then settles.
      // Subtle — we DON'T want bouncy elastic. Just a soft pendulum decay.
      tl.to(
        el,
        {
          keyframes: [
            { rotationZ: p.hangRotZ + 6, ease: "sine.inOut" },
            { rotationZ: p.hangRotZ - 3, ease: "sine.inOut" },
            { rotationZ: p.hangRotZ + 1.5, ease: "sine.inOut" },
            { rotationZ: p.hangRotZ, ease: "sine.out" },
          ],
          duration: 1.6,
        },
        stagger + 0.7
      );
    });

    tlRef.current = tl;
  }, [viewport.w, viewport.h, cardPositions]);

  const drop = useCallback(() => {
    tlRef.current?.kill();
    killIdle();
    stationsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.killTweensOf(el);
      el.style.willChange = "transform";
      const dir = i % 2 === 0 ? 1 : -1;
      const swayKick = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 6);
      const fall = gsap.timeline({
        onComplete: () => {
          if (el) el.style.willChange = "auto";
        },
      });
      // small clip-release kick — tilt then fall
      fall.to(
        el,
        {
          rotationZ: `+=${swayKick}`,
          duration: 0.18,
          ease: "power1.out",
        },
        i * 0.04
      );
      fall.to(el, {
        y: viewport.h + 240,
        rotationZ: `+=${(180 + Math.random() * 180) * dir}`,
        x: `+=${(40 + Math.random() * 100) * dir}`,
        duration: 1.5 + Math.random() * 0.4,
        ease: "power2.in",
      });
    });
    setPhase("ready");
  }, [viewport.h]);

  const openCard = (idx: number) => {
    if (phase !== "rest") return;
    setActiveIdx(idx);
  };
  const closeCard = () => setActiveIdx(null);

  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx]);

  // autoplay after preload + initial viewport measured
  useEffect(() => {
    let cancelled = false;
    if (!viewport.w) return;
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
      // ensure cards are hidden before timeline kicks in
      stationsRef.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0 });
      });
      play();
    });
    return () => {
      cancelled = true;
    };
    // play depends on cardPositions which depends on viewport; we only want to autoplay once on first measurement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.w, viewport.h]);

  const active = activeIdx === null ? null : PHOTOS[activeIdx];

  // pulley vertical anchor — aligned with rope edge
  const pulleyTopL = ropeBaseY - 45;
  const pulleyTopR = ropeBaseY - 45;

  return (
    <div className="stage relative w-full h-full">
      <div className="backdrop" />

      <header className="header">
        <h1>Polaroid POC</h1>
        <p>clothesline · pulleys · 10 cards · GSAP</p>
      </header>

      {/* rope SVG */}
      <div className="rope-stage">
        <svg
          className="rope-svg"
          viewBox={`0 0 ${viewport.w} ${viewport.h}`}
          preserveAspectRatio="none"
        >
          <path className="rope-path-shadow" d={buildRopePath()} />
          <path ref={ropePathRef} className="rope-path" d={buildRopePath()} />
        </svg>
      </div>

      {/* pulleys */}
      <div
        className={`pulley pulley-l ${pulleysSpinning ? "is-spinning" : ""}`}
        style={{ top: pulleyTopL }}
      >
        <svg viewBox="0 0 100 100">
          {/* outer disc */}
          <circle cx="50" cy="50" r="42" fill="#a87234" stroke="#3d2613" strokeWidth="3" />
          <circle cx="50" cy="50" r="36" fill="#8a5b2a" />
          {/* inner hub */}
          <circle cx="50" cy="50" r="9" fill="#3d2613" />
          <circle cx="50" cy="50" r="4" fill="#8a5b2a" />
          {/* spokes */}
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line
              key={a}
              x1="50"
              y1="50"
              x2={50 + 32 * Math.cos((a * Math.PI) / 180)}
              y2={50 + 32 * Math.sin((a * Math.PI) / 180)}
              stroke="#3d2613"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          {/* axle bolts */}
          <circle cx="50" cy="50" r="2" fill="#1a1006" />
        </svg>
      </div>

      <div
        className={`pulley pulley-r ${pulleysSpinning ? "is-spinning" : ""}`}
        style={{ top: pulleyTopR }}
      >
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="#a87234" stroke="#3d2613" strokeWidth="3" />
          <circle cx="50" cy="50" r="36" fill="#8a5b2a" />
          <circle cx="50" cy="50" r="9" fill="#3d2613" />
          <circle cx="50" cy="50" r="4" fill="#8a5b2a" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line
              key={a}
              x1="50"
              y1="50"
              x2={50 + 32 * Math.cos((a * Math.PI) / 180)}
              y2={50 + 32 * Math.sin((a * Math.PI) / 180)}
              stroke="#3d2613"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          <circle cx="50" cy="50" r="2" fill="#1a1006" />
        </svg>
      </div>

      {/* hanging stations — anchors at rope, cards dangle from clip */}
      {PHOTOS.map((p, i) => {
        const pos = cardPositions[i];
        return (
          <div
            key={i}
            ref={(el) => (stationsRef.current[i] = el)}
            className="hangstation"
            style={{
              left: pos.x,
              top: pos.y,
              opacity: 0,
              zIndex: 10 + i,
            }}
          >
            {/* clip — small wooden clothespin SVG */}
            <svg className="clip" viewBox="0 0 18 26" aria-hidden="true">
              {/* two halves */}
              <rect x="2" y="0" width="6" height="22" rx="2" fill="var(--clip-wood)" stroke="var(--clip-wood-dark)" strokeWidth="1" />
              <rect x="10" y="0" width="6" height="22" rx="2" fill="var(--clip-wood)" stroke="var(--clip-wood-dark)" strokeWidth="1" />
              {/* spring coil */}
              <circle cx="9" cy="13" r="3" fill="none" stroke="#4a3018" strokeWidth="1.2" />
              <circle cx="9" cy="13" r="1.2" fill="#4a3018" />
            </svg>

            {/* card */}
            <div
              className="polaroid"
              onClick={() => openCard(i)}
              role="button"
              tabIndex={0}
              aria-label={`Открыть ${p.caption}`}
            >
              <div
                className="photo"
                style={{ backgroundImage: `url("${p.src}")` }}
                role="img"
                aria-label={p.caption}
              />
              <div className="caption">{p.caption}</div>
            </div>
          </div>
        );
      })}

      <div className="controls">
        <button
          className="btn btn-accent"
          onClick={play}
          disabled={phase === "running"}
        >
          ▶ Запуск
        </button>
        <button
          className="btn"
          onClick={drop}
          disabled={phase !== "rest"}
        >
          ⬇ Drop
        </button>
      </div>

      <div
        className={`detail-overlay ${active ? "is-open" : ""}`}
        onClick={closeCard}
      >
        {active && (
          <div className="detail-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="detail-close"
              onClick={closeCard}
              aria-label="Закрыть"
            >
              ×
            </button>
            <div
              className="detail-photo"
              style={{ backgroundImage: `url("${active.src}")` }}
              role="img"
              aria-label={active.caption}
            />
            <h2 className="detail-title">{active.caption}</h2>
            <div className="detail-sub">{active.region}</div>
            <p className="detail-text">{active.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
