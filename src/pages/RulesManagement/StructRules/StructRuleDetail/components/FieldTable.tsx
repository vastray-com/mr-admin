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
import { type FC, useMemo, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleFieldMappingType,
  StructRuleFieldParsingType,
  StructRuleFieldValueType,
  structRuleFieldMappingTypeOptions,
  structRuleFieldParsingTypeOptions,
  structRuleFieldValueTypeOptions,
} from '@/typing/enum';
import type { StructRule } from '@/typing/structRules';

type Props = {
  form: FormInstance;
  detail: StructRule.Detail;
  onChange: (data: StructRule.Fields) => void;
};
const FieldTable: FC<Props> = ({ form, detail, onChange }) => {
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (key: string) => key === editingKey;
  // const resultFieldOptions = useMemo(
  //   () =>
  //     detail.fields.map((f) => ({
  //       label: f.name_cn,
  //       value: f.name_en,
  //     })),
  //   [detail.fields],
  // );
  //
  // const name_en = Form.useWatch('name_en', form);
  // const sourceType = Form.useWatch('source_type', form);
  const mappingType = Form.useWatch('mapping_type', form);

  const edit = (record: Partial<StructRule.Field>) => {
    form.setFieldsValue({
      category_name: '',
      name_cn: '',
      name_en: '',
      source_type: StructRuleFieldParsingType.LLM,
      parsing_rule: '',
      value_type: StructRuleFieldValueType.Text,
      is_array: false,
      mapping_type: StructRuleFieldMappingType.None,
      mapping_content: '',
      need_store: 1,
      ...record,
    });
    setEditingKey(record.uid || '');
  };
  const move = (key: string, position: -1 | 1) => {
    const newData = [...detail.fields];
    const idx = newData.findIndex((item) => item.uid === key);
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(idx + position, 0, item);
    onChange(newData);
  };
  // 快速移动
  const [fastMoveTarget, setFastMoveTarget] = useState<string | number | null>(
    null,
  );
  const fastMove = (key: string, position: string | number | null) => {
    if (position === null) return;
    const posNum = Number(position);
    if (
      posNum < 1 ||
      Number.isNaN(posNum) ||
      posNum - 1 >= detail.fields.length
    )
      return;
    const newData = [...detail.fields];
    const idx = newData.findIndex((item) => item.uid === key);
    if (idx === -1 || posNum - 1 === idx) return;
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(posNum - 1, 0, item);
    onChange(newData);
    setFastMoveTarget(null);
  };
  const remove = (key: string) => {
    const newData = [...detail.fields];
    const idx = newData.findIndex((item) => item.uid === key);
    newData.splice(idx, 1);
    onChange(newData);
  };
  const cancel = () => {
    setEditingKey('');
  };
  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as StructRule.Field;
      const newData = [...detail.fields];
      const idx = newData.findIndex((item) => item.uid === key);
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

  // 编码选项
  const encodeOptions = useCacheStore((s) => s.encodeOptions);
  // 分类选择列表
  const categoryOptions = useMemo(
    () =>
      detail.category
        .filter((category) => category.name_en && category.name_cn)
        .map((item) => ({
          label: item.name_cn,
          value: `category#${item.name_en}`,
        })),
    [detail.category],
  );
  // 小字段选择列表
  const fieldOptions = useMemo(
    () =>
      detail.fields
        .filter((field) => field.name_en && field.name_cn)
        .map((item) => ({
          label: item.name_cn,
          value: `field#${item.name_en}`,
        })),
    [detail.fields],
  );

  const columns = [
    {
      title: '序号',
      dataIndex: 'no',
      width: '80px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Field) =>
        detail.fields.findIndex((f) => f.uid === record.uid) + 1,
    },
    {
      title: '数据项',
      dataIndex: 'name_cn',
      width: '200px',
      ellipsis: true,
      inputType: 'text',
      editable: true,
      enableSearch: true,
    },
    {
      title: '字段名称',
      dataIndex: 'name_en',
      width: '200px',
      ellipsis: true,
      inputType: 'text',
      editable: true,
      enableSearch: true,
    },
    {
      title: '数据来源',
      dataIndex: 'data_source',
      width: '220px',
      ellipsis: true,
      inputType: 'select',
      options: [
        {
          label: '大字段',
          title: '大字段',
          options: categoryOptions,
        },
        {
          label: '明细字段',
          title: '明细字段',
          options: fieldOptions,
        },
      ],
      editable: true,
      // enableSearch: true,
      filters: categoryOptions
        .map((o) => ({ text: `大字段: ${o.label}`, value: o.value }))
        .concat(
          fieldOptions.map((o) => ({
            text: `明细字段: ${o.label}`,
            value: o.value,
          })),
        ),
      onFilter: (value: any, record: StructRule.Field) =>
        record.data_source?.indexOf(value as string) === 0,
      render: (v: string) => {
        if (!v) return '';
        if (v.startsWith('category#')) {
          return `大字段: ${categoryOptions.find((option) => option.value === v)?.label || v}`;
        } else if (v.startsWith('field#')) {
          return `明细字段: ${fieldOptions.find((option) => option.value === v)?.label || v}`;
        }
        return v;
      },
    },
    {
      title: '解析方式',
      dataIndex: 'parsing_type',
      width: '180px',
      inputType: 'select',
      options: structRuleFieldParsingTypeOptions,
      editable: true,
      filters: structRuleFieldParsingTypeOptions.map((o) => ({
        text: o.label,
        value: o.value,
      })),
      onFilter: (value: any, record: StructRule.Field) =>
        record.parsing_type === value,
      render: (v: StructRuleFieldParsingType) =>
        structRuleFieldParsingTypeOptions.find((option) => option.value === v)
          ?.label,
    },
    {
      title: '解析规则',
      dataIndex: 'parsing_rule',
      width: '360px',
      inputType: 'text',
      ellipsis: true,
      editable: true,
      enableSearch: true,
    },
    {
      title: '值类型',
      dataIndex: 'value_type',
      width: '120px',
      inputType: 'select',
      options: structRuleFieldValueTypeOptions,
      editable: true,
      filters: structRuleFieldValueTypeOptions.map((o) => ({
        text: o.label,
        value: o.value,
      })),
      onFilter: (value: any, record: StructRule.Field) =>
        record.value_type === value,
      render: (v: StructRuleFieldValueType) =>
        structRuleFieldValueTypeOptions.find((option) => option.value === v)
          ?.label,
    },
    {
      title: '是否数组',
      dataIndex: 'is_array',
      width: '120px',
      inputType: 'select',
      options: [
        { label: '是', value: true },
        { label: '否', value: false },
      ],
      editable: true,
      filters: [
        { text: '是', value: true },
        { text: '否', value: false },
      ],
      onFilter: (value: any, record: StructRule.Field) =>
        record.is_array === value,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '字段映射',
      dataIndex: 'mapping_type',
      width: '120px',
      inputType: 'select',
      options: structRuleFieldMappingTypeOptions,
      editable: true,
      filters: structRuleFieldMappingTypeOptions.map((o) => ({
        text: o.label,
        value: o.value,
      })),
      onFilter: (value: any, record: StructRule.Field) =>
        record.mapping_type === value,
      render: (v: StructRuleFieldMappingType) =>
        structRuleFieldMappingTypeOptions.find((option) => option.value === v)
          ?.label,
    },
    {
      title: '映射内容',
      dataIndex: 'mapping_content',
      width: '240px',
      ellipsis: true,
      inputType: 'select',
      editable: true,
      render: (v: string, record: StructRule.Field) => {
        if (record.mapping_type === StructRuleFieldMappingType.Encode) {
          return encodeOptions.find((option) => option.value === v)?.label || v;
        } else if (record.mapping_type === StructRuleFieldMappingType.Enum) {
          return v;
        } else {
          return '';
        }
      },
    },
    {
      title: '是否落库',
      dataIndex: 'need_store',
      width: '96px',
      inputType: 'select',
      options: [
        { label: '是', value: 1 },
        { label: '否', value: 0 },
      ],
      editable: true,
      render: (v: number) => (v === 1 ? '是' : '否'),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: '240px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Field) => {
        const editable = isEditing(record.uid);
        const idx = detail.fields.findIndex((item) => item.uid === record.uid);
        return editable ? (
          <Space>
            <Typography.Link
              onClick={() => save(record.uid)}
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
              onClick={() => move(record.uid, -1)}
            >
              上移
            </Typography.Link>
            <Typography.Link
              disabled={editingKey !== '' || idx === detail.fields.length - 1}
              onClick={() => move(record.uid, 1)}
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
                    max={detail.fields.length}
                    value={fastMoveTarget}
                    onChange={setFastMoveTarget}
                  />
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => fastMove(record.uid, fastMoveTarget)}
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
              onClick={() => remove(record.uid)}
            >
              删除
            </Typography.Link>
          </Space>
        );
      },
    },
  ];

  const columnsMerged: TableProps<StructRule.Field>['columns'] = columns.map(
    (col) => {
      if (!col.editable) return col;
      // 解析规则联动
      // if (col.dataIndex === 'parsing_rule') {
      //   return {
      //     ...col,
      //     onCell: (record) => {
      //       return {
      //         record,
      //         inputType:
      //           sourceType === StructRuleFieldParsingType.QuoteResult
      //             ? 'select'
      //             : 'text',
      //         ...(sourceType === StructRuleFieldParsingType.QuoteResult
      //           ? {
      //             options: resultFieldOptions.filter(
      //               (o) => o.value !== name_en,
      //             ),
      //           }
      //           : {}),
      //         dataIndex: col.dataIndex,
      //         title: col.title,
      //         editing: isEditing(record.uid),
      //       };
      //     },
      //   };
      // }

      // 映射类型联动
      if (col.dataIndex === 'mapping_content') {
        return {
          ...col,
          onCell: (record) => {
            return {
              record,
              inputType:
                mappingType === StructRuleFieldMappingType.Encode
                  ? 'select'
                  : mappingType === StructRuleFieldMappingType.Enum
                    ? 'text'
                    : 'none',
              ...(mappingType === StructRuleFieldMappingType.Encode
                ? { options: encodeOptions }
                : {}),
              dataIndex: col.dataIndex,
              title: col.title,
              editing: isEditing(record.uid),
            };
          },
        };
      }

      return {
        ...col,
        onCell: (record) => {
          return {
            record,
            inputType: col.inputType,
            options: col.options,
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditing(record.uid),
          };
        },
      };
    },
  );

  return (
    <Form form={form} component={false}>
      <EditableTable<StructRule.Field>
        dataSource={detail.fields}
        columns={columnsMerged}
        scroll={{ x: '2200px' }}
      />
    </Form>
  );
};

export default FieldTable;
