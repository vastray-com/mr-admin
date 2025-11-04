import {
  Button,
  Form,
  type FormInstance,
  Popconfirm,
  type TableProps,
  Typography,
} from 'antd';
import { type FC, useState } from 'react';
import EditableTable from '@/components/EditableTable';
import type { StructRule } from '@/typing/structRules';

type Props = {
  form: FormInstance;
  detail: StructRule.Detail;
  onChange: (data: StructRule.Categories) => void;
};
const CategoryTable: FC<Props> = ({ form, detail, onChange }) => {
  const [editingKey, setEditingKey] = useState<string>('');
  // console.log('editingKey', editingKey);
  const isEditing = (key: string) => {
    console.log('comparing idx', key, editingKey, key === editingKey);
    return key === editingKey;
  };
  const edit = (record: Partial<StructRule.Category>) => {
    // console.log('edit key', record.uid);
    // console.log('record', record);
    form.setFieldsValue({
      name_cn: '',
      name_en: '',
      comment: '',
      ...record,
    });
    setEditingKey(record.uid || '');
  };
  const move = (key: string, position: -1 | 1) => {
    const newData = [...detail.category];
    const idx = newData.findIndex((item) => item.uid === key);
    const item = newData[idx];
    newData.splice(idx, 1);
    newData.splice(idx + position, 0, item);
    onChange(newData);
  };
  const remove = (key: string) => {
    const newData = [...detail.category];
    const idx = newData.findIndex((item) => item.uid === key);
    newData.splice(idx, 1);
    onChange(newData);
  };
  const cancel = () => setEditingKey('');
  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as StructRule.Category;
      const newData = [...detail.category];
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

  const columns = [
    {
      title: '提取字段',
      dataIndex: 'name_cn',
      inputType: 'text',
      rules: [
        {
          required: true,
          message: '请输入提取字段名称',
        },
        {
          whitespace: true,
          message: '请输入提取字段名称',
        },
      ],
      width: '20%',
      editable: true,
    },
    {
      title: '字段名称',
      dataIndex: 'name_en',
      inputType: 'text',
      rules: [
        {
          required: true,
          message: '请输入字段名称',
        },
        {
          whitespace: true,
          message: '请输入字段名称',
        },
      ],
      width: '20%',
      editable: true,
    },
    {
      title: '提取规则',
      dataIndex: 'content',
      inputType: 'text',
      rules: [
        {
          required: true,
          message: '请输入提取规则',
        },
        {
          whitespace: true,
          message: '请输入提取规则',
        },
      ],
      width: '52%',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Category, idx: number) => {
        const editable = isEditing(record.uid);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.uid)}
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
              disabled={editingKey !== ''}
              onClick={() => edit(record)}
            >
              编辑
            </Typography.Link>
            <Typography.Link
              disabled={idx === 0 || editingKey !== ''}
              onClick={() => move(record.uid, -1)}
            >
              上移
            </Typography.Link>
            <Typography.Link
              disabled={idx === detail.category.length - 1 || editingKey !== ''}
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
          </span>
        );
      },
    },
  ];

  const columnsMerged: TableProps<StructRule.Category>['columns'] = columns.map(
    (col) => {
      if (!col.editable) return col;
      return {
        ...col,
        onCell: (record) => {
          // console.log('isEditing', record.uid, isEditing(record.uid), col);

          return {
            record,
            inputType: col.inputType,
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
      <EditableTable<StructRule.Category>
        dataSource={detail.category}
        columns={columnsMerged}
        onCancel={cancel}
      />
    </Form>
  );
};

export default CategoryTable;
