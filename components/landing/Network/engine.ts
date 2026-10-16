import type { NetworkField } from "@/src/config/landing";

/**
 * Pure layout and motion for the network map. No DOM and no canvas here, so it
 * can be unit tested. Coordinates are normalised to the 0..1 box of the stage.
 */

export type NodeKind = "hub" | "company" | "person" | "spark";

export interface NetNode {
  id: string;
  kind: NodeKind;
  /** Anchor the node drifts around. */
  ax: number;
  ay: number;
  /** Current position. */
  x: number;
  y: number;
  /** Radius as a fraction of min(width, height). */
  size: number;
  phase: number;
  field?: NetworkField;
  companyId?: string;
  personIndex?: number;
}

export interface NetEdge {
  a: number;
  b: number;
  /** Faint background links between neighbouring companies. */
  faint: boolean;
}

export interface Pulse {
  edge: number;
  /** 0..1 progress along the edge. */
  t: number;
  /** Progress per second. */
  speed: number;
}

export interface NetGraph {
  nodes: NetNode[];
  edges: NetEdge[];
  pulses: Pulse[];
  /** Fields present among each company's people, for dimming companies. */
  companyFields: Map<string, Set<NetworkField>>;
  rand: () => number;
}

export interface GraphInput {
  companies: readonly { id: string; hub?: boolean }[];
  people: readonly { id: string; field: NetworkField; companyId: string }[];
}

export interface Pointer {
  x: number;
  y: number;
}

const MARGIN = 0.1;
const SPARK_COUNT = 22;
const PULSE_COUNT = 12;

/** Small seeded PRNG so the layout is the same on every render. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Push overlapping nodes apart so logos and faces never sit on top of each
 * other. The hub stays put and companies move less than people.
 */
function relax(nodes: NetNode[]): void {
  const aspect = 1.1;
  const weight = (node: NetNode) => (node.kind === "hub" ? 0 : node.kind === "company" ? 0.35 : 1);
  const movable = nodes.filter((n) => n.kind !== "spark");
  for (let pass = 0; pass < 60; pass += 1) {
    let moved = false;
    for (let i = 0; i < movable.length; i += 1) {
      for (let j = i + 1; j < movable.length; j += 1) {
        const a = movable[i] as NetNode;
        const b = movable[j] as NetNode;
        const dx = (b.ax - a.ax) * aspect;
        const dy = b.ay - a.ay;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const min = (a.size + b.size) * 1.3 + 0.02;
        if (dist >= min) continue;
        const wa = weight(a);
        const wb = weight(b);
        if (wa + wb === 0) continue;
        const push = (min - dist) / dist;
        const share = (w: number) => w / (wa + wb);
        a.ax -= (dx / aspect) * push * share(wa);
        a.ay -= dy * push * share(wa);
        b.ax += (dx / aspect) * push * share(wb);
        b.ay += dy * push * share(wb);
        moved = true;
      }
    }
    for (const node of movable) {
      node.ax = clamp(node.ax, MARGIN, 1 - MARGIN);
      node.ay = clamp(node.ay, MARGIN, 1 - MARGIN);
    }
    if (!moved) break;
  }
  for (const node of movable) {
    node.x = node.ax;
    node.y = node.ay;
  }
}

