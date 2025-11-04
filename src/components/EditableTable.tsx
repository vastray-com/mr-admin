import {
  Form,
  type FormRule,
  Input,
  InputNumber,
  Select,
  type SelectProps,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { HTMLAttributes, PropsWithChildren } from 'react';

interface EditableCellProps<T> extends HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'none' | 'number' | 'text' | 'select';
  options?: SelectProps['options'];
  rules?: FormRule[];
  record: T;
  index: number;
}

const EditableCell = <T,>({
  editing,
  dataIndex,
  title,
  inputType,
  options = [],
  record,
  rules = [],
  index,
  children,
  ...restProps
}: PropsWithChildren<EditableCellProps<T>>) => {
  const inputNode = () => {
    switch (inputType) {
      case 'none':
        return null;
      case 'number':
        return <InputNumber />;
      case 'text':
        return <Input />;
      case 'select':
        return <Select allowClear placeholder="请选择" options={options} />;
    }
  };

  console.log('editing', editing);
  console.log('inputNode', inputNode());
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }} rules={rules}>
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

type Props<T> = {
  dataSource: T[];
  columns: ColumnsType<T>;
  onCancel?: () => void;
};

const EditableTable = <T,>(props: Props<T>) => {
  return (
    <Table<T>
      components={{ body: { cell: EditableCell<T> } }}
      bordered
      dataSource={props.dataSource}
      columns={props.columns}
      rowClassName="editable-row"
      pagination={{ onChange: () => props.onCancel?.() }}
      rowKey="uid"
    />
  );
};

export default EditableTable;
