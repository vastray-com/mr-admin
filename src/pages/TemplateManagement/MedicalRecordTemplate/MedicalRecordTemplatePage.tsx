import {
  Button,
  Card,
  DatePicker,
  Form,
  type GetProps,
  Input,
  Table,
} from 'antd';
import clsx from 'clsx';
import dayjs, { type Dayjs } from 'dayjs';
import { type FC, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { service } from '@/utils/service';
import type { FormProps } from 'antd';

type FormValues = {
  name?: string;
  range?: [Dayjs, Dayjs] | null;
};

const MedicalRecordTemplatePage: FC = () => {
  const [list, setList] = useState<MedicalRecordTemplate.List>([]);

  // 禁止选择超过今天的日期和 6 个月前的日期
  const disabledDate: GetProps<typeof DatePicker.RangePicker>['disabledDate'] =
    (current) => {
      if (!current) return false;
      const todayEnd = dayjs().endOf('day');
      return current > todayEnd || current < todayEnd.add(-6, 'month');
    };

  // 表单提交处理函数
  const onFinish: FormProps<FormValues>['onFinish'] = async (values) => {
    const { name, range } = values;
    const params: MedicalRecordTemplate.GetListParams = {};
    if (name) params.name = name;
    if (range && range.length === 2) {
      params.update_start = range[0].format('YYYY-MM-DD');
      params.update_end = range[1].format('YYYY-MM-DD');
    }
    const data = await service.get('/312240633', {
      params,
    });
    console.log('查询结果:', data);
    setList(data.data as MedicalRecordTemplate.List);
  };

  return (
    <ContentLayout
      title="病历模板列表"
      action={
        <>
          <Button>快速导入</Button>
          <Button type="primary" className="ml-[8px]">
            新建病历模板
          </Button>
        </>
      }
    >
      <div className="h-full">
        <Card className="h-[80px]">
          <Form
            layout="inline"
            name="medical-record-template-search"
            onFinish={onFinish}
            autoComplete="off"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-[16px]">
              <Form.Item<FormValues>
                label="病历名称"
                name="name"
                className="w-[256px]"
              >
                <Input />
              </Form.Item>

              <Form.Item<FormValues>
                label="更新时间"
                name="range"
                className="w-[360px]"
              >
                <DatePicker.RangePicker disabledDate={disabledDate} />
              </Form.Item>
            </div>

            <div>
              <Form.Item noStyle>
                <Button htmlType="button">导出</Button>
                <Button type="primary" className="ml-[8px]" htmlType="submit">
                  查询
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card className="h-[calc(100%_-_80px_-_16px)] mt-[16px]">
          <Table<MedicalRecordTemplate.ListItem> dataSource={list} rowKey="id">
            <Table.Column title="病历名称" dataIndex="name_cn" />
            <Table.Column title="病历英文名" dataIndex="name_en" />
            <Table.Column title="病历 ID" dataIndex="id" />
            <Table.Column title="所属分类" dataIndex="mr_type" />
            <Table.Column title="排序" dataIndex="sort_index" />
            <Table.Column
              title="更新时间"
              dataIndex="update_time"
              sorter={(a, b) =>
                dayjs(a.update_time).isBefore(dayjs(b.update_time)) ? -1 : 1
              }
            />
            <Table.Column title="备注" dataIndex="comment" />
            <Table.Column
              title="状态"
              dataIndex="status"
              render={(status: 0 | 1) => (
                <p className="flex items-center">
                  <span
                    className={clsx(
                      'w-[6px] h-[6px] rounded-full inline-block mr-[4px]',
                      status === 0 ? 'bg-[#52C41A]' : 'bg-[#FF4D4F]',
                    )}
                  />
                  <span>{status === 0 ? '启用中' : '已停用'}</span>
                </p>
              )}
            />
            <Table.Column
              title="操作"
              key="action"
              width={180}
              render={(_, record: MedicalRecordTemplate.ListItem) => (
                <div className="flex">
                  <Button size="small" type="link">
                    编辑
                  </Button>
                  <Button size="small" type="link">
                    {record.status === 0 ? '停用' : '启用'}
                  </Button>
                  <Button size="small" type="link" danger>
                    删除
                  </Button>
                </div>
              )}
            />
          </Table>
        </Card>
      </div>
    </ContentLayout>
  );
};

export default MedicalRecordTemplatePage;
