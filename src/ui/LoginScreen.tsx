import { useState, type FormEvent } from "react";
import { useToken } from "../token/TokenProvider";
import { useDocumentTitle } from "./useDocumentTitle";

const TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

export function LoginScreen() {
  const token = useToken();
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  useDocumentTitle("Connexion · norae-bang");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = new FormData(event.currentTarget).get("token");
    setError(token.save(typeof raw === "string" ? raw : ""));
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
              Créez un jeton fine-grained.{" "}
              <a href={TOKEN_URL} target="_blank" rel="noreferrer">
                Créer un jeton
              </a>
            </li>
            <li>
              Autorisez uniquement le dépôt <strong>pierre-claisse/norae-bang-data</strong>.
            </li>
            <li>
              Permission : <strong>Contents</strong>, en lecture seule.
            </li>
          </ol>
          <label htmlFor="token">Jeton</label>
          <div className="token-field">
            <input
              id="token"
              name="token"
              type={visible ? "text" : "password"}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button
              type="button"
              className="secondary"
              aria-controls="token"
              aria-pressed={visible}
              onClick={() => setVisible((value) => !value)}
            >
              {visible ? "Masquer" : "Afficher"}
            </button>
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <button className="wide" type="submit">
            Enregistrer le jeton
          </button>
          <p className="hint">Le jeton reste sur cet appareil (localStorage). Il sert seulement à lire l’API GitHub.</p>
        </form>
      </main>
    </>
  );
}
