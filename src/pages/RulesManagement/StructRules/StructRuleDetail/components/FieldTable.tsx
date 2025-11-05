import {
  Button,
  Form,
  type FormInstance,
  Popconfirm,
  Space,
  type TableProps,
  Typography,
} from 'antd';
import { type FC, useMemo, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleFieldMappingType,
  StructRuleFieldSourceType,
  StructRuleFieldValueType,
  structRuleFieldMappingTypeOptions,
  structRuleFieldSourceTypeOptions,
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
  const resultFieldOptions = useMemo(
    () =>
      detail.fields.map((f) => ({
        label: f.name_cn,
        value: f.name_en,
      })),
    [detail.fields],
  );

  const name_en = Form.useWatch('name_en', form);
  const sourceType = Form.useWatch('source_type', form);
  const mappingType = Form.useWatch('mapping_type', form);

  const edit = (record: Partial<StructRule.Field>) => {
    form.setFieldsValue({
      category_name: '',
      name_cn: '',
      name_en: '',
      source_type: StructRuleFieldSourceType.LLM,
      parsing_rule: '',
      value_type: StructRuleFieldValueType.Text,
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
          value: item.name_en,
        })),
    [detail.category],
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
    },
    {
      title: '字段名称',
      dataIndex: 'name_en',
      width: '200px',
      ellipsis: true,
      inputType: 'text',
      editable: true,
    },
    {
      title: '大字段',
      dataIndex: 'category_name',
      width: '220px',
      ellipsis: true,
      inputType: 'select',
      options: categoryOptions,
      editable: true,
      render: (v: string) =>
        categoryOptions.find((option) => option.value === v)?.label,
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      width: '180px',
      inputType: 'select',
      options: structRuleFieldSourceTypeOptions,
      editable: true,
      render: (v: StructRuleFieldSourceType) =>
        structRuleFieldSourceTypeOptions.find((option) => option.value === v)
          ?.label,
    },
    {
      title: '解析规则',
      dataIndex: 'parsing_rule',
      width: '360px',
      ellipsis: true,
      editable: true,
      render: (v: string, record: StructRule.Field) => {
        if (record.source_type === StructRuleFieldSourceType.QuoteResult) {
          return (
            resultFieldOptions.find((option) => option.value === v)?.label || v
          );
        } else {
          return v;
        }
      },
    },
    {
      title: '值类型',
      dataIndex: 'value_type',
      width: '120px',
      inputType: 'select',
      options: structRuleFieldValueTypeOptions,
      editable: true,
      render: (v: StructRuleFieldValueType) =>
        structRuleFieldValueTypeOptions.find((option) => option.value === v)
          ?.label,
    },
    {
      title: '字段映射',
      dataIndex: 'mapping_type',
      width: '120px',
      inputType: 'select',
      options: structRuleFieldMappingTypeOptions,
      editable: true,
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
      width: '180px',
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
      if (col.dataIndex === 'parsing_rule') {
        return {
          ...col,
          onCell: (record) => {
            return {
              record,
              inputType:
                sourceType === StructRuleFieldSourceType.QuoteResult
                  ? 'select'
                  : 'text',
              ...(sourceType === StructRuleFieldSourceType.QuoteResult
                ? {
                    options: resultFieldOptions.filter(
                      (o) => o.value !== name_en,
                    ),
                  }
                : {}),
              dataIndex: col.dataIndex,
              title: col.title,
              editing: isEditing(record.uid),
            };
          },
        };
      }

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
