import type { ReactNode } from "react";
import { Header } from "./Header";
import { useDocumentTitle } from "./useDocumentTitle";

export function StatusScreen({
  title,
  onForget,
  children,
  busy = false,
}: {
  title: string;
  onForget: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  useDocumentTitle(`${title} · norae-bang`);
  return (
    <>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <Header onForget={onForget} home="text" />
      <main id="contenu" className="wrap" tabIndex={-1} aria-busy={busy}>
        {children}
      </main>
    </>
  );
}
