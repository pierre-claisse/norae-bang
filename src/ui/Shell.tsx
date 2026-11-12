import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Shell({ onForget }: { onForget: () => void }) {
  return (
    <>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <Header onForget={onForget} home="link" />
      <main id="contenu" className="wrap" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="colophon">Lecture seule. Les paroles sont lues à la demande et ne font pas partie de ce site.</footer>
    </>
  );
}
