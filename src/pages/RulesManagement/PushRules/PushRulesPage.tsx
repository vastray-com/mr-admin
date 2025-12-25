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
import dayjs, { type Dayjs } from 'dayjs';
import { type FC, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useFileImport } from '@/hooks/useFileImport';
import { usePaginationData } from '@/hooks/usePaginationData';
import { useCacheStore } from '@/store/useCacheStore';
import { type PushTargetDB, pushTargetDBOptions } from '@/typing/enum';
import { downloadFile } from '@/utils/helper';
import type { FormProps } from 'antd';
import type { PushRule } from '@/typing/pushRules';

type FormValues = {
  name?: string;
  range?: [Dayjs, Dayjs] | null;
};

const PushRulesPage: FC = () => {
  const { pushRuleApi } = useApi();
  const { message, modal } = App.useApp();
  const nav = useNavigate();

  const structuredRuleList = useCacheStore((state) => state.structRuleList);
  const setRuleListCache = useCacheStore((state) => state.setPushRuleList);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);

  // 禁止选择超过今天的日期和 6 个月前的日期
  const disabledDate: GetProps<typeof DatePicker.RangePicker>['disabledDate'] =
    (current) => {
      if (!current) return false;
      const todayEnd = dayjs().endOf('day');
      return current > todayEnd || current < todayEnd.add(-6, 'month');
    };

  // 拉取列表分页数据
  const [list, setList] = useState<PushRule.List>([]);
  const searchParams = useRef<PushRule.ListParams>({
    name: undefined,
    update_start: undefined,
    update_end: undefined,
  });
  const fetchData = useCallback(
    async (params: PaginationParams) =>
      pushRuleApi.getRuleList({ ...params, ...searchParams.current }),
    [pushRuleApi.getRuleList],
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
    searchParams.current.name = name ? name.trim() : undefined;
    if (range && range.length === 2) {
      searchParams.current.update_start = range[0].format('YYYY-MM-DD');
      searchParams.current.update_end = range[1].format('YYYY-MM-DD');
    } else {
      searchParams.current.update_start = undefined;
      searchParams.current.update_end = undefined;
    }
    refresh();
  };

  // 导入病历模版
  const importText = useRef<string>('');
  const onImport = useCallback(async () => {
    console.log('导入推送规则', importText.current);
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
      const res = await pushRuleApi.createRule(data);
      if (res.code === 200) {
        message.success('新建推送规则成功!');
        // 成功后清空导入文本
        importText.current = '';
        // 刷新列表
        refresh();
      } else {
        message.error(res.message || '新建推送规则失败');
      }
    } catch (error) {
      console.error('新建推送规则失败:', error);
      message.error('新建推送规则失败，请检查导入文本格式是否正确。');
    }
  }, [refresh, message, pushRuleApi]);

  const onOpenImportModal = useCallback(() => {
    modal.confirm({
      title: '快速导入推送规则',
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

  // 导入文件
  const { FileImportModal, openFileImportModal } = useFileImport({
    title: '通过文件导入推送规则',
    path: '/admin/push_rule/import',
    onSucceed: refresh,
  });

  // 新建病历模板
  const onCreate = useCallback(() => {
    nav('/rules_management/push_rules/NEW');
  }, [nav]);

  // 导出选中推送规则
  const onExportRecords = useCallback(
    async (uids: string[]) => {
      const msgKey = 'export-message';
      if (uids.length === 0) {
        message.info({ key: msgKey, content: '没有选中任何推送规则' });
        return;
      }
      message.loading({
        key: msgKey,
        content: '正在导出推送规则...',
        duration: 0,
      });
      console.log('导出推送规则:', uids);
      const res = await pushRuleApi.exportRule({ uids });
      downloadFile(res);
      message.success({ key: msgKey, content: '导出成功!' });
    },
    [message, pushRuleApi],
  );

  // 编辑项目
  const onEdit = useCallback(
    (record: PushRule.Item) => {
      console.log('编辑项目:', record);
      nav(`/rules_management/push_rules/${record.uid}`);
    },
    [nav],
  );
  // 停用/启用/删除项目
  const onAction = useCallback(
    async (record: PushRule.Item, action: PushRule.ActionParams['action']) => {
      console.log(`执行 ${action} 操作:`, record);
      const res = await pushRuleApi.actionRule({ uid: record.uid, action });
      if (res.code === 200) {
        message.success(`操作成功`);
        refresh();
      } else {
        message.error(`操作失败: ${res.message}`);
      }
    },
    [refresh, message, pushRuleApi],
  );

  // 页面渲染
  return (
    <ContentLayout
      title="推送规则列表"
      action={
        <>
          <Button onClick={onOpenImportModal}>快速导入</Button>
          <Button className="ml-[8px]" onClick={openFileImportModal}>
            文件导入
          </Button>
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建推送规则
          </Button>
        </>
      }
    >
      <FileImportModal />

      <div className="h-full">
        <Card className="h-[80px]">
          <Form
            layout="inline"
            name="push-rules-search"
            onFinish={onFinish}
            autoComplete="off"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-[16px]">
              <Form.Item<FormValues>
                label="规则名称"
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
                  onClick={() => onExportRecords(selectedUids)}
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
          <Table<PushRule.Item>
            dataSource={list}
            rowKey="uid"
            rowSelection={{
              type: 'checkbox',
              onChange: (uids) => setSelectedUids(uids as string[]),
            }}
            pagination={false}
          >
            <Table.Column title="规则名称" dataIndex="name_cn" />
            <Table.Column title="规则英文名" dataIndex="name_en" />
            <Table.Column title="规则 ID" dataIndex="uid" />
            <Table.Column
              title="关联结构化规则"
              dataIndex="structured_rule_uid"
              render={(structured_rule_uid: string) => {
                return structured_rule_uid ? (
                  <span>
                    {structuredRuleList.find(
                      (rule) => rule.uid === structured_rule_uid,
                    )?.name_cn ?? structured_rule_uid}
                  </span>
                ) : (
                  <span className="text-gray-400">未关联</span>
                );
              }}
            />

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
              title="推送目标"
              dataIndex="target_db"
              render={(target: PushTargetDB) =>
                pushTargetDBOptions.find((db) => db.value === target)?.label ||
                target
              }
            />
            <Table.Column
              title="操作"
              key="action"
              width={180}
              render={(_, record: PushRule.Item) => (
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

export default PushRulesPage;
