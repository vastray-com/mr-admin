import {
  App,
  Button,
  Card,
  Dropdown,
  Empty,
  Flex,
  Form,
  type MenuProps,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useDownloadDataset } from '@/hooks/useDownloadDataset';
import { usePaginationData } from '@/hooks/usePaginationData';
import { CreateDatasetModal } from '@/pages/DatasetManagement/components/CreateDatasetModal';
import { datasetFilterDB2FE } from '@/pages/DatasetManagement/helper';
import { useUserStore } from '@/store/useUserStore';
import { ENUM_VARS, UserRole } from '@/typing/enum';
import { DatasetSourceType, DatasetType } from '@/typing/enum/dataset';
import type { Dataset } from '@/typing/dataset';
import type { User } from '@/typing/user';

const DatasetListPage = () => {
  const nav = useNavigate();
  const { datasetApi, userApi } = useApi();
  const { message } = App.useApp();

  const { showDownloadModal, DownloadModal } = useDownloadDataset();

  // 拉取列表分页数据
  const [data, setData] = useState<Dataset.List>([]);
  const { refresh } = usePaginationData({
    fetchData: datasetApi.getDatasetList,
    setData: setData,
  });

  const user = useUserStore((s) => s.user);
  const [userList, setUserList] = useState<User.List | null>(null);
  if (user?.role === UserRole.Admin && !userList) {
    userApi
      .getList({ page_num: 1, page_size: 99999 })
      .then((res) => setUserList(res.data.data));
  }

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
      <DownloadModal />

      <CreateDatasetModal
        form={form}
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onFinish={() => refresh()}
      />

      <ContentLayout title="数据集列表">
        {data.length < 1 && (
          <div className="h-[300px] flex items-center justify-center">
            <Empty
              description={
                <p className="flex flex-col gap-y-[4px]">
                  <span>暂无数据集</span>
                  <span>请先去数据查询进行创建</span>
                </p>
              }
              className="mt-[50px]"
            />
          </div>
        )}

        <Flex wrap="wrap" gap="20px" className="py-[5px]">
          {data.map((item) => (
            <Card
              className="min-w-[360px] w-[calc((100%_-_20px_-_20px)_/_3)] shrink-0 grow-0 hover:bg-[#fffc] transition-all"
              key={item.uid}
              actions={[
                <Button
                  key="task"
                  type="link"
                  disabled={!item.task_uid}
                  onClick={() =>
                    item.task_uid
                      ? nav(`/task_management/detail/${item.task_uid}`)
                      : console.log('没有关联任务')
                  }
                >
                  {/*<i className="i-icon-park-outline:rotating-forward text-[18px]" />*/}
                  <span>查看任务</span>
                </Button>,
                <Button
                  key="download"
                  type="link"
                  onClick={() =>
                    showDownloadModal({
                      datasetUid: item.uid,
                      datasetType: item.dataset_type,
                    })
                  }
                >
                  {/*<i className="i-icon-park-outline:database-download text-[20px]" />*/}
                  <span>下载数据集</span>
                </Button>,
              ]}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <Tooltip
                    title={item.warning_msg ? item.warning_msg : '无异常'}
                    color={item.warning_msg ? 'orange' : 'green'}
                  >
                    <div className="mr-[4px] flex justify-center items-center">
                      {item.warning_msg ? (
                        <i className="i-icon-park-solid:attention bg-[#faad14] text-[18px]" />
                      ) : (
                        <i className="i-icon-park-solid:check-one bg-[#52C41A] text-[18px]" />
                      )}
                    </div>
                  </Tooltip>

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

                {user?.role === UserRole.Admin && (
                  <p className="text-fg-tertiary mt-[8px] flex items-center gap-x-[8px]">
                    <span>创建人</span>
                    <span className="text-fg-primary">
                      {userList?.find((u) => u.uid === item.creator)
                        ?.username ?? '-'}
                    </span>
                  </p>
                )}

                <p className="text-fg-tertiary mt-[8px] flex items-center gap-x-[8px]">
                  <span>创建于</span>
                  <span className="text-fg-primary">
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </p>
              </div>
            </Card>
          ))}
        </Flex>
      </ContentLayout>
    </>
  );
};

export default DatasetListPage;
