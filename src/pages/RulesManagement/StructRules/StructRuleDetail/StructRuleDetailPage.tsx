import {
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Tree,
} from 'antd';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { MonacoEditor } from '@/components/MonacoEditor';
import { useApi } from '@/hooks/useApi';
import CategoryTable from '@/pages/RulesManagement/StructRules/StructRuleDetail/components/CategoryTable';
import FieldTable from '@/pages/RulesManagement/StructRules/StructRuleDetail/components/FieldTable';
import { useCacheStore } from '@/store/useCacheStore';
import {
  StructRuleFieldMappingType,
  StructRuleFieldSourceType,
  StructRuleFieldValueType,
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
  const [categoryForm] = Form.useForm<StructRule.Category>();
  const [fieldForm] = Form.useForm<StructRule.Field>();
  const [codeSnippetForm] = Form.useForm<{ content: '' }>();

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
              need_store: 1,
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
  const encodeOptions = useCacheStore((s) => s.encodeOptions);
  const onFinish = useCallback(
    async (values: StructRule.Detail) => {
      console.log('保存病历模板:', values);

      // 校验大字段
      const errCategoryIdx = values.category.findIndex((c, idx) => {
        let err = '';
        if (!c.name_cn) {
          err = `提交失败！大字段序号 ${idx + 1} 提取字段名称不能为空`;
        }
        if (!c.name_en) {
          err = `提交失败！大字段序号 ${idx + 1} 字段名称不能为空`;
        }
        if (!c.content) {
          err = `提交失败！大字段序号 ${idx + 1} 提取规则不能为空`;
        }
        if (err) {
          message.error(err);
          return true;
        }
      });
      if (errCategoryIdx !== -1) return;

      // 校验明细字段
      const errFieldIdx = values.fields.findIndex((f, idx) => {
        let err = '';
        if (!f.name_cn) {
          err = `提交失败！明细字段序号 ${idx + 1} 数据项名称不能为空`;
        }
        if (!f.name_en) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段名称不能为空`;
        }

        if (
          f.category_name &&
          !values.category.find((c) => c.name_en === f.category_name)
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 所属大字段不存在`;
        }

        if (
          !structRuleFieldSourceTypeOptions.find(
            (item) => item.value === f.source_type,
          )
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段来源类型不合法`;
        }

        if (f.source_type === StructRuleFieldSourceType.QuoteResult) {
          const isExist = values.fields.find(
            (field) => field.name_en === f.parsing_rule,
          );
          if (!isExist) {
            err = `提交失败！明细字段序号 ${idx + 1} 引用结果字段不存在`;
          }
        }

        if (!f.parsing_rule) {
          err = `提交失败！明细字段序号 ${idx + 1} 提取规则不能为空`;
        }

        if (
          !structRuleFieldValueTypeOptions.find(
            (item) => item.value === f.value_type,
          )
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段值类型不合法`;
        }

        if (
          structRuleFieldMappingTypeOptions.find(
            (item) => item.value === f.mapping_type,
          ) === undefined
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段映射类型不合法`;
        }

        if (
          f.mapping_type === StructRuleFieldMappingType.Encode &&
          !encodeOptions.find((o) => o.value === f.mapping_content)
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段映射码表不存在`;
        }

        if (err) {
          message.error(err);
          return true;
        }
      });
      if (errFieldIdx !== -1) return;

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
    [ruleApi, message, nav, encodeOptions],
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
          onClick={() =>
            onFinish({
              ...detail,
              ...baseForm.getFieldsValue(),
              category: detail.category,
              fields: detail.fields,
              code_snippets: codeSnippetForm.getFieldValue('content')
                ? [
                    {
                      content: codeSnippetForm.getFieldValue(
                        'content',
                      ) as string,
                    },
                  ]
                : [],
            })
          }
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

          <Card
            title="大字段"
            className="mt-[12px]"
            extra={
              <Button
                onClick={() => {
                  setDetail((prev) => ({
                    ...prev,
                    category: [
                      ...prev.category,
                      {
                        uid: `${Math.random() * 1000000}`,
                        name_cn: '',
                        name_en: '',
                        content: '',
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
            <CategoryTable
              detail={detail}
              form={categoryForm}
              onChange={(list) =>
                setDetail((prev) => ({ ...prev, category: list }))
              }
            />
          </Card>

          <Card
            title="明细字段"
            className="mt-[12px]"
            extra={
              <Space>
                <Button onClick={addPresetField} type="primary">
                  添加预设字段
                </Button>
                <Button
                  onClick={() => {
                    setDetail((prev) => ({
                      ...prev,
                      fields: [
                        ...prev.fields,
                        {
                          uid: `${Math.random() * 1000000}`,
                          name_cn: '',
                          name_en: '',
                          category_name: '',
                          source_type: StructRuleFieldSourceType.LLM,
                          parsing_rule: '',
                          value_type: StructRuleFieldValueType.Text,
                          is_array: false,
                          mapping_type: StructRuleFieldMappingType.None,
                          mapping_content: '',
                          need_store: 1,
                        },
                      ],
                    }));
                  }}
                >
                  添加新字段
                </Button>
              </Space>
            }
          >
            <FieldTable
              form={fieldForm}
              detail={detail}
              onChange={(list) =>
                setDetail((prev) => ({ ...prev, fields: list }))
              }
            />
          </Card>

          <Card title="后处理代码片段" className="mt-[12px]">
            <Form
              form={codeSnippetForm}
              className="w-full h-full"
              initialValues={detail.code_snippets[0] || { content: '' }}
            >
              <Form.Item<{ content: string }>
                name="content"
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
