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
import type { StructRule } from '@/typing/structRules';

type Props = {
  form: FormInstance;
  detail: StructRule.Detail;
  onChange: (data: StructRule.Categories) => void;
};
const CategoryTable: FC<Props> = ({ form, detail, onChange }) => {
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (key: string) => key === editingKey;
  const edit = (record: Partial<StructRule.Category>) => {
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
    if (idx === 0 && position === -1) return;
    if (idx === newData.length - 1 && position === 1) return;

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
      title: '序号',
      dataIndex: 'no',
      width: '80px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Category) =>
        detail.category.findIndex((c) => c.uid === record.uid) + 1,
    },
    {
      title: '提取字段',
      dataIndex: 'name_cn',
      ellipsis: true,
      inputType: 'text',
      width: '160px',
      editable: true,
    },
    {
      title: '字段名称',
      dataIndex: 'name_en',
      ellipsis: true,
      inputType: 'text',
      width: '320px',
      editable: true,
    },
    {
      title: '提取规则',
      dataIndex: 'content',
      ellipsis: true,
      inputType: 'text',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: '180px',
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      render: (_: any, record: StructRule.Category) => {
        const editable = isEditing(record.uid);
        const idx = detail.category.findIndex(
          (item) => item.uid === record.uid,
        );
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
              disabled={editingKey !== '' || idx === detail.category.length - 1}
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

  const columnsMerged: TableProps<StructRule.Category>['columns'] = columns.map(
    (col) => {
      if (!col.editable) return col;
      return {
        ...col,
        onCell: (record) => {
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
