import {
  Button,
  Form,
  type FormInstance,
  Popconfirm,
  Space,
  type TableProps,
  Typography,
} from 'antd';
import { type FC, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import type { PushRule } from '@/typing/pushRules';

const uniqueKey = (record: PushRule.Filter) => {
  return record.source + record.operator + record.value;
};
const findRecordIndex = (data: PushRule.Filters, record: PushRule.Filter) => {
  return data.findIndex(
    (item) =>
      item.source === record.source &&
      item.operator === record.operator &&
      item.value === record.value,
  );
};

const operatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含', value: 'like' },
  { label: '不包含', value: 'nlike' },
];

type Props = {
  form: FormInstance;
  detail: PushRule.Detail;
  sourceOptions: { label: string; value: string }[];
  onChange: (data: PushRule.Filters) => void;
};
const FilterTable: FC<Props> = ({
  form,
  detail,
  onChange,
  sourceOptions = [],
}) => {
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (record: PushRule.Filter) =>
    uniqueKey(record) === editingKey;
  const edit = (record: PushRule.Filter) => {
    form.setFieldsValue({ ...record });
    setEditingKey(uniqueKey(record) || '');
  };
  const move = (record: PushRule.Filter, position: -1 | 1) => {
    const newData = [...detail.filter];
    const idx = findRecordIndex(newData, record);
    if (idx === 0 && position === -1) return;
    if (idx === newData.length - 1 && position === 1) return;

    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(idx + position, 0, item);
    onChange(newData);
  };
  const remove = (record: PushRule.Filter) => {
    const newData = [...detail.filter];
    const idx = findRecordIndex(newData, record);
    newData.splice(idx, 1);
    onChange(newData);
  };
  const cancel = () => setEditingKey('');
  const save = async (record: PushRule.Filter) => {
    try {
      const row = (await form.validateFields()) as PushRule.Filter;
      const newData = [...detail.filter];
      const idx = findRecordIndex(newData, record);
      if (idx > -1) {
        const item = newData[idx];
        newData.splice(idx, 1, {
          ...item,
          ...row,
        });
        onChange(newData);
      }
      setEditingKey('');
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'no',
      width: '80px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: PushRule.Filter) =>
        findRecordIndex(detail.filter, record) + 1,
    },
    {
      title: '源字段',
      dataIndex: 'source',
      ellipsis: true,
      inputType: 'select',
      options: sourceOptions,
      width: '480px',
      editable: true,
      enableSearch: true,
      render: (v: string) =>
        sourceOptions.find((option) => option.value === v)?.label,
    },
    {
      title: '过滤条件',
      dataIndex: 'operator',
      ellipsis: true,
      inputType: 'select',
      options: operatorOptions,
      width: '200px',
      editable: true,
      render: (v: string) =>
        operatorOptions.find((option) => option.value === v)?.label,
    },
    {
      title: '过滤值',
      dataIndex: 'value',
      ellipsis: true,
      inputType: 'text',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: '180px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: PushRule.Filter) => {
        const editable = isEditing(record);
        const idx = findRecordIndex(detail.filter, record);
        return editable ? (
          <Space>
            <Typography.Link
              onClick={() => save(record)}
              style={{ marginInlineEnd: 8 }}
            >
              确定
            </Typography.Link>
            <Popconfirm title="确定取消编辑?" onConfirm={cancel}>
              <Button type="link">取消</Button>
            </Popconfirm>
          </Space>
        ) : (
          <Space>
            <Typography.Link
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
            >
              编辑
            </Typography.Link>
            <Typography.Link
              disabled={editingKey !== '' || idx === 0}
              onClick={() => move(record, -1)}
            >
              上移
            </Typography.Link>
            <Typography.Link
              disabled={editingKey !== '' || idx === detail.filter.length - 1}
              onClick={() => move(record, 1)}
            >
              下移
            </Typography.Link>
            <Typography.Link
              type="danger"
              disabled={editingKey !== ''}
              onClick={() => remove(record)}
            >
              删除
            </Typography.Link>
          </Space>
        );
      },
    },
  ];

  const columnsMerged: TableProps<PushRule.Filter>['columns'] = columns.map(
    (col) => {
      if (!col.editable) return col;
      return {
        ...col,
        onCell: (record) => {
          return {
            record,
            inputType: col.inputType,
            options: col.options,
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditing(record),
          };
        },
      };
    },
  );

  return (
    <Form form={form} component={false}>
      <EditableTable<PushRule.Filter>
        dataSource={detail.filter}
        columns={columnsMerged}
        onCancel={cancel}
        rowKey="no"
      />
    </Form>
  );
};

export default FilterTable;
