import {
  Button,
  Form,
  Input,
  InputNumber,
  type InputRef,
  Select,
  type SelectProps,
  Space,
  Table,
  type TableColumnType,
  Tooltip,
} from 'antd';
import {
  type HTMLAttributes,
  type PropsWithChildren,
  useRef,
  useState,
} from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { FilterDropdownProps } from 'antd/es/table/interface';

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
        return (
          <Select
            showSearch
            allowClear
            placeholder="请选择"
            options={options}
            filterOption={(input, option) =>
              ((option?.label ?? '') as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        );
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
  columns: Record<string, any>[];
  onCancel?: () => void;
  scroll?: {
    x?: number | true | string;
    y?: number | string;
  };
};

const EditableTable = <T,>(props: Props<T>) => {
  const [_, setSearchText] = useState('');
  const [__, setSearchedColumn] = useState<string>('');
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: string,
  ) => {
    confirm({ closeDropdown: false });
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (
    dataIndex: string,
    title: string,
  ): TableColumnType<T> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${title}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<i className="i-icon-park-outline:search" />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <i
        className="i-icon-park-outline:search"
        style={{ color: filtered ? '#1677ff' : undefined }}
      />
    ),
    onFilter: (value, record) => {
      const data = record[dataIndex as keyof T];
      if (data === undefined || data === null) {
        return false;
      }
      return data
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase());
    },
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    // render: (text) =>
    //   searchedColumn === dataIndex ? (
    //     <Highlighter
    //       highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
    //       searchWords={[searchText]}
    //       autoEscape
    //       textToHighlight={text ? text.toString() : ''}
    //     />
    //   ) : (
    //     text
    //   ),
  });

  return (
    <Table<T>
      components={{ body: { cell: EditableCell<T> } }}
      bordered
      dataSource={props.dataSource}
      columns={
        props.columns.map((c) => {
          if (c.enableSearch) {
            return { ...c, ...getColumnSearchProps(c.dataIndex, c.title) };
          } else {
            return c;
          }
        }) as ColumnsType<T>
      }
      rowClassName="editable-row"
      pagination={{ onChange: () => props.onCancel?.() }}
      rowKey="uid"
      scroll={props.scroll}
    />
  );
};

export default EditableTable;
