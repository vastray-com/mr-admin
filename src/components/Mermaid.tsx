import { type FC, type ReactNode, useEffect, useRef, useState } from 'react';

/** 最小化的 Mermaid 运行时接口（仅使用到的方法，避免绑定具体版本类型） */
type MermaidRuntime = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

/** 占位高度（px） */
const DEFAULT_HEIGHT = 320;

let runtimePromise: Promise<MermaidRuntime> | null = null;

/** 懒加载并初始化 Mermaid 运行时（动态分包，仅在有流程图时加载，不拖大主包） */
const loadMermaidRuntime = (): Promise<MermaidRuntime> => {
  if (!runtimePromise) {
    runtimePromise = import('mermaid').then((mod) => {
      const runtime = ((mod as unknown as { default?: MermaidRuntime })
        .default ?? mod) as MermaidRuntime;
      runtime.initialize({
        startOnLoad: false,
        // 图表定义来自用户文件 / 模型输出，视为不可信内容：关闭 click 交互并净化标签
        securityLevel: 'strict',
        // 解析失败时不要把错误图注入 DOM，由组件回退为代码块
        suppressErrorRendering: true,
        theme: 'base',
        fontFamily: 'inherit',
        themeVariables: {
          fontSize: '13px',
          primaryColor: '#eef3ff',
          primaryBorderColor: '#3875f6',
          primaryTextColor: '#303133',
          lineColor: '#93a4bd',
        },
        flowchart: { useMaxWidth: true },
        sequence: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      });
      return runtime;
    });
  }
  return runtimePromise;
};

/**
 * Mermaid 渲染队列：`render` 会读写全局 DOM，串行执行可避免多个图表并发渲染时相互干扰。
 */
let renderQueue: Promise<unknown> = Promise.resolve();

const enqueueRender = (task: () => Promise<string>): Promise<string> => {
  const next = renderQueue.then(task, task);
  renderQueue = next.catch(() => undefined);
  return next;
};

/** 图表容器：包裹图表，提供与页面一致的卡片描边与留白 */
const DiagramFrame: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="my-[10px] overflow-auto rounded-[10px] border border-[rgba(56,117,246,0.16)] border-solid bg-white/70 p-[10px]">
    {children}
  </div>
);

/** 渲染失败时的回退：原样展示图表定义，便于用户排查语法问题 */
const FallbackCode: FC<{ code: string }> = ({ code }) => (
  <pre className="my-[10px] overflow-auto rounded-[8px] bg-[rgba(56,117,246,0.06)] p-[12px] text-[13px]">
    <code>{code}</code>
  </pre>
);

type MermaidBlockProps = {
  /** 围栏代码块内的原始文本（Mermaid 图表定义） */
  code: string;
};

/**
 * 流程图代码块：把 ` ```mermaid ` 围栏代码块内的图表定义（流程图 / 时序图 / 甘特图等）渲染为 SVG。
 * 渲染失败（语法错误）时回退为纯文本代码块，异步渲染期间显示占位提示。
 */
export const MermaidBlock: FC<MermaidBlockProps> = ({ code }) => {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let alive = true;
    setSvg('');
    setFailed(false);
    const source = code.trim();
    if (!source) {
      return;
    }

    enqueueRender(async () => {
      const runtime = await loadMermaidRuntime();
      const { svg: output } = await runtime.render(idRef.current, source);
      return output;
    })
      .then((output) => {
        if (alive) {
          setSvg(output);
        }
      })
      .catch(() => {
        // 清理 Mermaid 失败时可能残留的临时节点
        document.getElementById(idRef.current)?.remove();
        document.getElementById(`d${idRef.current}`)?.remove();
        if (alive) {
          setFailed(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [code]);

  if (failed) {
    return <FallbackCode code={code} />;
  }

  if (!svg) {
    return (
      <DiagramFrame>
        <div
          className="flex items-center justify-center text-fg-tertiary text-[13px]"
          style={{ height: DEFAULT_HEIGHT }}
        >
          正在渲染图表…
        </div>
      </DiagramFrame>
    );
  }

  return (
    <DiagramFrame>
      <div
        className="w-full"
        // Mermaid 输出的 SVG 由运行时生成并已按 strict 安全级别净化
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </DiagramFrame>
  );
};
