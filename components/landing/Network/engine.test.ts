import { describe, it, expect } from "vitest";
import { network } from "@/src/config/landing";
import {
  buildGraph,
  hitTest,
  isNodeActive,
  mulberry32,
  settle,
  step,
  visiblePersonIndexes,
} from "./engine";

const build = () => buildGraph({ companies: network.companies, people: network.people });

describe("network engine", () => {
  it("is deterministic for a seed", () => {
    const a = build();
    const b = build();
    expect(a.nodes.map((n) => [n.ax, n.ay])).toEqual(b.nodes.map((n) => [n.ax, n.ay]));
    const r1 = mulberry32(3);
    const r2 = mulberry32(3);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });

  it("creates one hub in the centre, a node per company and per person", () => {
    const graph = build();
    const hubs = graph.nodes.filter((n) => n.kind === "hub");
    expect(hubs).toHaveLength(1);
    expect(hubs[0]?.ax).toBe(0.5);
    expect(hubs[0]?.ay).toBe(0.5);
    expect(graph.nodes.filter((n) => n.kind === "company")).toHaveLength(network.companies.length - 1);
    expect(graph.nodes.filter((n) => n.kind === "person")).toHaveLength(network.people.length);
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

  it("only sends pulses along solid edges", () => {
    const graph = build();
    expect(graph.pulses.length).toBeGreaterThan(0);
    for (const pulse of graph.pulses) expect(graph.edges[pulse.edge]?.faint).toBe(false);
  });

  it("dims people and companies that do not match the field filter", () => {
    const graph = build();
    const design = visiblePersonIndexes(graph, "Design");
    expect(design.length).toBeGreaterThan(0);
    for (const index of design) expect(network.people[index]?.field).toBe("Design");
    expect(visiblePersonIndexes(graph, null)).toHaveLength(network.people.length);

    const someone = graph.nodes.find((n) => n.kind === "person" && n.field !== "Design");
    expect(someone && isNodeActive(graph, someone, "Design")).toBe(false);
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
    for (let i = 0; i < 60; i += 1) step(graph, 1 / 60, 0, pointer);
    expect(node.x).toBeGreaterThan(node.ax);
    for (let i = 0; i < 240; i += 1) step(graph, 1 / 60, 0, null);
    expect(Math.abs(node.x - node.ax)).toBeLessThan(0.02);
  });

  it("never lets the hub follow the pointer and keeps pulse progress in range", () => {
    const graph = build();
    const hub = graph.nodes.find((n) => n.kind === "hub");
    const pointer = { x: 0.6, y: 0.5 };
    for (let i = 0; i < 600; i += 1) step(graph, 1 / 60, i / 60, pointer);
    expect(Math.abs((hub?.x ?? 0) - 0.5)).toBeLessThan(0.01);
    for (const pulse of graph.pulses) {
      expect(pulse.t).toBeGreaterThanOrEqual(0);
      expect(pulse.t).toBeLessThanOrEqual(1);
    }
  });
});
