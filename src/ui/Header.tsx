import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { frenchTypography } from "../domain/french";

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
      <TokenControl onForget={onForget} />
    </header>
  );
}

function TokenControl({ onForget }: { onForget: () => void }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="token-link" aria-label="Jeton" title="Jeton" onClick={() => setOpen(true)}>
        <svg className="token-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
          <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div className="confirm-backdrop" onMouseDown={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="confirm"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id={titleId}>{frenchTypography("Oublier le jeton ?")}</h2>
            <p>Il sera effacé de ce navigateur. Vous pourrez en coller un autre ensuite.</p>
            <div className="confirm-actions">
              <button ref={cancelRef} type="button" className="secondary" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onForget();
                }}
              >
                Oublier le jeton
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
