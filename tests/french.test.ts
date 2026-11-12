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
    expect(frenchTypography(`Déjà${THIN}; fait`)).toBe(`Déjà${THIN}; fait`);
  });

  it("ajoute l’espace fine manquante avant ? ! ; :", () => {
    expect(frenchTypography("en quête de proie?")).toBe(`en quête de proie${THIN}?`);
    expect(frenchTypography("« en quête de proie? »")).toBe(`«${THIN}en quête de proie${THIN}?${THIN}»`);
    expect(frenchTypography("Oui!")).toBe(`Oui${THIN}!`);
    expect(frenchTypography("Attends;")).toBe(`Attends${THIN};`);
    expect(frenchTypography("Attends ;")).toBe(`Attends${THIN};`);
    expect(frenchTypography("Note: suite")).toBe(`Note${THIN}: suite`);
  });

  it("insère l’espace fine dans les guillemets collés", () => {
    expect(frenchTypography("«음음»")).toBe(`«${THIN}음음${THIN}»`);
    expect(frenchTypography("« 음음 »")).toBe(`«${THIN}음음${THIN}»`);
  });

  it("n’altère pas les URL, les heures ni les points de suspension", () => {
    const url = "https://exemple.org/chemin?q=1&x=2";
    expect(frenchTypography(url)).toBe(url);
    expect(frenchTypography("http://exemple.org:8080/a")).toBe("http://exemple.org:8080/a");
    expect(frenchTypography("HTTPS://exemple.org/A")).toBe("HTTPS://exemple.org/A");
    expect(frenchTypography(`Voir ${url} maintenant?`)).toBe(`Voir ${url} maintenant${THIN}?`);
    expect(frenchTypography("https://exemple.org/d'exemple")).toBe("https://exemple.org/d'exemple");
    expect(frenchTypography("Voir l'adresse https://exemple.org/d'exemple maintenant?")).toBe(
      `Voir l\u2019adresse https://exemple.org/d'exemple maintenant${THIN}?`,
    );
    expect(frenchTypography("Rendez-vous à 12:30.")).toBe("Rendez-vous à 12:30.");
    expect(frenchTypography("Durée 1:05:09.")).toBe("Durée 1:05:09.");
    expect(frenchTypography("À 12:30 ?")).toBe(`À 12:30${THIN}?`);
    expect(frenchTypography("Attendez...")).toBe("Attendez...");
    expect(frenchTypography("Attendez…")).toBe("Attendez…");
    expect(frenchTypography("Et alors...?")).toBe(`Et alors...${THIN}?`);
    expect(frenchTypography("Et alors…?")).toBe(`Et alors…${THIN}?`);
    expect(frenchTypography("d'abord...")).toBe("d\u2019abord...");
    expect(frenchTypography(`Note: voir ${url} à 12:30... vraiment?`)).toBe(
      `Note${THIN}: voir ${url} à 12:30... vraiment${THIN}?`,
    );
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

  it("prépare le français affiché : unités, notes, variantes, contexte et sourcesNote", () => {
    const song = fixture.songs[0];
    expect(song).toBeDefined();
    if (!song) return;
    expect(frenchTypography(song.units[0]?.fr ?? "")).toBe("Une seule ligne inventée.");
    expect(frenchTypography(`Note : ${song.units[1]?.note ?? ""}`)).toBe(
      `Note${THIN}: Jeu de mots inventé pour la fixture.`,
    );
    expect(frenchTypography(`Variante : ${song.units[1]?.variant ?? ""}`)).toBe(
      `Variante${THIN}: Une édition inventée écrit «${THIN}다다${THIN}» au lieu de «${THIN}마마${THIN}».`,
    );
    expect(frenchTypography(song.context ?? "")).toBe(
      `Phrase de contexte factice, pour la fiche d\u2019exemple${THIN}: «${THIN}음음${THIN}», en quête de proie${THIN}?`,
    );
    expect(frenchTypography(song.sourcesNote ?? "")).toBe(
      `Remarque de vérification factice${THIN}: plateformes, variantes et dates inventées, pour la mesure de cette fiche d\u2019exemple.`,
    );
  });
});
