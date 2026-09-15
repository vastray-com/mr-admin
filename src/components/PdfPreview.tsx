import { Spin } from 'antd';
import clsx from 'clsx';
import { type FC, useEffect, useRef, useState } from 'react';

/** pdf.js 运行时模块类型（含全局 worker 配置） */
type PdfRuntime = typeof import('pdfjs-dist');

let runtimePromise: Promise<PdfRuntime> | null = null;

/** 懒加载 pdf.js 运行时并配置 worker（动态分包，仅在有 PDF 预览时加载，不拖大主包） */
const loadPdfRuntime = (): Promise<PdfRuntime> => {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return runtimePromise;
};

/** 单页渲染宽度上限（px），避免超宽页面占用过多内存 */
const MAX_PAGE_WIDTH = 900;
/** 渲染倍率上限，兼顾清晰度与开销 */
const MAX_SCALE = 2;

type Props = {
  /** PDF 文件内容 */
  blob: Blob;
  className?: string;
};

/**
 * PDF 文档预览：按需加载 pdf.js，把每一页渲染为 canvas 并按容器宽度自适应堆叠展示。
 * 不依赖浏览器内置 PDF 插件（嵌入式 / 部分国产浏览器可能缺失），渲染期间显示加载态，
 * 解析失败时提示下载查看；组件卸载或内容变化时清空容器并销毁文档。
 */
export const PdfPreview: FC<Props> = ({ blob, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let alive = true;
    let dispose: (() => void) | undefined;
    container.innerHTML = '';
    setLoading(true);
    setFailed(false);
    setPageCount(0);

    const renderPages = async () => {
      const pdfjs = await loadPdfRuntime();
      const data = new Uint8Array(await blob.arrayBuffer());
      const task = pdfjs.getDocument({ data });
      const doc = await task.promise;
      // pdf.js 的文档销毁入口在加载任务上（会一并释放 worker）
      dispose = () => void task.destroy();
      if (!alive) return;

      setPageCount(doc.numPages);
      const maxWidth = Math.min(
        container.clientWidth || MAX_PAGE_WIDTH,
        MAX_PAGE_WIDTH,
      );
      for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
        const page = await doc.getPage(pageNo);
        if (!alive) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(MAX_SCALE, maxWidth / base.width),
        });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className =
          'mx-auto mb-[12px] block rounded-[4px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.16)]';
        container.appendChild(canvas);
        await page.render({ canvas, viewport }).promise;
      }
      if (alive) setLoading(false);
    };

    renderPages().catch(() => {
      if (alive) {
        setFailed(true);
        setLoading(false);
      }
    });

    return () => {
      alive = false;
      dispose?.();
      container.innerHTML = '';
    };
  }, [blob]);

  return (
    <div className={className}>
      {pageCount > 0 && !failed && (
        <div className="mb-[8px] text-right text-[12px] text-fg-tertiary">
          共 {pageCount} 页
        </div>
      )}
      <div className="relative">
        {(loading || failed) && (
          <div className="absolute inset-0 z-1 flex items-center justify-center bg-white/70">
            {failed ? (
              <span className="text-[13px] text-fg-secondary">
                PDF 解析失败，请下载后查看
              </span>
            ) : (
              <Spin />
            )}
          </div>
        )}
        <div
          ref={containerRef}
          className={clsx(
            'max-h-[70vh] overflow-auto rounded-[6px] border-1 border-solid bg-black/5 p-[12px]',
            loading && !failed && 'min-h-[320px]',
          )}
        />
      </div>
    </div>
  );
};
