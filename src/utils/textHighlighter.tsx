import { Fragment, type ReactNode } from 'react';

const BM25_OPERATORS = new Set([
  'and',
  'or',
  'not',
  'to',
  'in',
  'true',
  'false',
]);

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractBm25Keywords = (query: string): string[] => {
  const raw = String(query ?? '').trim();
  if (!raw) {
    return [];
  }

  const quoted: string[] = [];
  const unquoted = raw.replace(/"([^"]+)"|'([^']+)'/g, (_, g1, g2) => {
    const value = String(g1 ?? g2 ?? '').trim();
    if (value) {
      quoted.push(value);
    }
    return ' ';
  });

  const tokens = unquoted.match(/[\p{L}\p{N}_-]+/gu) ?? [];
  const normalized = tokens
    .map((token) => token.replace(/^[-+~^]+|[-+~^*?]+$/g, '').trim())
    .filter((token) => token && !BM25_OPERATORS.has(token.toLowerCase()))
    .map((token) => {
      if (!token.includes(':')) {
        return token;
      }
      const parts = token.split(':');
      return parts[parts.length - 1] || '';
    })
    .filter(Boolean);

  return Array.from(new Set([...quoted, ...normalized])).sort(
    (a, b) => b.length - a.length,
  );
};

export const matchesAnyKeyword = (
  text: string,
  keywords: string[],
): boolean => {
  if (keywords.length < 1) {
    return true;
  }
  const source = String(text ?? '').toLowerCase();
  return keywords.some((keyword) => source.includes(keyword.toLowerCase()));
};

export const highlightTextByKeywords = (
  text: string,
  keywords: string[],
): ReactNode => {
  const source = String(text ?? '');
  if (!source) {
    return '-';
  }
  const valid = keywords.filter(Boolean);
  if (valid.length < 1) {
    return source;
  }

  const pattern = new RegExp(
    `(${valid.map((keyword) => escapeRegExp(keyword)).join('|')})`,
    'gi',
  );
  const parts = source.split(pattern);
  return (
    <>
      {parts.map((part, idx) =>
        valid.some(
          (keyword) => keyword.toLowerCase() === part.toLowerCase(),
        ) ? (
          <mark
            key={`${part}-${idx}`}
            className="bg-yellow-400 text-black font-semibold px-[2px] rounded-[2px]"
          >
            {part}
          </mark>
        ) : (
          <Fragment key={`${part}-${idx}`}>{part}</Fragment>
        ),
      )}
    </>
  );
};
