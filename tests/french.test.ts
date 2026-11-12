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

  it("remplace l’apostrophe droite par l’apostrophe typographique", () => {
    const curly = "\u2019";
    expect(frenchTypography("Chanson d'exemple")).toBe(`Chanson d${curly}exemple`);
    expect(frenchTypography("Unité d'une ligne.")).toBe(`Unité d${curly}une ligne.`);
    expect(frenchTypography("Note : jeu d'esprit.")).toBe(`Note${THIN}: jeu d${curly}esprit.`);
    expect(frenchTypography("Variante : l'édition inventée.")).toBe(`Variante${THIN}: l${curly}édition inventée.`);
    expect(frenchTypography("Contexte d'une fiche.")).toBe(`Contexte d${curly}une fiche.`);
    expect(frenchTypography("Source d'exemple")).toBe(`Source d${curly}exemple`);
    expect(frenchTypography("d\u2019abord")).toBe("d\u2019abord");
  });

  it("met en forme la variante factice", () => {
    const variant = fixture.songs[0]?.units[1]?.variant ?? "";
    expect(frenchTypography(`Variante : ${variant}`)).toBe(
      `Variante${THIN}: Une édition inventée écrit «${THIN}다다${THIN}» au lieu de «${THIN}마마${THIN}».`,
    );
  });
});
