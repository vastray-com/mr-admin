import {
  Button,
  Form,
  type FormInstance,
  Popconfirm,
  Space,
  type TableProps,
  Typography,
} from 'antd';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleFieldMappingType,
  StructRuleFieldSourceType,
  StructRuleFieldValueType,
  structRuleFieldSourceTypeOptions,
  structRuleFieldValueTypeOptions,
} from '@/typing/enum';
import type { StructRule } from '@/typing/structRules';

const feFieldToField = (feField: StructRule.FEField): StructRule.Field => {
  const { encodeContent, enumContent, ...rest } = feField;
  if (encodeContent) {
    return {
      ...rest,
      mapping_type: StructRuleFieldMappingType.Encode,
      mapping_content: encodeContent,
    };
  } else if (enumContent) {
    return {
      ...rest,
      mapping_type: StructRuleFieldMappingType.Enum,
      mapping_content: enumContent,
    };
  } else {
    return {
      ...rest,
      mapping_type: StructRuleFieldMappingType.None,
      mapping_content: '',
    };
  }
};

const fieldToFEField = (field: StructRule.Field): StructRule.FEField => {
  const { mapping_type, mapping_content, ...rest } = field;
  if (mapping_type === StructRuleFieldMappingType.Encode) {
    return {
      ...rest,
      encodeContent: mapping_content,
      enumContent: '',
    };
  } else if (mapping_type === StructRuleFieldMappingType.Enum) {
    return {
      ...rest,
      encodeContent: '',
      enumContent: mapping_content,
    };
  } else {
    return {
      ...rest,
      encodeContent: '',
      enumContent: '',
    };
  }
};

type Props = {
  form: FormInstance;
  detail: StructRule.Detail;
  onChange: (data: StructRule.Fields) => void;
};
const FieldTable: FC<Props> = ({ form, detail, onChange }) => {
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (key: string) => key === editingKey;

  const enumContent = Form.useWatch('enumContent', form);
  const encodeContent = Form.useWatch('encodeContent', form);
  const needEmpty = useRef(false);
  // 当修改其中一个时，清空另一个
  useEffect(() => {
    if (editingKey && needEmpty.current && enumContent) {
      form.setFieldsValue({ encodeContent: '' });
    }
  }, [editingKey, enumContent, form]);
  useEffect(() => {
    if (editingKey && needEmpty.current && encodeContent) {
      form.setFieldsValue({ enumContent: '' });
    }
  }, [editingKey, encodeContent, form]);

  const edit = (record: Partial<StructRule.FEField>) => {
    form.setFieldsValue({
      category_name: '',
      name_cn: '',
      name_en: '',
      source_type: StructRuleFieldSourceType.LLM,
      parsing_rule: '',
      value_type: StructRuleFieldValueType.Text,
      need_store: 1,
      ...record,
    });
    needEmpty.current = true;
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
    needEmpty.current = false;
    setEditingKey('');
  };
  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as StructRule.FEField;
      const newData = [...detail.fields];
      const idx = newData.findIndex((item) => item.uid === key);
      if (idx > -1) {
        const item = newData[idx];
        newData.splice(idx, 1, {
          ...item,
          ...feFieldToField(row),
        });
        onChange(newData);
      }
      needEmpty.current = false;
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
      render: (_: any, record: StructRule.FEField) =>
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
      inputType: 'text',
      editable: true,
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
    // {
    //   title: '字段映射',
    //   dataIndex: 'mapping_type',
    //   width: '120px',
    //   inputType: 'select',
    //   options: structRuleFieldMappingTypeOptions,
    //   editable: true,
    //   render: (v: StructRuleFieldMappingType) =>
    //     structRuleFieldMappingTypeOptions.find((option) => option.value === v)
    //       ?.label,
    // },
    {
      title: '码表映射',
      dataIndex: 'encodeContent',
      width: '240px',
      ellipsis: true,
      inputType: 'select',
      options: encodeOptions,
      render: (v: string) =>
        encodeOptions.find((option) => option.value === v)?.label || v,
      editable: true,
    },
    {
      title: '枚举映射',
      dataIndex: 'enumContent',
      width: '240px',
      ellipsis: true,
      inputType: 'text',
      editable: true,
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
      render: (_: any, record: StructRule.FEField) => {
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

  const columnsMerged: TableProps<StructRule.FEField>['columns'] = columns.map(
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
            editing: isEditing(record.uid),
          };
        },
      };
    },
  );

  return (
    <Form form={form} component={false}>
      <EditableTable<StructRule.FEField>
        dataSource={detail.fields.map((f) => fieldToFEField(f))}
        columns={columnsMerged}
        scroll={{ x: '2200px' }}
      />
    </Form>
  );
};

export default FieldTable;
