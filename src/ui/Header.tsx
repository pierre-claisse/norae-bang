import { Link } from "react-router-dom";

export function Header({ onForget, home }: { onForget: () => void; home: "link" | "text" }) {
  const mark = <span className="brand-mark">norae-bang</span>;
  return (
    <header className="top">
      {home === "link" ? (
        <Link to="/" className="brand">
          {mark}
        </Link>
      ) : (
        <span className="brand">{mark}</span>
      )}
      <button type="button" className="secondary" onClick={onForget}>
        Oublier ou remplacer le jeton
      </button>
    </header>
  );
}
