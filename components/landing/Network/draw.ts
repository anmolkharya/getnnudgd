import type { AvatarLook, NetworkField } from "@/src/config/landing";
import { isNodeActive, pathEdges, type NetGraph, type NetNode } from "./engine";

/** Colours come from the design tokens, read once from the stage element. */
export interface Palette {
  accent: string;
  indigo: string;
  amber: string;
  success: string;
  ink: string;
  font: string;
}

/** What a company node shows: its logo once loaded, otherwise its name. */
export interface CompanyArt {
  name: string;
  image: HTMLImageElement | null;
}

export interface DrawOptions {
  width: number;
  height: number;
  dpr: number;
  time: number;
  field: NetworkField | null;
  activeId: string | null;
  palette: Palette;
  companyArt: ReadonlyMap<string, CompanyArt>;
  /** Face look per person, indexed by `node.personIndex`. */
  looks: readonly AvatarLook[];
  /** Label under the centre node. */
  seekerLabel: string;
}

export function readPalette(el: Element): Palette {
  const style = getComputedStyle(el);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    accent: read("--accent", "#4F46E5"),
    indigo: read("--indigo-500", "#6366F1"),
    amber: read("--amber-500", "#F59E0B"),
    success: read("--success", "#10B981"),
    ink: read("--lv-ink-1", "#0A0A0A"),
    font: style.fontFamily || "system-ui, sans-serif",
  };
}

// Illustration colours for the face avatars (not UI tokens).
const SKIN = ["#F6D3B3", "#E8B88F", "#C98F63", "#A26B45", "#76472C"] as const;
const HAIR = ["#1B1512", "#2E1D14", "#4A2F1E"] as const;
const SHIRTS = ["#F8FAFC", "#E2E8F0", "#FDE68A", "#C7D2FE"] as const;
const FEATURE = "#1F1A17";
const MOUTH = "#8A3F33";
const BACKDROPS = ["indigo", "amber", "success", "accent"] as const;

