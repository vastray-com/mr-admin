import { App, Button, Card, Form, Input, Select, Spin, Tree } from 'antd';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { MonacoEditor } from '@/components/MonacoEditor';
import { useApi } from '@/hooks/useApi';
import CategoryTable from '@/pages/RulesManagement/StructRules/StructRuleDetail/components/CategoryTable';
import FieldTable from '@/pages/RulesManagement/StructRules/StructRuleDetail/components/FieldTable';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleStatus,
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
  const { message, modal } = App.useApp();
  const nav = useNavigate();
  const isNewRule = useRef(uid === 'NEW');
  const isInit = useRef(isNewRule.current);

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

  const [baseForm] =
    Form.useForm<Pick<StructRule.Detail, 'name_cn' | 'name_en' | 'comment'>>();
  const [categoryForm] = Form.useForm();
  const [fieldForm] = Form.useForm();
  const [codeSnippetForm] = Form.useForm();

  // 父字段选择列表
  const parentOptions = useMemo(
    () =>
      detail.fields
        .filter((field) => field?.name_en && field?.name_cn)
        .map((item) => ({
          label: item.name_cn,
          value: item.name_en,
        })),
    [detail.fields],
  );

  // 添加预设字段
  const presetFields = useCacheStore((s) => s.presetFields);
  const presetFieldOptions = useMemo(() => {
    return presetFields?.map((field) => {
      const typeLabel = structRuleFieldValueTypeOptions.find(
        (o) => o.value === field.value_type,
      )?.label;
      return {
        label: field.name_cn,
        value: field.id,
        value_type: typeLabel ?? '未知类型',
        parsing_rule: field.parsing_rule,
      };
    });
  }, [presetFields]);
  const selectedPresetFields = useRef<number[]>([]);
  const onAddPresetField = useCallback(async () => {
    console.log('添加预设字段:', selectedPresetFields.current);
    const presetFieldsToAdd = presetFields
      .filter((field) => selectedPresetFields.current.includes(field.id))
      .map((f) => {
        const { id, ...rest } = f;
        return { ...rest };
      });
    setDetail((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        ...presetFieldsToAdd.map(
          (f) =>
            ({
              ...f,
              uid: `${Math.random() * 1000000}`,
              rule_uid: '',
              need_store: 1,
              create_time: '',
              update_time: '',
            }) as const,
        ),
      ],
    }));
  }, [presetFields]);
  const addPresetField = useCallback(() => {
    console.log('新增预设字段');
    modal.confirm({
      title: '新增预设字段',
      width: '48vw',
      centered: true,
      icon: null,
      content: (
        <Select
          options={presetFieldOptions}
          size="large"
          style={{ width: '100%', margin: '24px 0' }}
          mode="multiple"
          allowClear
          placeholder="请选择或搜索预设字段"
          onChange={(value: number[]) => {
            selectedPresetFields.current = value;
          }}
          optionRender={(option) =>
            `${option.data.label} - ${option.data.value_type} - ${option.data.parsing_rule}`
          }
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
      okText: '确认添加',
      cancelText: '取消',
      onOk: onAddPresetField,
    });
  }, [modal, onAddPresetField, presetFieldOptions]);

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

  if (!uid || !isInit.current)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-4">
        <Spin />
        <p>加载数据中，请稍候...</p>
      </div>
    );

  return (
    <ContentLayout
      breadcrumb={[
        {
          title: <Link to="/rules_management/struct_rules">病历模版</Link>,
        },
        { title: '编辑模版' },
      ]}
      title={isNewRule.current ? '新建病历模板' : '编辑病历模板'}
      action={
        <Button
          type="primary"
          onClick={() => {
            console.log('点击保存按钮');
            console.log('最新 detail:', {
              ...baseForm.getFieldsValue(),
              category: detail.category,
              fields: detail.fields,
              code_snippets: codeSnippetForm.getFieldsValue(),
            });
          }}
        >
          保存
        </Button>
      }
    >
      <div className="flex h-full">
        <div className="flex-1 w-[calc(100%_-_200px_-_200px_-_24px)] overflow-auto">
          <Card className="h-[220px]" title="基本信息">
            <Form
              form={baseForm}
              className="w-full h-full"
              initialValues={detail}
            >
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
            </Form>
          </Card>

          <Card title="大字段" className="mt-[12px]">
            <CategoryTable
              detail={detail}
              form={categoryForm}
              onChange={(list) => {
                console.log('新 category', list);
              }}
            />
          </Card>

          <Card
            title="明细字段"
            className="mt-[12px]"
            extra={[
              <Button key="addPresetField" onClick={addPresetField}>
                添加预设字段
              </Button>,
            ]}
          >
            <FieldTable
              form={fieldForm}
              detail={detail}
              onChange={(list) => {
                console.log('新 fields', list);
              }}
            />
          </Card>

          <Card title="后处理代码片段" className="mt-[12px]">
            <Form
              form={codeSnippetForm}
              className="w-full h-full"
              initialValues={detail.code_snippets || [{ content: '' }]}
            >
              <Form.Item<StructRule.Detail['code_snippets']>
                name={[0, 'content']}
                className="h-[500px]"
              >
                <MonacoEditor />
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className="ml-[12px] w-[220px] shrink-0 grow-0 h-full">
          <Card title="预览" className="h-full">
            <Preview categories={detail.category} fields={detail.fields} />
          </Card>
        </div>
      </div>
    </ContentLayout>
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
