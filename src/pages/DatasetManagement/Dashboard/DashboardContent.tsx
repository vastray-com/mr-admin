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
    title: '挂号人数',
    icon: 'i-icon-park-outline:user-to-user-transmission',
    color: ['#4FAEE4', '#4FAEE433'],
  },
  {
    key: 'ip_admission_count',
    title: '入院人数',
    icon: 'i-icon-park-outline:hospital',
    color: ['#D09332', '#D0933233'],
  },
  {
    key: 'ip_discharge_count',
    title: '出院人数',
    icon: 'i-icon-park-outline:logout',
    color: ['#469D78', '#469D7833'],
  },
  {
    key: 'operation_count',
    title: '手术台数',
    icon: 'i-icon-park-outline:scissors',
    color: ['#DE4D47', '#DE4D4733'],
  },
];

type Props = {
  data?: Warehouse.DashboardData | null;
};

export const DashboardContent: FC<Props> = ({ data }) => {
  if (!data) {
    return <Empty />;
  }

  return (
    <div>
      <Flex gap={16}>
        {DataCardList.map((item) => (
          <Card key={item.key} className="flex-1 py-[8px]">
            <div className="flex items-start justify-between">
              <div>
                <h2>
                  {data.core.columns.find((c) => c.value === item.key)?.label ??
                    '未知'}
                </h2>
                <p className="text-[28px] font-bold">
                  {formatCountToString(data.core.data[0][item.key])}
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
        <Card
          className="basis-[calc(66%_-_16px_-_16px)] shrink-0 grow-0"
          title="门诊量趋势"
        >
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
          className="basis-[calc(33%_-_16px_-_16px)] shrink-0 grow-0"
          title="科室门诊 Top 20"
        >
          <BarChart
            transform="transpose"
            axis={{
              x: 'dept_name',
              y: '门诊人数',
            }}
            data={data.distribution.data
              .map((i) => ({
                dept_name: i.dept_name,
                门诊人数: i.op_visit_count,
              }))
              .sort((a, b) => b.门诊人数 - a.门诊人数)
              .slice(0, 20)}
          />
        </Card>
      </div>

      <div className="mt-[16px] flex gap-[16px]">
        <Card
          className="basis-[calc(66%_-_16px_-_16px)] shrink-0 grow-0"
          title="住院趋势"
        >
          <LineChart
            axis={{
              x: 'date',
              y: 'count',
              color: 'type',
            }}
            data={[
              ...data.time_serial.data.map((i) => ({
                date: i.date,
                count: i.ip_admission_count,
                type: '入院人数',
              })),
              ...data.time_serial.data.map((i) => ({
                date: i.date,
                count: i.ip_discharge_count,
                type: '出院人数',
              })),
            ]}
          />
        </Card>

        <Card
          className="basis-[calc(33%_-_16px_-_16px)] shrink-0 grow-0"
          title="手术等级分布"
        >
          <PieChart
            data={[
              {
                item: '一级手术',
                count: 100,
                percent: 0.5,
              },
              {
                item: '二级手术',
                count: 50,
                percent: 0.25,
              },
              {
                item: '三级手术',
                count: 50,
                percent: 0.25,
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};
