import type { NetworkField } from "@/src/config/landing";
import { isNodeActive, type NetGraph, type NetNode } from "./engine";

/** Colours come from the design tokens, read once from the stage element. */
export interface Palette {
  accent: string;
  indigo: string;
  amber: string;
  success: string;
  ink: string;
  font: string;
}

export interface DrawOptions {
  width: number;
  height: number;
  dpr: number;
  time: number;
  field: NetworkField | null;
  activeId: string | null;
  palette: Palette;
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

const PERSON_TONES = ["indigo", "amber", "success", "accent"] as const;

function personTone(palette: Palette, personIndex: number): string {
  return palette[PERSON_TONES[personIndex % PERSON_TONES.length] ?? "indigo"];
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

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tone: string,
  palette: Palette,
  active: boolean,
  dimmed: boolean,
) {
  ctx.save();
  ctx.globalAlpha = dimmed ? 0.22 : 1;
  if (active) glow(ctx, x, y, r * 2.6, tone, 0.55);

  // Soft illustrated portrait: tinted disc, head and shoulders.
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
  const disc = ctx.createLinearGradient(x, y - r, x, y + r);
  disc.addColorStop(0, tone);
  disc.addColorStop(1, palette.ink);
  ctx.fillStyle = disc;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y - r * 0.18, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.78, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = active ? 2.5 : 1.5;
  ctx.strokeStyle = active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ink: string) {
  const w = r * 0.9;
  const h = r * 1.1;
  ctx.save();
  ctx.fillStyle = ink;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  const cell = r * 0.18;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      ctx.fillRect(x - w / 2 + r * 0.17 + col * (cell + r * 0.2), y - h / 2 + r * 0.17 + row * (cell + r * 0.2), cell, cell);
    }
  }
  ctx.restore();
}

function drawCompany(
  ctx: CanvasRenderingContext2D,
  node: NetNode,
  x: number,
  y: number,
  r: number,
  palette: Palette,
  time: number,
  dimmed: boolean,
) {
  const hub = node.kind === "hub";
  ctx.save();
  ctx.globalAlpha = dimmed ? 0.25 : 1;
  glow(ctx, x, y, r * (hub ? 3.4 : 2.2), hub ? palette.accent : palette.indigo, hub ? 0.5 : 0.22);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fill();
  drawBuilding(ctx, x, y, r, palette.ink);
  if (hub) {
    ctx.strokeStyle = palette.indigo;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 7]);
    ctx.lineDashOffset = -time * 14;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawScene(ctx: CanvasRenderingContext2D, graph: NetGraph, options: DrawOptions): void {
  const { width, height, dpr, time, field, activeId, palette } = options;
  const unit = Math.min(width, height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const px = (node: NetNode) => node.x * width;
  const py = (node: NetNode) => node.y * height;

  // Edges first, so nodes sit on top.
  for (const edge of graph.edges) {
    const a = graph.nodes[edge.a];
    const b = graph.nodes[edge.b];
    if (!a || !b) continue;
    const live = isNodeActive(graph, a, field) && isNodeActive(graph, b, field);
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.globalAlpha = live ? (edge.faint ? 0.07 : 0.16) : 0.03;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sparks twinkle in the background.
  for (const node of graph.nodes) {
    if (node.kind !== "spark") continue;
    const twinkle = 0.35 + 0.35 * Math.sin(time * 1.4 + node.phase);
    ctx.globalAlpha = twinkle;
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
    if (node.kind !== "hub" && node.kind !== "company") continue;
    drawCompany(ctx, node, px(node), py(node), node.size * unit, palette, time, !isNodeActive(graph, node, field));
  }
  for (const node of graph.nodes) {
    if (node.kind !== "person") continue;
    drawAvatar(
      ctx,
      px(node),
      py(node),
      node.size * unit,
      personTone(palette, node.personIndex ?? 0),
      palette,
      node.id === activeId,
      !isNodeActive(graph, node, field),
    );
  }
}
