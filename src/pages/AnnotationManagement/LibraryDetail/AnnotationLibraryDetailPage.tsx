import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Select,
  Spin,
  Tabs,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
import { useUserStore } from '@/store/useUserStore';
import { ENUM_VARS, UserRole } from '@/typing/enum';
import { DatasetType } from '@/typing/enum/dataset';
import type { Annotation } from '@/typing/annotation';
import type { Warehouse } from '@/typing/warehose';

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
  const [tabTotals, setTabTotals] = useState({ pending: 0, completed: 0 });
  const [annotationStatus, setAnnotationStatus] = useState<
    'pending' | 'completed'
  >('pending');
  const [currentRow, setCurrentRow] = useState<Record<string, any> | null>(
    null,
  );
  const [values, setValues] = useState<Record<string, any>>({});
  const [originalDetail, setOriginalDetail] =
    useState<Warehouse.PatientDetail | null>(null);
  const [selectedOriginalType, setSelectedOriginalType] = useState('');
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

  const refreshTabTotals = useCallback(
    async (q: string) => {
      if (!projectUid || !libraryUid) return;
      try {
        const [pendingRes, completedRes] = await Promise.all([
          annotationApi.getLibraryDataPage({
            project_uid: projectUid,
            library_uid: libraryUid,
            page_num: 1,
            page_size: 1,
            keyword: q || undefined,
            annotation_status: 'pending',
          }),
          annotationApi.getLibraryDataPage({
            project_uid: projectUid,
            library_uid: libraryUid,
            page_num: 1,
            page_size: 1,
            keyword: q || undefined,
            annotation_status: 'completed',
          }),
        ]);
        setTabTotals({
          pending: pendingRes.code === 200 ? pendingRes.data.total : 0,
          completed: completedRes.code === 200 ? completedRes.data.total : 0,
        });
      } catch {
        setTabTotals({ pending: 0, completed: 0 });
      }
    },
    [annotationApi, libraryUid, projectUid],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    fetchPage(1, queryKeyword);
  }, [annotationStatus, fetchPage, queryKeyword]);

  useEffect(() => {
    refreshTabTotals(queryKeyword);
  }, [queryKeyword, refreshTabTotals]);

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

  const encodeTableList = useCacheStore((s) => s.encodeTableList);
  const formFields = useMemo(() => {
    const source = detail?.form_fields ?? [];
    const mergeOptions = (
      options: Annotation.FieldOption[],
    ): Annotation.FieldOption[] => {
      const optionMap = new Map<string, Annotation.FieldOption>();
      for (const opt of options) {
        const key = String(opt.value ?? '').trim();
        if (!key) continue;
        if (!optionMap.has(key)) {
          optionMap.set(key, { value: key, label: opt.label });
        }
      }
      return Array.from(optionMap.values());
    };

    const mergeChildren = (
      children: Annotation.FormChildField[],
    ): Annotation.FormChildField[] => {
      const childMap = new Map<string, Annotation.FormChildField>();
      for (const child of children) {
        const childKey = String(child.key ?? '')
          .trim()
          .toLowerCase();
        if (!childKey) continue;
        const existing = childMap.get(childKey);
        if (!existing) {
          childMap.set(childKey, {
            ...child,
            key: childKey,
            mapping_options: mergeOptions(child.mapping_options ?? []),
          });
          continue;
        }
        existing.label = existing.label || child.label;
        existing.value_type =
          existing.value_type === 'text'
            ? child.value_type
            : existing.value_type;
        existing.is_array = existing.is_array || child.is_array;
        existing.mapping_type = existing.mapping_type || child.mapping_type;
        existing.mapping_content =
          existing.mapping_content || child.mapping_content;
        existing.mapping_options = mergeOptions([
          ...(existing.mapping_options ?? []),
          ...(child.mapping_options ?? []),
        ]);
      }
      return Array.from(childMap.values());
    };

    const fieldMap = new Map<string, Annotation.FormField>();
    for (const field of source) {
      const fieldKey = String(field.key ?? field.column_name ?? '')
        .trim()
        .toLowerCase();
      if (!fieldKey) continue;
      const normalized: Annotation.FormField = {
        ...field,
        key: fieldKey,
        children: mergeChildren(field.children ?? []),
        mapping_options: mergeOptions(field.mapping_options ?? []),
      };
      const existing = fieldMap.get(fieldKey);
      if (!existing) {
        fieldMap.set(fieldKey, normalized);
        continue;
      }
      existing.label = existing.label || normalized.label;
      existing.column_name = existing.column_name || normalized.column_name;
      existing.is_array = existing.is_array || normalized.is_array;
      existing.mapping_type = existing.mapping_type || normalized.mapping_type;
      existing.mapping_content =
        existing.mapping_content || normalized.mapping_content;
      existing.mapping_options = mergeOptions([
        ...(existing.mapping_options ?? []),
        ...(normalized.mapping_options ?? []),
      ]);
      if (existing.children.length < 1 && normalized.children.length > 0) {
        existing.children = normalized.children;
        existing.value_type = 'object';
      } else if (
        existing.children.length > 0 &&
        normalized.children.length > 0
      ) {
        existing.children = mergeChildren([
          ...existing.children,
          ...normalized.children,
        ]);
        existing.value_type = 'object';
      } else if (existing.value_type === 'text') {
        existing.value_type = normalized.value_type;
      }
    }
    return Array.from(fieldMap.values());
  }, [detail?.form_fields]);

  const getMappingOptions = useCallback(
    (
      field: Annotation.FormField | Annotation.FormChildField,
    ): Array<{ value: string; label: string }> => {
      if (field.mapping_options?.length) {
        return field.mapping_options.map((x) => ({
          value: x.value,
          label: x.label,
        }));
      }
      if (field.mapping_type === 'encode_table' && field.mapping_content) {
        const encode = (encodeTableList as Array<any>).find(
          (x) => x.uid === field.mapping_content,
        );
        const content = Array.isArray(encode?.content) ? encode.content : [];
        return content.map((x: any) => ({
          value: String(x.code ?? ''),
          label: `${String(x.code ?? '')} ${String(x.desc ?? '')}`.trim(),
        }));
      }
      return [];
    },
    [encodeTableList],
  );

  const isEmptyValue = useCallback((value: any): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }, []);

  const formatFieldTitle = useCallback((cn?: string, en?: string): string => {
    const cnName = String(cn ?? '').trim();
    const enName = String(en ?? '').trim();
    if (cnName && enName && cnName !== enName) {
      return `${cnName}（${enName}）`;
    }
    return cnName || enName;
  }, []);

  const normalizeScalarValue = useCallback(
    (
      value: any,
      valueType:
        | Annotation.FormField['value_type']
        | Annotation.FormChildField['value_type'],
    ) => {
      if (isEmptyValue(value)) return undefined;
      if (valueType === 'date') {
        if (dayjs.isDayjs(value)) return (value as Dayjs).format('YYYY-MM-DD');
        return String(value);
      }
      if (valueType === 'number') {
        const num = typeof value === 'number' ? value : Number(value);
        return Number.isNaN(num) ? value : num;
      }
      if (valueType === 'bool') {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
      }
      return value;
    },
    [isEmptyValue],
  );

  const validateScalar = useCallback(
    (
      value: any,
      field: Annotation.FormField | Annotation.FormChildField,
      fieldLabel: string,
    ): string | null => {
      if (isEmptyValue(value)) {
        return null;
      }
      if (field.mapping_type && getMappingOptions(field).length > 0) {
        const options = new Set(
          getMappingOptions(field).map(
            (opt: { value: string; label: string }) => String(opt.value),
          ),
        );
        if (!options.has(String(value))) {
          return `${fieldLabel} 取值不在映射选项中`;
        }
      }
      if (field.value_type === 'date' && !dayjs(String(value)).isValid()) {
        return `${fieldLabel} 不是合法日期`;
      }
      if (field.value_type === 'number' && Number.isNaN(Number(value))) {
        return `${fieldLabel} 不是合法数字`;
      }
      if (
        field.value_type === 'bool' &&
        !(
          value === true ||
          value === false ||
          value === 'true' ||
          value === 'false'
        )
      ) {
        return `${fieldLabel} 不是合法布尔值`;
      }
      return null;
    },
    [getMappingOptions, isEmptyValue],
  );

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

  useEffect(() => {
    if (displayOriginalDetail.length < 1) {
      setSelectedOriginalType('');
      return;
    }
    const exists = displayOriginalDetail.some(
      (x) => x.name === selectedOriginalType,
    );
    if (!exists) {
      setSelectedOriginalType(displayOriginalDetail[0]?.name || '');
    }
  }, [displayOriginalDetail, selectedOriginalType]);

  const selectedOriginalRecord = useMemo(
    () =>
      displayOriginalDetail.find((x) => x.name === selectedOriginalType) ||
      displayOriginalDetail[0] ||
      null,
    [displayOriginalDetail, selectedOriginalType],
  );

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

  const updateFieldValue = useCallback((columnName: string, nextValue: any) => {
    setValues((prev) => ({
      ...prev,
      [columnName]: nextValue,
    }));
  }, []);

  const updateChildValue = useCallback(
    (columnName: string, childKey: string, nextValue: any) => {
      setValues((prev) => {
        const current =
          prev[columnName] &&
          typeof prev[columnName] === 'object' &&
          !Array.isArray(prev[columnName])
            ? prev[columnName]
            : {};
        return {
          ...prev,
          [columnName]: {
            ...current,
            [childKey]: nextValue,
          },
        };
      });
    },
    [],
  );

  const renderScalarInput = useCallback(
    (
      field: Annotation.FormField | Annotation.FormChildField,
      value: any,
      onChange: (next: any) => void,
    ) => {
      const options = getMappingOptions(field);
      if (options.length > 0) {
        return (
          <Select
            allowClear
            className="w-full"
            value={isEmptyValue(value) ? undefined : value}
            options={options}
            onChange={(v) => onChange(v)}
          />
        );
      }
      if (field.value_type === 'date') {
        const dateValue =
          value && dayjs(String(value)).isValid() ? dayjs(String(value)) : null;
        return (
          <DatePicker
            allowClear
            className="w-full"
            value={dateValue}
            onChange={(v) => onChange(v ?? undefined)}
          />
        );
      }
      if (field.value_type === 'number') {
        return (
          <InputNumber
            className="w-full"
            value={isEmptyValue(value) ? undefined : Number(value)}
            onChange={(v) => onChange(v ?? undefined)}
          />
        );
      }
      if (field.value_type === 'bool') {
        return (
          <Select
            allowClear
            className="w-full"
            value={value === true || value === false ? value : undefined}
            options={[
              { label: '是', value: true },
              { label: '否', value: false },
            ]}
            onChange={(v) => onChange(v)}
          />
        );
      }
      return (
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      );
    },
    [getMappingOptions, isEmptyValue],
  );

  const saveCurrentRow = useCallback(
    async (showSuccessMessage: boolean) => {
      if (!projectUid || !libraryUid || !currentRow?.visit_no) {
        return false;
      }
      for (const field of formFields) {
        const fieldTitle = formatFieldTitle(field.label, field.key);
        const fieldValue = values[field.column_name];
        if (field.children.length > 0) {
          const obj =
            fieldValue &&
            typeof fieldValue === 'object' &&
            !Array.isArray(fieldValue)
              ? fieldValue
              : {};
          for (const child of field.children) {
            const childTitle = formatFieldTitle(child.label, child.key);
            const childValue = obj[child.key];
            if (child.is_array) {
              if (!isEmptyValue(childValue) && !Array.isArray(childValue)) {
                message.error(`${childTitle} 必须为数组`);
                return false;
              }
              for (const item of childValue || []) {
                const err = validateScalar(item, child, childTitle);
                if (err) {
                  message.error(err);
                  return false;
                }
              }
            } else {
              const err = validateScalar(childValue, child, childTitle);
              if (err) {
                message.error(err);
                return false;
              }
            }
          }
        } else if (field.is_array) {
          if (!isEmptyValue(fieldValue) && !Array.isArray(fieldValue)) {
            message.error(`${fieldTitle} 必须为数组`);
            return false;
          }
          for (const item of fieldValue || []) {
            const err = validateScalar(item, field, fieldTitle);
            if (err) {
              message.error(err);
              return false;
            }
          }
        } else {
          const err = validateScalar(fieldValue, field, fieldTitle);
          if (err) {
            message.error(err);
            return false;
          }
        }
      }

      const payloadValues: Record<string, any> = {};
      const schema = detail?.library.table_schema ?? [];
      for (const col of schema) {
        payloadValues[col.name] = values[col.name] ?? '';
      }
      for (const field of formFields) {
        if (field.children.length > 0) {
          const raw =
            values[field.column_name] &&
            typeof values[field.column_name] === 'object' &&
            !Array.isArray(values[field.column_name])
              ? values[field.column_name]
              : {};
          const obj: Record<string, any> = {};
          for (const child of field.children) {
            const childVal = raw[child.key];
            if (child.is_array) {
              const arr = Array.isArray(childVal)
                ? childVal
                    .map((x: any) => normalizeScalarValue(x, child.value_type))
                    .filter((x: any) => !isEmptyValue(x))
                : [];
              if (arr.length > 0) {
                obj[child.key] = arr;
              }
            } else {
              const v = normalizeScalarValue(childVal, child.value_type);
              if (!isEmptyValue(v)) {
                obj[child.key] = v;
              }
            }
          }
          payloadValues[field.column_name] =
            Object.keys(obj).length > 0 ? obj : '';
          continue;
        }
        if (field.is_array) {
          const arr = Array.isArray(values[field.column_name])
            ? values[field.column_name]
                .map((x: any) => normalizeScalarValue(x, field.value_type))
                .filter((x: any) => !isEmptyValue(x))
            : [];
          payloadValues[field.column_name] = arr.length > 0 ? arr : '';
          continue;
        }
        const normalized = normalizeScalarValue(
          values[field.column_name],
          field.value_type,
        );
        payloadValues[field.column_name] = isEmptyValue(normalized)
          ? ''
          : normalized;
      }

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
      formFields,
      isEmptyValue,
      libraryUid,
      message,
      normalizeScalarValue,
      projectUid,
      formatFieldTitle,
      validateScalar,
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
        refreshTabTotals(queryKeyword);
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
    refreshTabTotals,
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
        refreshTabTotals(queryKeyword);
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
    refreshTabTotals,
  ]);

  const onBackToProjectDetail = useCallback(() => {
    nav(`/annotation/project/detail/${projectUid}`);
  }, [nav, projectUid]);

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
      title={
        <div className="flex items-center gap-x-[16px]">
          <Button
            className="p-0 m-0"
            type="link"
            onClick={onBackToProjectDetail}
          >
            <p className="flex items-center">
              <i className="i-icon-park-outline:left text-[20px]" />
              <span>返回项目详情</span>
            </p>
          </Button>
        </div>
      }
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
            { key: 'pending', label: `未标注数据（${tabTotals.pending}）` },
            { key: 'completed', label: `已标注数据（${tabTotals.completed}）` },
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
                  <>
                    <Select
                      className="w-full mb-[12px]"
                      value={selectedOriginalRecord?.name}
                      options={displayOriginalDetail.map((d) => ({
                        value: d.name,
                        label: d.label,
                      }))}
                      onChange={(val) => setSelectedOriginalType(String(val))}
                    />
                    <div className="max-h-[56vh] overflow-y-auto pr-[8px]">
                      {selectedOriginalRecord && (
                        <Descriptions
                          key={selectedOriginalRecord.name}
                          items={selectedOriginalRecord.columns.map((c) => ({
                            key: c.value,
                            label: c.label,
                            children: renderValue(
                              selectedOriginalRecord.data[0][c.value],
                            ),
                            span: c.data_length > 100 ? 3 : 1,
                          }))}
                          column={3}
                          bordered
                          layout="vertical"
                          size="small"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <Empty description="暂无原始病历数据" />
                )}
              </Card>

              <Card
                size="small"
                className="sticky top-0"
                title={`标注编辑（病案号：${String(currentRow.visit_no)}）`}
              >
                <div className="max-h-[56vh] overflow-y-auto pr-[8px]">
                  {formFields.length < 1 ? (
                    <Empty description="暂无可编辑字段" />
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {formFields.map((field) => {
                        const fieldTitle = formatFieldTitle(
                          field.label,
                          field.key,
                        );
                        const fieldValue = values[field.column_name];
                        if (field.children.length > 0) {
                          const detailValue =
                            fieldValue &&
                            typeof fieldValue === 'object' &&
                            !Array.isArray(fieldValue)
                              ? fieldValue
                              : {};
                          return (
                            <Card
                              key={field.column_name}
                              size="small"
                              title={fieldTitle}
                            >
                              <div className="flex flex-col gap-[10px]">
                                {field.children.map((child) => {
                                  const childTitle = formatFieldTitle(
                                    child.label,
                                    child.key,
                                  );
                                  const childValue = detailValue[child.key];
                                  if (child.is_array) {
                                    const arr = Array.isArray(childValue)
                                      ? childValue
                                      : [];
                                    return (
                                      <div key={child.key}>
                                        <div className="text-fg-secondary mb-[6px]">
                                          {childTitle}
                                        </div>
                                        <div className="flex flex-col gap-[6px]">
                                          {arr.map((item, idx) => (
                                            <div
                                              key={`${child.key}-${idx}`}
                                              className="flex items-center gap-[6px]"
                                            >
                                              <div className="flex-1">
                                                {renderScalarInput(
                                                  child,
                                                  item,
                                                  (next) => {
                                                    const nextArr = [...arr];
                                                    nextArr[idx] = next;
                                                    updateChildValue(
                                                      field.column_name,
                                                      child.key,
                                                      nextArr,
                                                    );
                                                  },
                                                )}
                                              </div>
                                              <Button
                                                danger
                                                onClick={() =>
                                                  updateChildValue(
                                                    field.column_name,
                                                    child.key,
                                                    arr.filter(
                                                      (_, i) => i !== idx,
                                                    ),
                                                  )
                                                }
                                              >
                                                删除
                                              </Button>
                                            </div>
                                          ))}{' '}
                                          <Button
                                            onClick={() =>
                                              updateChildValue(
                                                field.column_name,
                                                child.key,
                                                [...arr, undefined],
                                              )
                                            }
                                          >
                                            添加
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={child.key}>
                                      <div className="text-fg-secondary mb-[6px]">
                                        {childTitle}
                                      </div>
                                      {renderScalarInput(
                                        child,
                                        childValue,
                                        (next) =>
                                          updateChildValue(
                                            field.column_name,
                                            child.key,
                                            next,
                                          ),
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          );
                        }

                        if (field.is_array) {
                          const arr = Array.isArray(fieldValue)
                            ? fieldValue
                            : [];
                          return (
                            <Card
                              key={field.column_name}
                              size="small"
                              title={fieldTitle}
                            >
                              <div className="flex flex-col gap-[6px]">
                                {arr.map((item, idx) => (
                                  <div
                                    key={`${field.column_name}-${idx}`}
                                    className="flex items-center gap-[6px]"
                                  >
                                    <div className="flex-1">
                                      {renderScalarInput(
                                        field,
                                        item,
                                        (next) => {
                                          const nextArr = [...arr];
                                          nextArr[idx] = next;
                                          updateFieldValue(
                                            field.column_name,
                                            nextArr,
                                          );
                                        },
                                      )}
                                    </div>
                                    <Button
                                      danger
                                      onClick={() =>
                                        updateFieldValue(
                                          field.column_name,
                                          arr.filter((_, i) => i !== idx),
                                        )
                                      }
                                    >
                                      删除
                                    </Button>
                                  </div>
                                ))}{' '}
                                <Button
                                  onClick={() =>
                                    updateFieldValue(field.column_name, [
                                      ...arr,
                                      undefined,
                                    ])
                                  }
                                >
                                  添加
                                </Button>
                              </div>
                            </Card>
                          );
                        }

                        return (
                          <div key={field.column_name}>
                            <div className="text-fg-secondary mb-[6px]">
                              {fieldTitle}
                            </div>
                            {renderScalarInput(field, fieldValue, (next) =>
                              updateFieldValue(field.column_name, next),
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>
    </ContentLayout>
  );
};

export default AnnotationLibraryDetailPage;
