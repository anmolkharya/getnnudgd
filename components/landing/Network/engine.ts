import type { NetworkField } from "@/src/config/landing";

/**
 * Pure layout and motion for the network map. No DOM and no canvas here, so it
 * can be unit tested. Coordinates are normalised to the 0..1 box of the stage.
 *
 * The map reads as: You (the Seeker) in the centre, companies on a ring around
 * you, and the Insiders who work at each company next to it. No company and no
 * platform sits in the middle.
 */

export type NodeKind = "seeker" | "company" | "person" | "spark";

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
}

export interface Pulse {
  edge: number;
  /** 0..1 progress along the edge, from `a` to `b`. */
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
  companies: readonly { id: string }[];
  people: readonly { id: string; field: NetworkField; companyId: string }[];
}

export interface Pointer {
  x: number;
  y: number;
}

const MARGIN = 0.1;
const SPARK_COUNT = 22;
const PULSE_COUNT = 12;
/** Width divided by height of a typical stage, used where the real one is unknown. */
const DEFAULT_ASPECT = 1.2;

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

/** How far a node gives way when two overlap. The seeker never moves. */
function giveWay(node: NetNode): number {
  return node.kind === "seeker" ? 0 : node.kind === "company" ? 0.35 : 1;
}

/** Push apart every pair of non-spark nodes that is closer than their radii allow. */
function separate(nodes: NetNode[], useAnchor: boolean, aspect: number, gap: number, ease: number): boolean {
  const solid = nodes.filter((n) => n.kind !== "spark");
  let moved = false;
  for (let i = 0; i < solid.length; i += 1) {
    for (let j = i + 1; j < solid.length; j += 1) {
      const a = solid[i] as NetNode;
      const b = solid[j] as NetNode;
      const ax = useAnchor ? a.ax : a.x;
      const ay = useAnchor ? a.ay : a.y;
      const bx = useAnchor ? b.ax : b.x;
      const by = useAnchor ? b.ay : b.y;
      const dx = (bx - ax) * aspect;
      const dy = by - ay;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const min = (a.size + b.size) * 1.3 + gap;
      if (dist >= min) continue;
      const wa = giveWay(a);
      const wb = giveWay(b);
      if (wa + wb === 0) continue;
      const push = ((min - dist) / dist) * ease;
      const shareA = wa / (wa + wb);
      const shareB = wb / (wa + wb);
      if (useAnchor) {
        a.ax -= (dx / aspect) * push * shareA;
        a.ay -= dy * push * shareA;
        b.ax += (dx / aspect) * push * shareB;
        b.ay += dy * push * shareB;
      } else {
        a.x -= (dx / aspect) * push * shareA;
        a.y -= dy * push * shareA;
        b.x += (dx / aspect) * push * shareB;
        b.y += dy * push * shareB;
      }
      moved = true;
    }
  }
  return moved;
}

