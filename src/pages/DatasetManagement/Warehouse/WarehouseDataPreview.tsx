import { App, Button, Card, Flex, Form, Input, Select } from 'antd';
import { type FC, useCallback, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import {
  AIGenBtnStyle,
  AIGenFilterModal,
} from '@/pages/DatasetManagement/components/AIGenFilterModal';
import { CreateDatasetModal } from '@/pages/DatasetManagement/components/CreateDatasetModal';
import { DatasetFilterForm } from '@/pages/DatasetManagement/components/DatasetFilterForm';
import { WarehouseDataTable } from '@/pages/DatasetManagement/components/WarehouseDataTable';
import { datasetFilterFE2DB } from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import type { AxiosError } from 'axios';
import type { Dataset } from '@/typing/dataset';
import type { DatasetSourceType } from '@/typing/enum/dataset';

const aiGenPlaceholder = `你可以说帮我查询 2026 年入院的有吸烟史的肺癌患者...
`;

type Props = {
  generating: boolean;
  value: string;
  onChange: (content: string) => void;
  onGenerate: () => void;
  onSwitchToManual: () => void;
};

const DefaultPage: FC<Props> = ({
  generating,
  value,
  onChange,
  onGenerate,
  onSwitchToManual,
}) => {
  return (
    <div
      className="w-full h-full flex flex-col justify-center items-center gap-y-[16px]"
      style={{ background: 'linear-gradient(135deg,#c621e522,#7d7cf922)' }}
    >
      <h1 className="font-bold text-[28px]">你想要查询什么数据？</h1>
      <div className="w-[48vw]">
        <div className="flex gap-x-[12px] h-[48px]">
          <Input
            className="text-[16px] bg-[#fff8] h-full"
            style={{
              '--ant-input-active-border-color': '#c621e5',
              '--ant-input-hover-border-color': '#c621e599',
              '--ant-input-hover-bg': '#ffffffaa',
              '--ant-input-active-bg': '#ffffffee',
            }}
            value={value}
            onChange={(v) => onChange(v.target.value)}
            placeholder={aiGenPlaceholder}
            disabled={generating}
          />
          <Button
            onClick={onGenerate}
            className="h-full aspect-ratio-[5/3] text-[#fffb] important:not-disabled:hover:text-[#fff] disabled:hover:text-[#aaa] disabled:text-[#aaa]"
            style={!value.trim() || generating ? {} : AIGenBtnStyle}
            disabled={!value.trim() || generating}
          >
            {!generating ? (
              <i className="i-icon-park-outline:send text-[24px] text-inherit" />
            ) : (
              <i className="i-icon-park-outline:loading-four text-[24px] text-inherit infinite-rotate" />
            )}
          </Button>
        </div>

        <Button
          type="link"
          onClick={onSwitchToManual}
          className="mt-[12px]"
          disabled={generating}
        >
          <i className="i-icon-park-outline:switch" />
          切换到手动配置
        </Button>
      </div>
    </div>
  );
};

const WarehouseDataPreviewPage = () => {
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  // 显示默认页面
  const [showDefaultPage, setShowDefaultPage] = useState(true);

  // 过滤数据表单
  const [filterForm] = Form.useForm<Dataset.GetDataParams>();
  // 新建数据集表单
  const [createForm] = Form.useForm<Dataset.InputCreateParams>();

  // 创建数据集
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    createForm.resetFields();
    const filterFormValues = filterForm.getFieldsValue();
    createForm.setFieldsValue({
      source_type: filterFormValues.source_type,
      filter: filterFormValues.filter,
    });
    setShowCreateModal(true);
  };

  // 过滤数据
  const [filter, setFilter] = useState<Dataset.Filter | null>(null);
  const onFilterFinish = useCallback(() => {
    filterForm
      .validateFields()
      .then((values) => {
        if (!values.filter || values.filter.length === 0) {
          message.warning('请至少设置一个过滤器');
          return;
        }
        console.log('过滤条件：', values.filter);
        const f = datasetFilterFE2DB(values.filter);
        console.log('转换后过滤条件：', f);
        setFilter(f);
      })
      .catch((e) => {
        console.log('表单验证失败：', e);
        message.error('过滤条件填写有误，请检查后重试');
      });
  }, [message]);

  // AI 生成过滤条件
  const [generating, setGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenContent, setAiGenContent] = useState('');
  const onGenerate = useCallback(
    async (content: string) => {
      console.log('开始 AI 生成过滤条件: ', content);
      setGenerating(true);

      try {
        const res = await datasetApi.genAIFilter({ content });
        if (res.code === 200) {
          console.log('AI 生成的过滤条件：', res.data);
          const data = JSON.parse(res.data) as {
            source_type: DatasetSourceType;
            filter: Dataset.FilterFEInput;
          };
          filterForm.setFieldsValue(data);
          message.success('生成成功');
          setShowAIModal(false);
          setShowDefaultPage(false);
        } else {
          message.error(`生成过滤条件失败: ${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('生成过滤条件失败: ', e);
        message.error(
          `生成过滤条件失败: ${e.response?.data.message || e.message}`,
        );
      } finally {
        setGenerating(false);
      }
    },
    [datasetApi, filterForm, message],
  );

  if (showDefaultPage) {
    return (
      <DefaultPage
        value={aiGenContent}
        generating={generating}
        onChange={(v) => setAiGenContent(v)}
        onGenerate={() => onGenerate(aiGenContent)}
        onSwitchToManual={() => setShowDefaultPage(false)}
      />
    );
  }

  return (
    <>
      <CreateDatasetModal
        form={createForm}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <AIGenFilterModal
        open={showAIModal}
        generating={generating}
        placeholder={aiGenPlaceholder}
        value={aiGenContent}
        onChange={(v) => setAiGenContent(v)}
        onClose={() => setShowAIModal(false)}
        onGenerate={() => onGenerate(aiGenContent)}
      />

      <ContentLayout title="数据查询">
        <Card
          actions={[
            <Flex
              key="group"
              gap={8}
              className="items-center justify-between px-[24px]"
            >
              <div>
                <Button
                  type="primary"
                  onClick={() => setShowAIModal(true)}
                  style={AIGenBtnStyle}
                >
                  AI 生成过滤条件
                </Button>
              </div>
              <div className="flex items-center gap-[8px]">
                <Button onClick={onFilterFinish}>查询数据</Button>
                <Button type="primary" onClick={onCreate}>
                  以此条件创建数据集
                </Button>
              </div>
            </Flex>,
          ]}
        >
          <div className="overflow-y-scroll max-h-[440px] pr-[12px]">
            <Form<Dataset.GetDataParams>
              form={filterForm}
              name="filter-dataset-form"
              onFinishFailed={(v) => {
                console.log('表单提交失败：', v);
              }}
              autoComplete="off"
              requiredMark={false}
            >
              <Form.Item<Dataset.GetDataParams>
                label="数据源类型"
                name="source_type"
                rules={[
                  {
                    required: true,
                    message: '请选择数据源类型',
                  },
                ]}
              >
                <Select
                  options={ENUM_VARS.DATASET.SOURCE_TYPE_OPT}
                  placeholder="选择数据源类型"
                />
              </Form.Item>

              <DatasetFilterForm
                name="filter"
                sourceTypeName="source_type"
                form={filterForm}
                cardWidth="540px"
              />
            </Form>
          </div>
        </Card>

        <Card className="mt-[16px]">
          <WarehouseDataTable showMessage filter={filter} />
        </Card>
      </ContentLayout>
    </>
  );
};

export default WarehouseDataPreviewPage;
