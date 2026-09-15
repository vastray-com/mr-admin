import { Spin } from 'antd';
import { type FC, useEffect, useRef, useState } from 'react';

/** docx-preview 渲染使用的类名前缀（用于覆盖其默认样式，避免与页面其它样式冲突） */
const DOCX_CLASS = 'hm-docx';

/** 覆盖 docx-preview 默认样式：去掉灰色底衬与内边距，页面改为白底 + 轻投影 */
const DOCX_STYLE = `
.${DOCX_CLASS}-wrapper { background: transparent !important; padding: 0 !important; }
.${DOCX_CLASS}-wrapper > section.${DOCX_CLASS} {
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16) !important;
  margin-bottom: 12px !important;
}
`;

let runtimePromise: Promise<typeof import('docx-preview')> | null = null;

/** 懒加载 docx-preview 运行时（动态分包，仅在有 Word 文件预览时加载，不拖大主包） */
const loadDocxRuntime = (): Promise<typeof import('docx-preview')> => {
  if (!runtimePromise) {
    runtimePromise = import('docx-preview');
  }
  return runtimePromise;
};

type Props = {
  /** Word（.docx）文件内容 */
  blob: Blob;
  className?: string;
};

/**
 * Word（.docx）文档预览：按需加载 `docx-preview`，将文档解析并分页渲染为类 Word 版式。
 * 渲染期间显示加载态，解析失败时提示下载查看；组件卸载或内容变化时清空容器。
 */
export const DocxPreview: FC<Props> = ({ blob, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let alive = true;
    container.innerHTML = '';
    setLoading(true);
    setFailed(false);

    loadDocxRuntime()
      .then((runtime) =>
        runtime.renderAsync(blob, container, undefined, {
          className: DOCX_CLASS,
          inWrapper: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
        }),
      )
      .then(() => {
        if (alive) setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      alive = false;
      container.innerHTML = '';
    };
  }, [blob]);

  return (
    <div className={className}>
      {/* 覆盖 docx-preview 注入的默认样式（仅作用于 .hm-docx* 类，不污染其它页面） */}
      <style>{DOCX_STYLE}</style>
      <div className="relative">
        {(loading || failed) && (
          <div className="absolute inset-0 z-1 flex items-center justify-center bg-white/70">
            {failed ? (
              <span className="text-[13px] text-fg-secondary">
                Word 文档解析失败，请下载后查看
              </span>
            ) : (
              <Spin />
            )}
          </div>
        )}
        <div
          ref={containerRef}
          className="max-h-[70vh] overflow-auto rounded-[6px] border-1 border-solid bg-black/5 p-[12px]"
        />
      </div>
    </div>
  );
};
