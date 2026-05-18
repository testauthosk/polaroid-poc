import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

type CardData = {
  src: string;
  caption: string;
  region: string;
  description: string;
  /** rest position relative to viewport center: x in px, y in px */
  restX: number;
  restY: number;
  /** rest rotations in degrees */
  restRotZ: number;
  restRotX: number;
  restRotY: number;
  /** start offset from rest pos */
  startOffsetX: number;
  startOffsetY: number;
  startRotZ: number;
  /** stagger order */
  delay: number;
};

const PHOTOS: CardData[] = [
  {
    src: "https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&q=80&auto=format&fit=crop",
    caption: "Cairo",
    region: "Каир · столица",
    description:
      "Город минаретов и шумных базаров. Хан эль-Халили торгует пряностями уже 700 лет, а сабиль на горизонте подсвечивается на закате.",
    restX: -320,
    restY: -90,
    restRotZ: -7,
    restRotX: 5,
    restRotY: -3,
    startOffsetX: -1000,
    startOffsetY: -600,
    startRotZ: -180,
    delay: 0.0,
  },
  {
    src: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=80&auto=format&fit=crop",
    caption: "Giza",
    region: "Пирамиды Гизы",
    description:
      "Последнее из семи чудес света, до сих пор стоящее. Хеопс, Хефрен, Микерин и Сфинкс на одном плато за 30 минут от центра Каира.",
    restX: -170,
    restY: 70,
    restRotZ: 5,
    restRotX: -4,
    restRotY: 3,
    startOffsetX: 900,
    startOffsetY: -700,
    startRotZ: 220,
    delay: 0.1,
  },
  {
    src: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&q=80&auto=format&fit=crop",
    caption: "Sharm",
    region: "Шарм-эль-Шейх",
    description:
      "Курорт Красного моря с коралловыми рифами Рас-Мохаммеда. Дайвинг, гольф, all-inclusive и закаты над Тиранским проливом.",
    restX: 0,
    restY: -130,
    restRotZ: -3,
    restRotX: 4,
    restRotY: -2,
    startOffsetX: 0,
    startOffsetY: -1000,
    startRotZ: -90,
    delay: 0.2,
  },
  {
    src: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&auto=format&fit=crop",
    caption: "Luxor",
    region: "Луксор · древние Фивы",
    description:
      "Карнакский храмовый комплекс, Долина царей, гробница Тутанхамона. Воздушный шар на рассвете над западным берегом Нила.",
    restX: 170,
    restY: 70,
    restRotZ: 8,
    restRotX: -5,
    restRotY: 4,
    startOffsetX: 1100,
    startOffsetY: 200,
    startRotZ: 260,
    delay: 0.3,
  },
  {
    src: "https://images.unsplash.com/photo-1583161181100-6dd2403fa44d?w=800&q=80&auto=format&fit=crop",
    caption: "Hurghada",
    region: "Хургада",
    description:
      "Песчаные пляжи и ветреные кайт-споты. Стартовая точка для дайв-сафари на южные рифы и острова Гифтун.",
    restX: 320,
    restY: -50,
    restRotZ: -5,
    restRotX: 3,
    restRotY: -1,
    startOffsetX: -800,
    startOffsetY: 800,
    startRotZ: -270,
    delay: 0.4,
  },
  {
    src: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80&auto=format&fit=crop",
    caption: "Dahab",
    region: "Дахаб · Синай",
    description:
      "Расслабленный синайский курорт у Голубой дыры — легендарного дайв-сайта на 100+ метров. Бедуинские кафе на берегу, кайт и сноркл.",
    restX: -240,
    restY: 140,
    restRotZ: 6,
    restRotX: -3,
    restRotY: 5,
    startOffsetX: -1100,
    startOffsetY: 600,
    startRotZ: 200,
    delay: 0.5,
  },
  {
    src: "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=800&q=80&auto=format&fit=crop",
    caption: "Aswan",
    region: "Асуан · нубийский юг",
    description:
      "Фелюки под белым парусом по Нилу, Высотная плотина, остров Элефантина и храм Филе. Самый спокойный город на Ниле.",
    restX: 240,
    restY: 160,
    restRotZ: -6,
    restRotX: 4,
    restRotY: -3,
    startOffsetX: 1000,
    startOffsetY: -300,
    startRotZ: -240,
    delay: 0.6,
  },
  {
    src: "https://images.unsplash.com/photo-1591375372226-1be9efe43d4f?w=800&q=80&auto=format&fit=crop",
    caption: "Alex",
    region: "Александрия",
    description:
      "Средиземноморский порт, основанный Александром Македонским. Современная Bibliotheca Alexandrina и катакомбы Ком-эль-Шукафа.",
    restX: -90,
    restY: -220,
    restRotZ: 4,
    restRotX: -2,
    restRotY: 2,
    startOffsetX: -700,
    startOffsetY: -900,
    startRotZ: 160,
    delay: 0.7,
  },
  {
    src: "https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&q=80&auto=format&fit=crop",
    caption: "Marsa Alam",
    region: "Марса-Алам",
    description:
      "Нетронутые рифы, дюгони в бухте Абу-Дабаб, тихие пляжи без толп. Долететь сложнее, но дайвинг лучший в Египте.",
    restX: 100,
    restY: 230,
    restRotZ: 3,
    restRotX: 5,
    restRotY: -4,
    startOffsetX: 800,
    startOffsetY: 900,
    startRotZ: -200,
    delay: 0.8,
  },
  {
    src: "https://images.unsplash.com/photo-1601553267932-1cd2a6c75ba8?w=800&q=80&auto=format&fit=crop",
    caption: "Siwa",
    region: "Оазис Сива",
    description:
      "Берберская оазисная деревня в Западной пустыне, в 50 км от ливийской границы. Солёные озёра, источник Клеопатры и крепость Шали.",
    restX: -380,
    restY: 220,
    restRotZ: -8,
    restRotX: 3,
    restRotY: 4,
    startOffsetX: -1200,
    startOffsetY: 200,
    startRotZ: 300,
    delay: 0.9,
  },
];

