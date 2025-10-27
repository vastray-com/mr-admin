import { App, Button, Card, Form, Input, Select, type SelectProps } from 'antd';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
import {
  PushTargetDB,
  pushDataTypeOptions,
  pushTargetDBOptions,
} from '@/typing/enum';
import type { PushRule } from '@/typing/pushRules';
import type { StructRule } from '@/typing/structRules';

const operatorOptions = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'neq' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'gte' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'lte' },
  { label: '包含', value: 'in' },
  { label: '不包含', value: 'nin' },
];

const initialDetail: PushRule.Detail = {
  uid: '',
  name_cn: '',
  name_en: '',
  structured_rule_uid: '',
  comment: '',
  source_map_field: '',
  filter: [],
  content: [],
  target_db: PushTargetDB.MySQL,
  target_uri: '',
  target_table: '',
  create_time: '',
  update_time: '',
};

const PushRuleDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { pushRuleApi, ruleApi } = useApi();
  const { message } = App.useApp();
  const nav = useNavigate();
  const isNewRule = useRef(uid === 'NEW');
  const isInit = useRef(isNewRule.current);

  const structuredRuleOptions = useCacheStore((s) => s.ruleOptions);
  const [detail, setDetail] = useState<PushRule.Detail>(initialDetail);
  const fetchDetail = useCallback(
    async (uid: string) => {
      const res = await pushRuleApi.getRuleDetail({ uid });
      console.log('拉取推送规则详情成功:', res);
      setDetail(res.data);
      isInit.current = true;
    },
    [pushRuleApi],
  );

  const [form] = Form.useForm<PushRule.Detail>();
  const structuredRuleUid = Form.useWatch('structured_rule_uid', form);
  const content = Form.useWatch('content', form);
  const filter = Form.useWatch('filter', form);

  // 获取当前关联的结构化规则的字段
  const [sourceFieldOptions, setSourceFieldOptions] = useState<{
    filter: SelectProps['options'];
    content: SelectProps['options'];
  }>({ filter: [], content: [] });
  const currentStructuredRuleFieldsCache = useRef<
    Record<string, StructRule.Fields>
  >({});
  const getCurrentStructuredRuleFields = useCallback(
    async (uid: string) => {
      if (!uid) return [];
      if (currentStructuredRuleFieldsCache.current[uid]) {
        return currentStructuredRuleFieldsCache.current[uid];
      }
      console.log('拉取结构化规则字段:', uid);
      try {
        const res = await ruleApi.getRuleDetail({ uid });
        if (res.code === 200) {
          currentStructuredRuleFieldsCache.current[uid] = res.data.fields;
          return res.data.fields;
        }
        console.error('获取结构化规则字段失败:', res.msg);
        return [];
      } catch (e) {
        console.error('获取结构化规则字段失败:', e);
        return [];
      }
    },
    [ruleApi.getRuleDetail],
  );
  // 获取结构化规则字段可选选项
  const lastStructuredRuleUid = useRef<string>('');
  const fetchStructuredRuleFieldOptions = useCallback(async () => {
    if (!structuredRuleUid) return;
    console.log('获取结构化规则字段可选项');
    const structuredRuleChanged =
      structuredRuleUid !== lastStructuredRuleUid.current;
    // 关联的结构化规则变更，清空已配置的推送字段
    if (structuredRuleChanged && lastStructuredRuleUid.current) {
      form.setFieldValue('content', []);
      form.setFieldValue('filter', []);
    }
    if (structuredRuleChanged) {
      lastStructuredRuleUid.current = structuredRuleUid;
    }

    const currentStructuredRuleFields =
      await getCurrentStructuredRuleFields(structuredRuleUid);
    // 计算当前可选的结构化规则字段
    const c = currentStructuredRuleFields
      .filter(
        (field) => !content || !content.some((d) => d.source === field.name_en),
      )
      .map((field) => ({
        label: field.name_cn,
        value: field.name_en,
      }));
    const f = currentStructuredRuleFields
      .filter(
        (field) => !filter || !filter.some((d) => d.source === field.name_en),
      )
      .map((field) => ({
        label: field.name_cn,
        value: field.name_en,
      }));
    setSourceFieldOptions({ filter: f, content: c });
  }, [
    getCurrentStructuredRuleFields,
    form.setFieldValue,
    structuredRuleUid,
    content,
    filter,
  ]);
  useEffect(() => {
    fetchStructuredRuleFieldOptions();
  }, [fetchStructuredRuleFieldOptions]);

  // 保存
  const onFinish = useCallback(
    async (values: PushRule.Detail) => {
      console.log('保存推送规则:', values);
      if (isNewRule.current) {
        const res = await pushRuleApi.createRule(values);
        if (res.code === 200) {
          message.success('新建推送规则成功!');
          nav(`/rules_management/push_rules/${res.data}`);
        } else {
          message.error(res.msg || '新建推送规则失败');
        }
      } else {
        const res = await pushRuleApi.updateRule(values);
        console.log('更新推送规则:', res);
        if (res.code === 200) {
          message.success('更新推送规则成功');
        } else {
          message.error(res.msg || '更新推送规则失败');
        }
      }
    },
    [pushRuleApi, message, nav],
  );

  if (!isInit.current && !isNewRule.current && uid) {
    fetchDetail(uid);
  }

  if (!uid || !isInit.current) return null;

  return (
    <Form<PushRule.Detail>
      name="push-rules-save"
      onFinish={onFinish}
      initialValues={detail}
      autoComplete="off"
      className="w-full h-full"
      form={form}
    >
      <ContentLayout
        breadcrumb={[
          {
            title: <Link to="/rules_management/push_rules">推送规则</Link>,
          },
          { title: '编辑推送规则' },
        ]}
        title={isNewRule.current ? '新建推送规则' : '编辑推送规则'}
        action={
          <Button htmlType="submit" type="primary">
            保存
          </Button>
        }
      >
        <div className="h-full">
          <Card title="基本信息">
            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail> name="uid" hidden>
                <Input />
              </Form.Item>

              <Form.Item<PushRule.Detail>
                label="规则名称"
                name="name_cn"
                className="w-[36%]"
                rules={[
                  { required: true, message: '请输入推送规则名称' },
                  { whitespace: true, message: '推送规则名称不能为空' },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item<PushRule.Detail>
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

            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail>
                label="关联结构化规则"
                name="structured_rule_uid"
                className="w-[36%]"
                rules={[
                  { required: true, message: '请选择关联结构化规则' },
                  { whitespace: true, message: '关联结构化规则不能为空' },
                ]}
              >
                <Select options={structuredRuleOptions} />
              </Form.Item>

              <Form.Item<PushRule.Detail>
                label="规则备注"
                name="comment"
                className="w-[36%]"
              >
                <Input />
              </Form.Item>
            </div>

            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail>
                label="推送目标"
                name="target_db"
                className="w-[36%]"
                rules={[
                  { required: true, message: '请选择推送目标' },
                  { whitespace: true, message: '推送目标不能为空' },
                ]}
              >
                <Select options={pushTargetDBOptions} />
              </Form.Item>

              <Form.Item<PushRule.Detail>
                label="推送表名"
                name="target_table"
                className="w-[36%]"
                rules={[
                  { required: true, message: '请输入推送表名' },
                  { whitespace: true, message: '推送表名不能为空' },
                ]}
              >
                <Input placeholder="请输入推送表名" />
              </Form.Item>
            </div>

            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail>
                label="连接字符串"
                name="target_uri"
                className="w-[74%]"
                rules={[
                  { required: true, message: '请输入目标连接字符串' },
                  { whitespace: true, message: '目标连接字符串不能为空' },
                ]}
              >
                <Input placeholder="请输入连接字符串, 如 mysql://user:password@host:port/dbname" />
              </Form.Item>
            </div>

            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail>
                label="原始病历映射列名"
                name="source_map_field"
                className="w-[74%]"
              >
                <Input placeholder="如需同时携带原始病历推送，请输入映射列名，不携带则留空" />
              </Form.Item>
            </div>
          </Card>

          <Card title="数据过滤" className="mt-[12px]">
            <Form.Item shouldUpdate noStyle>
              {sourceFieldOptions?.filter &&
                sourceFieldOptions.filter.length > 0 && (
                  <Form.List name="filter">
                    {(fields, { add, remove, move }) => (
                      <div className="h-full rounded-2xl overflow-auto pos-relative">
                        <table className="w-full">
                          <thead className="sticky top-0 z-1">
                            <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                              <td>源字段</td>
                              <td>过滤条件</td>
                              <td>过滤值</td>
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
                                  <Form.Item<PushRule.Detail['filter']>
                                    style={{ width: '360px' }}
                                    {...restField}
                                    name={[name, 'source']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '请选择源字段',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请选择源字段',
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="请选择源字段"
                                      options={sourceFieldOptions.filter}
                                    />
                                  </Form.Item>
                                </td>

                                <td>
                                  <Form.Item<PushRule.Detail['filter']>
                                    style={{ width: '160px' }}
                                    {...restField}
                                    name={[name, 'operator']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '请选择操作符',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请选择操作符',
                                      },
                                      {
                                        type: 'enum',
                                        enum: operatorOptions.map(
                                          (item) => item.value,
                                        ),
                                        message: '请选择正确的操作符',
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="请选择操作符"
                                      options={operatorOptions}
                                    />
                                  </Form.Item>
                                </td>

                                <td>
                                  <Form.Item<PushRule.Detail['filter']>
                                    style={{ width: '200px' }}
                                    {...restField}
                                    name={[name, 'value']}
                                    shouldUpdate
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入过滤值',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请输入过滤值',
                                      },
                                    ]}
                                  >
                                    <Input placeholder="请输入过滤值" />
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
                                  onClick={() =>
                                    add({
                                      source: '',
                                      operator: '',
                                      value: '',
                                    })
                                  }
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
                )}
            </Form.Item>
          </Card>

          <Card title="推送字段" className="mt-[12px]">
            <Form.Item shouldUpdate noStyle>
              {sourceFieldOptions?.content &&
                sourceFieldOptions.content.length > 0 && (
                  <Form.List name="content">
                    {(fields, { add, remove, move }) => (
                      <div className="h-full rounded-2xl overflow-auto pos-relative">
                        <table className="w-full">
                          <thead className="sticky top-0 z-1">
                            <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">
                              <td>源字段</td>
                              <td>目标字段</td>
                              <td>目标数据类型</td>
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
                                  <Form.Item<PushRule.Detail['content']>
                                    style={{ width: '360px' }}
                                    {...restField}
                                    name={[name, 'source']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '请选择源字段',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请选择源字段',
                                      },
                                    ]}
                                  >
                                    <Select
                                      placeholder="请选择源字段"
                                      options={sourceFieldOptions.content}
                                    />
                                  </Form.Item>
                                </td>

                                <td>
                                  <Form.Item<PushRule.Detail['content']>
                                    style={{ width: '360px' }}
                                    {...restField}
                                    name={[name, 'target']}
                                    rules={[
                                      {
                                        required: true,
                                        message: '请输入目标字段名',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请输入目标字段名',
                                      },
                                    ]}
                                  >
                                    <Input placeholder="请输入目标字段名" />
                                  </Form.Item>
                                </td>

                                <td>
                                  <Form.Item<PushRule.Detail['content']>
                                    style={{ width: '200px' }}
                                    {...restField}
                                    name={[name, 'data_type']}
                                    shouldUpdate
                                    rules={[
                                      {
                                        required: true,
                                        message: '请选择正确的数据类型',
                                      },
                                      {
                                        whitespace: true,
                                        message: '请选择正确的数据类型',
                                      },
                                      {
                                        type: 'enum',
                                        enum: pushDataTypeOptions.map(
                                          (item) => item.value,
                                        ),
                                        message: '请选择正确的数据类型',
                                      },
                                    ]}
                                  >
                                    <Select
                                      allowClear
                                      placeholder="请选择目标数据类型"
                                      options={pushDataTypeOptions}
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
                                  onClick={() =>
                                    add({
                                      source: '',
                                      target: '',
                                      data_type: null,
                                    })
                                  }
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
                )}
            </Form.Item>
          </Card>
        </div>
      </ContentLayout>
    </Form>
  );
};

export default PushRuleDetailPage;