export function buildGraph(input: GraphInput, seed = 7): NetGraph {
  const rand = mulberry32(seed);
  const nodes: NetNode[] = [];
  const edges: NetEdge[] = [];
  const companyIndex = new Map<string, number>();
  const companyFields = new Map<string, Set<NetworkField>>();

  const hub = input.companies.find((c) => c.hub) ?? input.companies[0];
  const others = input.companies.filter((c) => c !== hub);

  const addNode = (node: Omit<NetNode, "x" | "y">): number => {
    nodes.push({ ...node, x: node.ax, y: node.ay });
    return nodes.length - 1;
  };

  if (hub) {
    companyIndex.set(
      hub.id,
      addNode({ id: hub.id, kind: "hub", ax: 0.5, ay: 0.5, size: 0.085, phase: rand() * 6.28, companyId: hub.id }),
    );
  }

  const companyAngle = new Map<string, number>();
  const ringStart = -Math.PI / 2 + 0.35;
  others.forEach((company, i) => {
    const angle = ringStart + (i / Math.max(others.length, 1)) * Math.PI * 2;
    companyAngle.set(company.id, angle);
    const index = addNode({
      id: company.id,
      kind: "company",
      ax: clamp(0.5 + Math.cos(angle) * 0.36, MARGIN, 1 - MARGIN),
      ay: clamp(0.5 + Math.sin(angle) * 0.34, MARGIN, 1 - MARGIN),
      size: 0.06,
      phase: rand() * 6.28,
      companyId: company.id,
    });
    companyIndex.set(company.id, index);
  });
  if (hub) companyAngle.set(hub.id, -Math.PI / 2);

  const hubIndex = hub ? companyIndex.get(hub.id) : undefined;
  if (hubIndex !== undefined) {
    others.forEach((company) => {
      const index = companyIndex.get(company.id);
      if (index !== undefined) edges.push({ a: hubIndex, b: index, faint: false });
    });
  }
  // Faint ring between neighbouring companies.
  others.forEach((company, i) => {
    const next = others[(i + 1) % others.length];
    const a = companyIndex.get(company.id);
    const b = next ? companyIndex.get(next.id) : undefined;
    if (a !== undefined && b !== undefined && a !== b) edges.push({ a, b, faint: true });
  });

  // People cluster around their company.
  const perCompany = new Map<string, number>();
  input.people.forEach((person) => {
    perCompany.set(person.companyId, (perCompany.get(person.companyId) ?? 0) + 1);
  });
  const placed = new Map<string, number>();
  const personNodeIndexes: number[] = [];
  input.people.forEach((person, personIndex) => {
    const companyNode = nodes[companyIndex.get(person.companyId) ?? 0];
    if (!companyNode) return;
    const count = perCompany.get(person.companyId) ?? 1;
    const j = placed.get(person.companyId) ?? 0;
    placed.set(person.companyId, j + 1);
    const base = companyAngle.get(person.companyId) ?? 0;
    const spread = (j - (count - 1) / 2) * 1.05;
    const angle = (companyNode.kind === "hub" ? Math.PI * 0.5 : base) + spread + (rand() - 0.5) * 0.25;
    const radius = (companyNode.kind === "hub" ? 0.17 : 0.14) + rand() * 0.04;
    const index = addNode({
      id: person.id,
      kind: "person",
      ax: clamp(companyNode.ax + Math.cos(angle) * radius * 1.1, MARGIN, 1 - MARGIN),
      ay: clamp(companyNode.ay + Math.sin(angle) * radius * 0.9, MARGIN, 1 - MARGIN),
      size: 0.05,
      phase: rand() * 6.28,
      field: person.field,
      companyId: person.companyId,
      personIndex,
    });
    personNodeIndexes.push(index);
    edges.push({ a: companyIndex.get(person.companyId) ?? 0, b: index, faint: false });
    const fields = companyFields.get(person.companyId) ?? new Set<NetworkField>();
    fields.add(person.field);
    companyFields.set(person.companyId, fields);
  });
  // A few cross links between people so the web feels connected.
  for (let i = 0; i + 3 < personNodeIndexes.length; i += 3) {
    edges.push({ a: personNodeIndexes[i] as number, b: personNodeIndexes[i + 3] as number, faint: true });
  }

  relax(nodes);

  for (let i = 0; i < SPARK_COUNT; i += 1) {
    addNode({
      id: `spark-${i}`,
      kind: "spark",
      ax: MARGIN / 2 + rand() * (1 - MARGIN),
      ay: MARGIN / 2 + rand() * (1 - MARGIN),
      size: 0.004 + rand() * 0.004,
      phase: rand() * 6.28,
    });
  }

  const solid = edges.map((edge, index) => ({ edge, index })).filter(({ edge }) => !edge.faint);
  const pulses: Pulse[] = [];
  for (let i = 0; i < PULSE_COUNT && solid.length > 0; i += 1) {
    const pick = solid[Math.floor(rand() * solid.length)];
    if (pick) pulses.push({ edge: pick.index, t: rand(), speed: 0.15 + rand() * 0.2 });
  }

  return { nodes, edges, pulses, companyFields, rand };
}

/** Is this node highlighted under the current field filter? */
export function isNodeActive(graph: NetGraph, node: NetNode, field: NetworkField | null): boolean {
  if (field === null || node.kind === "spark") return true;
  if (node.kind === "person") return node.field === field;
  return graph.companyFields.get(node.companyId ?? "")?.has(field) ?? false;
}

/** Indexes into the people list that match the filter. */
export function visiblePersonIndexes(graph: NetGraph, field: NetworkField | null): number[] {
  const out: number[] = [];
  for (const node of graph.nodes) {
    if (node.kind === "person" && node.personIndex !== undefined && isNodeActive(graph, node, field)) {
      out.push(node.personIndex);
    }
  }
  return out;
}

/** Move every node toward its drifting, pointer-attracted target. */
export function step(graph: NetGraph, dt: number, time: number, pointer: Pointer | null): void {
  const ease = 1 - Math.exp(-dt * 8);
  for (const node of graph.nodes) {
    const amp = node.kind === "spark" ? 0.012 : node.kind === "hub" ? 0.004 : 0.008;
    let tx = node.ax + Math.sin(time * 0.6 + node.phase) * amp;
    let ty = node.ay + Math.cos(time * 0.5 + node.phase * 1.3) * amp;
    if (pointer && node.kind !== "hub") {
      const dx = pointer.x - tx;
      const dy = pointer.y - ty;
      const dist = Math.hypot(dx, dy);
      const reach = 0.22;
      if (dist > 0.0001 && dist < reach) {
        const pull = (1 - dist / reach) ** 2 * 0.04;
        tx += (dx / dist) * pull;
        ty += (dy / dist) * pull;
      }
    }
    node.x += (tx - node.x) * ease;
    node.y += (ty - node.y) * ease;
  }
  for (const pulse of graph.pulses) {
    pulse.t += pulse.speed * dt;
    if (pulse.t > 1) {
      pulse.t -= 1;
      const solid = graph.edges.map((edge, index) => ({ edge, index })).filter(({ edge }) => !edge.faint);
      const pick = solid[Math.floor(graph.rand() * solid.length)];
      if (pick) pulse.edge = pick.index;
    }
  }
}

/** The person node under a pixel position, if any. Dimmed people cannot be hit. */
export function hitTest(
  graph: NetGraph,
  px: number,
  py: number,
  width: number,
  height: number,
  field: NetworkField | null,
): NetNode | null {
  const unit = Math.min(width, height);
  let best: NetNode | null = null;
  let bestDist = Infinity;
  for (const node of graph.nodes) {
    if (node.kind !== "person" || !isNodeActive(graph, node, field)) continue;
    const dist = Math.hypot(node.x * width - px, node.y * height - py);
    if (dist <= node.size * unit + 8 && dist < bestDist) {
      best = node;
      bestDist = dist;
    }
  }
  return best;
}

/** Put every node back on its anchor, for a still frame. */
export function settle(graph: NetGraph): void {
  for (const node of graph.nodes) {
    node.x = node.ax;
    node.y = node.ay;
  }
}
