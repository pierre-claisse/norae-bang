import { describe, expect, it } from "vitest";
import { frenchTypography } from "../src/domain/french";
import fixture from "./fixtures/catalog.json";

const THIN = "\u202F";

describe("typographie française", () => {
  it("place une espace fine insécable autour des guillemets et avant : ? !", () => {
    expect(frenchTypography("« texte »")).toBe(`«${THIN}texte${THIN}»`);
    expect(frenchTypography("Note : suite")).toBe(`Note${THIN}: suite`);
    expect(frenchTypography("Vraiment ?")).toBe(`Vraiment${THIN}?`);
    expect(frenchTypography("Oui !")).toBe(`Oui${THIN}!`);
    expect(frenchTypography("« Quoi ? »")).toBe(`«${THIN}Quoi${THIN}?${THIN}»`);
  });

  it("ne double pas une espace fine déjà présente", () => {
    const ready = `«${THIN}déjà${THIN}»`;
    expect(frenchTypography(ready)).toBe(ready);
    expect(frenchTypography(`Déjà${THIN}: fait`)).toBe(`Déjà${THIN}: fait`);
  });

  it("laisse un texte sans ponctuation haute inchangé", () => {
    expect(frenchTypography("Jeu de mots inventé pour la fixture.")).toBe("Jeu de mots inventé pour la fixture.");
  });

  it("met en forme la variante factice", () => {
    const variant = fixture.songs[0]?.units[1]?.variant ?? "";
    expect(frenchTypography(`Variante : ${variant}`)).toBe(
      `Variante${THIN}: Une édition inventée écrit «${THIN}다다${THIN}» au lieu de «${THIN}마마${THIN}».`,
    );
  });
});
