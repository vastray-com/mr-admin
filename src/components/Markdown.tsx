import clsx from 'clsx';
import { type FC, type ReactNode, useMemo } from 'react';
import { EChartBlock } from '@/components/EChart';
import { MermaidBlock } from '@/components/Mermaid';
import { tryGetCode } from '@/utils/highlighter';

type Props = {
  /** Markdown 源文本 */
  content: string;
  className?: string;
};

type Block =
  | { type: 'code'; lang?: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'quote'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'paragraph'; lines: string[] };

/** 行内语法：代码、加粗、斜体、删除线、链接 */
const INLINE_RE =
  /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|~~[^~]+~~|\[[^\]]+\]\([^)\s]+\))/g;

/** 渲染行内 Markdown（代码/加粗/斜体/删除线/链接） */
const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  INLINE_RE.lastIndex = 0;
  let match = INLINE_RE.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i-${index++}`;
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-[4px] bg-[rgba(56,117,246,0.10)] px-[4px] py-[1px] text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('~~')) {
      nodes.push(<del key={key}>{token.slice(2, -2)}</del>);
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      nodes.push(
        link ? (
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-[#3875F6] hover:underline"
          >
            {link[1]}
          </a>
        ) : (
          token
        ),
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = match.index + token.length;
    match = INLINE_RE.exec(text);
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
};

/** 是否为表格分隔行（如 | --- | :--: |） */
const isTableSeparator = (line: string) =>
  /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(line);

/** 拆分表格行单元格 */
const splitTableRow = (row: string): string[] => {
  let cells = row.split('|').map((cell) => cell.trim());
  if (cells[0] === '') cells = cells.slice(1);
  if (cells[cells.length - 1] === '') cells = cells.slice(0, -1);
  return cells;
};

/** 将 Markdown 文本解析为块级结构 */
const parseBlocks = (content: string): Block[] => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 围栏代码块
    const fence = /^```(.*)$/.exec(trimmed);
    if (fence) {
      const lang = fence[1].trim().split(/\s+/)[0] || undefined;
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // 标题
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    // 分割线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 引用
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    // 表格
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      const header = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableRow(lines[i].trim()));
        i++;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    // 列表
    const unordered = /^[-*+]\s+/.test(trimmed);
    const ordered = /^\d+[.)]\s+/.test(trimmed);
    if (unordered || ordered) {
      const pattern = unordered ? /^[-*+]\s+/ : /^\d+[.)]\s+/;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(pattern, ''));
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // 段落
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i].trim();
      if (
        !current ||
        /^```/.test(current) ||
        /^#{1,6}\s+/.test(current) ||
        /^>\s?/.test(current) ||
        /^[-*+]\s+/.test(current) ||
        /^\d+[.)]\s+/.test(current) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(current)
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', lines: paraLines });
  }
  return blocks;
};

/** 代码块：优先用 Shiki 高亮，不支持时回退为纯文本 */
const CodeBlock: FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const html = useMemo(
    () => (lang ? tryGetCode(code, lang) : null),
    [code, lang],
  );
  if (html) {
    return (
      <div
        className="my-[10px] overflow-auto rounded-[8px] text-[13px]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <pre className="my-[10px] overflow-auto rounded-[8px] bg-[rgba(56,117,246,0.06)] p-[12px] text-[13px]">
      <code>{code}</code>
    </pre>
  );
};

const HEADING_CLASS = [
  'text-[20px]',
  'text-[18px]',
  'text-[16px]',
  'text-[15px]',
  'text-[14px]',
  'text-[13px]',
];

/** 渲染块级结构 */
const renderBlocks = (content: string): ReactNode[] =>
  parseBlocks(content).map((block, index) => {
    const key = `b-${index}`;
    switch (block.type) {
      case 'code': {
        // 特殊语言标记的围栏代码块：由对应图表组件渲染为可视化图形
        const lang = block.lang?.toLowerCase();
        if (lang === 'echarts') {
          return <EChartBlock key={key} code={block.code} />;
        }
        if (lang === 'mermaid') {
          return <MermaidBlock key={key} code={block.code} />;
        }
        return <CodeBlock key={key} code={block.code} lang={block.lang} />;
      }
      case 'heading':
        return (
          <div
            key={key}
            className={clsx(
              'mt-[12px] mb-[6px] font-semibold first:mt-0',
              HEADING_CLASS[block.level - 1],
            )}
          >
            {renderInline(block.text, key)}
          </div>
        );
      case 'hr':
        return <hr key={key} className="my-[12px] border-0 border-t-1" />;
      case 'quote':
        return (
          <blockquote
            key={key}
            className="my-[8px] pl-[10px] text-fg-secondary"
            style={{ borderLeft: '3px solid #d0d7de' }}
          >
            {renderInline(block.lines.join('\n'), key)}
          </blockquote>
        );
      case 'list':
        return block.ordered ? (
          <ol key={key} className="my-[6px] list-decimal pl-[22px]">
            {block.items.map((item, li) => (
              <li key={`${key}-${li}`} className="my-[2px]">
                {renderInline(item, `${key}-${li}`)}
              </li>
            ))}
          </ol>
        ) : (
          <ul key={key} className="my-[6px] list-disc pl-[22px]">
            {block.items.map((item, li) => (
              <li key={`${key}-${li}`} className="my-[2px]">
                {renderInline(item, `${key}-${li}`)}
              </li>
            ))}
          </ul>
        );
      case 'table':
        return (
          <div key={key} className="my-[10px] overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {block.header.map((cell, ci) => (
                    <th
                      key={`${key}-h-${ci}`}
                      className="border-1 bg-[rgba(56,117,246,0.06)] px-[8px] py-[4px] text-left font-medium"
                    >
                      {renderInline(cell, `${key}-h-${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={`${key}-r-${ri}`}>
                    {row.map((cell, ci) => (
                      <td
                        key={`${key}-r-${ri}-${ci}`}
                        className="border-1 px-[8px] py-[4px] align-top"
                      >
                        {renderInline(cell, `${key}-r-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <p
            key={key}
            className="my-[6px] break-words whitespace-pre-wrap first:mt-0 last:mb-0"
          >
            {renderInline(block.lines.join('\n'), key)}
          </p>
        );
    }
  });

/**
 * 轻量 Markdown 渲染组件（Markdown 解析无需额外依赖）。
 * 支持标题、段落、围栏代码块（Shiki 高亮 / `echarts` 图表 / `mermaid` 流程图）、
 * 有序/无序列表、引用、分割线、表格与常见行内语法；渲染为 React 节点，避免 HTML 注入风险。
 */
export const Markdown: FC<Props> = ({ content, className }) => {
  const nodes = useMemo(() => renderBlocks(content), [content]);
  return (
    <div className={clsx('text-[14px] leading-[1.7]', className)}>{nodes}</div>
  );
};
