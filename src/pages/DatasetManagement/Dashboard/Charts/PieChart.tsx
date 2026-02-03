import { Chart } from '@antv/g2';
import { Empty } from 'antd';
import { type FC, useCallback, useEffect, useRef } from 'react';

type Props = {
  data: { item: string; count: number; percent: number }[];
};

export const PieChart: FC<Props> = ({ data }) => {
  const container = useRef<HTMLDivElement | null>(null);
  const chart = useRef<Chart | null>(null);

  // 初始化图表
  useEffect(() => {
    if (!chart.current && container.current) {
      chart.current = render(container.current);
    }
    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, []);

  // 渲染图表数据
  const render = useCallback((container: HTMLDivElement) => {
    // 初始化图表
    const chart = new Chart({ container, theme: 'classic' });

    // 配置图表
    chart.options({
      type: 'view',
      autoFit: true,
      coordinate: { type: 'theta', outerRadius: 0.8, innerRadius: 0.5 },
      children: [
        {
          type: 'interval',
          encode: { y: 'percent', color: 'item' },
          transform: [{ type: 'stackY' }],
          legend: {
            color: { position: 'bottom', layout: { justifyContent: 'center' } },
          },
          // labels: [
          //   {
          //     position: 'outside',
          //     text: (data) => `${data.item}: ${data.percent * 100}%`,
          //   },
          // ],
          tooltip: {
            title: (data) => data.item,
            items: [
              (data) => ({
                name: '占比',
                value: `${data.percent * 100}%`,
              }),
              (data) => ({
                name: '数量',
                value: data.count,
              }),
            ],
          },
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
