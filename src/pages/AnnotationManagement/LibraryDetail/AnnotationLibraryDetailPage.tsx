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
import { UserRole } from '@/typing/enum';
import type { Annotation } from '@/typing/annotation';

type RowItem = {
  key: string;
  name: string;
  data_type: string;
  value: string;
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

  const fetchDetail = useCallback(async () => {
    if (!projectUid || !libraryUid) return;
    const res = await annotationApi.getLibraryDetail({
      project_uid: projectUid,
      library_uid: libraryUid,
    });
    if (res.code === 200) {
      setDetail(res.data);
    } else {
      message.error(res.message || '获取详情失败');
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
    if (!projectUid || !libraryUid || !currentRow?._annotation_row_id) {
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
        row_id: String(currentRow._annotation_row_id),
        values: payloadValues,
      });
      if (res.code === 200) {
        message.success('保存成功');
        fetchPage(pageNum, queryKeyword);
      } else {
        message.error(res.message || '保存失败');
      }
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
    } catch {
      message.error({ key: loadingKey, content: '导出失败' });
    }
  }, [annotationApi, detail, libraryUid, message, projectUid]);

  const onDeleteLibrary = useCallback(async () => {
    if (!projectUid || !libraryUid) return;
    if (!isAdmin) {
      message.warning('普通用户不允许删除数据集');
      return;
    }
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
  }, [annotationApi, isAdmin, libraryUid, message, nav, projectUid]);

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
          <Button danger disabled={!isAdmin} onClick={onDeleteLibrary}>
            删除数据集
          </Button>
          <Button
            onClick={() => {
              setQueryKeyword(keyword.trim());
            }}
          >
            搜索
          </Button>
          <Button type="primary" loading={saving} onClick={onSave}>
            保存当前记录
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

      <Card className="mt-[16px]" title="数据编辑（每页 1 条）">
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
              当前行 ID：{String(currentRow._annotation_row_id)}
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
