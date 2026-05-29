import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import type { AxiosError } from 'axios';

type FilterFormValues = {
  module?: string;
  action?: string;
  method?: string;
  status_code?: number;
  operator_uid?: string;
  request_ip?: string;
  path_keyword?: string;
  time_range?: [dayjs.Dayjs, dayjs.Dayjs];
};

const AuditLogPage = () => {
  const { sysApi } = useApi();
  const { message } = App.useApp();
  const [form] = Form.useForm<FilterFormValues>();

  const [filters, setFilters] = useState<
    Omit<Audit.ListParams, keyof PaginationParams>
  >({});
  const [data, setData] = useState<Audit.Log[]>([]);
  const [filterOptions, setFilterOptions] =
    useState<Audit.FilterOptions | null>(null);

  const fetchAuditList = useCallback(
    (params: PaginationParams) =>
      sysApi.getAuditList({ ...params, ...filters }),
    [sysApi, filters],
  );

  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: fetchAuditList,
    setData,
  });

  useEffect(() => {
    refresh();
  }, [filters]);

  useEffect(() => {
    sysApi
      .getAuditFilterOptions()
      .then((res) => {
        if (res.code === 200) {
          setFilterOptions(res.data);
        }
      })
      .catch((error: AxiosError<APIRes<any>>) => {
        message.error(
          `获取审计筛选选项失败: ${error.response?.data.message || error.message}`,
        );
      });
  }, [sysApi, message]);

  const [detailUid, setDetailUid] = useState<string>('');
  const [detail, setDetail] = useState<Audit.Log | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!detailUid) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);
    sysApi
      .getAuditDetail({ uid: detailUid })
      .then((res) => {
        if (res.code === 200) {
          setDetail(res.data);
        } else {
          message.error(`获取审计详情失败: ${res.message}`);
        }
      })
      .catch((error: AxiosError<APIRes<any>>) => {
        message.error(
          `获取审计详情失败: ${error.response?.data.message || error.message}`,
        );
      })
      .finally(() => setDetailLoading(false));
  }, [detailUid]);

  const onSearch = useCallback((values: FilterFormValues) => {
    const nextFilters: Omit<Audit.ListParams, keyof PaginationParams> = {
      module: values.module?.trim() || undefined,
      action: values.action?.trim() || undefined,
      method: values.method?.trim() || undefined,
      status_code: values.status_code,
      operator_uid: values.operator_uid?.trim() || undefined,
      request_ip: values.request_ip?.trim() || undefined,
      path_keyword: values.path_keyword?.trim() || undefined,
      started_at: values.time_range?.[0]?.toISOString(),
      ended_at: values.time_range?.[1]?.toISOString(),
    };
    setFilters(nextFilters);
  }, []);

  const onReset = useCallback(() => {
    form.resetFields();
    setFilters({});
  }, [form]);

  const columns = useMemo(
    () => [
      {
        title: '时间',
        dataIndex: 'created_at',
        width: 180,
        render: (tm?: string) =>
          tm ? dayjs(tm).format('YYYY-MM-DD HH:mm:ss') : '-',
      },
      {
        title: '模块',
        dataIndex: 'module',
        width: 120,
      },
      {
        title: '行为',
        dataIndex: 'action',
        width: 140,
      },
      {
        title: '请求',
        key: 'request',
        width: 220,
        render: (_: unknown, record: Audit.Log) => (
          <Space orientation="vertical" size={2}>
            <Tag color="blue">{record.method}</Tag>
            <span className="text-[12px] break-all">{record.path}</span>
          </Space>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status_code',
        width: 90,
        render: (status: number) =>
          status >= 400 ? (
            <Tag color="red">{status}</Tag>
          ) : (
            <Tag color="green">{status}</Tag>
          ),
      },
      {
        title: 'IP',
        dataIndex: 'request_ip',
        width: 140,
      },
      {
        title: '操作者',
        key: 'operator',
        width: 160,
        render: (_: unknown, record: Audit.Log) =>
          record.operator_username || record.operator_uid || '-',
      },
      {
        title: '耗时(ms)',
        dataIndex: 'duration_ms',
        width: 100,
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_: unknown, record: Audit.Log) => (
          <Button type="link" onClick={() => setDetailUid(record.uid)}>
            详情
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <ContentLayout title="审计日志">
        <Card className="mb-[12px]">
          <Form<FilterFormValues>
            form={form}
            layout="inline"
            onFinish={onSearch}
            className="gap-y-[12px]"
          >
            <Form.Item name="module" label="模块" className="w-[240px]">
              <Select
                showSearch
                placeholder="选择模块"
                options={filterOptions?.modules || []}
                allowClear
              />
            </Form.Item>
            <Form.Item name="action" label="行为" className="w-[240px]">
              <Select
                showSearch
                placeholder="选择行为"
                options={filterOptions?.actions || []}
                allowClear
              />
            </Form.Item>
            <Form.Item name="method" label="方法">
              <Select
                placeholder="请求方法"
                options={filterOptions?.methods || []}
                className="w-[120px]"
                allowClear
              />
            </Form.Item>
            <Form.Item name="status_code" label="状态码">
              <Select
                placeholder="选择状态码"
                options={(filterOptions?.status_codes || []).map((item) => ({
                  label: item.label,
                  value: Number(item.value),
                }))}
                className="w-[140px]"
                allowClear
              />
            </Form.Item>
            <Form.Item name="request_ip" label="IP">
              <Input placeholder="客户端 IP" allowClear />
            </Form.Item>
            <Form.Item
              name="operator_uid"
              label="操作者UID"
              className="w-[320px]"
            >
              <Select
                placeholder="选择操作者"
                options={filterOptions?.operators || []}
                allowClear
                showSearch
              />
            </Form.Item>
            <Form.Item name="path_keyword" label="路径关键字">
              <Input placeholder="如: /admin/user" allowClear />
            </Form.Item>
            <Form.Item name="time_range" label="时间范围">
              <DatePicker.RangePicker showTime />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  查询
                </Button>
                <Button onClick={onReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Card>
          <Table<Audit.Log>
            rowKey="uid"
            dataSource={data}
            columns={columns}
            pagination={false}
            scroll={{ x: 1400 }}
          />
          <div className="mt-[20px] flex justify-end">
            <PaginationComponent />
          </div>
        </Card>
      </ContentLayout>

      <Modal
        centered
        open={!!detailUid}
        title="审计详情"
        width={1000}
        onCancel={() => setDetailUid('')}
        footer={null}
        confirmLoading={detailLoading}
      >
        {detail ? (
          <Space orientation="vertical" className="w-full" size={16}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="时间">
                {detail.created_at
                  ? dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                {detail.request_ip || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="方法">
                {detail.method}
              </Descriptions.Item>
              <Descriptions.Item label="状态码">
                {detail.status_code}
              </Descriptions.Item>
              <Descriptions.Item label="模块">
                {detail.module}
              </Descriptions.Item>
              <Descriptions.Item label="行为">
                {detail.action}
              </Descriptions.Item>
              <Descriptions.Item label="路径" span={2}>
                {detail.path}
                {detail.query ? `?${detail.query}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="操作者" span={2}>
                {detail.operator_username || detail.operator_uid || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              items={[
                {
                  key: 'headers',
                  label: '请求 Header',
                  children: (
                    <pre className="max-h-[300px] overflow-auto bg-[#f7f7f7] p-[12px] rounded">
                      {formatJson(detail.request_headers)}
                    </pre>
                  ),
                },
                {
                  key: 'request',
                  label: '请求体',
                  children: (
                    <pre className="max-h-[300px] overflow-auto bg-[#f7f7f7] p-[12px] rounded">
                      {formatJson(detail.request_body)}
                    </pre>
                  ),
                },
                {
                  key: 'response',
                  label: '响应体',
                  children: (
                    <pre className="max-h-[300px] overflow-auto bg-[#f7f7f7] p-[12px] rounded">
                      {formatJson(detail.response_body)}
                    </pre>
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Modal>
    </>
  );
};

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default AuditLogPage;
