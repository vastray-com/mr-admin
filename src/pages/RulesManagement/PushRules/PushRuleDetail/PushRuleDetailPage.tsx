import { App, Button, Card, Form, Input, Select, Spin } from 'antd';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import FilterTable from '@/pages/RulesManagement/PushRules/PushRuleDetail/components/FilterTable';
import PushTable from '@/pages/RulesManagement/PushRules/PushRuleDetail/components/PushTable';
import { useCacheStore } from '@/store/useCacheStore';
import { PushDataType, PushTargetDB, pushTargetDBOptions } from '@/typing/enum';
import type { PushRule } from '@/typing/pushRules';
import type { StructRule } from '@/typing/structRules';

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

  const [baseForm] =
    Form.useForm<
      Pick<
        PushRule.Detail,
        | 'uid'
        | 'name_cn'
        | 'name_en'
        | 'structured_rule_uid'
        | 'comment'
        | 'target_db'
        | 'target_uri'
        | 'target_table'
        | 'source_map_field'
      >
    >();
  const [filterForm] = Form.useForm<PushRule.Filter>();
  const [pushForm] = Form.useForm<PushRule.ContentItem>();
  const structuredRuleUid = Form.useWatch('structured_rule_uid', baseForm);

  // 获取当前关联的结构化规则的字段
  const [sourceFieldOptions, setSourceFieldOptions] = useState<{
    filter: { label: string; value: string }[];
    content: { label: string; value: string }[];
  }>({ filter: [], content: [] });
  const [
    currentStructuredRuleFieldsCache,
    setCurrentStructuredRuleFieldsCache,
  ] = useState<Record<string, StructRule.Fields>>({});
  const getCurrentStructuredRuleFields = useCallback(
    async (uid: string) => {
      if (!uid) return [];
      if (currentStructuredRuleFieldsCache[uid]) {
        return currentStructuredRuleFieldsCache[uid];
      }
      console.log('拉取结构化规则字段:', uid);
      try {
        const res = await ruleApi.getRuleDetail({ uid });
        if (res.code === 200) {
          setCurrentStructuredRuleFieldsCache((prev) => ({
            ...prev,
            [uid]: res.data.fields,
          }));
          return res.data.fields;
        }
        console.error('获取结构化规则字段失败:', res.message);
        return [];
      } catch (e) {
        console.error('获取结构化规则字段失败:', e);
        return [];
      }
    },
    [ruleApi.getRuleDetail, currentStructuredRuleFieldsCache],
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
      setDetail((prev) => ({
        ...prev,
        filter: [],
        content: [],
      }));
    }
    if (structuredRuleChanged) {
      lastStructuredRuleUid.current = structuredRuleUid;
    }

    const currentStructuredRuleFields =
      await getCurrentStructuredRuleFields(structuredRuleUid);
    // 计算当前可选的结构化规则字段
    const c = currentStructuredRuleFields.map((field) => ({
      label: `${field.name_en} (${field.name_cn})`,
      value: field.name_en,
    }));
    const f = currentStructuredRuleFields.map((field) => ({
      label: `${field.name_en} (${field.name_cn})`,
      value: field.name_en,
    }));
    setSourceFieldOptions({ filter: f, content: c });
  }, [getCurrentStructuredRuleFields, structuredRuleUid]);
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
          message.error(res.message || '新建推送规则失败');
        }
      } else {
        const res = await pushRuleApi.updateRule(values);
        console.log('更新推送规则:', res);
        if (res.code === 200) {
          message.success('更新推送规则成功');
        } else {
          message.error(res.message || '更新推送规则失败');
        }
      }
    },
    [pushRuleApi, message, nav],
  );

  if (!isInit.current && !isNewRule.current && uid) {
    fetchDetail(uid);
  }

  if (!uid || !isInit.current)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-4">
        <Spin />
        <p>加载表格中，请稍候...</p>
      </div>
    );

  return (
    <ContentLayout
      breadcrumb={[
        {
          title: <Link to="/rules_management/push_rules">推送规则</Link>,
        },
        { title: '编辑推送规则' },
      ]}
      title={isNewRule.current ? '新建推送规则' : '编辑推送规则'}
      action={
        <Button
          type="primary"
          onClick={() =>
            onFinish({
              ...detail,
              ...baseForm.getFieldsValue(),
              filter: detail.filter,
              content: detail.content,
            })
          }
        >
          保存
        </Button>
      }
    >
      <div className="h-full">
        <Card title="基本信息">
          <Form
            form={baseForm}
            className="w-full h-full"
            initialValues={detail}
          >
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
          </Form>
        </Card>

        <Card
          title="数据过滤"
          className="mt-[12px]"
          extra={
            <Button
              onClick={() => {
                setDetail((prev) => ({
                  ...prev,
                  filter: [
                    ...prev.filter,
                    {
                      source: '',
                      value: '',
                      operator: '',
                    },
                  ],
                }));
              }}
              type="primary"
            >
              添加字段
            </Button>
          }
        >
          <FilterTable
            detail={detail}
            form={filterForm}
            sourceOptions={sourceFieldOptions.filter}
            onChange={(filter) => setDetail((prev) => ({ ...prev, filter }))}
          />
        </Card>

        <Card
          title="推送字段"
          className="mt-[12px]"
          extra={
            <Button
              onClick={() => {
                setDetail((prev) => ({
                  ...prev,
                  content: [
                    ...prev.content,
                    {
                      source: '',
                      target: '',
                      data_type: PushDataType.String,
                      max_length: null,
                      mapping_content: null,
                    },
                  ],
                }));
              }}
              type="primary"
            >
              添加字段
            </Button>
          }
        >
          <PushTable
            detail={detail}
            form={pushForm}
            sourceOptions={sourceFieldOptions.content}
            structuredRuleFields={
              currentStructuredRuleFieldsCache[structuredRuleUid]
            }
            onChange={(content) => setDetail((prev) => ({ ...prev, content }))}
          />
        </Card>

        {/*<Card title="数据过滤" className="mt-[12px]">*/}
        {/*  <Form.Item shouldUpdate noStyle>*/}
        {/*    {sourceFieldOptions?.filter &&*/}
        {/*      (sourceFieldOptions.filter.length > 0 || filter?.length > 0) && (*/}
        {/*        <Form.List name="filter">*/}
        {/*          {(fields, { add, remove, move }) => (*/}
        {/*            <div className="h-full rounded-2xl overflow-auto pos-relative">*/}
        {/*              <table className="w-full">*/}
        {/*                <thead className="sticky top-0 z-1">*/}
        {/*                  <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">*/}
        {/*                    <td>源字段</td>*/}
        {/*                    <td>过滤条件</td>*/}
        {/*                    <td>过滤值</td>*/}
        {/*                    <td className="sticky right-0">操作</td>*/}
        {/*                  </tr>*/}
        {/*                </thead>*/}

        {/*                <tbody>*/}
        {/*                  {fields.map(({ key, name, ...restField }) => (*/}
        {/*                    <tr*/}
        {/*                      key={key}*/}
        {/*                      className="b-b-1 b-divider children:(pt-[24px] px-[16px])"*/}
        {/*                    >*/}
        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['filter']>*/}
        {/*                          style={{ width: '360px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'source']}*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请选择源字段',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请选择源字段',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Select*/}
        {/*                            placeholder="请选择源字段"*/}
        {/*                            options={sourceFieldOptions.filter}*/}
        {/*                          />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['filter']>*/}
        {/*                          style={{ width: '160px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'operator']}*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请选择操作符',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请选择操作符',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              type: 'enum',*/}
        {/*                              enum: operatorOptions.map(*/}
        {/*                                (item) => item.value,*/}
        {/*                              ),*/}
        {/*                              message: '请选择正确的操作符',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Select*/}
        {/*                            placeholder="请选择操作符"*/}
        {/*                            options={operatorOptions}*/}
        {/*                          />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['filter']>*/}
        {/*                          style={{ width: '200px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'value']}*/}
        {/*                          shouldUpdate*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请输入过滤值',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请输入过滤值',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Input placeholder="请输入过滤值" />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td className="py-[12px] sticky right-0 bg-white flex">*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          onClick={() => move(name, name - 1)}*/}
        {/*                          disabled={name === 0}*/}
        {/*                        >*/}
        {/*                          上移*/}
        {/*                        </Button>*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          onClick={() => move(name, name + 1)}*/}
        {/*                          disabled={name === fields.length - 1}*/}
        {/*                        >*/}
        {/*                          下移*/}
        {/*                        </Button>*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          danger*/}
        {/*                          onClick={() => remove(name)}*/}
        {/*                        >*/}
        {/*                          删除*/}
        {/*                        </Button>*/}
        {/*                      </td>*/}
        {/*                    </tr>*/}
        {/*                  ))}*/}

        {/*                  {sourceFieldOptions.filter &&*/}
        {/*                    sourceFieldOptions.filter.length > 0 && (*/}
        {/*                      <tr>*/}
        {/*                        <td colSpan={99} className="py-[12px]">*/}
        {/*                          <Button*/}
        {/*                            type="dashed"*/}
        {/*                            size="large"*/}
        {/*                            onClick={() =>*/}
        {/*                              add({*/}
        {/*                                source: '',*/}
        {/*                                operator: '',*/}
        {/*                                value: '',*/}
        {/*                              })*/}
        {/*                            }*/}
        {/*                            block*/}
        {/*                          >*/}
        {/*                            <i className="i-icon-park-outline:plus text-[16px]" />*/}
        {/*                            <span>新增一行</span>*/}
        {/*                          </Button>*/}
        {/*                        </td>*/}
        {/*                      </tr>*/}
        {/*                    )}*/}
        {/*                </tbody>*/}
        {/*              </table>*/}
        {/*            </div>*/}
        {/*          )}*/}
        {/*        </Form.List>*/}
        {/*      )}*/}
        {/*  </Form.Item>*/}
        {/*</Card>*/}

        {/*<Card title="推送字段" className="mt-[12px]">*/}
        {/*  <Form.Item shouldUpdate noStyle>*/}
        {/*    {sourceFieldOptions?.content &&*/}
        {/*      (sourceFieldOptions.content.length > 0 ||*/}
        {/*        content?.length > 0) && (*/}
        {/*        <Form.List name="content">*/}
        {/*          {(fields, { add, remove, move }) => (*/}
        {/*            <div className="h-full rounded-2xl overflow-auto pos-relative">*/}
        {/*              <table className="w-full">*/}
        {/*                <thead className="sticky top-0 z-1">*/}
        {/*                  <tr className="children:(pl-[24px] font-medium text-fg-title py-[16px] bg-[#f0f0f0])">*/}
        {/*                    <td>源字段</td>*/}
        {/*                    <td>目标字段</td>*/}
        {/*                    <td>目标数据类型</td>*/}
        {/*                    <td>枚举映射</td>*/}
        {/*                    <td className="sticky right-0">操作</td>*/}
        {/*                  </tr>*/}
        {/*                </thead>*/}

        {/*                <tbody>*/}
        {/*                  {fields.map(({ key, name, ...restField }) => (*/}
        {/*                    <tr*/}
        {/*                      key={key}*/}
        {/*                      className="b-b-1 b-divider children:(pt-[24px] px-[16px])"*/}
        {/*                    >*/}
        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['content']>*/}
        {/*                          style={{ width: '360px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'source']}*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请选择源字段',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请选择源字段',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Select*/}
        {/*                            placeholder="请选择源字段"*/}
        {/*                            options={sourceFieldOptions.content}*/}
        {/*                            onChange={(v) => {*/}
        {/*                              console.log(v);*/}
        {/*                            }}*/}
        {/*                          />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['content']>*/}
        {/*                          style={{ width: '360px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'target']}*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请输入目标字段名',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请输入目标字段名',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Input placeholder="请输入目标字段名" />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['content']>*/}
        {/*                          style={{ width: '200px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'data_type']}*/}
        {/*                          shouldUpdate*/}
        {/*                          rules={[*/}
        {/*                            {*/}
        {/*                              required: true,*/}
        {/*                              message: '请选择正确的数据类型',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              whitespace: true,*/}
        {/*                              message: '请选择正确的数据类型',*/}
        {/*                            },*/}
        {/*                            {*/}
        {/*                              type: 'enum',*/}
        {/*                              enum: pushDataTypeOptions.map(*/}
        {/*                                (item) => item.value,*/}
        {/*                              ),*/}
        {/*                              message: '请选择正确的数据类型',*/}
        {/*                            },*/}
        {/*                          ]}*/}
        {/*                        >*/}
        {/*                          <Select*/}
        {/*                            allowClear*/}
        {/*                            placeholder="请选择目标数据类型"*/}
        {/*                            options={pushDataTypeOptions}*/}
        {/*                          />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td>*/}
        {/*                        <Form.Item<PushRule.Detail['content']>*/}
        {/*                          style={{ width: '360px' }}*/}
        {/*                          {...restField}*/}
        {/*                          name={[name, 'mapping_content']}*/}
        {/*                        >*/}
        {/*                          <Input placeholder="请输入枚举映射内容" />*/}
        {/*                        </Form.Item>*/}
        {/*                      </td>*/}

        {/*                      <td className="py-[12px] sticky right-0 bg-white flex">*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          onClick={() => move(name, name - 1)}*/}
        {/*                          disabled={name === 0}*/}
        {/*                        >*/}
        {/*                          上移*/}
        {/*                        </Button>*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          onClick={() => move(name, name + 1)}*/}
        {/*                          disabled={name === fields.length - 1}*/}
        {/*                        >*/}
        {/*                          下移*/}
        {/*                        </Button>*/}
        {/*                        <Button*/}
        {/*                          size="small"*/}
        {/*                          type="link"*/}
        {/*                          danger*/}
        {/*                          onClick={() => remove(name)}*/}
        {/*                        >*/}
        {/*                          删除*/}
        {/*                        </Button>*/}
        {/*                      </td>*/}
        {/*                    </tr>*/}
        {/*                  ))}*/}

        {/*                  {sourceFieldOptions?.content &&*/}
        {/*                    sourceFieldOptions.content.length > 0 && (*/}
        {/*                      <tr>*/}
        {/*                        <td colSpan={99} className="py-[12px]">*/}
        {/*                          <Button*/}
        {/*                            type="dashed"*/}
        {/*                            size="large"*/}
        {/*                            onClick={() =>*/}
        {/*                              add({*/}
        {/*                                source: '',*/}
        {/*                                target: '',*/}
        {/*                                data_type: null,*/}
        {/*                                mapping_content: null,*/}
        {/*                              })*/}
        {/*                            }*/}
        {/*                            block*/}
        {/*                          >*/}
        {/*                            <i className="i-icon-park-outline:plus text-[16px]" />*/}
        {/*                            <span>新增一行</span>*/}
        {/*                          </Button>*/}
        {/*                        </td>*/}
        {/*                      </tr>*/}
        {/*                    )}*/}
        {/*                </tbody>*/}
        {/*              </table>*/}
        {/*            </div>*/}
        {/*          )}*/}
        {/*        </Form.List>*/}
        {/*      )}*/}
        {/*  </Form.Item>*/}
        {/*</Card>*/}
      </div>
    </ContentLayout>
  );
};

export default PushRuleDetailPage;
