import {
  Form,
  Input,
  InputNumber,
  Select,
  type SelectProps,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { HTMLAttributes, PropsWithChildren } from 'react';

interface EditableCellProps<T> extends HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: 'none' | 'number' | 'text' | 'select';
  options?: SelectProps['options'];
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

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item name={dataIndex} style={{ margin: 0 }}>
          {inputNode()}
        </Form.Item>
      ) : (
        <Tooltip
          placement="topLeft"
          title={(record?.[dataIndex as keyof T] as string) ?? ''}
        >
          {children}
        </Tooltip>
      )}
    </td>
  );
};

type Props<T> = {
  dataSource: T[];
  columns: ColumnsType<T>;
  onCancel?: () => void;
  scroll?: {
    x?: number | true | string;
    y?: number | string;
  };
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
      scroll={props.scroll}
    />
  );
};

export default EditableTable;
