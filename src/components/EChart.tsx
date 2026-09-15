import {
  type FC,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** 宽松的 ECharts option 类型：来自智能体输出的 JSON 对象 */
export type EChartsOption = Record<string, unknown>;

/** 最小化的 ECharts 实例接口（仅使用到的方法，避免绑定具体版本类型） */
type EChartsInstance = {
  setOption: (option: EChartsOption, opts?: { notMerge?: boolean }) => void;
  resize: () => void;
  dispose: () => void;
};

/** ECharts 运行时模块（仅使用 init） */
type EChartsRuntime = {
  init: (
    el: HTMLElement,
    theme?: unknown,
    opts?: { renderer?: 'canvas' | 'svg' },
  ) => EChartsInstance;
};

/** 图表默认调色板（以平台主题色为首） */
const DEFAULT_PALETTE = [
  '#3875f6',
  '#38c3a0',
  '#f6a638',
  '#8b6bf6',
  '#f6576b',
  '#3bb4f6',
  '#a0c33a',
];

/** 默认图表高度（px） */
const DEFAULT_HEIGHT = 360;

let runtimePromise: Promise<EChartsRuntime> | null = null;

/** 懒加载 ECharts 运行时（动态分包，仅在有图表时加载，不拖大主包） */
const loadEChartsRuntime = (): Promise<EChartsRuntime> => {
  if (!runtimePromise) {
    runtimePromise = import('echarts').then(
      (mod) => mod as unknown as EChartsRuntime,
    );
  }
  return runtimePromise;
};

type EChartProps = {
  /** ECharts option（JSON 对象） */
  option: EChartsOption;
  /** 图表高度（px），默认 360 */
  height?: number;
};

/**
 * ECharts 图表：按需加载运行时，自适应容器宽度，卸载时释放实例。
 */
export const EChart: FC<EChartProps> = ({
  option,
  height = DEFAULT_HEIGHT,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const [runtime, setRuntime] = useState<EChartsRuntime | null>(null);
  const [failed, setFailed] = useState(false);

  // 懒加载运行时（失败时退化为错误提示，不影响对话）
  useEffect(() => {
    let alive = true;
    loadEChartsRuntime()
      .then((mod) => {
        if (alive) setRuntime(mod);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 初始化实例并跟随容器尺寸自适应
  useEffect(() => {
    const container = containerRef.current;
    if (!runtime || !container) return;
    const chart = runtime.init(container, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [runtime]);

  // option 变化时重设（不合并，避免残留上一次的系列/坐标轴）
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption({ color: DEFAULT_PALETTE, ...option }, { notMerge: true });
  }, [runtime, option]);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center text-fg-tertiary text-[13px]"
        style={{ height }}
      >
        图表组件加载失败
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" style={{ height }} />;
};

/** 图表容器：包裹图表，提供与页面一致的卡片描边与留白 */
const ChartFrame: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="my-[10px] rounded-[10px] border border-[rgba(56,117,246,0.16)] border-solid bg-white/70 p-[10px]">
    {children}
  </div>
);

type EChartBlockProps = {
  /** 围栏代码块内的原始文本（应为 ECharts option 的 JSON） */
  code: string;
};

/**
 * 图表代码块：把 ` ```echarts ` 围栏代码块内的 JSON 渲染为 ECharts 图表。
 * 解析失败时回退为纯文本代码块；流式生成中（JSON 未闭合）显示占位提示。
 */
export const EChartBlock: FC<EChartBlockProps> = ({ code }) => {
  const option = useMemo<EChartsOption | null>(() => {
    try {
      const value = JSON.parse(code) as unknown;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as EChartsOption;
      }
      return null;
    } catch {
      return null;
    }
  }, [code]);

  if (!option) {
    const trimmed = code.trim();
    // 流式生成中：JSON 尚未闭合，先给占位，避免闪现代码文本
    if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      return (
        <ChartFrame>
          <div className="flex h-[200px] items-center justify-center text-fg-tertiary text-[13px]">
            正在生成图表…
          </div>
        </ChartFrame>
      );
    }
    return (
      <pre className="my-[10px] overflow-auto rounded-[8px] bg-[rgba(56,117,246,0.06)] p-[12px] text-[13px]">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <ChartFrame>
      <EChart option={option} />
    </ChartFrame>
  );
};
