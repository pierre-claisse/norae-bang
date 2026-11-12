const THIN = "\u202F";
const APOSTROPHE = "\u2019";

export function frenchTypography(text: string): string {
  const tokens: string[] = [];
  const keep = (match: string) => {
    const token = `\uE000${tokens.length}\uE001`;
    tokens.push(match);
    return token;
  };
  // URL, heures et points de suspension : pas d’espace fine à l’intérieur.
  const shielded = text
    .replace(/https?:\/\/[^\s<>«»]+/giu, keep)
    .replace(/(?<!\d)\d{1,2}:\d{2}(?::\d{2})?(?!\d)/gu, keep)
    .replace(/\.{3}|…/gu, keep);
  const withApostrophes = shielded.replaceAll("'", APOSTROPHE);
  const withQuotes = withApostrophes.replace(/«[^\S\n]*/gu, `«${THIN}`).replace(/[^\S\n]*»/gu, `${THIN}»`);
  const withPunctuation = withQuotes.replace(/[^\S\n]*([:;?!])/gu, `${THIN}$1`);
  return withPunctuation.replace(/\uE000(\d+)\uE001/gu, (match, index: string) => tokens[Number(index)] ?? match);
}
