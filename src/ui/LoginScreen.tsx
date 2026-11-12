import { useId, useState, type FormEvent } from "react";
import { frenchTypography } from "../domain/french";
import { useToken } from "../token/TokenProvider";
import { useDocumentTitle } from "./useDocumentTitle";

const TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

export function LoginScreen({
  initialValue = "",
  externalError = null,
}: {
  initialValue?: string;
  externalError?: string | null;
}) {
  const token = useToken();
  const errorId = useId();
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(false);
  const error = editing ? localError : (localError ?? externalError);
  useDocumentTitle("Connexion · norae-bang");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditing(false);
    setLocalError(token.save(value));
  }

  return (
    <>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <main id="contenu" className="gate" tabIndex={-1}>
        <form className="gate-card" onSubmit={onSubmit}>
          <h1>norae-bang</h1>
          <p>Ce site n’embarque aucune chanson. Collez un jeton pour lire le répertoire privé.</p>
          <ol>
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noreferrer">
                Créez un jeton à accès restreint (fine-grained)
              </a>
              .
            </li>
            <li>
              Autorisez uniquement le dépôt{" "}
              <code className="repo">
                <span className="repo-part">pierre‑claisse</span>
                /<wbr />
                <span className="repo-part">norae‑bang‑data</span>
              </code>
              .
            </li>
            <li>
              {frenchTypography("Permission : ")}<strong>Contents</strong>, en lecture seule.
            </li>
          </ol>
          <label htmlFor="token">Jeton GitHub</label>
          <div className="token-field">
            <input
              id="token"
              name="token"
              type={visible ? "text" : "password"}
              value={value}
              placeholder="github_pat_…"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setEditing(true);
                setLocalError(null);
                setValue(event.target.value);
              }}
            />
            <button
              type="button"
              className="icon-button"
              aria-controls="token"
              aria-pressed={visible}
              aria-label={visible ? "Masquer le jeton" : "Afficher le jeton"}
              onClick={() => setVisible((next) => !next)}
            >
              <EyeIcon off={visible} />
            </button>
          </div>
          {error ? (
            <p id={errorId} className="field-error" role="alert">
              <AlertIcon />
              <span>{error}</span>
            </p>
          ) : null}
          <button className="wide" type="submit">
            Enregistrer le jeton
          </button>
          <p className="hint">Le jeton reste dans ce navigateur et sert seulement à lire les paroles sur GitHub.</p>
        </form>
      </main>
    </>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {off ? (
        <>
          <path d="M4 6 20 18" />
          <path d="M9.2 9.4A3 3 0 0 0 14.6 14" />
          <path d="M6.1 7.7C4.4 9.1 3 12 3 12s3.6 6 9 6c1.5 0 2.9-.4 4.1-1" />
          <path d="M10 6.2A9 9 0 0 1 12 6c5.4 0 9 6 9 6a17 17 0 0 1-2.1 2.7" />
        </>
      ) : (
        <>
          <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z" />
          <circle cx="12" cy="12" r="2.4" />
        </>
      )}
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="icon alert-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}
