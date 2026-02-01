import { Button, Card, Flex, Form, message, Select } from 'antd';
import { useCallback, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { CreateDatasetModal } from '@/pages/DatasetManagement/components/CreateDatasetModal';
import { DatasetFilterForm } from '@/pages/DatasetManagement/components/DatasetFilterForm';
import { WarehouseDataTable } from '@/pages/DatasetManagement/components/WarehouseDataTable';
import { datasetFilterFE2DB } from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';

const WarehouseDataPreviewPage = () => {
  // 新建数据集
  const [form] = Form.useForm<Dataset.InputCreateParams>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    setShowCreateModal(true);
  };

  // 过滤数据
  const [filter, setFilter] = useState<Dataset.Filter | null>(null);
  const onFilterFinish = useCallback(async () => {
    form
      .validateFields(['filter', 'source_type'], {
        recursive: true,
      })
      .then((v) => {
        if (!v.filter || v.filter.length === 0) {
          message.warning('请至少设置一个过滤器');
          return;
        }
        console.log('过滤条件：', v.filter);
        const f = datasetFilterFE2DB(v.filter);
        console.log('转换后过滤条件：', f);
        setFilter(f);
      })
      .catch((e) => {
        console.log('表单验证失败：', e);
        message.error('过滤条件填写有误，请检查后重试');
      });
  }, [message]);

  return (
    <>
      <CreateDatasetModal
        form={form}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ContentLayout title="明细数据列表">
        <Card
          actions={[
            <Flex
              key="group"
              gap={8}
              className="items-center justify-end px-[24px]"
            >
              <Button onClick={onFilterFinish}>查询数据</Button>
              <Button type="primary" onClick={onCreate}>
                以此条件创建数据集
              </Button>
            </Flex>,
          ]}
        >
          <div className="overflow-y-scroll max-h-[440px] pr-[12px]">
            <Form<Dataset.InputCreateParams>
              form={form}
              name="filter-dataset-form"
              onFinish={onFilterFinish}
              onFinishFailed={(v) => {
                console.log('表单提交失败：', v);
              }}
              autoComplete="off"
              labelCol={{ span: 1 }}
              requiredMark={false}
            >
              <Form.Item<Dataset.InputCreateParams>
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
                form={form}
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
