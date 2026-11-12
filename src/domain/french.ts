const THIN = "\u202F";
const APOSTROPHE = "\u2019";

export function frenchTypography(text: string): string {
  const withApostrophes = text.replaceAll("'", APOSTROPHE);
  const withQuotes = withApostrophes.replace(/«[^\S\n]*/gu, `«${THIN}`).replace(/[^\S\n]*»/gu, `${THIN}»`);
  return withQuotes.replace(/[^\S\n]*([:?!])/gu, `${THIN}$1`);
}
