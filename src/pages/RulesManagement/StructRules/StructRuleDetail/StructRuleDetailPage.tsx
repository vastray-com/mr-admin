import { Button, Card, Form, Input, InputNumber, Select } from 'antd';
import { type FC, useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import {
  StructRuleFieldValueTypeOptions,
  StructRuleStatus,
  structRuleFieldTypeOptions,
} from '@/typing/enum';
import type { StructRule } from '@/typing/structRules';

const initialDetail: StructRule.Detail = {
  id: -1,
  name_cn: '',
  name_en: '',
  comment: '',
  status: StructRuleStatus.Enabled,
  create_time: '',
  update_time: '',
  category: [],
  fields: [],
  code_snippets: [],
};

const StructRuleDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { ruleApi } = useApi();
  const isNewRule = useRef(id === 'NEW');
  const isInit = useRef(isNewRule.current);

  const [detail, setDetail] = useState<StructRule.Detail>(initialDetail);
  const fetchDetail = useCallback(
    async (id: string) => {
      const res = await ruleApi.getRuleDetail({ id: Number(id) });
      console.log('拉取病历模板详情成功:', res);
      setDetail(res.data);
      isInit.current = true;
    },
    [ruleApi],
  );

  const [form] = Form.useForm<StructRule.Detail>();

  // 保存
  const onFinish = useCallback(async (values: StructRule.Detail) => {
    console.log('保存病历模板:', values);
  }, []);
  if (!isInit.current && !isNewRule.current && id) {
    fetchDetail(id);
  }

  if (!id || !isInit.current) return null;
  return (
    <Form<StructRule.Detail>
      name="struct-rules-save"
      onFinish={onFinish}
      initialValues={detail}
      autoComplete="off"
      className="w-full h-full"
      form={form}
    >
      <ContentLayout
        breadcrumb={[
          {
            title: <Link to="/rules_management/struct_rules">病历模版</Link>,
          },
          { title: '编辑模版' },
        ]}
        title={isNewRule.current ? '新建病历模板' : '编辑病历模板'}
        action={
          <Button htmlType="submit" type="primary">
            保存
          </Button>
        }
      >
        <div className="flex h-full">
          <div className="flex-1">
            <Card className="h-[220px]" title="基本信息">
              <div className="flex items-center gap-x-[24px] mb-[8px]">
                <Form.Item<StructRule.Detail> name="id" hidden>
                  <Input />
                </Form.Item>

                <Form.Item<StructRule.Detail>
                  label="规则名称"
                  name="name_cn"
                  className="w-[36%]"
                  rules={[
                    { required: true, message: '请输入规则名称' },
                    { whitespace: true, message: '规则名称不能为空' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item<StructRule.Detail>
                  label="英文名称"
                  name="name_en"
                  className="w-[36%]"
                  rules={[
                    { required: true, message: '请输入英文名称' },
                    { whitespace: true, message: '英文名称不能为空' },
                  ]}
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="flex items-center gap-x-[24px]">
                <Form.Item<StructRule.Detail>
                  label="模版备注"
                  name="comment"
                  className="w-[38%]"
                >
                  <Input />
                </Form.Item>
              </div>
            </Card>

            <Card title="大字段" className="mt-[12px]">
              <Form.List name="category">
                {(fields, { add, remove, move }) => (
                  <div className="h-full w-full rounded-2xl overflow-auto pos-relative">
                    <table className="w-full">
                      <thead className="sticky top-0 z-1">
                        <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                          <td>提取字段</td>
                          <td>字段名称</td>
                          <td>提取规则</td>
                          <td>操作</td>
                        </tr>
                      </thead>

                      <tbody>
                        {fields.map(({ key, name, ...restField }) => (
                          <tr
                            key={key}
                            className="b-b-1 b-divider children:(pt-[24px] px-[16px])"
                          >
                            <td>
                              <Form.Item<StructRule.Detail['category']>
                                {...restField}
                                name={[name, 'name_cn']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请输入提取字段名称',
                                  },
                                  {
                                    whitespace: true,
                                    message: '请输入提取字段名称',
                                  },
                                ]}
                              >
                                <Input placeholder="请输入提取字段名称" />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['category']>
                                {...restField}
                                name={[name, 'name_en']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请输入字段名称',
                                  },
                                  {
                                    whitespace: true,
                                    message: '请输入字段名称',
                                  },
                                ]}
                              >
                                <Input placeholder="请输入字段名称" />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['category']>
                                {...restField}
                                name={[name, 'content']}
                                rules={[
                                  { required: true, message: '请输入提取规则' },
                                  {
                                    whitespace: true,
                                    message: '请输入提取规则',
                                  },
                                ]}
                              >
                                <Input placeholder="请输入提取规则" />
                              </Form.Item>
                            </td>

                            <td className="pt-0 w-[180px]">
                              <Button
                                size="small"
                                type="link"
                                onClick={() => move(name, name - 1)}
                                disabled={name === 0}
                              >
                                上移
                              </Button>
                              <Button
                                size="small"
                                type="link"
                                onClick={() => move(name, name + 1)}
                                disabled={name === fields.length - 1}
                              >
                                下移
                              </Button>
                              <Button
                                size="small"
                                type="link"
                                danger
                                onClick={() => remove(name)}
                              >
                                删除
                              </Button>
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td colSpan={99} className="py-[12px]">
                            <Button
                              type="dashed"
                              size="large"
                              onClick={() => add()}
                              block
                            >
                              <i className="i-icon-park-outline:plus text-[16px]" />
                              <span>新增一行</span>
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Form.List>
            </Card>

            <Card title="明细字段" className="mt-[12px]">
              <Form.List name="fields">
                {(fields, { add, remove, move }) => (
                  <div className="h-full w-full rounded-2xl overflow-auto pos-relative">
                    <table className="w-full">
                      <thead className="sticky top-0 z-1">
                        <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                          <td>数据项</td>
                          <td>定义</td>
                          <td>字段名称</td>
                          <td>类型</td>
                          <td>长度</td>
                          <td>值描述类型</td>
                          <td>字段值描述</td>
                          <td>操作</td>
                        </tr>
                      </thead>

                      <tbody>
                        {fields.map(({ key, name, ...restField }) => (
                          <tr
                            key={key}
                            className="b-b-1 b-divider children:(pt-[24px] px-[16px])"
                          >
                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                {...restField}
                                name={[name, 'name_cn']}
                                rules={[
                                  { required: true, message: '请输入名称' },
                                  { whitespace: true, message: '请输入名称' },
                                ]}
                              >
                                <Input placeholder="请输入数据项名称" />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item
                                {...restField}
                                name={[name, 'data_define']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请输入数据项定义',
                                  },
                                  {
                                    whitespace: true,
                                    message: '请输入数据项定义',
                                  },
                                ]}
                              >
                                <Input placeholder="请输入数据项定义" />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item
                                {...restField}
                                name={[name, 'field_name']}
                                rules={[
                                  { required: true, message: '请输入字段名称' },
                                  {
                                    whitespace: true,
                                    message: '请输入字段名称',
                                  },
                                ]}
                              >
                                <Input placeholder="请输入字段名称" />
                              </Form.Item>
                            </td>

                            <td className="w-[120px]">
                              <Form.Item
                                {...restField}
                                name={[name, 'field_type']}
                                rules={[
                                  { required: true, message: '请选择字段类型' },
                                  {
                                    type: 'enum',
                                    enum: structRuleFieldTypeOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的字段类型',
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="请选择字段类型"
                                  options={structRuleFieldTypeOptions}
                                />
                              </Form.Item>
                            </td>

                            <td className="w-[120px]">
                              <Form.Item
                                {...restField}
                                name={[name, 'field_len']}
                                rules={[
                                  { required: true, message: '请输入长度' },
                                ]}
                              >
                                <InputNumber
                                  placeholder="请输入长度"
                                  precision={0}
                                />
                              </Form.Item>
                            </td>

                            <td className="w-[120px]">
                              <Form.Item
                                {...restField}
                                name={[name, 'value_type']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请选择值描述类型',
                                  },
                                  {
                                    type: 'enum',
                                    enum: StructRuleFieldValueTypeOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的值描述类型',
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="请选择值描述类型"
                                  options={StructRuleFieldValueTypeOptions}
                                />
                              </Form.Item>
                            </td>

                            <td className="w-[160px]">
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, curr) =>
                                  prev.fields?.[name]?.value_type !==
                                  curr.fields?.[name]?.value_type
                                }
                              >
                                {() =>
                                  form.getFieldValue([
                                    'fields',
                                    name,
                                    'value_type',
                                  ]) === 3 ? (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'value_desc']}
                                      rules={[
                                        {
                                          type: 'enum',
                                          enum: [123, 456],
                                          message: '请选择正确的码表',
                                        },
                                      ]}
                                    >
                                      <Select
                                        placeholder="请选择码表"
                                        options={[
                                          { value: 123, label: 'ICD-10' },
                                          { value: 456, label: 'ICD-20' },
                                        ]}
                                      />
                                    </Form.Item>
                                  ) : (
                                    <Form.Item
                                      {...restField}
                                      name={[name, 'value_desc']}
                                      rules={[
                                        {
                                          required: true,
                                          message: '请输入值描述',
                                        },
                                        {
                                          whitespace: true,
                                          message: '请输入值描述',
                                        },
                                      ]}
                                    >
                                      <Input placeholder="请输入" />
                                    </Form.Item>
                                  )
                                }
                              </Form.Item>
                            </td>

                            <td className="pt-0 w-[180px]">
                              <Button
                                size="small"
                                type="link"
                                onClick={() => move(name, name - 1)}
                                disabled={name === 0}
                              >
                                上移
                              </Button>
                              <Button
                                size="small"
                                type="link"
                                onClick={() => move(name, name + 1)}
                                disabled={name === fields.length - 1}
                              >
                                下移
                              </Button>
                              <Button
                                size="small"
                                type="link"
                                danger
                                onClick={() => remove(name)}
                              >
                                删除
                              </Button>
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td colSpan={99} className="py-[12px]">
                            <Button
                              type="dashed"
                              size="large"
                              onClick={() => add()}
                              block
                            >
                              <i className="i-icon-park-outline:plus text-[16px]" />
                              <span>新增一行</span>
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Form.List>
            </Card>

            <Card title="代码片段" className="mt-[12px]">
              <Form.Item<StructRule.Detail>
                name={['code_snippets', 0, 'content']}
              >
                <Input.TextArea rows={15} />
              </Form.Item>
            </Card>
          </div>

          <div className="ml-[12px] w-[220px] shrink-0 grow-0 h-full">
            <Card title="预览" className="h-full">
              xxxxx
            </Card>
          </div>
        </div>
      </ContentLayout>
    </Form>
  );
};

export default StructRuleDetailPage;
