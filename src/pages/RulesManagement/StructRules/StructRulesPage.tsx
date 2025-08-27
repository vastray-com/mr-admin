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
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { useCacheStore } from '@/store/useCacheStore';
import { StructRuleStatus } from '@/typing/enum';
import { downloadFile } from '@/utils/helper';
import type { FormProps } from 'antd';
import type { StructRule } from '@/typing/structRules';

type FormValues = {
  name?: string;
  range?: [Dayjs, Dayjs] | null;
};

const StructRulesPage: FC = () => {
  const { ruleApi } = useApi();
  const { message, modal } = App.useApp();
  const nav = useNavigate();

  const setRuleListCache = useCacheStore((state) => state.setStructRuleList);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 禁止选择超过今天的日期和 6 个月前的日期
  const disabledDate: GetProps<typeof DatePicker.RangePicker>['disabledDate'] =
    (current) => {
      if (!current) return false;
      const todayEnd = dayjs().endOf('day');
      return current > todayEnd || current < todayEnd.add(-6, 'month');
    };

  // 拉取列表分页数据
  const [list, setList] = useState<StructRule.List>([]);
  const fetchData = useCallback(
    async (params: PaginationParams) => ruleApi.getRuleList(params),
    [ruleApi.getRuleList],
  );
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData,
    setData: (v) => {
      setList(v);
      setRuleListCache(v);
    },
  });

  // 查询表单提交处理函数
  const onFinish: FormProps<FormValues>['onFinish'] = async (values) => {
    const { name, range } = values;
    const params: StructRule.GetListParams = { page_size: 100, page_num: 1 };
    if (name) params.name = name;
    if (range && range.length === 2) {
      params.update_start = range[0].format('YYYY-MM-DD');
      params.update_end = range[1].format('YYYY-MM-DD');
    }
    refresh();
  };

  // 导入病历模版
  const importText = useRef<string>('');
  const onImport = useCallback(async () => {
    console.log('导入结构化规则', importText.current);
    // 检查导入文本是否为有效的 JSON 格式
    let data = null;
    try {
      data = JSON.parse(importText.current);
    } catch (e) {
      console.error('导入文本不是有效的 JSON 格式:', e);
      message.error('导入文本不是有效的 JSON 格式，请检查后重试。');
      return;
    }
    if (!data || typeof data !== 'object') {
      message.error('导入文本格式不正确，请检查后重试。');
      return;
    }
    try {
      const res = await ruleApi.createRule(data);
      if (res.code === 200) {
        message.success('新建病历模板成功!');
        // 成功后清空导入文本
        importText.current = '';
        // 刷新列表
        refresh();
      } else {
        message.error(res.msg || '新建病历模板失败');
      }
    } catch (error) {
      console.error('新建病历模板失败:', error);
      message.error('新建病历模板失败，请检查导入文本格式是否正确。');
    }
  }, [refresh, message, ruleApi]);

  const onOpenImportModal = useCallback(() => {
    modal.confirm({
      title: '快速导入结构化规则',
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
    nav('/rules_management/struct_rules/NEW');
  }, [nav]);

  // 导出选中病历模板
  const onExportRecords = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) {
        message.info('没有选中任何结构化规则');
        return;
      }
      message.loading('正在导出结构化规则...');
      console.log('导出结构化规则:', ids);
      const res = await ruleApi.exportRules({ ids });
      downloadFile(res);
      message.success('导出成功!');
    },
    [message, ruleApi],
  );

  // 编辑项目
  const onEdit = useCallback(
    (record: StructRule.Item) => {
      console.log('编辑项目:', record);
      nav(`/rules_management/struct_rules/${record.id}`);
    },
    [nav],
  );
  // 停用/启用/删除项目
  const onAction = useCallback(
    async (
      record: StructRule.Item,
      action: StructRule.ActionParams['action'],
    ) => {
      console.log(`执行 ${action} 操作:`, record);
      const res = await ruleApi.actionRule({ id: record.id, action });
      if (res.code === 200) {
        message.success(`操作成功`);
        refresh();
      } else {
        message.error(`操作失败: ${res.msg}`);
      }
    },
    [refresh, message, ruleApi],
  );

  // 页面渲染
  return (
    <ContentLayout
      title="结构化规则列表"
      action={
        <>
          <Button onClick={onOpenImportModal}>快速导入</Button>
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建结构化规则
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
          <Table<StructRule.Item>
            dataSource={list}
            rowKey="id"
            rowSelection={{
              type: 'checkbox',
              onChange: (ids) => setSelectedIds(ids as number[]),
            }}
            pagination={false}
          >
            <Table.Column title="病历名称" dataIndex="name_cn" />
            <Table.Column title="病历英文名" dataIndex="name_en" />
            <Table.Column title="病历 ID" dataIndex="id" />
            <Table.Column
              title="更新时间"
              dataIndex="update_time"
              sorter={(a, b) =>
                dayjs(a.update_time).isBefore(dayjs(b.update_time)) ? -1 : 1
              }
              render={(time: string) =>
                dayjs(time).format('YYYY-MM-DD HH:mm:ss')
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
              render={(_, record: StructRule.Item) => (
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

          <div className="flex justify-end mt-[16px]">
            <PaginationComponent />
          </div>
        </Card>
      </div>
    </ContentLayout>
  );
};

export default StructRulesPage;
