import { useCallback, useEffect, useState } from 'react';
import { DownloadDatasetModal } from '@/components/Modal/downloadDatasetModal';
import { useApi } from '@/hooks/useApi';
import type { DownloadTask } from '@/typing/downloadTask';
import type { DatasetType } from '@/typing/enum/dataset';

type Params = {
  datasetUid: string;
  datasetType: DatasetType;
};

export const useDownloadDataset = () => {
  const { downloadTemplateApi } = useApi();

  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<Params | null>(null);

  // 模版
  const [fetching, setFetching] = useState<boolean>(false);
  const [templates, setTemplates] = useState<DownloadTask.Templates | null>(
    null,
  );
  const fetchTemplates = useCallback(async () => {
    setFetching(true);
    try {
      const res = await downloadTemplateApi.getTemplateList({
        page_num: 1,
        page_size: 200,
      });
      console.log('拉取下载模版成功:', res);
      setTemplates(
        (res.data.data ?? []).map((item) => ({
          uid: item.uid,
          name: item.name,
          tag: item.tag,
          creator_name: item.creator_name,
        })),
      );
    } finally {
      setFetching(false);
    }
  }, [downloadTemplateApi]);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

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
