import { App, Button, Card, Form, Input, Select, Tree } from 'antd';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { MonacoEditor } from '@/components/MonacoEditor';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleFieldMappingType,
  StructRuleFieldSourceType,
  StructRuleStatus,
  structRuleFieldMappingTypeOptions,
  structRuleFieldSourceTypeOptions,
  structRuleFieldValueTypeOptions,
} from '@/typing/enum';
import type { StructRule } from '@/typing/structRules';

const initialDetail: StructRule.Detail = {
  uid: '',
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
  const { uid } = useParams<{ uid: string }>();
  const { ruleApi } = useApi();
  const { message } = App.useApp();
  const nav = useNavigate();
  const isNewRule = useRef(uid === 'NEW');
  const isInit = useRef(isNewRule.current);

  const encodeOptions = useCacheStore((s) => s.encodeOptions);
  const [detail, setDetail] = useState<StructRule.Detail>(initialDetail);
  const fetchDetail = useCallback(
    async (uid: string) => {
      const res = await ruleApi.getRuleDetail({ uid });
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
      if (
        values.code_snippets.length === 1 &&
        !values.code_snippets[0].content
      ) {
        values.code_snippets = [];
      }

      if (isNewRule.current) {
        const res = await ruleApi.createRule(values);
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

  if (!isInit.current && !isNewRule.current && uid) {
    fetchDetail(uid);
  }

  if (!uid || !isInit.current) return null;
  return (
    <Form<StructRule.Detail>
      name="struct-rules-save"
      onFinish={onFinish}
      onFinishFailed={() => message.error(`配置有误，请检查`)}
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
                <Form.Item<StructRule.Detail> name="uid" hidden>
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
                          <td>来源</td>
                          <td>解析规则</td>
                          <td>值类型</td>
                          <td>字段映射</td>
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
                                  allowClear
                                  placeholder="请选择大字段分类"
                                  options={categoryOptions}
                                />
                              </Form.Item>
                            </td>

                            {/*<td>*/}
                            {/*  <Form.Item<StructRule.Detail['fields']>*/}
                            {/*    shouldUpdate*/}
                            {/*    style={{ width: '150px' }}*/}
                            {/*    {...restField}*/}
                            {/*    name={[name, 'parent_name']}*/}
                            {/*    rules={[*/}
                            {/*      {*/}
                            {/*        type: 'enum',*/}
                            {/*        enum: parentOptions*/}
                            {/*          .filter(*/}
                            {/*            (item) =>*/}
                            {/*              item.value !==*/}
                            {/*              form.getFieldValue([*/}
                            {/*                'fields',*/}
                            {/*                name,*/}
                            {/*                'name_en',*/}
                            {/*              ]),*/}
                            {/*          )*/}
                            {/*          .map((item) => item.value),*/}
                            {/*        message: '请选择正确的父字段',*/}
                            {/*      },*/}
                            {/*    ]}*/}
                            {/*  >*/}
                            {/*    <Select*/}
                            {/*      disabled={form.getFieldValue([*/}
                            {/*        'fields',*/}
                            {/*        name,*/}
                            {/*        'category_name',*/}
                            {/*      ])}*/}
                            {/*      allowClear*/}
                            {/*      placeholder="请选择父字段"*/}
                            {/*      options={parentOptions.filter(*/}
                            {/*        (item) =>*/}
                            {/*          item.value !==*/}
                            {/*          form.getFieldValue([*/}
                            {/*            'fields',*/}
                            {/*            name,*/}
                            {/*            'name_en',*/}
                            {/*          ]),*/}
                            {/*      )}*/}
                            {/*    />*/}
                            {/*  </Form.Item>*/}
                            {/*</td>*/}

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '160px' }}
                                {...restField}
                                name={[name, 'source_type']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请选择数据来源',
                                  },
                                  {
                                    type: 'enum',
                                    enum: structRuleFieldSourceTypeOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的来源',
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="请选择数据来源"
                                  options={structRuleFieldSourceTypeOptions}
                                />
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                  pre[name]?.source_type !==
                                  cur[name]?.source_type
                                }
                              >
                                {() =>
                                  form.getFieldValue([
                                    'fields',
                                    name,
                                    'source_type',
                                  ]) ===
                                  StructRuleFieldSourceType.QuoteResult ? (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '160px' }}
                                      {...restField}
                                      name={[name, 'parsing_rule']}
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
                                  ) : (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '160px' }}
                                      {...restField}
                                      name={[name, 'parsing_rule']}
                                    >
                                      <Input placeholder="请输入解析规则" />
                                    </Form.Item>
                                  )
                                }
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '100px' }}
                                {...restField}
                                name={[name, 'value_type']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请选择值类型',
                                  },
                                  {
                                    type: 'enum',
                                    enum: structRuleFieldValueTypeOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的值类型',
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="请选择值类型"
                                  options={structRuleFieldValueTypeOptions}
                                />
                              </Form.Item>
                            </td>

                            <td className="flex gap-x-[8px]">
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '100px' }}
                                {...restField}
                                name={[name, 'mapping_type']}
                                rules={[
                                  {
                                    required: true,
                                    message: '请选择映射方式',
                                  },
                                  {
                                    type: 'enum',
                                    enum: structRuleFieldMappingTypeOptions.map(
                                      (item) => item.value,
                                    ),
                                    message: '请选择正确的映射方式',
                                  },
                                ]}
                              >
                                <Select
                                  placeholder="请选择映射方式"
                                  options={structRuleFieldMappingTypeOptions}
                                />
                              </Form.Item>

                              <Form.Item<StructRule.Detail['fields']>
                                noStyle
                                shouldUpdate={(prev, curr) =>
                                  prev[name]?.mapping_type !==
                                  curr[name]?.mapping_type
                                }
                              >
                                {() =>
                                  form.getFieldValue([
                                    'fields',
                                    name,
                                    'mapping_type',
                                  ]) === StructRuleFieldMappingType.Encode ? (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '150px' }}
                                      {...restField}
                                      name={[name, 'mapping_content']}
                                      rules={[
                                        {
                                          required: true,
                                          message: '请选择码表',
                                        },
                                        {
                                          type: 'enum',
                                          enum: encodeOptions.map(
                                            (o) => o.value,
                                          ),
                                          message: '请选择正确的码表',
                                        },
                                      ]}
                                    >
                                      <Select
                                        placeholder="请选择码表"
                                        options={encodeOptions}
                                      />
                                    </Form.Item>
                                  ) : (
                                    <Form.Item<StructRule.Detail['fields']>
                                      style={{ width: '150px' }}
                                      {...restField}
                                      name={[name, 'mapping_content']}
                                    >
                                      <Input placeholder="请输入映射内容" />
                                    </Form.Item>
                                  )
                                }
                              </Form.Item>
                            </td>

                            <td>
                              <Form.Item<StructRule.Detail['fields']>
                                style={{ width: '60px' }}
                                {...restField}
                                name={[name, 'need_store']}
                                rules={[
                                  { required: true, message: '请选择是否落库' },
                                  { type: 'enum', enum: [0, 1] },
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

                            <td className="py-[12px] sticky right-0 bg-white flex">
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
                className="h-[500px]"
              >
                <MonacoEditor />
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
          // children: [],
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
      if (!f.category_name && f.name_en && f.name_cn) {
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
