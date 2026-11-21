// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { TOKEN_STORAGE_KEY } from "../src/token/storage";
import fixture from "./fixtures/catalog.json";

const TOKEN = "github_pat_fixture_not_a_real_token";
const THIN = "\u202F";
const RENDERED_CONTEXT = `Phrase de contexte factice, pour la fiche d\u2019exemple${THIN}: «${THIN}음음${THIN}», en quête de proie${THIN}?`;

beforeEach(() => {
  at("/norae-bang/");
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("application", () => {
  it("n’affiche que la connexion et n’appelle pas GitHub sans jeton", () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("non", { status: 500 }));
    render(<App deps={{ fetchImpl }} />);
    expect(screen.getByRole("heading", { name: "norae-bang" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accès restreint/ })).toHaveAttribute(
      "href",
      "https://github.com/settings/personal-access-tokens/new",
    );
    expect(screen.getByRole("button", { name: "Afficher le jeton" })).toBeInTheDocument();
    expect(screen.getByLabelText("Jeton GitHub")).toHaveAttribute("placeholder", "github_pat_…");
    expect(screen.getByText(/reste dans ce navigateur/)).toBeInTheDocument();
    expect(screen.getByText("pierre‑claisse").textContent?.includes("\u2011")).toBe(true);
    expect(screen.getByText("norae‑bang‑data").textContent?.includes("\u2011")).toBe(true);
    expect(document.querySelector(".repo")?.textContent?.replace(/\s/g, "")).toBe("pierre‑claisse/norae‑bang‑data");
    expect(screen.getByText(/Contents/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toContain(
      "Permission\u202F: Contents, en lecture seule.",
    );
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByText("Chanson exemple")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuse un jeton qui n’est pas fine-grained", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("non", { status: 500 }));
    const user = userEvent.setup();
    render(<App deps={{ fetchImpl }} />);
    await user.type(screen.getByLabelText("Jeton GitHub"), "ghp_notfinegrainedtoken");
    await user.click(screen.getByRole("button", { name: "Enregistrer le jeton" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Ce jeton ne commence pas par github_pat_");
    expect(screen.getByLabelText("Jeton GitHub")).toHaveAttribute("aria-invalid", "true");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("affiche le répertoire factice, la fiche, puis oublie le jeton", async () => {
    const fetchImpl = mockCatalog();
    const user = userEvent.setup();
    render(<App deps={{ fetchImpl }} />);
    await user.type(screen.getByLabelText("Jeton GitHub"), `  ${TOKEN}  `);
    await user.click(screen.getByRole("button", { name: "Enregistrer le jeton" }));

    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(TOKEN);
    expect(screen.queryByText("Chanson exemple")).toBeNull();
    const exempleSub = screen.getByRole("link", { name: /예시 노래/ }).querySelector(".song-sub");
    expect(exempleSub?.textContent).not.toContain("Chanson exemple");
    expect(exempleSub?.querySelector(".title-fr")).toBeNull();
    expect(exempleSub?.textContent).toContain("가수 예시");
    expect(exempleSub?.textContent).toContain("2020");
    expect(exempleSub?.textContent ?? "").not.toMatch(/^\s*·/);
    expect(screen.queryByText("Artiste exemple")).toBeNull();
    expect(screen.getAllByText("paroles vérifiées")).toHaveLength(2);
    expect(screen.getByText("brouillon")).toBeInTheDocument();
    expect(screen.getByText("sans paroles")).toBeInTheDocument();
    expect(screen.queryByText("Paroles manquantes")).toBeNull();

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "sans paroles");
    expect(screen.getByRole("link", { name: /빈 노래/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /예시 노래/ })).toBeNull();
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.click(screen.getByRole("link", { name: /예시 노래/ }));
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    expect(screen.getByText("Chanson exemple")).toBeInTheDocument();
    expect(screen.getByText("Paroles vérifiées")).toBeInTheDocument();
    expect(document.querySelector(".song .meta")?.textContent).toBe("가수 예시 · 2020");
    expect(screen.queryByText("Artiste exemple")).toBeNull();
    expect(screen.queryByText(/\([^)]*exemple\)/)).toBeNull();
    const bannerOrder = [...document.querySelectorAll(".song-banner h1, .song-banner .title-fr, .song-banner .meta, .song-banner .song-context")].map(
      (element) => element.getAttribute("class") ?? element.tagName.toLowerCase(),
    );
    expect(bannerOrder).toEqual(["h1", "title-fr", "meta", "song-context"]);
    expect(document.querySelector(".song-context")?.textContent).toBe(RENDERED_CONTEXT);
    expect(screen.getByText(/Remarque de vérification factice/)).toBeInTheDocument();
    expect(screen.getByText(/가짜줄예시/)).toBeInTheDocument();
    expect(screen.getByText("Une seule ligne inventée.")).toBeInTheDocument();
    expect(screen.getByText(/premier couplet et finit au second/)).toBeInTheDocument();
    const noted = screen.getByText(/Jeu de mots inventé pour la fixture\./).closest(".unit");
    const note = noted?.querySelector(".unit-note");
    const variant = noted?.querySelector(".unit-variant");
    expect(note?.textContent).toBe("Note\u202F: Jeu de mots inventé pour la fixture.");
    expect(variant?.textContent).toBe(
      "Variante\u202F: Une édition inventée écrit «\u202F다다\u202F» au lieu de «\u202F마마\u202F».",
    );
    expect(note && variant && Boolean(note.compareDocumentPosition(variant) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(document.querySelectorAll(".unit-variant")).toHaveLength(1);
    expect(document.querySelector(".stanza-mark")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "Source exemple" })).toHaveAttribute(
      "href",
      "https://example.com/source-exemple",
    );

    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));
    await user.click(await screen.findByRole("link", { name: /초고 노래/ }));
    expect(await screen.findByText("Brouillon d\u2019une ligne inventée.")).toBeInTheDocument();
    expect(screen.getByText(/pas encore été vérifiées/)).toBeInTheDocument();
    expect(screen.queryByText(/Variante\u202F:/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();

    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));
    await user.click(await screen.findByRole("link", { name: /빈 노래/ }));
    expect(await screen.findByText("Les paroles de cette chanson ne sont pas encore disponibles.")).toBeInTheDocument();
    expect(screen.getByText("Paroles manquantes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Jeton" }));
    expect(screen.getByRole("dialog", { name: "Oublier le jeton\u202F?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(TOKEN);
    await user.click(screen.getByRole("button", { name: "Jeton" }));
    await user.click(screen.getByRole("button", { name: "Oublier le jeton" }));
    expect(await screen.findByLabelText("Jeton GitHub")).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(screen.queryByText("Chanson exemple")).toBeNull();

    const url = String(fetchImpl.mock.calls[0]?.[0]);
    expect(url).toBe("https://api.github.com/repos/pierre-claisse/norae-bang-data/contents/songs.json?ref=main");
    expect(url).not.toContain(TOKEN);
  });

  it("affiche notes dans Sources quand context et sourcesNote manquent", async () => {
    const body = structuredClone(fixture) as {
      songs: Array<Record<string, unknown>>;
    };
    const song = body.songs[0]!;
    delete song.context;
    delete song.sourcesNote;
    song.notes = "Ancienne remarque factice.";
    at("/norae-bang/chanson/chanson-exemple");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<App deps={{ fetchImpl: mockCatalog(body) }} />);
    expect(await screen.findByRole("heading", { name: "Sources" })).toBeInTheDocument();
    expect(screen.getByText("Ancienne remarque factice.")).toBeInTheDocument();
    expect(screen.queryByText(/Phrase de contexte factice/)).toBeNull();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("clé dépréciée"));
    spy.mockRestore();
  });

  it("n’affiche pas notes dans Sources quand le contexte est renseigné", async () => {
    const body = structuredClone(fixture) as {
      songs: Array<Record<string, unknown>>;
    };
    body.songs[0]!.notes = "Ancienne remarque factice.";
    body.songs[0]!.sources = [];
    body.songs[0]!.sourcesNote = null;
    at("/norae-bang/chanson/chanson-exemple");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<App deps={{ fetchImpl: mockCatalog(body) }} />);
    expect(await screen.findByText(/Phrase de contexte factice/)).toBeInTheDocument();
    expect(document.querySelector(".song-context")?.textContent).toBe(RENDERED_CONTEXT);
    expect(screen.queryByText("Ancienne remarque factice.")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();
    spy.mockRestore();
  });

  it("met en forme le français affiché et n’affiche pas verificationLog", async () => {
    const body = structuredClone(fixture) as {
      songs: Array<Record<string, unknown> & { units: Array<Record<string, unknown>> }>;
    };
    const secret = `JOURNAL-VERIFICATION-INVISIBLE-9f3a ${"détail ".repeat(40)}`;
    const song = body.songs[0]!;
    song.verificationLog = secret;
    song.context = "Contexte d'exemple à 12:30 : «음음», en quête de proie?";
    song.sourcesNote = "Source d'exemple : voir https://exemple.org/a?q=1 maintenant?";
    song.units[0]!.fr = "Unité d'exemple ; «음음», en quête de proie?";
    song.units[0]!.note = "jeu d'esprit : «음음», vraiment?";
    song.units[0]!.variant = "édition d'exemple : «음음», vraiment?";
    at("/norae-bang/chanson/chanson-exemple");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog(body) }} />);
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    const unit = document.querySelector(".unit");
    expect(unit?.querySelector(".unit-fr > p")?.textContent).toBe(
      `Unité d\u2019exemple${THIN}; «${THIN}음음${THIN}», en quête de proie${THIN}?`,
    );
    expect(unit?.querySelector(".unit-note")?.textContent).toBe(
      `Note${THIN}: jeu d\u2019esprit${THIN}: «${THIN}음음${THIN}», vraiment${THIN}?`,
    );
    expect(unit?.querySelector(".unit-variant")?.textContent).toBe(
      `Variante${THIN}: édition d\u2019exemple${THIN}: «${THIN}음음${THIN}», vraiment${THIN}?`,
    );
    expect(document.querySelector(".song-context")?.textContent).toBe(
      `Contexte d\u2019exemple à 12:30${THIN}: «${THIN}음음${THIN}», en quête de proie${THIN}?`,
    );
    expect(document.querySelector(".sources-note")?.textContent).toBe(
      `Source d\u2019exemple${THIN}: voir https://exemple.org/a?q=1 maintenant${THIN}?`,
    );
    expect(document.body.textContent).not.toContain("JOURNAL-VERIFICATION-INVISIBLE-9f3a");
    expect(document.body.innerHTML).not.toContain("JOURNAL-VERIFICATION-INVISIBLE-9f3a");
    expect(document.title).not.toContain("JOURNAL-VERIFICATION-INVISIBLE-9f3a");
  });

  it("ouvre la fiche demandée par l’URL", async () => {
    at("/norae-bang/chanson/chanson-exemple");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Jeton GitHub")).toBeNull();
  });

  it("affiche les erreurs de schéma sans liste partielle", async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog({ schemaVersion: 2 }) }} />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/schemaVersion/);
    expect(alert.textContent).toContain("schemaVersion\u202F:");
    expect(screen.queryByText("Chanson exemple")).toBeNull();
  });

  it("affiche l’avis brouillon avec une espace fine insécable avant les deux-points", async () => {
    at("/norae-bang/chanson/brouillon-exemple");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    const notice = await screen.findByText(/pas encore été vérifiées/);
    const text = notice.textContent ?? "";
    const colon = text.indexOf(":");
    expect(colon).toBeGreaterThan(0);
    expect(text.charCodeAt(colon - 1)).toBe(0x202f);
  });

  it("explique un JSON invalide et un jeton refusé", async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    const invalid = render(<App deps={{ fetchImpl: fileResponse("ceci n'est pas du json") }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/JSON valide/);
    invalid.unmount();

    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(
      <App
        deps={{
          fetchImpl: vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(TOKEN, { status: 401 })),
        }}
      />,
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("GitHub refuse ce jeton");
    expect(alert.textContent ?? "").not.toContain(TOKEN);
    expect(screen.getByLabelText("Jeton GitHub")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Jeton GitHub")).toHaveAttribute("aria-describedby", alert.id);
  });

  it("affiche le hangeul seul quand il n’y a pas de traduction", async () => {
    at("/norae-bang/chanson/sans-traduction");
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    expect(await screen.findByText("가나 다라")).toBeInTheDocument();
    expect(screen.getByText("마바 사아")).toBeInTheDocument();
    expect(screen.queryByText(/traduire/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Traduction" })).toBeNull();
    expect(screen.queryByText("Une seule ligne inventée.")).toBeNull();
    expect(screen.queryByText(/Note\u202F:/)).toBeNull();
    expect(screen.queryByText(/Variante\u202F:/)).toBeNull();
  });

  it("filtre par artiste, le combine à la recherche, et le conserve au retour", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();

    const chips = [...document.querySelectorAll(".artist-chip")].map((chip) => chip.textContent);
    expect(chips[0]).toBe("Tous");
    expect(chips[1]).toContain("가수 예시");
    expect(chips[1]).toContain("2");
    expect(chips[2]).toBe("다른 가수");
    expect(chips[3]).toBe("셋째 그룹");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /가수 예시, 2 chansons/ }));
    expect(screen.getByRole("button", { name: /가수 예시, 2 chansons/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(document.querySelector(".count")?.textContent).toBe("2 chansons · 가수 예시");
    expect(screen.getByRole("link", { name: /예시 노래/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /한글만/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /초고 노래/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /빈 노래/ })).toBeNull();
    expect(screen.getByRole("link", { name: /예시 노래/ })).toHaveAttribute("href", expect.stringContaining("artiste="));

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "hangeul");
    expect(screen.queryByRole("link", { name: /예시 노래/ })).toBeNull();
    expect(screen.getByRole("link", { name: /한글만/ })).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.click(screen.getByRole("link", { name: /예시 노래/ }));
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    const artistLink = screen.getByRole("link", { name: "가수 예시" });
    expect(artistLink).toHaveAttribute("href", expect.stringContaining("artiste="));
    expect(new URL(artistLink.getAttribute("href") ?? "", "http://localhost").searchParams.get("artiste")).toBe("가수 예시");
    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));

    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(screen.getByRole("button", { name: /가수 예시, 2 chansons/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("link", { name: /초고 노래/ })).toBeNull();

    await user.click(screen.getByRole("link", { name: /예시 노래/ }));
    await user.click(await screen.findByRole("link", { name: "가수 예시" }));
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(screen.getByRole("link", { name: /한글만/ })).toBeInTheDocument();
  });

  it("ouvre une liste déjà filtrée par l’URL et centre la puce", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => undefined);
    at(`/norae-bang/?artiste=${encodeURIComponent("셋째 그룹")}`);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    expect(await screen.findByRole("link", { name: /빈 노래/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /예시 노래/ })).toBeNull();
    expect(screen.getByRole("button", { name: "셋째 그룹" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".count")?.textContent).toBe("1 chanson · 셋째 그룹");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" });
    scrollIntoView.mockRestore();
  });

  it("regroupe, trie, compte et conserve q, tri et artiste au retour", async () => {
    const user = userEvent.setup({ delay: 0 });
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog(directoryCatalog()) }} />);
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();

    expect(sectionLabels()).toEqual(["ㄱ", "ㄴ", "ㄷ", "#"]);
    expect(sectionTitles("ㄱ")).toEqual(["가나", "까나"]);
    expect(sectionTitles("ㄴ")).toEqual(["나나"]);
    expect(sectionTitles("ㄷ")).toEqual(["다나", "따나"]);
    expect(sectionTitles("#")).toEqual(["★별", "ABC"]);
    expect(screen.queryByRole("heading", { name: "ㄹ" })).toBeNull();
    expect(screen.getByRole("button", { name: "Titre" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Artiste" })).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".count")?.textContent).toBe("7 chansons");
    const gaSub = screen.getByRole("link", { name: /가나/ }).querySelector(".song-sub");
    expect(gaSub?.textContent).not.toContain("Titre ga");
    expect(gaSub?.textContent).toContain("가수 가");
    expect(gaSub?.textContent).toContain("1991");
    const firstHeading = screen.getByRole("heading", { name: "ㄱ" });
    expect(firstHeading.id).not.toBe("");
    expect(firstHeading.closest("section")).toHaveAttribute("aria-labelledby", firstHeading.id);

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "Titre");
    expect(sectionLabels()).toEqual(["ㄱ", "ㄴ", "ㄷ", "#"]);
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "kka");
    expect(sectionLabels()).toEqual(["ㄱ"]);
    expect(sectionTitles("ㄱ")).toEqual(["까나"]);
    expect(new URLSearchParams(window.location.search).get("q")).toBeNull();
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get("q")).toBe("kka");
    });
    expect(document.querySelector(".count")?.textContent).toBe("1 chanson");

    await user.click(screen.getByRole("button", { name: "Artiste" }));
    expect(screen.getByRole("button", { name: "Artiste" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Titre" })).toHaveAttribute("aria-pressed", "false");
    expect(sectionLabels()).toEqual(["가수 가"]);
    expect(screen.getByRole("link", { name: /까나/ }).querySelector(".song-sub")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("tri")).toBe("artiste");
    expect(new URLSearchParams(window.location.search).get("q")).toBe("kka");

    await user.click(screen.getByRole("button", { name: /가수 가, 2 chansons/ }));
    const params = () => new URLSearchParams(window.location.search);
    expect(params().get("artiste")).toBe("가수 가");
    expect(params().get("q")).toBe("kka");
    expect(params().get("tri")).toBe("artiste");
    expect(document.querySelector(".count")?.textContent).toBe("1 chanson · 가수 가");

    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const scrollY = vi.spyOn(window, "scrollY", "get").mockReturnValue(240);
    await user.click(screen.getByRole("link", { name: /까나/ }));
    const back = await screen.findByRole("link", { name: "Retour au répertoire" });
    const backParams = new URL(back.getAttribute("href") ?? "", "http://localhost").searchParams;
    expect(backParams.get("q")).toBe("kka");
    expect(backParams.get("tri")).toBe("artiste");
    expect(backParams.get("artiste")).toBe("가수 가");
    const artistParams = new URL(screen.getByRole("link", { name: "가수 가" }).getAttribute("href") ?? "", "http://localhost").searchParams;
    expect(artistParams.get("q")).toBeNull();
    expect(artistParams.get("tri")).toBe("artiste");
    expect(artistParams.get("artiste")).toBe("가수 가");
    expect(storageKeys().some((key) => key.includes("q=kka") && key.includes("tri=artiste"))).toBe(true);

    await user.click(back);
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(params().get("q")).toBe("kka");
    expect(params().get("tri")).toBe("artiste");
    expect(params().get("artiste")).toBe("가수 가");
    expect(screen.getByRole("button", { name: "Artiste" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /가수 가, 2 chansons/ })).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".count")?.textContent).toBe("1 chanson · 가수 가");
    expect(sectionTitles("가수 가")).toEqual(["까나"]);
    expect(scrollTo).toHaveBeenCalledWith(0, 240);

    await user.click(screen.getByRole("button", { name: "Titre" }));
    expect(new URLSearchParams(window.location.search).get("tri")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("q")).toBe("kka");
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 가");
    scrollTo.mockRestore();
    scrollY.mockRestore();
  });

  it("n’écrit jamais un point en tête de seconde ligne", async () => {
    const user = userEvent.setup({ delay: 0 });
    const body = directoryCatalog();
    body.songs.push(entry("sans-fr", "마나", null, "가수 나", 1987, "verified"));
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog(body) }} />);
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();

    const subs = [...document.querySelectorAll(".song-sub")];
    expect(subs.length).toBeGreaterThan(0);
    for (const sub of subs) {
      expect(sub.textContent ?? "").not.toMatch(/^\s*·/);
    }
    const withoutFrench = screen.getByRole("link", { name: /마나/ }).querySelector(".song-sub");
    expect(withoutFrench?.textContent?.trimStart().startsWith("가수 나")).toBe(true);
    expect(withoutFrench?.textContent).toContain("1987");
    expect(withoutFrench?.querySelector(".title-fr")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Artiste" }));
    const byArtist = screen.getByRole("link", { name: /다나/ }).querySelector(".song-sub");
    expect(byArtist?.textContent).not.toContain("Titre da");
    expect(byArtist?.textContent?.trim()).toBe("2001");
    expect(byArtist?.textContent).not.toContain("가수");
    expect(byArtist?.textContent ?? "").not.toMatch(/^\s*·/);
    const yearOnly = screen.getByRole("link", { name: /마나/ }).querySelector(".song-sub");
    expect(yearOnly?.textContent?.trim()).toBe("1987");
    expect(yearOnly?.textContent ?? "").not.toMatch(/^\s*·/);
  });

  it("oublie un jeton stocké qui n’a pas le bon format", () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, "pas-un-jeton");
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("non", { status: 500 }));
    render(<App deps={{ fetchImpl }} />);
    expect(screen.getByLabelText("Jeton GitHub")).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

