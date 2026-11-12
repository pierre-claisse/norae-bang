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
    expect(screen.getByText(/pierre-claisse\/norae-bang-data/)).toBeInTheDocument();
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
    expect(screen.getAllByText("Paroles vérifiées")).toHaveLength(2);
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    expect(screen.getByText("Paroles manquantes")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Rechercher" }), "sans paroles");
    expect(screen.getByRole("link", { name: /Sans paroles/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Chanson exemple/ })).toBeNull();
    await user.clear(screen.getByRole("searchbox", { name: "Rechercher" }));

    await user.click(screen.getByRole("link", { name: /Chanson exemple/ }));
    expect(await screen.findByRole("heading", { name: "예시 노래" })).toBeInTheDocument();
    expect(screen.getByText("Une seule ligne inventée.")).toBeInTheDocument();
    expect(screen.getByText(/premier couplet et finit au second/)).toBeInTheDocument();
    expect(screen.getByText(/Note :/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source exemple" })).toHaveAttribute(
      "href",
      "https://example.com/source-exemple",
    );

    await user.click(screen.getByRole("link", { name: "Retour au répertoire" }));
    await user.click(await screen.findByRole("link", { name: /Brouillon exemple/ }));
    expect(await screen.findByText("Brouillon d'une ligne inventée.")).toBeInTheDocument();
    expect(screen.getByText(/pas encore été vérifiées/)).toBeInTheDocument();
    expect(screen.getByText("Aucune source indiquée.")).toBeInTheDocument();

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
    expect(screen.queryByText(/Note :/)).toBeNull();
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
