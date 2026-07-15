import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Pagination,
  Spin,
  Table,
} from 'antd';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useUserStore } from '@/store/useUserStore';
import { ENUM_VARS, UserRole } from '@/typing/enum';
import { DatasetType } from '@/typing/enum/dataset';
import type { Annotation } from '@/typing/annotation';

type RowItem = {
  key: string;
  name: string;
  data_type: string;
  value: string;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = err.response?.data?.message || err.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
};

const AnnotationLibraryDetailPage: FC = () => {
  const { annotationApi } = useApi();
  const { message } = App.useApp();
  const nav = useNavigate();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === UserRole.Admin;
  const { projectUid, libraryUid } = useParams<{
    projectUid: string;
    libraryUid: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Annotation.LibraryDetail | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [currentRow, setCurrentRow] = useState<Record<string, any> | null>(
    null,
  );
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!projectUid || !libraryUid) return;
    try {
      const res = await annotationApi.getLibraryDetail({
        project_uid: projectUid,
        library_uid: libraryUid,
      });
      if (res.code === 200) {
        setDetail(res.data);
      } else {
        message.error(res.message || '获取详情失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '获取详情失败，请稍后重试'));
    }
  }, [annotationApi, libraryUid, message, projectUid]);

  const fetchPage = useCallback(
    async (targetPage: number, q: string) => {
      if (!projectUid || !libraryUid) return;
      setLoading(true);
      try {
        const res = await annotationApi.getLibraryDataPage({
          project_uid: projectUid,
          library_uid: libraryUid,
          page_num: targetPage,
          page_size: 1,
          keyword: q || undefined,
        });
        if (res.code === 200) {
          setTotal(res.data.total);
          setPageNum(targetPage);
          const row = res.data.data[0] ?? null;
          setCurrentRow(row);
          setValues(row ?? {});
        } else {
          message.error(res.message || '加载数据失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '加载数据失败，请稍后重试'));
      } finally {
        setLoading(false);
      }
    },
    [annotationApi, libraryUid, message, projectUid],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchPage(1, queryKeyword);
  }, [fetchPage, queryKeyword]);

  const rows = useMemo<RowItem[]>(() => {
    const schema = detail?.library.table_schema ?? [];
    if (!currentRow) {
      return [];
    }
    return schema.map((col) => ({
      key: col.name,
      name: col.label || col.name,
      data_type: col.data_type,
      value: String(values[col.name] ?? ''),
    }));
  }, [currentRow, detail, values]);

  const onSave = useCallback(async () => {
    if (!projectUid || !libraryUid || !currentRow?.visit_no) {
      return;
    }
    setSaving(true);
    try {
      const schema = detail?.library.table_schema ?? [];
      const payloadValues = schema.reduce<Record<string, any>>((acc, col) => {
        acc[col.name] = values[col.name] ?? '';
        return acc;
      }, {});
      const res = await annotationApi.saveLibraryRow({
        project_uid: projectUid,
        library_uid: libraryUid,
        row_id: String(currentRow.visit_no),
        values: payloadValues,
      });
      if (res.code === 200) {
        message.success('保存成功');
        fetchPage(pageNum, queryKeyword);
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '保存失败，请稍后重试'));
    } finally {
      setSaving(false);
    }
  }, [
    annotationApi,
    currentRow,
    detail,
    fetchPage,
    libraryUid,
    message,
    pageNum,
    projectUid,
    queryKeyword,
    values,
  ]);

  const onComplete = useCallback(async () => {
    if (!projectUid || !libraryUid || !currentRow?.visit_no) {
      return;
    }
    setCompleting(true);
    try {
      const res = await annotationApi.completeLibraryRow({
        project_uid: projectUid,
        library_uid: libraryUid,
        row_id: String(currentRow.visit_no),
      });
      if (res.code === 200) {
        message.success(res.message || '当前记录已完成标注');
        fetchPage(pageNum, queryKeyword);
      } else {
        message.error(res.message || '完成标注失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '完成标注失败，请稍后重试'));
    } finally {
      setCompleting(false);
    }
  }, [
    annotationApi,
    currentRow?.visit_no,
    fetchPage,
    libraryUid,
    message,
    pageNum,
    projectUid,
    queryKeyword,
  ]);

  const onExport = useCallback(async () => {
    if (!projectUid || !libraryUid || !detail) return;
    const loadingKey = `export-${libraryUid}`;
    message.loading({ key: loadingKey, content: '正在导出...', duration: 0 });
    try {
      const res = await annotationApi.exportLibrary({
        project_uid: projectUid,
        library_uid: libraryUid,
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail.library.name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      message.success({ key: loadingKey, content: '导出成功' });
    } catch (error) {
      message.error({
        key: loadingKey,
        content: getApiErrorMessage(error, '导出失败'),
      });
    }
  }, [annotationApi, detail, libraryUid, message, projectUid]);

  const onDeleteLibrary = useCallback(async () => {
    if (!projectUid || !libraryUid) return;
    if (!isAdmin) {
      message.warning('普通用户不允许删除数据集');
      return;
    }
    try {
      const res = await annotationApi.deleteLibrary({
        project_uid: projectUid,
        library_uid: libraryUid,
      });
      if (res.code === 200) {
        message.success('删除成功');
        nav(`/annotation/project/detail/${projectUid}`);
        return;
      }
      message.error(res.message || '删除失败');
    } catch (error) {
      message.error(getApiErrorMessage(error, '删除失败，请稍后重试'));
    }
  }, [annotationApi, isAdmin, libraryUid, message, nav, projectUid]);

  const onRefresh = useCallback(async () => {
    if (!projectUid || !libraryUid) return;
    setRefreshing(true);
    try {
      const res = await annotationApi.refreshLibrary({
        project_uid: projectUid,
        library_uid: libraryUid,
      });
      if (res.code === 200) {
        message.success(`更新成功，本次新增 ${res.data} 条`);
        fetchDetail();
        fetchPage(pageNum, queryKeyword);
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '更新失败，请稍后重试'));
    } finally {
      setRefreshing(false);
    }
  }, [
    annotationApi,
    fetchDetail,
    fetchPage,
    libraryUid,
    message,
    pageNum,
    projectUid,
    queryKeyword,
  ]);

  if (!projectUid || !libraryUid) {
    return <div className="p-[20px]">缺少路由参数</div>;
  }

  if (!detail) {
    return (
      <div className="h-full flex items-center justify-center gap-[8px]">
        <Spin />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <ContentLayout
      title={`专病库标注 - ${detail.library.name}`}
      action={
        <div className="flex items-center gap-[8px]">
          <Button onClick={onExport}>导出 CSV</Button>
          {detail.library.source_dataset_type === DatasetType.Subscribe && (
            <Button loading={refreshing} onClick={onRefresh}>
              更新专病库
            </Button>
          )}
          <Button danger disabled={!isAdmin} onClick={onDeleteLibrary}>
            删除数据集
          </Button>
        </div>
      }
    >
      <Card title="专病库信息">
        <Descriptions
          bordered
          size="small"
          column={4}
          items={[
            { key: 'name', label: '名称', children: detail.library.name },
            {
              key: 'type',
              label: '类型',
              children: detail.library.source_dataset_type
                ? ENUM_VARS.DATASET.TYPE_MAP[detail.library.source_dataset_type]
                : '-',
            },
            {
              key: 'desc',
              label: '描述',
              children: detail.library.description || '-',
            },
            {
              key: 'count',
              label: '数据条数',
              children: detail.library.row_count,
            },
            {
              key: 'table',
              label: 'Doris 表',
              children: detail.library.doris_table_name,
            },
          ]}
        />
      </Card>

      <Card
        className="mt-[16px]"
        title="数据编辑（每页 1 条）"
        extra={
          <div className="flex items-center gap-[8px]">
            <Button type="primary" loading={saving} onClick={onSave}>
              保存当前记录
            </Button>
            <Button loading={completing} onClick={onComplete}>
              完成当前记录标注
            </Button>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-[12px] mb-[16px]">
          <Input.Search
            className="max-w-[420px]"
            placeholder="按所有值模糊搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => {
              setQueryKeyword(keyword.trim());
            }}
          />
          <Pagination
            current={pageNum}
            pageSize={1}
            total={total}
            showQuickJumper
            showSizeChanger={false}
            onChange={(p) => fetchPage(p, queryKeyword)}
            showTotal={(t) => `共 ${t} 条`}
          />
        </div>

        {!currentRow ? (
          <Empty description="当前条件无数据" />
        ) : (
          <>
            <p className="text-fg-tertiary mb-[12px]">
              当前病案号：{String(currentRow.visit_no)}
            </p>
            <Table<RowItem>
              rowKey="key"
              loading={loading}
              dataSource={rows}
              pagination={false}
            >
              <Table.Column<RowItem>
                title="名称"
                dataIndex="name"
                width={280}
              />
              <Table.Column<RowItem>
                title="数据类型"
                dataIndex="data_type"
                width={160}
              />
              <Table.Column<RowItem>
                title="值"
                dataIndex="value"
                render={(_, row) => (
                  <Input
                    value={String(values[row.key] ?? '')}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [row.key]: e.target.value,
                      }))
                    }
                  />
                )}
              />
            </Table>
          </>
        )}
      </Card>
    </ContentLayout>
  );
};

export default AnnotationLibraryDetailPage;
