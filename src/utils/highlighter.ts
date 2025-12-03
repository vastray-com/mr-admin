import { createHighlighter } from 'shiki';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

let HIGHLIGHTER: HighlighterGeneric<BundledLanguage, BundledTheme> | null =
  null;
export const _initHighlighter = async () => {
  if (!HIGHLIGHTER) {
    HIGHLIGHTER = await createHighlighter({
      themes: ['one-light'],
      langs: ['javascript', 'sh'],
    });
  }
};

export const getCode = (code: string, lang: BundledLanguage) => {
  if (!HIGHLIGHTER) {
    return code;
  }
  return HIGHLIGHTER.codeToHtml(code, {
    lang,
    theme: 'one-light',
  });
};
