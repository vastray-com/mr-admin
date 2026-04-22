import { useCallback, useState } from 'react';
import { DownloadDatasetModal } from '@/components/Modal/downloadDatasetModal';
import { useApi } from '@/hooks/useApi';
import type { DownloadTask } from '@/typing/downloadTask';
import type { DatasetType } from '@/typing/enum/dataset';

type Params = {
  datasetUid: string;
  datasetType: DatasetType;
};

export const useDownloadDataset = () => {
  const { downloadTaskApi } = useApi();

  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Params | null>(null);

  // 模版
  const [fetching, setFetching] = useState<boolean>(false);
  const [templates, setTemplates] = useState<DownloadTask.Templates | null>(
    null,
  );
  const fetchTemplates = useCallback(async () => {
    setFetching(true);
    const res = await downloadTaskApi.getTemplateList();
    console.log('拉取下载模版成功:', res);
    setTemplates(res.data);
    setFetching(false);
  }, [downloadTaskApi]);

  // 打开弹窗
  const showDownloadModal = useCallback((params: Params) => {
    setParams(params);
    setOpen(true);
  }, []);

  // 弹窗组件
  const DownloadModal = useCallback(() => {
    if (fetching) {
      return null;
    }

    if (!templates) {
      fetchTemplates();
      return null;
    }

    return params ? (
      <DownloadDatasetModal
        onClose={() => setOpen(false)}
        datasetUid={params.datasetUid}
        datasetType={params.datasetType}
        templates={templates}
        open={open}
      />
    ) : null;
  }, [open, fetching, templates, params]);

  return {
    showDownloadModal,
    DownloadModal,
  };
};
