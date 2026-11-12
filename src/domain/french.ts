const THIN = "\u202F";

export function frenchTypography(text: string): string {
  const withQuotes = text.replace(/«[^\S\n]*/gu, `«${THIN}`).replace(/[^\S\n]*»/gu, `${THIN}»`);
  return withQuotes.replace(/[^\S\n]*([:?!])/gu, `${THIN}$1`);
}
