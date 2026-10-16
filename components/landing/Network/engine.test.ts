import { describe, it, expect } from "vitest";
import { network } from "@/src/config/landing";
import {
  buildGraph,
  hitTest,
  isNodeActive,
  mulberry32,
  pathEdges,
  settle,
  step,
  visiblePersonIndexes,
} from "./engine";

const build = () => buildGraph({ companies: network.companies, people: network.people });
const ASPECT = 1.2;

describe("network engine", () => {
  it("is deterministic for a seed", () => {
    const a = build();
    const b = build();
    expect(a.nodes.map((n) => [n.ax, n.ay])).toEqual(b.nodes.map((n) => [n.ax, n.ay]));
    const r1 = mulberry32(3);
    const r2 = mulberry32(3);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it("puts only you in the centre, with a node per company and per person", () => {
    const graph = build();
    const centre = graph.nodes.filter((n) => n.kind === "seeker");
    expect(centre).toHaveLength(1);
    expect(centre[0]?.ax).toBe(0.5);
    expect(centre[0]?.ay).toBe(0.5);
    expect(graph.nodes.filter((n) => n.kind === "company")).toHaveLength(network.companies.length);
    expect(graph.nodes.filter((n) => n.kind === "person")).toHaveLength(network.people.length);
    // No company sits on top of the centre.
    for (const company of graph.nodes.filter((n) => n.kind === "company")) {
      expect(Math.hypot((company.ax - 0.5) * ASPECT, company.ay - 0.5)).toBeGreaterThan(0.2);
    }
  });

  it("keeps every anchor inside the stage and every edge pointing at real nodes", () => {
    const graph = build();
    for (const node of graph.nodes) {
      expect(node.ax).toBeGreaterThan(0);
      expect(node.ax).toBeLessThan(1);
      expect(node.ay).toBeGreaterThan(0);
      expect(node.ay).toBeLessThan(1);
    }
    for (const edge of graph.edges) {
      expect(graph.nodes[edge.a]).toBeDefined();
      expect(graph.nodes[edge.b]).toBeDefined();
      expect(edge.a).not.toBe(edge.b);
    }
  });

  it("links you to each company and each Insider only to their own company", () => {
    const graph = build();
    const seeker = graph.nodes.findIndex((n) => n.kind === "seeker");
    const edgesOf = (index: number) => graph.edges.filter((e) => e.a === index || e.b === index);

    // You reach every company directly.
    const toCompanies = graph.edges.filter((e) => e.a === seeker);
    expect(toCompanies).toHaveLength(network.companies.length);
    for (const edge of toCompanies) expect(graph.nodes[edge.b]?.kind).toBe("company");

    // Each Insider has exactly one link, to the company they work at.
    graph.nodes.forEach((node, index) => {
      if (node.kind !== "person") return;
      const links = edgesOf(index);
      expect(links).toHaveLength(1);
      const other = graph.nodes[links[0]?.a === index ? links[0].b : (links[0]?.a ?? 0)];
      expect(other?.kind).toBe("company");
      expect(other?.id).toBe(node.companyId);
    });

    // Companies never link to each other.
    for (const edge of graph.edges) {
      expect(graph.nodes[edge.a]?.kind === "company" && graph.nodes[edge.b]?.kind === "company").toBe(false);
    }
  });

  it("lights exactly You to Company to Insider for the chosen person", () => {
    const graph = build();
    const person = graph.nodes.find((n) => n.kind === "person");
    expect(person).toBeDefined();
    if (!person) return;
    const lit = pathEdges(graph, person.id);
    expect(lit.size).toBe(2);
    const seeker = graph.nodes.findIndex((n) => n.kind === "seeker");
    const personIndex = graph.nodes.indexOf(person);
    const kinds = [...lit].map((i) => {
      const edge = graph.edges[i];
      return [graph.nodes[edge?.a ?? 0]?.kind, graph.nodes[edge?.b ?? 0]?.kind].sort().join("-");
    });
    expect(kinds.sort()).toEqual(["company-person", "company-seeker"]);
    expect([...lit].some((i) => graph.edges[i]?.b === personIndex)).toBe(true);
    expect([...lit].some((i) => graph.edges[i]?.a === seeker)).toBe(true);
    expect(pathEdges(graph, null).size).toBe(0);
    expect(pathEdges(graph, "nobody").size).toBe(0);
  });

  it("keeps logos and faces from sitting on top of each other", () => {
    const graph = build();
    const shown = graph.nodes.filter((n) => n.kind !== "spark");
    for (let i = 0; i < shown.length; i += 1) {
      for (let j = i + 1; j < shown.length; j += 1) {
        const a = shown[i];
        const b = shown[j];
        if (!a || !b) continue;
        const dist = Math.hypot((a.ax - b.ax) * ASPECT, a.ay - b.ay);
        expect(dist).toBeGreaterThan((a.size + b.size) * 0.95);
      }
    }
  });

  it("keeps them apart even while the pointer drags nodes together", () => {
    const graph = build();
    // Park the pointer on a company so everything near it is pulled inward.
    const company = graph.nodes.find((n) => n.kind === "company");
    const pointer = { x: company?.ax ?? 0.5, y: company?.ay ?? 0.5 };
    for (let i = 0; i < 400; i += 1) step(graph, 1 / 60, i / 60, pointer, ASPECT);
    const shown = graph.nodes.filter((n) => n.kind !== "spark");
    for (let i = 0; i < shown.length; i += 1) {
      for (let j = i + 1; j < shown.length; j += 1) {
        const a = shown[i];
        const b = shown[j];
        if (!a || !b) continue;
        const dist = Math.hypot((a.x - b.x) * ASPECT, a.y - b.y);
        expect(dist).toBeGreaterThan((a.size + b.size) * 0.9);
      }
    }
  });

  it("only sends pulses along real edges", () => {
    const graph = build();
    expect(graph.pulses.length).toBeGreaterThan(0);
    for (const pulse of graph.pulses) expect(graph.edges[pulse.edge]).toBeDefined();
  });

  it("dims people and companies that do not match the field filter, but never you", () => {
    const graph = build();
    const design = visiblePersonIndexes(graph, "Design");
    expect(design.length).toBeGreaterThan(0);
    for (const index of design) expect(network.people[index]?.field).toBe("Design");
    expect(visiblePersonIndexes(graph, null)).toHaveLength(network.people.length);

    const someone = graph.nodes.find((n) => n.kind === "person" && n.field !== "Design");
    expect(someone && isNodeActive(graph, someone, "Design")).toBe(false);
    const seeker = graph.nodes.find((n) => n.kind === "seeker");
    expect(seeker && isNodeActive(graph, seeker, "Design")).toBe(true);
    const spark = graph.nodes.find((n) => n.kind === "spark");
    expect(spark && isNodeActive(graph, spark, "Design")).toBe(true);
  });

  it("hit-tests the nearest person and ignores dimmed ones", () => {
    const graph = build();
    settle(graph);
    const person = graph.nodes.find((n) => n.kind === "person" && n.field === "Product");
    expect(person).toBeDefined();
    if (!person) return;
    const w = 800;
    const h = 500;
    expect(hitTest(graph, person.x * w, person.y * h, w, h, null)?.id).toBe(person.id);
    expect(hitTest(graph, person.x * w, person.y * h, w, h, "Design")?.id).not.toBe(person.id);
    expect(hitTest(graph, -50, -50, w, h, null)).toBeNull();
  });

  it("pulls nodes toward the pointer and lets them settle back without it", () => {
    const graph = build();
    const node = graph.nodes.find((n) => n.kind === "person");
    expect(node).toBeDefined();
    if (!node) return;
    const pointer = { x: node.ax + 0.05, y: node.ay };
    for (let i = 0; i < 60; i += 1) step(graph, 1 / 60, 0, pointer, ASPECT);
    expect(node.x).toBeGreaterThan(node.ax);
    for (let i = 0; i < 240; i += 1) step(graph, 1 / 60, 0, null, ASPECT);
    expect(Math.abs(node.x - node.ax)).toBeLessThan(0.02);
  });

  it("never lets you follow the pointer and keeps pulse progress in range", () => {
    const graph = build();
    const seeker = graph.nodes.find((n) => n.kind === "seeker");
    const pointer = { x: 0.6, y: 0.5 };
    for (let i = 0; i < 600; i += 1) step(graph, 1 / 60, i / 60, pointer, ASPECT);
    expect(Math.abs((seeker?.x ?? 0) - 0.5)).toBeLessThan(0.01);
    for (const pulse of graph.pulses) {
      expect(pulse.t).toBeGreaterThanOrEqual(0);
      expect(pulse.t).toBeLessThanOrEqual(1);
    }
  });
});
