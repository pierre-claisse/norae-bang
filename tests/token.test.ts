// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isFineGrainedToken } from "../src/token/format";
import { browserTokenStorage, TOKEN_STORAGE_KEY } from "../src/token/storage";

describe("jeton", () => {
  it("n’accepte qu’un jeton fine-grained", () => {
    expect(isFineGrainedToken("github_pat_fixture_not_a_real_token")).toBe(true);
    expect(isFineGrainedToken("github_pat_abc")).toBe(false);
    expect(isFineGrainedToken("ghp_abcdefghijklmnopqrstuvwxyz")).toBe(false);
    expect(isFineGrainedToken("github_pat_fixture token_value")).toBe(false);
    expect(isFineGrainedToken("")).toBe(false);
  });

  it("lit, écrit et oublie le jeton dans localStorage", () => {
    const storage = browserTokenStorage();
    expect(storage.read()).toBeNull();
    storage.write("github_pat_fixture_not_a_real_token");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("github_pat_fixture_not_a_real_token");
    expect(storage.read()).toBe("github_pat_fixture_not_a_real_token");
    storage.clear();
    expect(storage.read()).toBeNull();
  });
});
