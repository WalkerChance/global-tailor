import { describe, it, expect } from "vitest";
import { slugify, parseDollarsToCents, centsToInput } from "./utils";

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Tailor Lagos")).toBe("tailor-lagos");
  });
  it("strips punctuation and accents", () => {
    expect(slugify("Café  &  Co.!")).toBe("cafe-co");
  });
  it("trims leading/trailing dashes", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });
});

describe("parseDollarsToCents", () => {
  it("parses plain dollars", () => {
    expect(parseDollarsToCents("70")).toBe(7000);
    expect(parseDollarsToCents("12.34")).toBe(1234);
  });
  it("strips $ and commas", () => {
    expect(parseDollarsToCents("$1,299.99")).toBe(129999);
  });
  it("returns null for blank/invalid/negative", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents(null)).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNull();
    expect(parseDollarsToCents("-5")).toBeNull();
  });
  it("rounds to the nearest cent", () => {
    expect(parseDollarsToCents("0.005")).toBe(1);
  });
});

describe("centsToInput", () => {
  it("formats cents as a dollar string", () => {
    expect(centsToInput(7000)).toBe("70.00");
    expect(centsToInput(0)).toBe("0.00");
  });
  it("returns empty for null/undefined", () => {
    expect(centsToInput(null)).toBe("");
    expect(centsToInput(undefined)).toBe("");
  });
});
