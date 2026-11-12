import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { catalogErrorMessage, loadCatalog } from "./domain/loadCatalog";
import type { Catalog } from "./domain/schema";
import { GitHubContents, type FetchLike } from "./github/client";
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
  if (!token.current) return <LoginScreen />;
  return <CatalogApp token={token.current} fetchImpl={fetchImpl} onForget={token.forget} />;
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; catalog: Catalog };

function CatalogApp({
  token,
  fetchImpl,
  onForget,
}: {
  token: string;
  fetchImpl?: FetchLike;
  onForget: () => void;
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
        setState({ kind: "error", message: catalogErrorMessage(error) });
      },
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, fetchImpl, attempt]);

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
