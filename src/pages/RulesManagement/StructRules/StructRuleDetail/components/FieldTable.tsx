import {
  Button,
  Form,
  type FormInstance,
  Popconfirm,
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
  const [editingIdx, setEditingIdx] = useState<null | number>(null);
  const isEditing = (idx: number) => idx === editingIdx;
  const edit = (idx: number, record: Partial<StructRule.Field>) => {
    form.setFieldsValue({
      category_name: '',
      name_cn: '',
      name_en: '',
      source_type: StructRuleFieldSourceType.LLM,
      parsing_rule: '',
      value_type: StructRuleFieldValueType.Text,
      mapping_type: null,
      mapping_content: '',
      need_store: 1,
      ...record,
    });
    setEditingIdx(idx);
  };
  const move = (idx: number, position: -1 | 1) => {
    const newData = [...detail.fields];
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(idx + position, 0, item);
    onChange(newData);
  };
  const remove = (idx: number) => {
    const newData = [...detail.fields];
    newData.splice(idx, 1);
    onChange(newData);
  };
  const cancel = () => setEditingIdx(null);
  const save = async (idx: number) => {
    try {
      const row = (await form.validateFields()) as StructRule.Field;
      const newData = [...detail.fields];
      if (idx > -1) {
        const item = newData[idx];
        newData.splice(idx, 1, {
          ...item,
          ...row,
        });
        onChange(newData);
      }
      setEditingIdx(null);
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
      title: '数据项',
      dataIndex: 'name_cn',
      inputType: 'text',
      width: '15%',
      editable: true,
    },
    {
      title: '字段名称',
      dataIndex: 'name_en',
      inputType: 'text',
      width: '15%',
      editable: true,
    },
    {
      title: '大字段',
      dataIndex: 'category_name',
      inputType: 'select',
      options: categoryOptions,
      width: '40%',
      editable: true,
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      inputType: 'select',
      options: structRuleFieldSourceTypeOptions,
      width: '40%',
      editable: true,
    },
    {
      title: '解析规则',
      dataIndex: 'parsing_rule',
      inputType: 'text',
      width: '40%',
      editable: true,
    },
    {
      title: '值类型',
      dataIndex: 'value_type',
      inputType: 'select',
      options: structRuleFieldValueTypeOptions,
      width: '40%',
      editable: true,
    },
    {
      title: '字段映射',
      dataIndex: 'mapping_type',
      inputType: 'select',
      options: structRuleFieldMappingTypeOptions,
      width: '40%',
      editable: true,
    },
    {
      title: '映射内容',
      dataIndex: 'mapping_content',
      inputType: (record: StructRule.Field) => {
        switch (record.mapping_type) {
          case StructRuleFieldMappingType.None:
            return 'none';
          case StructRuleFieldMappingType.Enum:
            return 'text';
          case StructRuleFieldMappingType.Encode:
            return 'select';
        }
      },
      options: (record: StructRule.Field) => {
        switch (record.mapping_type) {
          case StructRuleFieldMappingType.None:
          case StructRuleFieldMappingType.Enum:
            return [];
          case StructRuleFieldMappingType.Encode:
            return encodeOptions;
        }
      },
      width: '40%',
      editable: true,
    },
    {
      title: '是否落库',
      dataIndex: 'need_store',
      inputType: 'select',
      options: [
        { label: '是', value: 1 },
        { label: '否', value: 0 },
      ],
      width: '40%',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Field, idx: number) => {
        const editable = isEditing(idx);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(idx)}
              style={{ marginInlineEnd: 8 }}
            >
              保存
            </Typography.Link>
            <Popconfirm title="确定取消编辑?" onConfirm={cancel}>
              <Button type="link">取消</Button>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link
              disabled={editingIdx !== null}
              onClick={() => edit(idx, record)}
            >
              编辑
            </Typography.Link>
            <Typography.Link
              disabled={idx === 0 || editingIdx !== null}
              onClick={() => move(idx, -1)}
            >
              上移
            </Typography.Link>
            <Typography.Link
              disabled={idx === detail.fields.length - 1 || editingIdx !== null}
              onClick={() => move(idx, 1)}
            >
              下移
            </Typography.Link>
            <Typography.Link
              type="danger"
              disabled={editingIdx !== null}
              onClick={() => remove(idx)}
            >
              删除
            </Typography.Link>
          </span>
        );
      },
    },
  ];

  const columnsMerged: TableProps<StructRule.Field>['columns'] = columns.map(
    (col) => {
      if (!col.editable) return col;
      return {
        ...col,
        onCell: (record) => ({
          record,
          inputType:
            typeof col.inputType === 'function'
              ? col.inputType(record)
              : col.inputType,
          options:
            typeof col.options === 'function'
              ? col.options(record)
              : col.options,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: false,
        }),
      };
    },
  );

  return (
    <Form form={form} component={false}>
      <EditableTable<StructRule.Field>
        dataSource={detail.fields}
        columns={columnsMerged}
      />
    </Form>
  );
};

export default FieldTable;
