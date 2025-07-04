import {
  App,
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
import { type FC, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { StructRuleStatus } from '@/typing/enum';
import { service } from '@/utils/service';
import type { FormProps } from 'antd';
import type { StructRule } from '@/typing/structRules';

type FormValues = {
  name?: string;
  range?: [Dayjs, Dayjs] | null;
};

const StructRulesPage: FC = () => {
  const { message, modal } = App.useApp();
  const isFirst = useRef(true);
  const nav = useNavigate();

  const [list, setList] = useState<StructRule.List>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 禁止选择超过今天的日期和 6 个月前的日期
  const disabledDate: GetProps<typeof DatePicker.RangePicker>['disabledDate'] =
    (current) => {
      if (!current) return false;
      const todayEnd = dayjs().endOf('day');
      return current > todayEnd || current < todayEnd.add(-6, 'month');
    };

  // 拉取病历模板列表
  const fetchList = useCallback(async (params: StructRule.GetListParams) => {
    const data = await service.get('/312240633', { params });
    console.log('拉取病历模板列表成功:', data);
    setList(data.data as StructRule.List);
  }, []);

  // 查询表单提交处理函数
  const onFinish: FormProps<FormValues>['onFinish'] = async (values) => {
    const { name, range } = values;
    const params: StructRule.GetListParams = {};
    if (name) params.name = name;
    if (range && range.length === 2) {
      params.update_start = range[0].format('YYYY-MM-DD');
      params.update_end = range[1].format('YYYY-MM-DD');
    }
    await fetchList(params);
  };

  // 导入病历模版
  const importText = useRef<string>('');
  const onImport = useCallback(() => {
    console.log('导入病历模板', importText.current);
    // 这里可以添加导入逻辑
  }, []);
  const onOpenImportModal = useCallback(() => {
    modal.confirm({
      title: '快速导入病历模板',
      width: '64vw',
      centered: true,
      icon: null,
      content: (
        <Input.TextArea
          rows={20}
          onChange={(e) => {
            importText.current = e.target.value;
          }}
        />
      ),
      okText: '确认导入',
      cancelText: '取消',
      onOk: onImport,
    });
  }, [onImport, modal]);

  // 新建病历模板
  const onCreate = useCallback(() => {
    console.log('新建病历模板');
    // 这里可以添加新建逻辑
    nav('/rules_management/struct_rules/NEW');
  }, [nav]);

  // 导出选中病历模板
  const onExportRecords = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        message.info('没有选中任何病历模板');
        return;
      }
      console.log('导出选中的病历模板 ID:', ids);
    },
    [message],
  );

  // 编辑项目
  const onEdit = useCallback(
    (record: StructRule.ListItem) => {
      console.log('编辑项目:', record);
      nav(`/rules_management/struct_rules/${record.id}`);
    },
    [nav],
  );
  // 停用/启用/删除项目
  const onAction = useCallback(
    (record: StructRule.ListItem, action: 'enable' | 'disable' | 'delete') => {
      console.log(`执行 ${action} 操作:`, record);
    },
    [],
  );

  // 如果是第一次加载，返回 null，避免重复渲染
  if (isFirst.current) {
    fetchList({});
    isFirst.current = false; // 设置为 false，避免重复加载
    return null;
  }

  // 页面渲染
  return (
    <ContentLayout
      title="病历模板列表"
      action={
        <>
          <Button onClick={onOpenImportModal}>快速导入</Button>
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建病历模板
          </Button>
        </>
      }
    >
      <div className="h-full">
        <Card className="h-[80px]">
          <Form
            layout="inline"
            name="struct-rules-search"
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
                <Button
                  htmlType="button"
                  onClick={() => onExportRecords(selectedIds)}
                >
                  导出
                </Button>
                <Button type="primary" className="ml-[8px]" htmlType="submit">
                  查询
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card className="h-[calc(100%_-_80px_-_16px)] mt-[16px]">
          <Table<StructRule.ListItem>
            dataSource={list}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              onChange: (ids) => setSelectedIds(ids as string[]),
            }}
          >
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
              render={(status: StructRuleStatus) => (
                <p className="flex items-center">
                  <span
                    className={clsx(
                      'w-[6px] h-[6px] rounded-full inline-block mr-[4px]',
                      status === StructRuleStatus.Enabled
                        ? 'bg-[#52C41A]'
                        : 'bg-[#FF4D4F]',
                    )}
                  />
                  <span>
                    {status === StructRuleStatus.Enabled ? '启用中' : '已停用'}
                  </span>
                </p>
              )}
            />
            <Table.Column
              title="操作"
              key="action"
              width={180}
              render={(_, record: StructRule.ListItem) => (
                <div className="flex">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => onEdit(record)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() =>
                      onAction(
                        record,
                        record.status === StructRuleStatus.Enabled
                          ? 'disable'
                          : 'enable',
                      )
                    }
                  >
                    {record.status === StructRuleStatus.Enabled
                      ? '停用'
                      : '启用'}
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={() => onAction(record, 'delete')}
                  >
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

export default StructRulesPage;
