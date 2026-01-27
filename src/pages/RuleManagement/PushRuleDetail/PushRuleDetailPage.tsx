import { App, Button, Card, Form, Input, Select, Spin } from 'antd';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import FilterTable from '@/pages/RuleManagement/PushRuleDetail/components/FilterTable';
import PushTable from '@/pages/RuleManagement/PushRuleDetail/components/PushTable';
import { useCacheStore } from '@/store/useCacheStore';
import { ENUM_VARS } from '@/typing/enum';
import { PushDataType, PushTargetDB } from '@/typing/enum/pushRule';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';

const initialDetail: PushRule.Detail = {
  uid: '',
  name: '',
  structured_ruleset_uid: '',
  comment: '',
  source_map_field: '',
  filter: [],
  content: [],
  target_db: PushTargetDB.MySql,
  target_uri: '',
  target_table: '',
};

const PushRuleDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { pushRuleApi, ruleApi } = useApi();
  const { message } = App.useApp();
  const nav = useNavigate();
  const isNewRule = useRef(uid === 'NEW');
  const isInit = useRef(isNewRule.current);

  const structuredRuleOptions = useCacheStore(
    (s) => s.structuredRulesetOptions,
  );
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
        | 'name'
        | 'structured_ruleset_uid'
        | 'comment'
        | 'target_db'
        | 'target_uri'
        | 'target_table'
        | 'source_map_field'
      >
    >();
  const [filterForm] = Form.useForm<PushRule.Filter>();
  const [pushForm] = Form.useForm<PushRule.ContentItem>();
  const structuredRuleUid = Form.useWatch('structured_ruleset_uid', baseForm);

  // 获取当前关联的结构化规则的字段
  const [sourceFieldOptions, setSourceFieldOptions] = useState<{
    filter: { label: string; value: string }[];
    content: { label: string; value: string }[];
  }>({ filter: [], content: [] });
  const [
    currentStructuredRuleFieldsCache,
    setCurrentStructuredRuleFieldsCache,
  ] = useState<Record<string, StructuredRuleset.Fields>>({});
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
          nav(`/rule_management/push_rule/${res.data}`);
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
          title: <Link to="/rule_management/push_rule">推送规则</Link>,
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
                name="name"
                className="w-[36%]"
                rules={[
                  { required: true, message: '请输入推送规则名称' },
                  { whitespace: true, message: '推送规则名称不能为空' },
                ]}
              >
                <Input />
              </Form.Item>
            </div>

            <div className="flex items-center gap-x-[24px] mb-[8px]">
              <Form.Item<PushRule.Detail>
                label="关联结构化规则"
                name="structured_ruleset_uid"
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
                <Select options={ENUM_VARS.PUSH_RULE.TARGET_DB_OPT} />
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
      </div>
    </ContentLayout>
  );
};

export default PushRuleDetailPage;
