import { createHighlighter } from 'shiki';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

let HIGHLIGHTER: HighlighterGeneric<BundledLanguage, BundledTheme> | null =
  null;

/** 初始化 Shiki 高亮器（含智能体对话常用的语言） */
export const _initHighlighter = async () => {
  if (!HIGHLIGHTER) {
    HIGHLIGHTER = await createHighlighter({
      themes: ['one-light'],
      langs: [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'json',
        'python',
        'rust',
        'sql',
        'bash',
        'sh',
        'html',
        'css',
        'markdown',
        'yaml',
      ],
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

/**
 * 尝试把代码高亮为 HTML 字符串。
 * 高亮器未就绪、语言不支持或高亮失败时返回 null，由调用方回退到纯文本渲染。
 * @param code 代码内容
 * @param lang 语言标识（如 sql/json/rust）
 * @returns 高亮后的 HTML，或 null
 */
export const tryGetCode = (code: string, lang: string): string | null => {
  if (!HIGHLIGHTER) {
    return null;
  }
  try {
    return HIGHLIGHTER.codeToHtml(code, {
      lang: lang as BundledLanguage,
      theme: 'one-light',
    });
  } catch {
    return null;
  }
};
