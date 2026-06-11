import { Card, Empty, Flex } from 'antd';
import clsx from 'clsx';
import { BarChart } from '@/pages/DatasetManagement/Dashboard/Charts/BarChart';
import { LineChart } from '@/pages/DatasetManagement/Dashboard/Charts/LineChart';
import { PieChart } from '@/pages/DatasetManagement/Dashboard/Charts/PieChart';
import { formatCountToString } from '@/utils/helper';
import type { FC } from 'react';
import type { Warehouse } from '@/typing/warehose';

const DataCardList = [
  {
    key: 'op_register_count',
    icon: 'i-icon-park-outline:user-to-user-transmission',
    color: ['#4FAEE4', '#4FAEE433'],
  },
  {
    key: 'ip_admission_count',
    icon: 'i-icon-park-outline:hospital',
    color: ['#D09332', '#D0933233'],
  },
  {
    key: 'ip_discharge_count',
    icon: 'i-icon-park-outline:logout',
    color: ['#469D78', '#469D7833'],
  },
  {
    key: 'operation_count',
    icon: 'i-icon-park-outline:scissors',
    color: ['#DE4D47', '#DE4D4733'],
  },
];

const SurgeryLevels = [
  { key: 'level1_cnt', label: '一级手术' },
  { key: 'level2_cnt', label: '二级手术' },
  { key: 'level3_cnt', label: '三级手术' },
  { key: 'level4_cnt', label: '四级手术' },
] as const;

function buildSurgeryPieData(coreRow: Record<string, number>) {
  const total =
    coreRow.level1_cnt +
    coreRow.level2_cnt +
    coreRow.level3_cnt +
    coreRow.level4_cnt;

  return SurgeryLevels.map((level) => ({
    item: level.label,
    count: coreRow[level.key],
    percent: total > 0 ? coreRow[level.key] / total : 0,
  }));
}

type Props = {
  data?: Warehouse.DashboardData | null;
};

export const DashboardContent: FC<Props> = ({ data }) => {
  if (!data) {
    return <Empty />;
  }

  const coreRow = data.core.data[0];
  const pieData = buildSurgeryPieData(coreRow);

  const columnLabelMap = Object.fromEntries(
    data.core.columns.map((c) => [c.value, c.label]),
  );

  return (
    <div>
      <Flex gap={16}>
        {DataCardList.map((item) => (
          <Card key={item.key} className="flex-1 py-[8px]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-normal text-fg-primary">
                  {columnLabelMap[item.key] ?? '未知'}
                </h2>
                <p className="text-[28px] font-bold text-fg-title">
                  {formatCountToString(coreRow[item.key])}
                </p>
              </div>

              <div
                className="w-[40px] h-[40px] flex items-center justify-center rounded-[8px] mt-4"
                style={{
                  color: item.color[0],
                  background: item.color[1],
                }}
              >
                <i className={clsx('text-[24px]', item.icon)} />
              </div>
            </div>
          </Card>
        ))}
      </Flex>

      <div className="mt-[16px] flex gap-[16px]">
        <Card className="basis-[60%] shrink-0 grow-0" title="门诊量趋势">
          <LineChart
            axis={{
              x: 'date',
              y: '门诊人数',
            }}
            data={data.time_serial.data.map((i) => ({
              date: i.date,
              门诊人数: i.op_visit_count,
            }))}
          />
        </Card>

        <Card
          className="basis-[calc(40%_-_16px)] shrink-0 grow-0"
          title="科室门诊 Top 20"
        >
          <BarChart
            transform="transpose"
            axis={{
              x: 'dept_name',
              y: '门诊人数',
            }}
            data={[...data.distribution.data]
              .sort((a, b) => b.op_visit_count - a.op_visit_count)
              .slice(0, 20)
              .map((i) => ({
                dept_name: i.dept_name,
                门诊人数: i.op_visit_count,
              }))}
          />
        </Card>
      </div>

      <div className="mt-[16px] flex gap-[16px]">
        <Card className="basis-[60%] shrink-0 grow-0" title="住院趋势">
          <LineChart
            axis={{
              x: 'date',
              y: 'count',
              color: 'type',
            }}
            data={data.time_serial.data.flatMap((i) => [
              { date: i.date, count: i.ip_admission_count, type: '入院人数' },
              { date: i.date, count: i.ip_discharge_count, type: '出院人数' },
            ])}
          />
        </Card>

        <Card
          className="basis-[calc(40%_-_16px)] shrink-0 grow-0"
          title="手术等级分布"
        >
          <PieChart data={pieData} />
        </Card>
      </div>
    </div>
  );
};
