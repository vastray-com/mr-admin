import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Tree,
} from 'antd';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
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
  const { message } = App.useApp();
  const nav = useNavigate();
  const isNewRule = useRef(id === 'NEW');
  const isInit = useRef(isNewRule.current);

  const encodeList = useCacheStore((s) => s.encodeList);
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
  const categories = Form.useWatch('category', form) || [];
  const fields = Form.useWatch('fields', form) || [];

  // 分类选择列表
  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category?.name_en && category?.name_cn)
        .map((item) => ({
          label: item.name_cn,
          value: item.name_en,
        })),
    [categories],
  );
  // 父字段选择列表
  const parentOptions = useMemo(
    () =>
      fields
        .filter((field) => field?.name_en && field?.name_cn)
        .map((item) => ({
          label: item.name_cn,
          value: item.name_en,
        })),
    [fields],
  );

  // 保存
  const onFinish = useCallback(
    async (values: StructRule.Detail) => {
      console.log('保存病历模板:', values);
      if (isNewRule.current) {
        const res = await ruleApi.createRule(values);
        console.log('新建病历模板成功:', res);
        if (res.code === 200) {
          message.success('新建病历模板成功!');
          nav(`/rules_management/struct_rules/${res.data}`);
        } else {
          message.error(res.msg || '新建病历模板失败');
        }
      } else {
        const res = await ruleApi.updateRule(values);
        console.log('更新病历模板成功:', res);
        if (res.code === 200) {
          message.success('更新病历模板成功');
        } else {
          message.error(res.msg || '更新病历模板失败');
        }
      }
    },
    [ruleApi, message, nav],
  );

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
          <div className="flex-1 w-[calc(100%_-_200px_-_200px_-_24px)] overflow-auto">
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
                          <td className="w-[16%]">提取字段</td>
                          <td className="w-[16%]">字段名称</td>
                          <td className="w-[56%]">提取规则</td>
                          <td className="w-[12%]">操作</td>
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
                  <div className="h-full rounded-2xl overflow-auto pos-relative">
                    <table className="w-full">
                      <thead className="sticky top-0 z-1">
                        <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                          <td>数据项</td>
                          <td>字段名称</td>
                          <td>大字段</td>
                          <td>父字段</td>
                          <td>定义</td>
                          <td>类型</td>
                          <td>长度</td>
                          <td>值类型</td>
                          <td>值描述</td>
                          <td>源字段</td>
                          <td>是否落库</td>
                          <td className="sticky right-0">操作</td>
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
                                style={{ width: '120px' }}
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
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '120px' }}
                                {...restField}
                                name={[name, 'name_en']}
                                rules={[
                                  { required: true, message: '请输入字段名' },
                                  { whitespace: true, message: '请输入字段名' },
                                ]}
                              >
                                <Input placeholder="请输入字段名" />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '150px' }}
                                {...restField}
                                name={[name, 'category_name']}
                                shouldUpdate
                                rules={[
                                  {
                                    type: 'enum',
                                    enum: categoryOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的大字段分类',
                                  },
                                ]}
                              >
                                <Select
                                  disabled={form.getFieldValue([
                                    'fields',
                                    name,
                                    'parent_name',
                                  ])}
                                  allowClear
                                  placeholder="请选择大字段分类"
                                  options={categoryOptions}
                                />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                shouldUpdate
                                style={{ width: '150px' }}
                                {...restField}
                                name={[name, 'parent_name']}
                                rules={[
                                  {
                                    type: 'enum',
                                    enum: parentOptions
                                      .filter(
                                        (item) =>
                                          item.value !==
                                          form.getFieldValue([
                                            'fields',
                                            name,
                                            'name_en',
                                          ]),
                                      )
                                      .map((item) => item.value),
                                    message: '请选择正确的父字段',
                                  },
                                ]}
                              >
                                <Select
                                  disabled={form.getFieldValue([
                                    'fields',
                                    name,
                                    'category_name',
                                  ])}
                                  allowClear
                                  placeholder="请选择父字段"
                                  options={parentOptions.filter(
                                    (item) =>
                                      item.value !==
                                      form.getFieldValue([
                                        'fields',
                                        name,
                                        'name_en',
                                      ]),
                                  )}
                                />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '160px' }}
                                {...restField}
                                name={[name, 'field_define']}
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
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '160px' }}
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

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '60px' }}
                                {...restField}
                                name={[name, 'field_len']}
                                rules={[
                                  { required: true, message: '请输入长度' },
                                ]}
                                getValueFromEvent={(e) => Number(e)}
                                normalize={(v) => `${v}`}
                              >
                                <InputNumber
                                  style={{ width: '60px' }}
                                  placeholder="请输入长度"
                                  precision={0}
                                />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '150px' }}
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

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                noStyle
                                shouldUpdate={(prev, curr) =>
                                  prev[name]?.value_type !==
                                  curr[name]?.value_type
                                }
                              >
                                {() =>
                                  form.getFieldValue([
                                    'fields',
                                    name,
                                    'value_type',
                                  ]) === 3 ? (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '150px' }}
                                      {...restField}
                                      name={[name, 'value_desc']}
                                      rules={[
                                        {
                                          type: 'enum',
                                          enum: encodeList.map(
                                            (encode) => `${encode.id}`,
                                          ),
                                          message: '请选择正确的码表',
                                        },
                                      ]}
                                    >
                                      <Select
                                        placeholder="请选择码表"
                                        options={encodeList.map((encode) => ({
                                          value: `${encode.id}`,
                                          label: encode.name_cn,
                                        }))}
                                      />
                                    </Form.Item>
                                  ) : (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '150px' }}
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

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                shouldUpdate
                                style={{ width: '150px' }}
                                {...restField}
                                name={[name, 'value_source_name']}
                                rules={[
                                  {
                                    type: 'enum',
                                    enum: parentOptions
                                      .filter(
                                        (item) =>
                                          item.value !==
                                          form.getFieldValue([
                                            'fields',
                                            name,
                                            'name_en',
                                          ]),
                                      )
                                      .map((item) => item.value),
                                    message: '请选择正确的源字段',
                                  },
                                ]}
                              >
                                <Select
                                  allowClear
                                  placeholder="请选择源字段"
                                  options={parentOptions.filter(
                                    (item) =>
                                      item.value !==
                                      form.getFieldValue([
                                        'fields',
                                        name,
                                        'name_en',
                                      ]),
                                  )}
                                />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '60px' }}
                                {...restField}
                                name={[name, 'need_store']}
                                rules={[
                                  { type: 'enum', enum: [0, 1] },
                                  { required: true, message: '请选择是否落库' },
                                ]}
                              >
                                <Select
                                  options={[
                                    { value: 1, label: '是' },
                                    { value: 0, label: '否' },
                                  ]}
                                />
                              </Form.Item>
                            </td>

                            <td className="pt-0 sticky right-0 bg-white">
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
                              onClick={() => add({ need_store: 1 })}
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

            <Card title="后处理代码片段" className="mt-[12px]">
              <Form.Item<StructRule.Detail>
                name={['code_snippets', 0, 'content']}
              >
                <Input.TextArea rows={15} />
              </Form.Item>
            </Card>
          </div>

          <div className="ml-[12px] w-[220px] shrink-0 grow-0 h-full">
            <Card title="预览" className="h-full">
              <Preview categories={categories} fields={fields} />
            </Card>
          </div>
        </div>
      </ContentLayout>
    </Form>
  );
};

