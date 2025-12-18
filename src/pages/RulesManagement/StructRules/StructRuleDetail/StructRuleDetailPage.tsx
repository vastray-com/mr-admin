import {
  App,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  Modal,
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
  StructRuleFieldParsingType,
  StructRuleFieldValueType,
  StructRuleStatus,
  structRuleFieldMappingTypeOptions,
  structRuleFieldParsingTypeOptions,
  structRuleFieldValueTypeOptions,
} from '@/typing/enum';
import { generateCurlExample } from '@/utils/helper';
import { getCode } from '@/utils/highlighter';
import type { StructRule } from '@/typing/structRules';

const initialDetail: StructRule.Detail = {
  uid: '',
  name_cn: '',
  name_en: '',
  comment: '',
  status: StructRuleStatus.Enabled,
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

  const [openPresetModal, setOpenPresetModal] = useState(false);
  const [selectedPresetFields, setSelectedPresetFields] = useState<
    (number | string)[]
  >([]);
  const [searchField, setSearchField] = useState('');
  const onAddPresetField = useCallback(async () => {
    console.log('添加字段:', selectedPresetFields);
    const fieldsToAdd = selectedPresetFields.map((item) => {
      // 如果是预设字段
      if (typeof item === 'number') {
        const presetField = presetFields.find((f) => f.id === item);
        if (presetField) {
          const { id, ...rest } = presetField;
          return {
            ...rest,
            uid: `${Math.random() * 1000000}`,
            need_store: 1,
          } as const;
        }
      }

      // 如果是自定义字段
      return {
        uid: `${Math.random() * 1000000}`,
        name_cn: `${item}`,
        name_en: '',
        data_source: '',
        parsing_type: StructRuleFieldParsingType.LLM,
        parsing_rule: '',
        value_type: StructRuleFieldValueType.Text,
        is_array: false,
        mapping_type: StructRuleFieldMappingType.None,
        mapping_content: '',
        need_store: 1,
      } as const;
    });

    setDetail((prev) => ({
      ...prev,
      fields: [...prev.fields, ...fieldsToAdd],
    }));
    setOpenPresetModal(false);
    setSelectedPresetFields([]);
  }, [presetFields, selectedPresetFields]);

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
      const nameCnList = values.fields.map((field) => field.name_cn);
      const nameEnList = values.fields.map((field) => field.name_en);
      const duplicateNameCn = nameCnList.findIndex(
        (item, index) => nameCnList.indexOf(item) !== index && item,
      );
      if (duplicateNameCn !== -1) {
        message.error(
          `提交失败！明细字段序号 ${duplicateNameCn + 1}【${nameCnList[duplicateNameCn]}】中文名称重复`,
        );
        return;
      }
      const duplicateNameEn = nameEnList.findIndex(
        (item, index) => nameEnList.indexOf(item) !== index && item,
      );
      if (duplicateNameEn !== -1) {
        message.error(
          `提交失败！明细字段 ${duplicateNameEn + 1}【${nameEnList[duplicateNameEn]}】英文名称重复`,
        );
        return;
      }

      const errFieldIdx = values.fields.findIndex((f, idx) => {
        let err = '';
        if (!f.name_cn) {
          err = `提交失败！明细字段序号 ${idx + 1} 数据项名称不能为空`;
        }

        if (!f.name_en) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段名称不能为空`;
        }

        if (
          f.data_source &&
          !values.category.find(
            (c) => `category#${c.name_en}` === f.data_source,
          ) &&
          !values.fields.find(
            (field) => `field#${field.name_en}` === f.data_source,
          )
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 数据来源不合法`;
        }

        if (
          !structRuleFieldParsingTypeOptions.find(
            (item) => item.value === f.parsing_type,
          )
        ) {
          err = `提交失败！明细字段序号 ${idx + 1} 字段来源类型不合法`;
        }

        // if (f.parsing_type === StructRuleFieldParsingType.QuoteResult) {
        //   const isExist = values.fields.find(
        //     (field) => field.name_en === f.parsing_rule,
        //   );
        //   if (!isExist) {
        //     err = `提交失败！明细字段序号 ${idx + 1} 引用结果字段不存在`;
        //   }
        // }

        // if (
        //   !f.parsing_rule &&
        //   f.parsing_type !== StructRuleFieldParsingType.Static
        // ) {
        //   err = `提交失败！明细字段序号 ${idx + 1} 提取规则不能为空`;
        // }

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

  // 测试结构化规则
  const [openTestRuleModal, setOpenTestRuleModal] = useState(false);
  const [testBody, setTestBody] = useState<StructRule.TestRuleParams>({
    uid: uid || '',
    output_filter: [],
    content: '',
    is_thinking: false,
  });
  const [testShowContent, setTestShowContent] = useState<'result' | 'curl'>(
    'result',
  );
  const [testResult, setTestResult] = useState('');
  const [testRuleLoading, setTestRuleLoading] = useState(false);
  const confirmTestRule = useCallback(
    async (body: StructRule.TestRuleParams) => {
      if (!body.uid || !body.content) return;
      console.log('确认测试结构化规则，病历内容为:', body);
      setTestRuleLoading(true);
      // 调用测试接口
      try {
        const res = await ruleApi.testRule(body);
        if (res.code === 200) {
          setTestResult(JSON.stringify(res.data, null, 2));
          message.success('测试结构化规则成功');
          setOpenTestRuleModal(true);
        } else {
          message.error(res.msg || '测试结构化规则失败，请重新测试');
        }
      } catch (_) {
        message.error('测试结构化规则失败，请重新测试');
      } finally {
        setTestRuleLoading(false);
      }
    },
    [ruleApi, message],
  );
  const testCode = useMemo(() => {
    return {
      curl: getCode(
        generateCurlExample('POST', '/admin/structured_rule/test', testBody),
        'sh',
      ),
    };
  }, [testBody]);

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
        <Space>
          <Button onClick={() => setOpenTestRuleModal(true)}>模型提取</Button>
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
        </Space>
      }
    >
      <Modal
        title="添加字段"
        width="48vw"
        open={openPresetModal}
        onOk={onAddPresetField}
        okText="确认添加"
        cancelText="取消"
        centered
        onCancel={() => setOpenPresetModal(false)}
      >
        <Select
          options={presetFieldOptions}
          size="large"
          style={{ width: '100%', margin: '24px 0' }}
          mode="multiple"
          allowClear
          autoClearSearchValue
          placeholder="请选择或搜索预设字段"
          searchValue={searchField}
          onSearch={setSearchField}
          value={selectedPresetFields}
          onChange={(v) => {
            console.log('选择预设字段:', v);
            const isInvalid = v.some((i) => !i && i !== 0);
            if (isInvalid) return;
            setSelectedPresetFields(v);
          }}
          optionRender={(option) =>
            `${option.data.label} - ${option.data.value_type} - ${option.data.parsing_rule}`
          }
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <div className="p-[8px]">
                <Button
                  size="large"
                  block
                  onClick={() => {
                    if (!searchField.trim()) return;
                    setSelectedPresetFields((prev) => [...prev, searchField]);
                    setSearchField('');
                  }}
                >
                  添加为自定义字段
                </Button>
              </div>
            </>
          )}
        />
      </Modal>

      <Modal
        width="64vw"
        styles={{ body: { marginTop: '16px' } }}
        open={openTestRuleModal}
        onOk={() => confirmTestRule(testBody)}
        okText="提取"
        cancelText="取消"
        centered
        confirmLoading={testRuleLoading}
        onCancel={() => setOpenTestRuleModal(false)}
      >
        <div className="flex items-start gap-x-[24px]">
          <div className="w-[24vw] shrink-0 grow-0">
            <h2 className="text-[16px] leading-[56px] font-medium">模型提取</h2>
            <Input.TextArea
              autoSize={{ minRows: 20, maxRows: 20 }}
              style={{ width: '100%' }}
              allowClear
              placeholder="请输入病历内容"
              onChange={(v) =>
                setTestBody((prev) => ({ ...prev, content: v.target.value }))
              }
            />

            <div className="w-full flex items-center mt-[16px]">
              <span className="shrink-0">输出过滤：</span>
              <Select
                mode="multiple"
                value={testBody.output_filter}
                onChange={(v) =>
                  setTestBody((prev) => ({ ...prev, output_filter: v }))
                }
                options={detail.fields
                  .filter((f) => f.name_en)
                  .map((f) => ({
                    label: f.name_cn,
                    value: f.name_en,
                  }))}
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                showSearch
                className="w-full"
                placeholder="选择输出字段，留空则不过滤"
              />
            </div>

            <div className="mt-[16px]">
              <Checkbox
                onChange={(v) =>
                  setTestBody((prev) => ({
                    ...prev,
                    is_thinking: v.target.checked,
                  }))
                }
              >
                开启模型思考
              </Checkbox>
            </div>
          </div>

          <div className="w-full flex-1 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-[16px] leading-[56px] font-medium">
                {testShowContent === 'result'
                  ? '提取结果'
                  : testShowContent === 'curl'
                    ? 'CURL 示例'
                    : ''}
              </h2>
              <div>
                <span>显示内容：</span>
                <Select
                  style={{ width: '200px' }}
                  value={testShowContent}
                  onChange={setTestShowContent}
                  options={[
                    { label: '提取结果', value: 'result' },
                    { label: 'CURL 示例', value: 'curl' },
                  ]}
                />
              </div>
            </div>

            {testShowContent === 'result' ? (
              <Input.TextArea
                autoSize={{ minRows: 24, maxRows: 24 }}
                style={{ width: '100%', fontFamily: 'Monaco, monospace' }}
                readOnly
                value={testResult}
              />
            ) : (
              <code
                className="block bg-[#FAFAFA] b-1 b-[#d9d9d9] h-[532px] p-[16px] rounded-[6px] overflow-auto text-[14px] leading-[1.5]" // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                dangerouslySetInnerHTML={{ __html: testCode[testShowContent] }}
              />
            )}
          </div>
        </div>
      </Modal>

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
              onChange={(category) =>
                setDetail((prev) => ({ ...prev, category }))
              }
            />
          </Card>

          <Card
            title="明细字段"
            className="mt-[12px]"
            extra={
              <Button onClick={() => setOpenPresetModal(true)} type="primary">
                添加字段
              </Button>
            }
          >
            <FieldTable
              form={fieldForm}
              detail={detail}
              onChange={(fields) => setDetail((prev) => ({ ...prev, fields }))}
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
          <Card title="预览" className="h-full overflow-y-auto">
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
          children: [],
        };
      }
    });

    // 再构建父子关系
    process_fields.forEach((f) => {
      const node = nodes[`FIELD_${f.name_en}`];
      if (f.data_source) {
        const [t, n] = f.data_source.split('#');
        if (t === 'category') {
          const parentNode = nodes[`CATEGORY_${n}`];
          if (parentNode) {
            parentNode.children?.push(node);
          }
        } else if (t === 'field') {
          const parentNode = nodes[`FIELD_${n}`];
          if (parentNode) {
            parentNode.children?.push(node);
          }
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
      if (!f.data_source && f.name_en && f.name_cn) {
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