function directoryCatalog() {
  const body = structuredClone(fixture) as { songs: Array<Record<string, unknown>> };
  body.songs = [
    entry("ga", "가나", "Titre ga", "가수 가", 1991, "verified"),
    entry("kka", "까나", "Titre kka", "가수 가", null, "draft"),
    entry("na", "나나", "Titre na", "가수 나", null, "missing"),
    entry("da", "다나", "Titre da", "가수 다", 2001, "verified"),
    entry("tta", "따나", "Titre tta", "가수 다", null, "verified"),
    entry("abc", "ABC", "Titre latin", "가수 하", null, "missing"),
    entry("star", "★별", "Titre etoile", "가수 하", null, "missing"),
  ];
  return body;
}

function entry(
  id: string,
  title: string,
  titleFr: string | null,
  artist: string,
  year: number | null,
  lyricsStatus: string,
) {
  return {
    id,
    spotifyTrackId: null,
    title,
    titleFr,
    artist,
    year,
    lyricsStatus,
    lines: [],
    units: [],
    sources: [],
    context: null,
    sourcesNote: null,
  };
}

function storageKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key) keys.push(key);
  }
  return keys;
}

function sectionLabels(): string[] {
  return screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent ?? "");
}

function sectionTitles(label: string): string[] {
  const section = screen.getByRole("heading", { name: label, level: 2 }).closest("section");
  return [...(section?.querySelectorAll(".song-title") ?? [])].map((node) => node.textContent ?? "");
}

function mockCatalog(body: unknown = fixture) {
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => fileBody(JSON.stringify(body)));
}

function fileResponse(text: string) {
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => fileBody(text));
}

function fileBody(text: string): Response {
  return new Response(
    JSON.stringify({
      encoding: "base64",
      sha: "fixture-sha",
      content: Buffer.from(text, "utf8").toString("base64"),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function at(path: string): void {
  window.history.replaceState(null, "", path);
}
