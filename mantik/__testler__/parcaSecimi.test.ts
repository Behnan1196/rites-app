import { eklenecekParcaVarMi, secilebilirParcalar } from "../parcaSecimi";

describe("Her parça karta bir kez (P-67)", () => {
  it("kartta olan listede yok", () => {
    expect(
      secilebilirParcalar({ uzman: false, mevcut: ["liste"] }).gorunen,
    ).toEqual(["foto", "video"]);
    const u = secilebilirParcalar({ uzman: true, mevcut: ["olcum", "video"] });
    expect(u.gorunen).not.toContain("video");
    expect(u.kayit).not.toContain("olcum");
    expect(u.kayit).toContain("puan");
  });
  it("proje adımları liste sayılır", () => {
    expect(
      secilebilirParcalar({ uzman: true, mevcut: ["adimlar"] }).gorunen,
    ).not.toContain("liste");
  });
  it("hepsi eklenince düğme yok", () => {
    expect(
      eklenecekParcaVarMi({ uzman: false, mevcut: ["liste", "foto", "video"] }),
    ).toBe(false);
    expect(eklenecekParcaVarMi({ uzman: false, mevcut: ["liste"] })).toBe(true);
    expect(
      eklenecekParcaVarMi({
        uzman: false,
        haric: ["foto"],
        mevcut: ["liste", "video"],
      }),
    ).toBe(false);
  });
});
