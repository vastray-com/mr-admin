import {
  Alert,
  App,
  Button,
  Card,
  Dropdown,
  Flex,
  Form,
  type MenuProps,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { CreateDatasetModal } from '@/pages/DatasetManagement/components/CreateDatasetModal';
import { datasetFilterDB2FE } from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import { DatasetSourceType, DatasetType } from '@/typing/enum/dataset';
import type { Dataset } from '@/typing/dataset';

const DatasetListPage = () => {
  const nav = useNavigate();
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<Dataset.List>([]);
  const { refresh } = usePaginationData({
    fetchData: datasetApi.getDatasetList,
    setData: setData,
  });

  // 复制数据集
  const [form] = Form.useForm<Dataset.InputCreateParams>();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const newDatasetData = useRef<Dataset.InputCreateParams | null>(null);
  const onCopy = (record: Dataset.Item) => {
    newDatasetData.current = {
      name_cn: `${record.name_cn}_Copy`,
      name_en: '',
      dataset_type: record.dataset_type,
      source_type: record.source_type,
      filter: datasetFilterDB2FE(record.filter),
    };
    console.log('复制的数据集：', newDatasetData.current);
    form.setFieldsValue(newDatasetData.current);
    // 打开新建任务模态框
    setShowCopyModal(true);
  };

  // 数据集操作
  const onAction = useCallback(
    (uid: string, action: Dataset.ActionParams['action']) => {
      console.log(`执行操作：${action}，数据集 ID：${uid}`);
      if (action === 'delete') {
        datasetApi
          .deleteDataset(uid)
          .then((res) => {
            if (res.code === 200) {
              message.success(`操作成功`);
              // 刷新任务列表
              refresh();
            } else {
              message.error(`操作失败：${res.message}`);
            }
          })
          .catch((err) => {
            console.error(`操作任务失败：`, err);
            message.error('操作任务失败，请稍后重试');
          });
      }
    },
    [datasetApi, refresh, message.error, message.success],
  );

  const actions = useCallback(
    (item: Dataset.Item): MenuProps['items'] => [
      {
        key: 'copy',
        label: (
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(item);
            }}
          >
            复制
          </Button>
        ),
      },
      {
        key: 'delete',
        label: (
          <Button
            type="link"
            danger
            onClick={(e) => {
              e.stopPropagation();
              onAction(item.uid, 'delete');
            }}
          >
            删除
          </Button>
        ),
      },
    ],
    [onAction, onCopy],
  );

  return (
    <>
      <CreateDatasetModal
        form={form}
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onFinish={() => refresh()}
      />

      <ContentLayout title="数据集列表">
        <Flex wrap="wrap" gap="20px" className="py-[5px]">
          {data.map((item) => (
            <Card
              className="min-w-[360px] w-[calc((100%_-_20px_-_20px)_/_3)] shrink-0 grow-0 hover:bg-[#fffc] transition-all"
              key={item.uid}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <Typography.Text
                    ellipsis={{ tooltip: item.name_cn }}
                    className="text-[18px] font-medium grow-1 shrink-1 cursor-pointer hover:text-blue-500 hover:translate-x-[3px] transition-all"
                    onClick={() => nav(`/data/dataset/detail/${item.uid}`)}
                  >
                    {item.name_cn}
                  </Typography.Text>

                  <Dropdown menu={{ items: actions(item) }}>
                    <Button
                      className="px-[4px] grow-0 shrink-0"
                      type="text"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="i-icon-park-outline:more-one text-[28px]" />
                    </Button>
                  </Dropdown>
                </div>

                <div className="mt-[8px] flex items-center gap-x-[8px]">
                  <Tag
                    variant="outlined"
                    color={
                      item.source_type === DatasetSourceType.Inpatient
                        ? 'orange'
                        : item.source_type === DatasetSourceType.Outpatient
                          ? 'purple'
                          : ''
                    }
                  >
                    {ENUM_VARS.DATASET.SOURCE_TYPE_MAP[item.source_type]}
                  </Tag>
                  <Tag
                    variant="outlined"
                    color={
                      item.dataset_type === DatasetType.Subscribe
                        ? 'geekblue'
                        : item.dataset_type === DatasetType.Review
                          ? 'magenta'
                          : ''
                    }
                  >
                    {ENUM_VARS.DATASET.TYPE_MAP[item.dataset_type]}
                  </Tag>
                </div>

                <p className="text-fg-tertiary mt-[16px] flex items-center gap-x-[8px]">
                  <span className="w-[40px]">UID</span>
                  <span className="text-fg-primary">{item.uid}</span>
                </p>

                <p className="text-fg-tertiary mt-[16px] flex items-center gap-x-[8px]">
                  <span>创建于</span>
                  <span className="text-fg-primary">
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </p>

                <div className="mt-[16px]">
                  {item.warning_msg ? (
                    <Alert title={item.warning_msg} type="warning" showIcon />
                  ) : // <Alert title="无异常" type="success" showIcon />
                  null}
                </div>
              </div>
            </Card>
          ))}
        </Flex>
      </ContentLayout>
    </>
  );
};

export default DatasetListPage;
