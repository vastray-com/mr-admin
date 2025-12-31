import { App, Modal, Upload } from 'antd';
import { type FC, useCallback, useState } from 'react';
import { ls } from '@/utils/ls';
import { service } from '@/utils/service';
import type { UploadChangeParam } from 'antd/es/upload';

type Opt = {
  title: string;
  path: string;
  onFailed?: () => void;
  onSucceed?: () => void;
};
export const useFileImport = ({ title, path, onFailed, onSucceed }: Opt) => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);

  const onFileImportChange = useCallback(
    (v: UploadChangeParam) => {
      console.log('上传文件变化:', v);
      const msgKey = 'upload-message';
      if (v.file.status === 'uploading') {
        message.loading({
          key: msgKey,
          content: '正在上传文件...',
          duration: 0,
        });
      } else if (v.file.status === 'error') {
        message.error({
          key: msgKey,
          content: `文件上传失败: ${(typeof v.file.response === 'string' ? v.file.response : v.file.response?.message) || '未知错误'}`,
        });
        onFailed?.();
      } else if (v.file.status === 'done') {
        message.success({
          key: msgKey,
          content: '文件上传成功!',
        });
        onSucceed?.();
        // 关闭弹窗
        setOpen(false);
      }
    },
    [message, onFailed, onSucceed],
  );

  const FileImportModal: FC = () => {
    return (
      <Modal
        open={open}
        title={title}
        width="64vw"
        centered
        footer={null}
        closable
        onCancel={() => setOpen(false)}
      >
        <Upload.Dragger
          accept=".zip"
          action={`${service.defaults.baseURL}${path}`}
          headers={{ Authorization: `Bearer ${ls.token.get()}` }}
          showUploadList={false}
          onChange={onFileImportChange}
          pastable
        >
          <i className="i-icon-park-outline:folder-upload text-[48px] text-[#3875F6]" />
          <p className="pt-[24px] pb-[8px] text-fg-primary text-[16px]">
            单击或将文件拖到此区域上传
          </p>
          <p className="text-fg-tertiary">
            仅支持本页面导出的压缩包文件（.zip），请勿上传其他格式文件。
          </p>
        </Upload.Dragger>
      </Modal>
    );
  };

  return {
    FileImportModal,
    openFileImportModal: () => setOpen(true),
  };
};
