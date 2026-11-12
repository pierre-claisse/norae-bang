// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { TOKEN_STORAGE_KEY } from "../src/token/storage";
import fixture from "./fixtures/catalog.json";

const TOKEN = "github_pat_fixture_not_a_real_token";

beforeEach(() => {
  at("/norae-bang/");
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
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
    expect(screen.getByText("Chanson exemple")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chanson exemple/ }).textContent).toContain("가수 예시 · 2020");
    expect(screen.queryByText("Artiste exemple")).toBeNull();
    expect(screen.getAllByText("Paroles vérifiées")).toHaveLength(2);
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    expect(screen.getByText("Paroles manquantes")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "sans paroles");
    expect(screen.getByRole("link", { name: /Sans paroles/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chanson exemple/ })).toBeNull();
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.click(screen.getByRole("link", { name: /Chanson exemple/ }));
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    expect(document.querySelector(".song .meta")?.textContent).toBe("가수 예시 · 2020");
    expect(screen.queryByText("Artiste exemple")).toBeNull();
    expect(screen.queryByText(/\([^)]*exemple\)/)).toBeNull();
    const bannerOrder = [...document.querySelectorAll(".song-banner h1, .song-banner .title-fr, .song-banner .meta, .song-banner .song-context")].map(
      (element) => element.getAttribute("class") ?? element.tagName.toLowerCase(),
    );
    expect(bannerOrder).toEqual(["h1", "title-fr", "meta", "song-context"]);
    expect(screen.getByText("Phrase de contexte factice, pour la fiche d'exemple.")).toBeInTheDocument();
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
    await user.click(await screen.findByRole("link", { name: /Brouillon exemple/ }));
    expect(await screen.findByText("Brouillon d'une ligne inventée.")).toBeInTheDocument();
    expect(screen.getByText(/pas encore été vérifiées/)).toBeInTheDocument();
    expect(screen.queryByText(/Variante\u202F:/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();

    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));
    await user.click(await screen.findByRole("link", { name: /Sans paroles/ }));
    expect(await screen.findByText("Les paroles de cette chanson ne sont pas encore disponibles.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Jeton" }));
    expect(screen.getByRole("dialog", { name: "Oublier le jeton ?" })).toBeInTheDocument();
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
    expect(screen.queryByText("Phrase de contexte factice, pour la fiche d'exemple.")).toBeNull();
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
    expect(await screen.findByText("Phrase de contexte factice, pour la fiche d'exemple.")).toBeInTheDocument();
    expect(screen.queryByText("Ancienne remarque factice.")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Sources" })).toBeNull();
    spy.mockRestore();
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
    expect(await screen.findByRole("alert")).toHaveTextContent(/schemaVersion/);
    expect(screen.queryByText("Chanson exemple")).toBeNull();
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
    expect(chips[2]).toContain("다른 가수");
    expect(chips[3]).toContain("셋째 그룹");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /가수 예시, 2 chansons/ }));
    expect(screen.getByRole("button", { name: /가수 예시, 2 chansons/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(document.querySelector(".count")?.textContent).toBe("2 chansons · 가수 예시");
    expect(screen.getByRole("link", { name: /Chanson exemple/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Seulement le hangeul/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Brouillon exemple/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Sans paroles/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Chanson exemple/ })).toHaveAttribute("href", expect.stringContaining("artiste="));

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "hangeul");
    expect(screen.queryByRole("link", { name: /Chanson exemple/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Seulement le hangeul/ })).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.click(screen.getByRole("link", { name: /Chanson exemple/ }));
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    const artistLink = screen.getByRole("link", { name: "가수 예시" });
    expect(artistLink).toHaveAttribute("href", expect.stringContaining("artiste="));
    expect(new URL(artistLink.getAttribute("href") ?? "", "http://localhost").searchParams.get("artiste")).toBe("가수 예시");
    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));

    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(screen.getByRole("button", { name: /가수 예시, 2 chansons/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("link", { name: /Brouillon exemple/ })).toBeNull();

    await user.click(screen.getByRole("link", { name: /Chanson exemple/ }));
    await user.click(await screen.findByRole("link", { name: "가수 예시" }));
    expect(await screen.findByRole("heading", { name: "Répertoire" })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get("artiste")).toBe("가수 예시");
    expect(screen.getByRole("link", { name: /Seulement le hangeul/ })).toBeInTheDocument();
  });

  it("ouvre une liste déjà filtrée par l’URL et centre la puce", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => undefined);
    at(`/norae-bang/?artiste=${encodeURIComponent("셋째 그룹")}`);
    window.localStorage.setItem(TOKEN_STORAGE_KEY, TOKEN);
    render(<App deps={{ fetchImpl: mockCatalog() }} />);
    expect(await screen.findByRole("link", { name: /Sans paroles/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chanson exemple/ })).toBeNull();
    expect(screen.getByRole("button", { name: /셋째 그룹, 1 chanson/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tous" })).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".count")?.textContent).toBe("1 chanson · 셋째 그룹");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" });
    scrollIntoView.mockRestore();
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
