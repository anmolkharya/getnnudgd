"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { Reveal, useInView, usePrefersReducedMotion } from "@/components/motion";
import { network, type NetworkCompany, type NetworkField, type NetworkPerson } from "@/src/config/landing";
import { logos } from "@/src/config/landing-assets";
import { drawScene, readPalette, type CompanyArt, type Palette } from "./draw";
import { buildGraph, hitTest, settle, step, visiblePersonIndexes, type Pointer } from "./engine";
import styles from "./Network.module.css";

const CYCLE_MS = 4200;
const CARD_WIDTH = 208;
const NARROW = 520;
const AVATAR_TONES = ["bg-indigo-500", "bg-amber-500", "bg-emerald-500", "bg-indigo-600"] as const;

const people: readonly NetworkPerson[] = network.people;
const companies: readonly NetworkCompany[] = network.companies;
const LOOKS = people.map((p) => p.look);
const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function personIdsFor(indexes: number[]): string[] {
  return indexes.map((i) => people[i]?.id).filter((id): id is string => id !== undefined);
}

export function LandingNetwork() {
  const headingId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [graph] = useState(() => buildGraph({ companies: network.companies, people: network.people }));

  const reduced = usePrefersReducedMotion();
  const inView = useInView(boxRef);
  const running = inView && !reduced;

  const [field, setField] = useState<NetworkField | null>(null);
  const [activeId, setActiveId] = useState<string>(people[0]?.id ?? "");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const shownId = hoverId ?? activeId;
  const person = people.find((p) => p.id === shownId) ?? people[0];

  // Values the animation loop reads every frame, kept out of React state.
  const fieldRef = useRef<NetworkField | null>(null);
  const shownRef = useRef<string>(shownId);
  const pointerRef = useRef<Pointer | null>(null);
  const timeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const paletteRef = useRef<Palette | null>(null);
  const paintRef = useRef<(() => void) | null>(null);
  const artRef = useRef<Map<string, CompanyArt>>(new Map());

  useEffect(() => {
    fieldRef.current = field;
    shownRef.current = shownId;
    paintRef.current?.();
  }, [field, shownId]);

  // Size the canvas and paint a frame whenever the stage resizes.
  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paletteRef.current = readPalette(box);

    const positionCard = () => {
      const card = cardRef.current;
      const node = graph.nodes.find((n) => n.id === shownRef.current);
      const { w, h } = sizeRef.current;
      if (!card || !node || w === 0) return;
      const cardHeight = card.offsetHeight || 104;
      let left: number;
      let top: number;
      if (w < NARROW) {
        left = 12;
        top = h - cardHeight - 12;
      } else {
        const x = node.x * w;
        const y = node.y * h;
        const r = node.size * Math.min(w, h);
        const gap = 14;
        const place = (l: number, t: number) => ({
          left: clamp(l, 8, Math.max(8, w - CARD_WIDTH - 8)),
          top: clamp(t, 8, Math.max(8, h - cardHeight - 8)),
        });
        // Try each side of the person and keep the one that covers the fewest other nodes.
        const options = [
          place(x + r + gap, y - cardHeight / 2),
          place(x - r - gap - CARD_WIDTH, y - cardHeight / 2),
          place(x - CARD_WIDTH / 2, y - r - gap - cardHeight),
          place(x - CARD_WIDTH / 2, y + r + gap),
        ];
        const covered = (o: { left: number; top: number }) => {
          let count = 0;
          for (const other of graph.nodes) {
            if (other === node || other.kind === "spark") continue;
            const cx = other.x * w;
            const cy = other.y * h;
            const nearestX = clamp(cx, o.left, o.left + CARD_WIDTH);
            const nearestY = clamp(cy, o.top, o.top + cardHeight);
            if (Math.hypot(cx - nearestX, cy - nearestY) < other.size * Math.min(w, h) + 4) {
              // Covering you or a logo costs more than covering a face.
              count += other.kind === "seeker" ? 6 : other.kind === "company" ? 3 : 1;
            }
          }
          return count;
        };
        let best = options[0] as { left: number; top: number };
        let bestScore = covered(best);
        for (const option of options.slice(1)) {
          const score = covered(option);
          if (score < bestScore) {
            best = option;
            bestScore = score;
          }
        }
        left = best.left;
        top = best.top;
      }
      left = clamp(left, 8, Math.max(8, w - CARD_WIDTH - 8));
      top = clamp(top, 8, Math.max(8, h - cardHeight - 8));
      card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    };

    const paint = () => {
      const { w, h, dpr } = sizeRef.current;
      const palette = paletteRef.current;
      if (!palette || w === 0 || h === 0) return;
      drawScene(ctx, graph, {
        width: w,
        height: h,
        dpr,
        time: timeRef.current,
        field: fieldRef.current,
        activeId: shownRef.current,
        palette,
        companyArt: artRef.current,
        looks: LOOKS,
        seekerLabel: network.seekerLabel,
      });
      positionCard();
    };
    paintRef.current = paint;

    const resize = () => {
      const rect = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      paint();
    };
    resize();

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(box);
    return () => {
      observer?.disconnect();
      paintRef.current = null;
    };
  }, [graph]);

  // Load each company logo once, repainting as each one arrives.
  useEffect(() => {
    const art = artRef.current;
    const images: HTMLImageElement[] = [];
    for (const company of companies) {
      const entry: CompanyArt = { name: company.name, image: null };
      art.set(company.id, entry);
      const asset = logos[company.logoKey];
      if (asset.type !== "svg") continue;
      const image = new Image();
      image.onload = () => {
        entry.image = image;
        paintRef.current?.();
      };
      image.src = asset.src;
      images.push(image);
    }
    paintRef.current?.();
    return () => {
      for (const image of images) image.onload = null;
    };
  }, []);

  // Reduced motion: hold every node on its anchor.
  useEffect(() => {
    if (reduced) {
      settle(graph);
      pointerRef.current = null;
      paintRef.current?.();
    }
  }, [graph, reduced]);

  // The animation loop only runs while the map is on screen.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeRef.current += dt;
      const { w, h } = sizeRef.current;
      step(graph, dt, timeRef.current, pointerRef.current, w > 0 && h > 0 ? w / h : undefined);
      paintRef.current?.();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [graph, running]);

  // Cycle the profile card through the visible people until someone hovers.
  useEffect(() => {
    if (!running || hoverId) return;
    const id = window.setInterval(() => {
      setActiveId((current) => {
        const ids = personIdsFor(visiblePersonIndexes(graph, fieldRef.current));
        if (ids.length === 0) return current;
        const at = ids.indexOf(current);
        return ids[(at + 1) % ids.length] ?? current;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [graph, running, hoverId]);

  const local = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, w: rect.width, h: rect.height };
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = local(event);
    if (p.w === 0 || p.h === 0) return;
    pointerRef.current = reduced ? null : { x: p.x / p.w, y: p.y / p.h };
    const hit = hitTest(graph, p.x, p.y, p.w, p.h, field)?.id ?? null;
    setHoverId((prev) => (prev === hit ? prev : hit));
  };

  const onPointerLeave = () => {
    pointerRef.current = null;
    setHoverId(null);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = local(event);
    const hit = hitTest(graph, p.x, p.y, p.w, p.h, field);
    if (hit) {
      setActiveId(hit.id);
      setHoverId(hit.id);
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType !== "mouse") onPointerLeave();
  };

  const chooseField = useCallback(
    (next: NetworkField | null) => {
      setField(next);
      const first = personIdsFor(visiblePersonIndexes(graph, next))[0];
      if (first) setActiveId(first);
    },
    [graph],
  );

  const company = person ? companyName(person.companyId) : "";
  const toneClass = AVATAR_TONES[(people.findIndex((p) => p.id === person?.id) + AVATAR_TONES.length) % AVATAR_TONES.length];

  return (
    <section
      aria-labelledby={headingId}
      data-placeholder={network.placeholder ? "true" : undefined}
      className={`lv-dark relative overflow-hidden py-20 md:py-28 ${styles.section}`}
    >
      <div className="lv-container grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        <div className="min-w-0 lg:col-span-4">
          <Reveal>
            <h2 id={headingId} className="lv-heading-pair text-h2-lg">
              <span>{network.headingSans}</span>
              <em>{network.headingSerif}</em>
            </h2>
            <p className="mt-4 max-w-measure text-on-dark-1">{network.sub}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div role="group" aria-label={network.filterHeading} className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              {[null, ...network.fields].map((option) => (
                <button
                  key={option ?? "all"}
                  type="button"
                  aria-pressed={field === option}
                  onClick={() => chooseField(field === option ? null : option)}
                  className="rounded-full border border-line-dark px-4 py-2 text-left text-sm text-on-dark-1 transition-colors hover:bg-white/10 hover:text-white aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-ink-1 lg:rounded-xl"
                >
                  {option ?? network.allLabel}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="min-w-0 lg:col-span-8">
          <div
            ref={boxRef}
            className="relative h-96 w-full md:h-128 lg:h-144"
          >
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={`absolute inset-0 size-full touch-pan-y ${hoverId ? "cursor-pointer" : ""}`}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            />
            {person ? (
              <div ref={cardRef} aria-hidden="true" className={`${styles.card} rounded-xl bg-white p-3 shadow-soft`}>
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${toneClass}`}
                  >
                    {person.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-semibold text-ink-1">{person.name}</p>
                    <p className="truncate text-xs text-ink-5">{person.role}</p>
                  </div>
                </div>
                <p className="mt-2 truncate text-xs text-ink-5">
                  {person.years}+ {network.yearsLabel} · {company}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {person.match}% {network.matchLabel}
                </p>
              </div>
            ) : null}
          </div>
          <p className="mt-4 max-w-measure text-xs text-on-dark-2">{network.disclaimer}</p>
          <ul className="sr-only" aria-label={network.mapLabel}>
            {people.map((p) => (
              <li key={p.id}>
                {p.name}, {p.role}, {p.years}+ {network.yearsLabel}, {companyName(p.companyId)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