export default function App() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const idleRef = useRef<gsap.core.Tween[]>([]);
  const [phase, setPhase] = useState<"ready" | "playing" | "rest">("ready");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const killIdle = () => {
    idleRef.current.forEach((t) => t.kill());
    idleRef.current = [];
  };

  const play = useCallback(() => {
    tlRef.current?.kill();
    killIdle();
    cardsRef.current.forEach((el) => {
      if (el) gsap.killTweensOf(el);
    });

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("rest");
        cardsRef.current.forEach((el, i) => {
          if (!el) return;
          el.style.willChange = "auto";
          const p = PHOTOS[i];
          const wobble = gsap.to(el, {
            rotationZ: p.restRotZ + (Math.random() > 0.5 ? 1.4 : -1.4),
            rotationY: p.restRotY + (Math.random() > 0.5 ? 2.5 : -2.5),
            duration: 2.4 + Math.random() * 1.0,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 0.8,
          });
          idleRef.current.push(wobble);
        });
      },
    });

    PHOTOS.forEach((p, i) => {
      const el = cardsRef.current[i];
      if (!el) return;
      el.style.willChange = "transform";

      // direction of approach — used to bias overshoot/squash
      const dx = p.startOffsetX;
      const dy = p.startOffsetY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      // overshoot positions: card flies PAST rest, then elastic-pulls back
      const overshootDist = 24 + Math.random() * 12;
      const overX = p.restX + (-nx) * overshootDist;
      const overY = p.restY + (-ny) * overshootDist;
      // mid-flight rotation overspin — card does an extra half-turn before settling
      const spinDir = Math.sign(p.restRotZ - p.startRotZ) || 1;
      const overRotZ = p.restRotZ + spinDir * (18 + Math.random() * 10);
      // jitter for natural per-card character
      const wobbleAmp = 4 + Math.random() * 3;

      gsap.set(el, {
        x: p.restX + p.startOffsetX,
        y: p.restY + p.startOffsetY,
        z: 600,
        rotationZ: p.startRotZ,
        rotationX: 30,
        rotationY: -25,
        scaleX: 1.3,
        scaleY: 1.1,
        opacity: 0,
      });

      // fade in mid-flight
      tl.to(el, { opacity: 1, duration: 0.14, ease: "power1.out" }, p.delay);

      // Phase A — hero-flight to OVERSHOOT pos + OVERSPIN rot. Power3.out = fast decel.
      // Squash-stretch: card stretches along motion vector (scaleY bigger as it leans into flight)
      tl.to(
        el,
        {
          x: overX,
          y: overY,
          z: 60,
          rotationZ: overRotZ,
          rotationX: p.restRotX - 8,
          rotationY: p.restRotY + 6,
          scaleX: 0.96,
          scaleY: 1.08,
          ease: "power3.out",
          duration: 0.62,
        },
        p.delay + 0.02
      );

      // Phase B — elastic settle to rest. This is where "the bounce" lives.
      // elastic.out(amplitude, period): amp = how far it overshoots, period = osc duration.
      tl.to(
        el,
        {
          x: p.restX,
          y: p.restY,
          z: 0,
          rotationZ: p.restRotZ,
          rotationX: p.restRotX,
          rotationY: p.restRotY,
          scaleX: 1.0,
          scaleY: 1.0,
          ease: "elastic.out(1.05, 0.42)",
          duration: 1.05,
        },
        p.delay + 0.62
      );

      // landing impact — micro squash on touchdown + elastic decay
      tl.to(
        el,
        {
          keyframes: [
            { scaleX: 1.14, scaleY: 0.86, duration: 0.09, ease: "power2.out" },
            { scaleX: 0.97, scaleY: 1.05, duration: 0.13, ease: "power2.inOut" },
            { scaleX: 1.0, scaleY: 1.0, duration: 0.32, ease: "elastic.out(1.2, 0.38)" },
          ],
        },
        p.delay + 0.58
      );

      // mid-flight tilt-wobble — keeps card feeling alive, not on a rail
      tl.to(
        el,
        {
          rotationY: `+=${wobbleAmp}`,
          duration: 0.28,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        p.delay + 0.18
      );
    });

    tlRef.current = tl;
    setPhase("playing");
  }, []);

  const drop = useCallback(() => {
    tlRef.current?.kill();
    killIdle();
    cardsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.killTweensOf(el);
      el.style.willChange = "transform";
      const dir = i % 2 === 0 ? 1 : -1;

      const fall = gsap.timeline({
        onComplete: () => {
          if (el) el.style.willChange = "auto";
        },
      });
      // lift, then fall — flutter-tumble per OSINT (lift via rot↔vy coupling)
      fall.to(el, {
        rotationZ: "+=" + 20 * dir,
        rotationX: "-=10",
        y: "-=40",
        duration: 0.25,
        ease: "power1.out",
        delay: i * 0.04,
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

  // click on a card → open modal, pause its idle wobble
  const openCard = (idx: number) => {
    if (phase !== "rest") return;
    setActiveIdx(idx);
  };
  const closeCard = () => setActiveIdx(null);

  // close on Escape
  useEffect(() => {
    if (activeIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCard();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx]);

  // first auto-play after mount, once images decode
  useEffect(() => {
    let cancelled = false;
    const els = cardsRef.current.filter(Boolean) as HTMLDivElement[];
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
      els.forEach((el) => gsap.set(el, { opacity: 0 }));
      play();
    });
    return () => {
      cancelled = true;
    };
  }, [play]);

  const active = activeIdx === null ? null : PHOTOS[activeIdx];

  return (
    <div className="stage relative w-full h-full">
      <div className="backdrop" />
      <div className="floor" />

      <header className="header">
        <h1>Polaroid POC</h1>
        <p>10 cards · pixar style · GSAP physics</p>
      </header>

      <div className="absolute inset-0 flex items-center justify-center">
        {PHOTOS.map((p, i) => (
          <div
            key={i}
            ref={(el) => (cardsRef.current[i] = el)}
            className="polaroid"
            style={{ opacity: 0, zIndex: 10 + i }}
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
