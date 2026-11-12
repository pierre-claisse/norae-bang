export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type GitHubCode = "unauthorized" | "forbidden" | "not_found" | "network" | "http";

export class GitHubRequestError extends Error {
  readonly name = "GitHubRequestError";

  constructor(
    readonly code: GitHubCode,
    readonly status: number,
  ) {
    super(messageFor(code, status));
  }
}

export class GitHubContents {
  constructor(
    private readonly options: {
      owner: string;
      repo: string;
      branch: string;
      token: string;
      fetchImpl?: FetchLike;
    },
  ) {}

  async getFile(path: string, signal?: AbortSignal): Promise<{ text: string } | null> {
    try {
      const body = await this.request(this.contentsPath(path), signal);
      if (Array.isArray(body)) throw new Error("La réponse GitHub est un dossier, pas un fichier.");
      if (!isRecord(body)) throw new GitHubRequestError("http", 200);
      const encoding = body.encoding;
      const content = body.content;
      if (encoding !== "base64" || typeof content !== "string" || content.trim() === "") {
        throw new GitHubRequestError("http", 200);
      }
      return { text: decodeBase64(content) };
    } catch (error) {
      if (error instanceof GitHubRequestError && error.code === "not_found") return null;
      throw error;
    }
  }

  private contentsPath(path: string): string {
    const encoded = path
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    const owner = encodeURIComponent(this.options.owner);
    const repo = encodeURIComponent(this.options.repo);
    const ref = encodeURIComponent(this.options.branch);
    return `/repos/${owner}/${repo}/contents/${encoded}?ref=${ref}`;
  }

  private async request(path: string, signal?: AbortSignal): Promise<unknown> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    let response: Response;
    try {
      response = await fetchImpl(`https://api.github.com${path}`, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.options.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new GitHubRequestError("network", 0);
    }

    if (response.status === 404) throw new GitHubRequestError("not_found", 404);
    if (!response.ok) {
      await response.text().catch(() => undefined);
      throw new GitHubRequestError(codeFor(response.status), response.status);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new GitHubRequestError("http", response.status);
    }
    return json;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function codeFor(status: number): GitHubCode {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "http";
}

function messageFor(code: GitHubCode, status: number): string {
  switch (code) {
    case "unauthorized":
      return "Jeton refusé (401). Il est expiré, révoqué ou mal copié.";
    case "forbidden":
      return "Accès refusé (403). Vérifiez la permission Contents en lecture sur pierre-claisse/norae-bang-data, ou réessayez plus tard si le quota GitHub est atteint.";
    case "not_found":
      return "Introuvable (404). Le fichier ou le dépôt n’est pas accessible avec ce jeton.";
    case "network":
      return "Réseau indisponible. Les paroles ne sont pas conservées sur cet appareil.";
    case "http":
      if (status === 200) return "La réponse GitHub est illisible.";
      return `GitHub a répondu ${status}. Le répertoire n’a pas pu être lu.`;
    default: {
      const unexpected: never = code;
      return unexpected;
    }
  }
}

function decodeBase64(value: string): string {
  try {
    const binary = atob(value.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new GitHubRequestError("http", 200);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
