import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Spin,
  Table,
  Tabs,
} from 'antd';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useUserStore } from '@/store/useUserStore';
import { ENUM_VARS, UserRole } from '@/typing/enum';
import { DatasetType } from '@/typing/enum/dataset';
import type { Annotation } from '@/typing/annotation';
import type { Warehouse } from '@/typing/warehose';

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
  const { annotationApi, warehouseApi } = useApi();
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
  const [pageInput, setPageInput] = useState('1');
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [annotationStatus, setAnnotationStatus] = useState<
    'pending' | 'completed'
  >('pending');
  const [currentRow, setCurrentRow] = useState<Record<string, any> | null>(
    null,
  );
  const [values, setValues] = useState<Record<string, any>>({});
  const [originalDetail, setOriginalDetail] =
    useState<Warehouse.PatientDetail | null>(null);
  const [originalLoading, setOriginalLoading] = useState(false);
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
          annotation_status: annotationStatus,
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
    [annotationApi, annotationStatus, libraryUid, message, projectUid],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchPage(1, queryKeyword);
  }, [annotationStatus, fetchPage, queryKeyword]);

  useEffect(() => {
    const visitNo = currentRow?.visit_no ? String(currentRow.visit_no) : '';
    if (!visitNo) {
      setOriginalDetail(null);
      return;
    }
    setOriginalLoading(true);
    warehouseApi
      .getPatientDetail({ visit_no: visitNo })
      .then((res) => {
        if (res.code === 200) {
          setOriginalDetail(res.data);
        } else {
          setOriginalDetail(null);
          message.error(res.message || '获取原始病历失败');
        }
      })
      .catch((error) => {
        setOriginalDetail(null);
        message.error(
          getApiErrorMessage(error, '获取原始病历失败，请稍后重试'),
        );
      })
      .finally(() => setOriginalLoading(false));
  }, [currentRow?.visit_no, message, warehouseApi]);

  useEffect(() => {
    setPageInput(String(pageNum));
  }, [pageNum]);

  const goToPage = useCallback(
    (targetPage: number) => {
      const maxPage = total > 0 ? total : 1;
      const nextPage = Math.min(Math.max(targetPage, 1), maxPage);
      fetchPage(nextPage, queryKeyword);
    },
    [fetchPage, queryKeyword, total],
  );

  const submitPageInput = useCallback(() => {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(pageNum));
      return;
    }
    goToPage(parsed);
  }, [goToPage, pageInput, pageNum]);

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

  const displayOriginalDetail = useMemo(() => {
    if (!originalDetail || originalDetail.length === 0) {
      return [];
    }
    return originalDetail
      .map((d) => {
        const firstRow = d.data?.[0];
        if (!firstRow) return null;
        const cols = d.columns.filter(
          (c) => ![undefined, null, 'NULL'].includes(firstRow[c.value]),
        );
        return {
          ...d,
          columns: cols,
        };
      })
      .filter(Boolean) as Warehouse.PatientDetail;
  }, [originalDetail]);

  const renderRecord = useCallback((record: Record<string, string>) => {
    return Object.keys(record).length === 0 ? (
      <p>-</p>
    ) : (
      <div>
        {Object.entries(record).map(([k, v]) => (
          <p
            className="leading-[20px] mt-[8px] first:mt-0"
            key={k}
          >{`${k}: ${v}`}</p>
        ))}
      </div>
    );
  }, []);

  const renderValue = useCallback(
    (
      value:
        | string
        | number
        | Record<string, string>[]
        | string[]
        | Record<string, string>,
    ) => {
      if (!value) return <p>-</p>;
      switch (typeof value) {
        case 'string':
        case 'number':
        case 'bigint':
          return <p>{value}</p>;
        case 'boolean':
          return <p>{value ? '是' : '否'}</p>;
        case 'object':
          if (Array.isArray(value)) {
            if (value.length === 0) {
              return <p>-</p>;
            } else if (typeof value[0] === 'string') {
              return (
                <div>
                  {(value as string[]).map((v) => (
                    <p key={v} className="flex mt-[8px] first:mt-0">
                      <span className="w-[6px] h-[6px] rounded-full bg-blue mr-[8px] shrink-0 grow-0 basis-[6px] mt-[9px]" />
                      <span className="leading-[24px]">{v}</span>
                    </p>
                  ))}
                </div>
              );
            } else {
              return (value as Record<string, string>[]).map((v) => (
                <div
                  key={JSON.stringify(v)}
                  className="flex mt-[12px] first:mt-0"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-blue mr-[8px] shrink-0 grow-0 basis-[6px] mt-[7px]" />
                  <div>{renderRecord(v)}</div>
                </div>
              ));
            }
          } else {
            return renderRecord(value);
          }
        default:
          return <p>{String(value)}</p>;
      }
    },
    [renderRecord],
  );

  const saveCurrentRow = useCallback(
    async (showSuccessMessage: boolean) => {
      if (!projectUid || !libraryUid || !currentRow?.visit_no) {
        return false;
      }
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
        if (showSuccessMessage) {
          message.success(res.message || '保存成功');
        }
        return true;
      }
      message.error(res.message || '保存失败');
      return false;
    },
    [
      annotationApi,
      currentRow?.visit_no,
      detail?.library.table_schema,
      libraryUid,
      message,
      projectUid,
      values,
    ],
  );

  const onSave = useCallback(async () => {
    if (!projectUid || !libraryUid || !currentRow?.visit_no) {
      return;
    }
    setSaving(true);
    try {
      const ok = await saveCurrentRow(true);
      if (ok) {
        fetchPage(pageNum, queryKeyword);
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '保存失败，请稍后重试'));
    } finally {
      setSaving(false);
    }
  }, [
    currentRow,
    fetchPage,
    libraryUid,
    message,
    pageNum,
    projectUid,
    queryKeyword,
    saveCurrentRow,
  ]);

  const onComplete = useCallback(async () => {
    if (!projectUid || !libraryUid || !currentRow?.visit_no) {
      return;
    }
    setCompleting(true);
    try {
      const saveOk = await saveCurrentRow(false);
      if (!saveOk) {
        return;
      }
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
    saveCurrentRow,
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
          <Button onClick={onExport}>导出 CSV</Button>{' '}
          {detail.library.source_dataset_type === DatasetType.Subscribe && (
            <Button loading={refreshing} onClick={onRefresh}>
              更新专病库
            </Button>
          )}{' '}
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

      <Card className="mt-[16px]" title="数据编辑（每页 1 条）">
        <Tabs
          activeKey={annotationStatus}
          onChange={(key) =>
            setAnnotationStatus(key as 'pending' | 'completed')
          }
          items={[
            { key: 'pending', label: '未标注数据' },
            { key: 'completed', label: '已标注数据' },
          ]}
          className="mb-[12px]"
        />
        <div className="flex items-center justify-end gap-[8px] mb-[12px]">
          <Button type="primary" loading={saving} onClick={onSave}>
            保存当前记录
          </Button>{' '}
          {annotationStatus === 'pending' && (
            <Button loading={completing} onClick={onComplete}>
              完成当前记录标注
            </Button>
          )}
        </div>
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
          <div className="flex items-center gap-[8px]">
            <Button
              type="text"
              size="small"
              onClick={() => goToPage(pageNum - 1)}
              disabled={loading || pageNum <= 1 || total < 1}
            >
              <i className="i-icon-park-outline:left text-[20px]" />
            </Button>
            <Input
              size="small"
              className="w-[56px] text-center"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
              onPressEnter={submitPageInput}
              onBlur={submitPageInput}
            />
            <span>/ {total}</span>
            <Button
              type="text"
              size="small"
              onClick={() => goToPage(pageNum + 1)}
              disabled={loading || total < 1 || pageNum >= total}
            >
              <i className="i-icon-park-outline:right text-[20px]" />
            </Button>
          </div>
        </div>

        {!currentRow ? (
          <Empty description="当前条件无数据" />
        ) : (
          <div className="max-h-[64vh] overflow-y-auto pr-[4px]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(420px,46%)] gap-[12px] items-start">
              <Card
                size="small"
                title={`原始病历（病案号：${String(currentRow.visit_no)}）`}
              >
                {originalLoading ? (
                  <div className="h-[240px] flex items-center justify-center gap-[8px]">
                    <Spin />
                    <span>原始病历加载中...</span>
                  </div>
                ) : displayOriginalDetail.length > 0 ? (
                  <div className="max-h-[56vh] overflow-y-auto pr-[8px]">
                    {displayOriginalDetail.map((d) => (
                      <Descriptions
                        className="mt-[20px] first:mt-0"
                        key={d.name}
                        title={d.label}
                        items={d.columns.map((c) => ({
                          key: c.value,
                          label: c.label,
                          children: renderValue(d.data[0][c.value]),
                          span: c.data_length > 100 ? 3 : 1,
                        }))}
                        column={3}
                        bordered
                        layout="vertical"
                        size="small"
                      />
                    ))}
                  </div>
                ) : (
                  <Empty description="暂无原始病历数据" />
                )}
              </Card>

              <Card
                size="small"
                className="sticky top-0"
                title={`标注编辑（病案号：${String(currentRow.visit_no)}）`}
              >
                <Table<RowItem>
                  rowKey="key"
                  loading={loading}
                  dataSource={rows}
                  pagination={false}
                >
                  <Table.Column<RowItem>
                    title="名称"
                    dataIndex="name"
                    width={220}
                  />
                  <Table.Column<RowItem>
                    title="数据类型"
                    dataIndex="data_type"
                    width={120}
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
              </Card>
            </div>
          </div>
        )}
      </Card>
    </ContentLayout>
  );
};

export default AnnotationLibraryDetailPage;