// 右侧预览组件
type PreviewProps = {
  categories: StructRule.Categories;
  fields: StructRule.Fields;
};
type TreeNode = {
  title: string;
  key: string;
  children?: TreeNode[];
};
const Preview: FC<PreviewProps> = ({ categories, fields }) => {
  const treeData = useMemo<TreeNode[]>(() => {
    const tree: TreeNode[] = [];
    const process_categories = categories.filter(
      (c) => c?.name_en && c?.name_cn,
    );
    const process_fields = fields.filter((f) => f?.name_en && f?.name_cn);

    // 行转树
    // 先构建所有节点的 Node
    const nodes: Record<string, TreeNode> = {};
    process_categories.forEach((c) => {
      if (c.name_cn && c.name_en) {
        nodes[`CATEGORY_${c.name_en}`] = {
          title: c.name_cn,
          key: `CATEGORY_${c.name_en}`,
          children: [],
        };
      }
    });
    process_fields.forEach((f) => {
      if (f.name_cn && f.name_en) {
        nodes[`FIELD_${f.name_en}`] = {
          title: f.name_cn,
          key: `FIELD_${f.name_en}`,
          children: [],
        };
      }
    });

    // 再构建父子关系
    process_fields.forEach((f) => {
      const node = nodes[`FIELD_${f.name_en}`];
      if (f.category_name) {
        const parentNode = nodes[`CATEGORY_${f.category_name}`];
        if (parentNode) {
          parentNode.children?.push(node);
        }
      } else if (f.parent_name) {
        const parentNode = nodes[`FIELD_${f.parent_name}`];
        if (parentNode) {
          parentNode.children?.push(node);
        }
      }
    });
    // 最后将所有顶层节点加入树
    process_categories.forEach((c) => {
      const node = nodes[`CATEGORY_${c.name_en}`];
      if (node) {
        tree.push(node);
      }
    });
    process_fields.forEach((f) => {
      if (!f.category_name && !f.parent_name && f.name_en && f.name_cn) {
        const node = nodes[`FIELD_${f.name_en}`];
        if (node) {
          tree.push(node);
        }
      }
    });

    return tree;
  }, [categories, fields]);

  return <Tree showLine treeData={treeData} />;
};

export default StructRuleDetailPage;
