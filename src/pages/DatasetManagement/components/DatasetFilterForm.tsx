import {
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { type FC, useCallback, useMemo } from 'react';
import { useCacheStore } from '@/store/useCacheStore';
import { ENUM_VARS } from '@/typing/enum';
import {
  DatasetSourceColumnType,
  type DatasetSourceType,
} from '@/typing/enum/dataset';

type Props = {
  name: string;
  form: FormInstance;
  sourceType?: DatasetSourceType;
  onlyPreview?: boolean;
  label?: string | null;
};

export const DatasetFilterForm: FC<Props> = ({
  name,
  sourceType,
  form,
  onlyPreview = false,
  label = '数据过滤器',
}) => {
  const sourceSchema = useCacheStore((s) => s.sourceSchemaList);

  const sourceTableOpt = useMemo(() => {
    if (!sourceType) return [];
    const source = sourceSchema.filter((s) => s.type === sourceType);
    if (!source) return [];
    return source;
  }, [sourceSchema, sourceType]);
  const getTableColumns = useCallback(
    (tableName: string) => {
      const table = sourceTableOpt.find((t) => t.value === tableName);
      return table ? table.columns : [];
    },
    [sourceTableOpt],
  );
  const getDataType = useCallback(
    (tableName: string, columnName: string) => {
      const columns = getTableColumns(tableName);
      const column = columns.find((c) => c.value === columnName);
      return column ? column.data_type : null;
    },
    [getTableColumns],
  );

  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(logicFields, { add: addLogic, remove: removeLogic }) => (
          <>
            {logicFields.map(({ key, name: logicName, ...restField }) => (
              <Card
                key={key}
                className="mb-[12px]"
                styles={{ body: { paddingBottom: 0 } }}
              >
                <Flex gap={16}>
                  <Form.Item
                    {...restField}
                    name={[logicName, 'logic']}
                    label="逻辑关系"
                    className="flex-1"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: '请选择逻辑关系',
                      },
                    ]}
                  >
                    <Select
                      placeholder="请选择逻辑关系"
                      options={ENUM_VARS.DATASET.FILTER_LOGIC_OPT}
                    />
                  </Form.Item>

                  {!onlyPreview && (
                    <Button
                      danger
                      onClick={() => removeLogic(logicName)}
                      icon={<i className="i-line-md:trash text-[20px]" />}
                    >
                      删除过滤器
                    </Button>
                  )}
                </Flex>

                <Form.Item shouldUpdate>
                  {() => (
                    <Form.List name={[logicName, 'group']}>
                      {(
                        groupFields,
                        { add: addGroup, remove: removeGroup },
                      ) => (
                        <>
                          {groupFields.map(
                            ({ key, name: groupName, ...restField }) => (
                              <Card
                                key={key}
                                className="mb-[12px]"
                                styles={{ body: { paddingBottom: 0 } }}
                              >
                                <Flex gap={16}>
                                  <Form.Item
                                    {...restField}
                                    name={[groupName, 'table']}
                                    className="flex-1"
                                    label="条件组数据表"
                                    rules={[
                                      {
                                        required: true,
                                        whitespace: true,
                                        message: '请选择数据表',
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="请选择表"
                                      options={sourceTableOpt}
                                      onChange={() => {
                                        const copied = form.getFieldValue([
                                          name,
                                        ]);
                                        copied[logicName].group[
                                          groupName
                                        ].conditions = [];
                                        form.setFieldsValue({
                                          [name]: copied,
                                        });
                                      }}
                                    />
                                  </Form.Item>

                                  {!onlyPreview && (
                                    <Button
                                      danger
                                      onClick={() => removeGroup(groupName)}
                                      icon={
                                        <i className="i-line-md:trash text-[20px]" />
                                      }
                                    >
                                      删除条件组
                                    </Button>
                                  )}
                                </Flex>

                                <Form.Item shouldUpdate>
                                  {() => (
                                    <Form.List name={[groupName, 'conditions']}>
                                      {(
                                        conditionFields,
                                        {
                                          add: addCondition,
                                          remove: removeCondition,
                                        },
                                      ) => (
                                        <>
                                          {conditionFields.map(
                                            ({
                                              key,
                                              name: conditionName,
                                              ...restField
                                            }) => (
                                              <Flex
                                                key={key}
                                                className="w-full"
                                                gap={8}
                                              >
                                                <Form.Item
                                                  {...restField}
                                                  name={[
                                                    conditionName,
                                                    'column',
                                                  ]}
                                                  className="basis-[188px]"
                                                  rules={[
                                                    {
                                                      required: true,
                                                      whitespace: true,
                                                      message: '请选择过滤字段',
                                                    },
                                                  ]}
                                                >
                                                  <Select
                                                    placeholder="选择过滤字段"
                                                    options={getTableColumns(
                                                      form.getFieldValue([
                                                        name,
                                                        logicName,
                                                        'group',
                                                        groupName,
                                                        'table',
                                                      ]),
                                                    )}
                                                  />
                                                </Form.Item>

                                                <Form.Item
                                                  {...restField}
                                                  name={[
                                                    conditionName,
                                                    'operator',
                                                  ]}
                                                  className="basis-[100px]"
                                                  rules={[
                                                    {
                                                      required: true,
                                                      whitespace: true,
                                                      message: '请选择操作符',
                                                    },
                                                  ]}
                                                >
                                                  <Select
                                                    options={
                                                      ENUM_VARS.DATASET
                                                        .FILTER_OPERATOR_OPT
                                                    }
                                                    placeholder="选择操作符"
                                                  />
                                                </Form.Item>

                                                <Form.Item shouldUpdate noStyle>
                                                  {() => {
                                                    const curFilter =
                                                      form.getFieldValue(name);
                                                    const tableName: string =
                                                      curFilter[logicName]
                                                        .group[groupName].table;
                                                    const columnName: string =
                                                      curFilter[logicName]
                                                        .group[groupName]
                                                        .conditions[
                                                        conditionName
                                                      ].column;
                                                    const dataType =
                                                      getDataType(
                                                        tableName,
                                                        columnName,
                                                      );

                                                    switch (dataType) {
                                                      case DatasetSourceColumnType.String:
                                                        return (
                                                          <Form.Item
                                                            {...restField}
                                                            name={[
                                                              conditionName,
                                                              'value',
                                                            ]}
                                                            className="flex-1"
                                                            rules={[
                                                              {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                  '请输入过滤值',
                                                              },
                                                            ]}
                                                          >
                                                            <Input placeholder="输入值" />
                                                          </Form.Item>
                                                        );
                                                      case DatasetSourceColumnType.Bool:
                                                        return (
                                                          <Form.Item
                                                            {...restField}
                                                            name={[
                                                              conditionName,
                                                              'value',
                                                            ]}
                                                            className="flex-1"
                                                            rules={[
                                                              {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                  '请选择过滤值',
                                                              },
                                                            ]}
                                                          >
                                                            <Select
                                                              options={[
                                                                {
                                                                  label: '是',
                                                                  value: 'true',
                                                                },
                                                                {
                                                                  label: '否',
                                                                  value:
                                                                    'false',
                                                                },
                                                              ]}
                                                              placeholder="选择值"
                                                            />
                                                          </Form.Item>
                                                        );
                                                      case DatasetSourceColumnType.Int:
                                                        return (
                                                          <Form.Item
                                                            {...restField}
                                                            name={[
                                                              conditionName,
                                                              'value',
                                                            ]}
                                                            className="flex-1"
                                                            rules={[
                                                              {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                  '请输入过滤值',
                                                              },
                                                            ]}
                                                          >
                                                            <InputNumber
                                                              placeholder="输入值"
                                                              precision={0}
                                                            />
                                                          </Form.Item>
                                                        );
                                                      case DatasetSourceColumnType.Float:
                                                        return (
                                                          <Form.Item
                                                            {...restField}
                                                            name={[
                                                              conditionName,
                                                              'value',
                                                            ]}
                                                            className="flex-1"
                                                            rules={[
                                                              {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                  '请输入过滤值',
                                                              },
                                                            ]}
                                                          >
                                                            <InputNumber placeholder="输入值" />
                                                          </Form.Item>
                                                        );
                                                      case DatasetSourceColumnType.Date:
                                                        return (
                                                          <Form.Item
                                                            {...restField}
                                                            name={[
                                                              conditionName,
                                                              'value',
                                                            ]}
                                                            getValueProps={(
                                                              v,
                                                            ) => ({
                                                              value:
                                                                v && dayjs(v),
                                                            })}
                                                            normalize={(
                                                              v: Dayjs,
                                                            ) =>
                                                              v?.toISOString()
                                                            }
                                                            className="flex-1"
                                                            rules={[
                                                              {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                  '请选择时间',
                                                              },
                                                            ]}
                                                          >
                                                            <DatePicker
                                                              showTime
                                                              placeholder="选择时间"
                                                              needConfirm={
                                                                false
                                                              }
                                                              disabledDate={(
                                                                cur,
                                                              ) => {
                                                                return (
                                                                  cur &&
                                                                  (cur >
                                                                    dayjs().endOf(
                                                                      'day',
                                                                    ) ||
                                                                    cur <
                                                                      dayjs(
                                                                        '1970-01-01',
                                                                      ))
                                                                );
                                                              }}
                                                            />
                                                          </Form.Item>
                                                        );
                                                    }
                                                  }}
                                                </Form.Item>

                                                {!onlyPreview && (
                                                  <Button
                                                    danger
                                                    type="link"
                                                    onClick={() =>
                                                      removeCondition(
                                                        conditionName,
                                                      )
                                                    }
                                                    className="basis-[32px]"
                                                    icon={
                                                      <i className="i-line-md:trash text-[20px]" />
                                                    }
                                                  />
                                                )}
                                              </Flex>
                                            ),
                                          )}

                                          {!onlyPreview && (
                                            <Button
                                              block
                                              type="dashed"
                                              onClick={addCondition}
                                              icon={
                                                <i className="i-line-md:plus-circle text-[20px]" />
                                              }
                                            >
                                              添加条件
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </Form.List>
                                  )}
                                </Form.Item>
                              </Card>
                            ),
                          )}

                          {!onlyPreview && (
                            <Button
                              block
                              type="dashed"
                              onClick={addGroup}
                              icon={
                                <i className="i-line-md:plus-circle text-[20px]" />
                              }
                            >
                              添加条件组
                            </Button>
                          )}
                        </>
                      )}
                    </Form.List>
                  )}
                </Form.Item>
              </Card>
            ))}

            {!onlyPreview && (
              <Button
                block
                type="dashed"
                onClick={addLogic}
                icon={
                  <i className="i-line-md:plus-circle text-[20px] fg-secondary" />
                }
              >
                添加过滤器
              </Button>
            )}
          </>
        )}
      </Form.List>
    </Form.Item>
  );
};