function relaxAnchors(nodes: NetNode[]): void {
  for (let pass = 0; pass < 60; pass += 1) {
    const moved = separate(nodes, true, DEFAULT_ASPECT, 0.02, 1);
    for (const node of nodes) {
      if (node.kind === "spark") continue;
      node.ax = clamp(node.ax, MARGIN, 1 - MARGIN);
      node.ay = clamp(node.ay, MARGIN, 1 - MARGIN);
    }
    if (!moved) break;
  }
  for (const node of nodes) {
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

  const addNode = (node: Omit<NetNode, "x" | "y">): number => {
    nodes.push({ ...node, x: node.ax, y: node.ay });
    return nodes.length - 1;
  };

  // You, in the middle.
  const seekerIndex = addNode({ id: "seeker", kind: "seeker", ax: 0.5, ay: 0.5, size: 0.08, phase: rand() * 6.28 });

  // Companies on a ring around you, each one reachable from you.
  const companyAngle = new Map<string, number>();
  const count = Math.max(input.companies.length, 1);
  input.companies.forEach((company, i) => {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    companyAngle.set(company.id, angle);
    const index = addNode({
      id: company.id,
      kind: "company",
      ax: clamp(0.5 + Math.cos(angle) * 0.3, MARGIN, 1 - MARGIN),
      ay: clamp(0.5 + Math.sin(angle) * 0.28, MARGIN, 1 - MARGIN),
      size: 0.06,
      phase: rand() * 6.28,
      companyId: company.id,
    });
    companyIndex.set(company.id, index);
    edges.push({ a: seekerIndex, b: index });
  });

  // Insiders sit just outside the company they work at.
  const perCompany = new Map<string, number>();
  input.people.forEach((person) => {
    perCompany.set(person.companyId, (perCompany.get(person.companyId) ?? 0) + 1);
  });
  const placed = new Map<string, number>();
  input.people.forEach((person, personIndex) => {
    const companyNodeIndex = companyIndex.get(person.companyId);
    const companyNode = companyNodeIndex === undefined ? undefined : nodes[companyNodeIndex];
    if (!companyNode || companyNodeIndex === undefined) return;
    const total = perCompany.get(person.companyId) ?? 1;
    const j = placed.get(person.companyId) ?? 0;
    placed.set(person.companyId, j + 1);
    const outward = companyAngle.get(person.companyId) ?? 0;
    const angle = outward + (j - (total - 1) / 2) * 0.9 + (rand() - 0.5) * 0.2;
    const radius = 0.15 + rand() * 0.03;
    const index = addNode({
      id: person.id,
      kind: "person",
      ax: clamp(companyNode.ax + Math.cos(angle) * radius * 0.9, MARGIN, 1 - MARGIN),
      ay: clamp(companyNode.ay + Math.sin(angle) * radius, MARGIN, 1 - MARGIN),
      size: 0.05,
      phase: rand() * 6.28,
      field: person.field,
      companyId: person.companyId,
      personIndex,
    });
    edges.push({ a: companyNodeIndex, b: index });
    const fields = companyFields.get(person.companyId) ?? new Set<NetworkField>();
    fields.add(person.field);
    companyFields.set(person.companyId, fields);
  });

  relaxAnchors(nodes);

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

  const pulses: Pulse[] = [];
  for (let i = 0; i < PULSE_COUNT && edges.length > 0; i += 1) {
    pulses.push({ edge: Math.floor(rand() * edges.length), t: rand(), speed: 0.15 + rand() * 0.2 });
  }

  return { nodes, edges, pulses, companyFields, rand };
}

/** Is this node highlighted under the current field filter? */
export function isNodeActive(graph: NetGraph, node: NetNode, field: NetworkField | null): boolean {
  if (field === null || node.kind === "spark" || node.kind === "seeker") return true;
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

/** The edges that make up You to Company to Insider for the chosen person. */
export function pathEdges(graph: NetGraph, personId: string | null): Set<number> {
  const out = new Set<number>();
  if (!personId) return out;
  const person = graph.nodes.findIndex((n) => n.id === personId && n.kind === "person");
  if (person < 0) return out;
  const companyId = graph.nodes[person]?.companyId;
  const company = graph.nodes.findIndex((n) => n.id === companyId && n.kind === "company");
  const seeker = graph.nodes.findIndex((n) => n.kind === "seeker");
  graph.edges.forEach((edge, index) => {
    const touchesPerson = edge.a === person || edge.b === person;
    const youToCompany = edge.a === seeker && edge.b === company;
    if (touchesPerson || youToCompany) out.add(index);
  });
  return out;
}

/**
 * Move every node toward its drifting, pointer-attracted target, then keep
 * nodes from overlapping. `aspect` is the stage width divided by its height.
 */
export function step(
  graph: NetGraph,
  dt: number,
  time: number,
  pointer: Pointer | null,
  aspect: number = DEFAULT_ASPECT,
): void {
  const ease = 1 - Math.exp(-dt * 8);
  for (const node of graph.nodes) {
    const amp = node.kind === "spark" ? 0.012 : node.kind === "seeker" ? 0.004 : 0.008;
    let tx = node.ax + Math.sin(time * 0.6 + node.phase) * amp;
    let ty = node.ay + Math.cos(time * 0.5 + node.phase * 1.3) * amp;
    if (pointer && node.kind !== "seeker") {
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
  // Pointer pull must never stack nodes on top of one another.
  separate(graph.nodes, false, aspect, 0.012, 0.6);
  for (const pulse of graph.pulses) {
    pulse.t += pulse.speed * dt;
    if (pulse.t > 1) {
      pulse.t -= 1;
      pulse.edge = Math.floor(graph.rand() * graph.edges.length);
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
