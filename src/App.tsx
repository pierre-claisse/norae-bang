import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { catalogErrorMessage, loadCatalog } from "./domain/loadCatalog";
import type { Catalog } from "./domain/schema";
import { GitHubContents, GitHubRequestError, type FetchLike } from "./github/client";
import { TokenProvider, useToken } from "./token/TokenProvider";
import type { TokenStorage } from "./token/storage";
import { LoginScreen } from "./ui/LoginScreen";
import { Shell } from "./ui/Shell";
import { SongListPage } from "./ui/SongListPage";
import { SongPage } from "./ui/SongPage";
import { StatusScreen } from "./ui/StatusScreen";
import { useDocumentTitle } from "./ui/useDocumentTitle";

const DATA_OWNER = "pierre-claisse";
const DATA_REPO = "norae-bang-data";
const DATA_BRANCH = "main";

export type AppDeps = {
  fetchImpl?: FetchLike;
  storage?: TokenStorage;
};

export function App({ deps }: { deps?: AppDeps }) {
  return (
    <TokenProvider storage={deps?.storage}>
      <Gate fetchImpl={deps?.fetchImpl} />
    </TokenProvider>
  );
}

function Gate({ fetchImpl }: { fetchImpl?: FetchLike }) {
  const token = useToken();
  const [problem, setProblem] = useState<{ message: string; value: string } | null>(null);
  const onForget = useCallback(() => {
    setProblem(null);
    token.forget();
  }, [token]);
  const onTokenProblem = useCallback(
    (message: string) => {
      setProblem({ message, value: token.current ?? "" });
      token.forget();
    },
    [token],
  );
  if (!token.current) {
    return <LoginScreen initialValue={problem?.value ?? ""} externalError={problem?.message ?? null} />;
  }
  return (
    <CatalogApp token={token.current} fetchImpl={fetchImpl} onForget={onForget} onTokenProblem={onTokenProblem} />
  );
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; catalog: Catalog };

function CatalogApp({
  token,
  fetchImpl,
  onForget,
  onTokenProblem,
}: {
  token: string;
  fetchImpl?: FetchLike;
  onForget: () => void;
  onTokenProblem: (message: string) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState({ kind: "loading" });
    const client = new GitHubContents({
      owner: DATA_OWNER,
      repo: DATA_REPO,
      branch: DATA_BRANCH,
      token,
      fetchImpl,
    });
    loadCatalog(client, controller.signal).then(
      (catalog) => {
        if (!cancelled) setState({ kind: "ready", catalog });
      },
      (error: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        const access = tokenAccessMessage(error);
        if (access) {
          onTokenProblem(access);
          return;
        }
        setState({ kind: "error", message: catalogErrorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, fetchImpl, attempt, onTokenProblem]);

  switch (state.kind) {
    case "loading":
      return (
        <StatusScreen title="Chargement" onForget={onForget} busy>
          <p>Chargement du répertoire…</p>
        </StatusScreen>
      );
    case "error":
      return (
        <StatusScreen title="Lecture impossible" onForget={onForget}>
          <h1>Lecture impossible</h1>
          <p role="alert">{state.message}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Réessayer
          </button>
        </StatusScreen>
      );
    case "ready":
      return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Shell onForget={onForget} />}>
              <Route path="/" element={<SongListPage songs={state.catalog.songs} />} />
              <Route path="/chanson/:songId" element={<SongPage songs={state.catalog.songs} />} />
              <Route path="*" element={<MissingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      );
    default: {
      const unexpected: never = state;
      return unexpected;
    }
  }
}

function tokenAccessMessage(error: unknown): string | null {
  if (!(error instanceof GitHubRequestError)) return null;
  switch (error.code) {
    case "unauthorized":
      return "GitHub refuse ce jeton";
    case "forbidden":
    case "not_found":
      return "Ce jeton n’a pas accès à norae-bang-data";
    case "network":
      return "Erreur réseau. Impossible de joindre GitHub.";
    case "http":
      return null;
    default: {
      const unexpected: never = error.code;
      return unexpected;
    }
  }
}

function MissingPage() {
  useDocumentTitle("Page introuvable · norae-bang");
  return (
    <>
      <h1>Page introuvable</h1>
      <p>Cette adresse ne correspond à aucun écran.</p>
      <p>
        <Link to="/">Retour au répertoire</Link>
      </p>
    </>
  );
}
