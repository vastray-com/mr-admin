import {
  Button,
  Form,
  type FormInstance,
  InputNumber,
  Popconfirm,
  Popover,
  Space,
  type TableProps,
  Typography,
} from 'antd';
import { type FC, useEffect, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import {
  PushDataType,
  pushDataTypeOptions,
  StructuredFieldMappingType,
} from '@/typing/enum';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';

const uniqueKey = (record: PushRule.ContentItem) => {
  return record.source + record.target + record.data_type;
};
const findRecordIndex = (
  data: PushRule.Content,
  record: PushRule.ContentItem,
) => {
  return data.findIndex(
    (item) =>
      item.source === record.source &&
      item.target === record.target &&
      item.data_type === record.data_type,
  );
};

type Props = {
  form: FormInstance;
  detail: PushRule.Detail;
  sourceOptions: { label: string; value: string }[];
  structuredRuleFields: StructuredRuleset.Fields;
  onChange: (data: PushRule.Content) => void;
};
const PushTable: FC<Props> = ({
  form,
  detail,
  onChange,
  sourceOptions = [],
  structuredRuleFields,
}) => {
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (record: PushRule.ContentItem) =>
    uniqueKey(record) === editingKey;
  const edit = (record: PushRule.ContentItem) => {
    form.setFieldsValue({ ...record });
    setEditingKey(uniqueKey(record) || '');
  };
  const move = (record: PushRule.ContentItem, position: -1 | 1) => {
    const newData = [...detail.content];
    const idx = findRecordIndex(newData, record);
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(idx + position, 0, item);
    onChange(newData);
  };
  // 快速移动
  const [fastMoveTarget, setFastMoveTarget] = useState<string | number | null>(
    null,
  );
  const fastMove = (
    record: PushRule.ContentItem,
    position: string | number | null,
  ) => {
    if (position === null) return;
    const posNum = Number(position);
    if (
      posNum < 1 ||
      Number.isNaN(posNum) ||
      posNum - 1 >= detail.content.length
    )
      return;
    const newData = [...detail.content];
    const idx = findRecordIndex(newData, record);
    if (idx === -1 || posNum - 1 === idx) return;
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(posNum - 1, 0, item);
    onChange(newData);
    setFastMoveTarget(null);
  };
  const remove = (record: PushRule.ContentItem) => {
    const newData = [...detail.content];
    const idx = findRecordIndex(newData, record);
    newData.splice(idx, 1);
    onChange(newData);
  };
  const cancel = () => {
    setEditingKey('');
  };
  const save = async (record: PushRule.ContentItem) => {
    try {
      const row = (await form.validateFields()) as StructuredRuleset.Field;
      const newData = [...detail.content];
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

  // 切换字段时自动带入内容
  const source = Form.useWatch('source', form);
  useEffect(() => {
    if (!source) return;
    const field = structuredRuleFields.find((f) => f.name_en === source);
    if (field) {
      form.setFieldsValue({
        source,
        target: field.name_en,
        data_type: PushDataType.String,
        // 枚举映射内容
        mapping_content:
          field.mapping_type === StructuredFieldMappingType.Enum &&
          field.mapping_content
            ? field.mapping_content
            : null,
      });
    }
  }, [source, form, structuredRuleFields]);

  // // 编码选项
  // const encodeOptions = useCacheStore((s) => s.encodeOptions);
  // // 分类选择列表
  // const categoryOptions = useMemo(
  //   () =>
  //     detail.category
  //       .filter((category) => category.name_en && category.name_cn)
  //       .map((item) => ({
  //         label: item.name_cn,
  //         value: item.name_en,
  //       })),
  //   [detail.category],
  // );

  const columns = [
    {
      title: '序号',
      dataIndex: 'no',
      width: '80px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: PushRule.ContentItem) =>
        findRecordIndex(detail.content, record) + 1,
    },
    {
      title: '源字段',
      dataIndex: 'source',
      width: '480px',
      ellipsis: true,
      inputType: 'select',
      options: sourceOptions,
      editable: true,
      enableSearch: true,
      render: (v: string) =>
        sourceOptions.find((option) => option.value === v)?.label,
    },
    {
      title: '目标字段',
      dataIndex: 'target',
      ellipsis: true,
      inputType: 'text',
      editable: true,
      enableSearch: true,
    },
    {
      title: '目标数据类型',
      dataIndex: 'data_type',
      width: '160px',
      ellipsis: true,
      inputType: 'select',
      options: pushDataTypeOptions,
      editable: true,
      filters: pushDataTypeOptions.map((o) => ({
        text: o.label,
        value: o.value,
      })),
      onFilter: (value: any, record: PushRule.ContentItem) =>
        record.data_type.indexOf(value as string) === 0,
      render: (v: string) =>
        pushDataTypeOptions.find((option) => option.value === v)?.label,
    },
    {
      title: '最大值长度',
      dataIndex: 'max_length',
      width: '120px',
      ellipsis: true,
      inputType: 'number',
      editable: true,
    },
    {
      title: '枚举映射',
      dataIndex: 'mapping_content',
      width: '400px',
      inputType: 'text',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: '220px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: PushRule.ContentItem) => {
        const editable = isEditing(record);
        const idx = findRecordIndex(detail.content, record);
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
              disabled={editingKey !== '' || idx === detail.content.length - 1}
              onClick={() => move(record, 1)}
            >
              下移
            </Typography.Link>
            <Popover
              content={
                <Space>
                  <span>请输入目标位置：</span>
                  <InputNumber
                    size="small"
                    min={1}
                    max={detail.content.length}
                    value={fastMoveTarget}
                    onChange={setFastMoveTarget}
                  />
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => fastMove(record, fastMoveTarget)}
                  >
                    确定
                  </Button>
                </Space>
              }
              trigger="click"
            >
              <Typography.Link disabled={editingKey !== ''}>
                快移
              </Typography.Link>
            </Popover>
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

  const columnsMerged: TableProps<PushRule.ContentItem>['columns'] =
    columns.map((col) => {
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
    });

  return (
    <Form form={form} component={false}>
      <EditableTable<PushRule.ContentItem>
        dataSource={detail.content}
        columns={columnsMerged}
        rowKey="no"
      />
    </Form>
  );
};

export default PushTable;