function backdropFor(palette: Palette, personIndex: number): string {
  return palette[BACKDROPS[personIndex % BACKDROPS.length] ?? "indigo"];
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A small illustrated face: backdrop, shoulders, neck, head, hair, eyes, smile. */
function drawFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  look: AvatarLook,
  personIndex: number,
  palette: Palette,
  active: boolean,
  dimmed: boolean,
) {
  const skin = SKIN[look.skin];
  const hair = HAIR[personIndex % HAIR.length] ?? HAIR[0];
  const shirt = SHIRTS[personIndex % SHIRTS.length] ?? SHIRTS[0];

  ctx.save();
  ctx.globalAlpha = dimmed ? 0.25 : 1;
  if (active) glow(ctx, x, y, r * 2.6, backdropFor(palette, personIndex), 0.6);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  const disc = ctx.createLinearGradient(x, y - r, x, y + r);
  disc.addColorStop(0, backdropFor(palette, personIndex));
  disc.addColorStop(1, palette.ink);
  ctx.fillStyle = disc;
  ctx.fill();

  ctx.save();
  ctx.clip();

  // Hair that sits behind the head.
  if (look.hair === "long") ellipse(ctx, x, y + r * 0.08, r * 0.42, r * 0.58, hair);
  if (look.hair === "curly") ellipse(ctx, x, y - r * 0.14, r * 0.45, r * 0.48, hair);
  if (look.hair === "bun") ellipse(ctx, x, y - r * 0.62, r * 0.18, r * 0.18, hair);

  // Shoulders and neck.
  ellipse(ctx, x, y + r * 0.98, r * 0.82, r * 0.56, shirt);
  ctx.fillStyle = skin;
  ctx.fillRect(x - r * 0.11, y + r * 0.1, r * 0.22, r * 0.32);
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(x - r * 0.11, y + r * 0.1, r * 0.22, r * 0.1);

  // Head.
  ellipse(ctx, x, y - r * 0.1, r * 0.3, r * 0.35, skin);

  // Hair on top.
  const capY = y - r * 0.31;
  if (look.hair === "curly") {
    ellipse(ctx, x, capY, r * 0.37, r * 0.24, hair);
  } else {
    ellipse(ctx, x, capY, r * 0.32, r * 0.21, hair);
    ellipse(ctx, x - r * 0.27, y - r * 0.18, r * 0.07, r * 0.16, hair);
    ellipse(ctx, x + r * 0.27, y - r * 0.18, r * 0.07, r * 0.16, hair);
  }

  // Eyes and smile.
  const eyeY = y - r * 0.1;
  const eye = Math.max(0.9, r * 0.045);
  ctx.fillStyle = FEATURE;
  ctx.beginPath();
  ctx.arc(x - r * 0.11, eyeY, eye, 0, Math.PI * 2);
  ctx.arc(x + r * 0.11, eyeY, eye, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = MOUTH;
  ctx.lineWidth = Math.max(1, r * 0.045);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y + r * 0.02, r * 0.1, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();

  if (look.glasses) {
    const lens = r * 0.11;
    ctx.strokeStyle = FEATURE;
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.11 + lens, eyeY);
    ctx.arc(x - r * 0.11, eyeY, lens, 0, Math.PI * 2);
    ctx.moveTo(x + r * 0.11 + lens, eyeY);
    ctx.arc(x + r * 0.11, eyeY, lens, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.lineWidth = active ? 2.5 : 1.5;
  ctx.strokeStyle = active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Logo fitted inside the white disc; falls back to the company name. */
function drawCompanyMark(
  ctx: CanvasRenderingContext2D,
  art: CompanyArt | undefined,
  x: number,
  y: number,
  r: number,
  palette: Palette,
) {
  const image = art?.image;
  if (image && image.complete && image.naturalWidth > 0) {
    const maxW = r * 1.7;
    const maxH = r * 0.9;
    const ratio = image.naturalWidth / image.naturalHeight;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
    return;
  }
  const name = art?.name ?? "";
  if (!name) return;
  let size = r * 0.5;
  ctx.font = `700 ${size}px ${palette.font}`;
  const maxWidth = r * 1.55;
  const measured = ctx.measureText(name).width;
  if (measured > maxWidth) {
    size = (size * maxWidth) / measured;
    ctx.font = `700 ${size}px ${palette.font}`;
  }
  ctx.fillStyle = palette.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x, y);
}

function drawCompany(
  ctx: CanvasRenderingContext2D,
  art: CompanyArt | undefined,
  x: number,
  y: number,
  r: number,
  palette: Palette,
  dimmed: boolean,
) {
  ctx.save();
  ctx.globalAlpha = dimmed ? 0.28 : 1;
  glow(ctx, x, y, r * 2.1, palette.indigo, 0.22);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  ctx.fill();
  drawCompanyMark(ctx, art, x, y, r, palette);
  ctx.restore();
}

/** The centre of the map: you, the Seeker, with a small label underneath. */
function drawSeeker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  palette: Palette,
  time: number,
  label: string,
) {
  ctx.save();
  glow(ctx, x, y, r * 3.2, palette.accent, 0.5);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  const disc = ctx.createLinearGradient(x, y - r, x, y + r);
  disc.addColorStop(0, palette.indigo);
  disc.addColorStop(1, palette.accent);
  ctx.fillStyle = disc;
  ctx.fill();

  // A plain person glyph, so it reads as "you" rather than as any one profile.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.78, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = palette.indigo;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 7]);
  ctx.lineDashOffset = -time * 14;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (label) {
    const size = Math.max(10, r * 0.34);
    ctx.font = `600 ${size}px ${palette.font}`;
    const textWidth = ctx.measureText(label).width;
    const padX = size * 0.7;
    const pillW = textWidth + padX * 2;
    const pillH = size * 1.7;
    const pillY = y + r * 1.62;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.beginPath();
    ctx.roundRect(x - pillW / 2, pillY - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = palette.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, pillY + 0.5);
  }
  ctx.restore();
}

export function drawScene(ctx: CanvasRenderingContext2D, graph: NetGraph, options: DrawOptions): void {
  const { width, height, dpr, time, field, activeId, palette, companyArt, looks, seekerLabel } = options;
  const unit = Math.min(width, height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const px = (node: NetNode) => node.x * width;
  const py = (node: NetNode) => node.y * height;

  // Edges first, so nodes sit on top. The chosen person's path is lit:
  // You to their company, then the company to them.
  const lit = pathEdges(graph, activeId);
  graph.edges.forEach((edge, index) => {
    const a = graph.nodes[edge.a];
    const b = graph.nodes[edge.b];
    if (!a || !b) return;
    const live = isNodeActive(graph, a, field) && isNodeActive(graph, b, field);
    const onPath = lit.has(index) && live;
    ctx.strokeStyle = onPath ? palette.indigo : "rgba(255,255,255,1)";
    ctx.globalAlpha = onPath ? 0.85 : live ? 0.18 : 0.03;
    ctx.lineWidth = onPath ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // Sparks twinkle in the background.
  for (const node of graph.nodes) {
    if (node.kind !== "spark") continue;
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 1.4 + node.phase);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px(node), py(node), Math.max(0.8, node.size * unit), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Light pulses travelling along solid edges.
  for (const pulse of graph.pulses) {
    const edge = graph.edges[pulse.edge];
    const a = edge && graph.nodes[edge.a];
    const b = edge && graph.nodes[edge.b];
    if (!a || !b) continue;
    if (!(isNodeActive(graph, a, field) && isNodeActive(graph, b, field))) continue;
    const x = px(a) + (px(b) - px(a)) * pulse.t;
    const y = py(a) + (py(b) - py(a)) * pulse.t;
    glow(ctx, x, y, 11, palette.indigo, 0.9);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Companies, then people on top.
  for (const node of graph.nodes) {
    if (node.kind !== "company") continue;
    drawCompany(
      ctx,
      companyArt.get(node.companyId ?? ""),
      px(node),
      py(node),
      node.size * unit,
      palette,
      !isNodeActive(graph, node, field),
    );
  }
  for (const node of graph.nodes) {
    if (node.kind !== "seeker") continue;
    drawSeeker(ctx, px(node), py(node), node.size * unit, palette, time, seekerLabel);
  }
  for (const node of graph.nodes) {
    if (node.kind !== "person") continue;
    const index = node.personIndex ?? 0;
    const look = looks[index] ?? { skin: 1, hair: "short" as const };
    drawFace(
      ctx,
      px(node),
      py(node),
      node.size * unit,
      look,
      index,
      palette,
      node.id === activeId,
      !isNodeActive(graph, node, field),
    );
  }
}
