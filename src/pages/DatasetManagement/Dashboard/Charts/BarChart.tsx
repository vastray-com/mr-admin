import { Chart } from '@antv/g2';
import { Empty } from 'antd';
import { type FC, useCallback, useEffect, useRef } from 'react';

type Props = {
  axis: { x: string; y: string };
  data: Record<string, unknown>[];
  transform?: 'fisheye' | 'transpose';
};

export const BarChart: FC<Props> = ({ data, axis, transform }) => {
  const container = useRef<HTMLDivElement | null>(null);
  const chart = useRef<Chart | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!chart.current && container.current) {
      chart.current = render(container.current, { data, axis, transform });
    }
    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, []);

  // 渲染图表数据
  const render = useCallback((container: HTMLDivElement, props: Props) => {
    // 初始化图表
    const chart = new Chart({ container, theme: 'classic' });

    // 配置图表
    chart.options({
      type: 'interval',
      autoFit: true,
      encode: { x: props.axis.x, y: props.axis.y },
      axis: {
        x: {
          title: null,
        },
        y: {
          title: null,
        },
      },
      coordinate: {
        transform: [{ type: props.transform }],
      },
      interaction: [
        {
          type: 'elementHighlight',
          background: true,
          region: true,
        },
      ],
    });

    // 绑定数据
    chart.data(data);

    // 渲染
    chart.render();
    return chart;
  }, []);

  const updateChart = useCallback((chart: Chart, data: Props['data']) => {
    chart.data(data);
    chart.render();
  }, []);

  // 更新图表数据
  useEffect(() => {
    if (chart.current && data) {
      updateChart(chart.current, data);
    }
  }, [data, chart.current]);

  return (
    <div className="w-full h-full pos-relative">
      {(!data || data.length === 0) && (
        <div className="w-full h-full pos-absolute top-0 left-0 flex items-center justify-center">
          <Empty />
        </div>
      )}
      <div ref={container} className="w-full h-full" />
    </div>
  );
};
