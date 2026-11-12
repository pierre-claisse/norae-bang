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
      <button type="button" className="token-link" onClick={() => setOpen(true)}>
        Jeton
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
