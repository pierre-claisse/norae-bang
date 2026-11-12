import { describe, expect, it, vi } from "vitest";
import { GitHubContents, GitHubRequestError } from "../src/github/client";

const token = "github_pat_fixture_not_a_real_token";

describe("client GitHub", () => {
  it("lit songs.json en GET, sans cache, sans suivre de redirection, sans exposer le jeton", async () => {
    const text = "{\"schemaVersion\":1,\"titre\":\"예시\"}";
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(url).toBe(
        "https://api.github.com/repos/pierre-claisse/norae-bang-data/contents/songs.json?ref=main",
      );
      expect(url).not.toContain(token);
      expect(init?.method).toBe("GET");
      expect(init?.cache).toBe("no-store");
      expect(init?.redirect).toBe("error");
      expect(init?.credentials).toBe("omit");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
      expect(headers.get("Accept")).toBe("application/vnd.github+json");
      expect(headers.has("User-Agent")).toBe(false);
      const wrapped = Buffer.from(text, "utf8").toString("base64").split("").join("\n");
      return json({ sha: "fixture-sha", encoding: "base64", content: wrapped });
    });
    const client = new GitHubContents({
      owner: "pierre-claisse",
      repo: "norae-bang-data",
      branch: "main",
      token,
      fetchImpl,
    });
    const file = await client.getFile("songs.json");
    expect(file?.text).toBe(text);
    expect("putFile" in client).toBe(false);
  });

  it("traduit 401 sans reprendre le corps de la réponse", async () => {
    const fetchImpl = vi.fn(async () => new Response(`token=${token}`, { status: 401 }));
    const client = clientWith(fetchImpl);
    await expect(client.getFile("songs.json")).rejects.toBeInstanceOf(GitHubRequestError);
    await expect(client.getFile("songs.json")).rejects.toThrow(/401/);
    await expect(client.getFile("songs.json")).rejects.not.toThrow(/fixture/);
  });

  it("renvoie null quand le fichier est introuvable", async () => {
    const client = clientWith(vi.fn(async () => new Response("absent", { status: 404 })));
    await expect(client.getFile("songs.json")).resolves.toBeNull();
  });

  it("explique un 403 sans citer le jeton", async () => {
    const client = clientWith(vi.fn(async () => new Response(token, { status: 403 })));
    await expect(client.getFile("songs.json")).rejects.toThrow(/Contents en lecture/);
    await expect(client.getFile("songs.json")).rejects.not.toThrow(/github_pat_/);
  });

  it("signale un dossier et un contenu illisible", async () => {
    const directory = clientWith(vi.fn(async () => json([])));
    await expect(directory.getFile("songs.json")).rejects.toThrow(/dossier/);
    const broken = clientWith(vi.fn(async () => json({ encoding: "base64", content: "@@@" })));
    await expect(broken.getFile("songs.json")).rejects.toThrow(/illisible/);
  });

  it("nomme une coupure réseau sans masquer une annulation", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("failed");
    });
    await expect(clientWith(fetchImpl).getFile("songs.json")).rejects.toThrow(/Réseau indisponible/);

    const abort = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const error = new Error("aborted");
      error.name = "AbortError";
      if (init?.signal) throw error;
      throw error;
    });
    await expect(clientWith(abort).getFile("songs.json", new AbortController().signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

function clientWith(fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  return new GitHubContents({
    owner: "pierre-claisse",
    repo: "norae-bang-data",
    branch: "main",
    token,
    fetchImpl,
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
