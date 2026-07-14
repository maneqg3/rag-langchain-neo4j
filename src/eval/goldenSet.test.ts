import { describe, expect, it } from "vitest";
import { goldenSet } from "./goldenSet.js";

describe("goldenSet", () => {
  it("tem 11 perguntas no total", () => {
    expect(goldenSet).toHaveLength(11);
  });

  it("tem 4 perguntas hop único, 4 multi-hop e 3 fora de escopo", () => {
    const counts = goldenSet.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts["single-hop"]).toBe(4);
    expect(counts["multi-hop"]).toBe(4);
    expect(counts["out-of-scope"]).toBe(3);
  });

  it("perguntas respondíveis (hop único/multi-hop) têm ao menos 1 fato esperado", () => {
    const respondiveis = goldenSet.filter((item) => item.category !== "out-of-scope");
    for (const item of respondiveis) {
      expect(item.expectedFacts.length).toBeGreaterThan(0);
    }
  });

  it("perguntas multi-hop têm pelo menos 2 fatos esperados", () => {
    const multiHop = goldenSet.filter((item) => item.category === "multi-hop");
    for (const item of multiHop) {
      expect(item.expectedFacts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("perguntas fora de escopo não têm fatos esperados", () => {
    const foraDeEscopo = goldenSet.filter((item) => item.category === "out-of-scope");
    for (const item of foraDeEscopo) {
      expect(item.expectedFacts).toEqual([]);
    }
  });

  it("ids são únicos", () => {
    const ids = goldenSet.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
