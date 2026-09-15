import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Modal,
  Segmented,
  Spin,
  Table,
  Tag,
} from 'antd';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { Markdown } from '@/components/Markdown';
import { useApi } from '@/hooks/useApi';
import { downloadFile } from '@/utils/helper';
import type { TableProps } from 'antd';
import type { Workspace as WorkspaceType } from '@/typing/workspace';

/** 预览弹窗的展示模式：渲染 Markdown 或查看原始文本 */
type PreviewMode = 'render' | 'source';

/** 按扩展名识别的 Markdown 文件后缀 */
const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mkdn'];

/** 根据文件名判断是否为 Markdown 文件 */
const isMarkdownFile = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MARKDOWN_EXTENSIONS.includes(ext);
};

/** 从接口异常中提取可读错误信息 */
const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = err.response?.data?.message || err.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
};

/** 字节数格式化为可读文本 */
const formatSize = (size: number): string => {
  if (!size) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

/**
 * 智能体文件工作区（沙箱）
 * 浏览工作区目录、在线预览文本文件并下载文件；所有文件都位于 `<工作目录>/workspace` 沙箱内。
 */
const WorkspacePage: FC = () => {
  const { workspaceApi } = useApi();
  const { message } = App.useApp();

  const [listing, setListing] = useState<WorkspaceType.Listing>();
  const [loading, setLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<WorkspaceType.FilePreview>();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('render');

  /** 拉取指定目录（缺省为根目录）的文件列表 */
  const fetchList = useCallback(
    async (target = '') => {
      setLoading(true);
      try {
        const res = await workspaceApi.list(target);
        if (res.code === 200 && res.data) {
          setListing(res.data);
        } else {
          message.error(res.message || '获取工作区文件失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '获取工作区文件失败'));
      } finally {
        setLoading(false);
      }
    },
    [workspaceApi, message],
  );

  // 对话中的文件交付物链接会携带 path（目录）/ file（文件名）参数，用于定位到目标文件
  const location = useLocation();
  const locatedKeyRef = useRef<string | null>(null);

  /** 打开文件预览弹窗 */
  const openPreview = useCallback(
    async (path: string) => {
      setPreviewData(undefined);
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewMode('render');
      try {
        const res = await workspaceApi.preview(path);
        if (res.code === 200 && res.data) {
          setPreviewData(res.data);
        } else {
          message.error(res.message || '预览失败');
          setPreviewOpen(false);
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '预览失败'));
        setPreviewOpen(false);
      } finally {
        setPreviewLoading(false);
      }
    },
    [workspaceApi, message],
  );

  // 每次导航进入本页时按 URL 参数定位：列出目标目录，若指定了文件则直接打开预览
  useEffect(() => {
    if (locatedKeyRef.current === location.key) {
      return;
    }
    locatedKeyRef.current = location.key;
    const params = new URLSearchParams(location.search);
    const dir = params.get('path') ?? '';
    void fetchList(dir);
    const file = params.get('file');
    if (file) {
      void openPreview(dir ? `${dir}/${file}` : file);
    }
  }, [location.key, location.search, fetchList, openPreview]);

  /** 下载文件（浏览器保存到本地） */
  const onDownload = useCallback(
    async (entry: WorkspaceType.Entry) => {
      try {
        const res = await workspaceApi.download(entry.path);
        downloadFile(res);
      } catch (error) {
        message.error(getApiErrorMessage(error, '下载失败'));
      }
    },
    [workspaceApi, message],
  );

  const openDir = useCallback(
    (entry: WorkspaceType.Entry) => void fetchList(entry.path),
    [fetchList],
  );

  // 面包屑：工作区 / 一级目录 / 二级目录 …
  const crumbs = useMemo(() => {
    const segments = (listing?.path ?? '').split('/').filter(Boolean);
    const items: { title: React.ReactNode }[] = [
      {
        title: (
          <Button
            type="link"
            className="!p-0"
            onClick={() => void fetchList('')}
          >
            工作区
          </Button>
        ),
      },
    ];
    let accumulated = '';
    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      const target = accumulated;
      items.push({
        title: (
          <Button
            type="link"
            className="!p-0"
            onClick={() => void fetchList(target)}
          >
            {segment}
          </Button>
        ),
      });
    }
    return items;
  }, [listing?.path, fetchList]);

  const columns: TableProps<WorkspaceType.Entry>['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name: string, record) => (
        <Button
          type="link"
          className="!px-0"
          icon={
            <i
              className={
                record.is_dir
                  ? 'i-icon-park-outline:folder text-[16px]'
                  : 'i-icon-park-outline:file-text text-[16px]'
              }
            />
          }
          onClick={() =>
            record.is_dir ? openDir(record) : void openPreview(record.path)
          }
        >
          {name}
        </Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'is_dir',
      width: 110,
      render: (isDir: boolean) =>
        isDir ? <Tag color="blue">文件夹</Tag> : <Tag>文件</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 120,
      render: (size: number, record) =>
        record.is_dir ? '-' : formatSize(size),
    },
    {
      title: '修改时间',
      dataIndex: 'modified_at',
      width: 180,
      render: (value?: string | null) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) =>
        record.is_dir ? (
          <Button type="link" onClick={() => openDir(record)}>
            打开
          </Button>
        ) : (
          <>
            <Button type="link" onClick={() => void openPreview(record.path)}>
              预览
            </Button>
            <Button type="link" onClick={() => void onDownload(record)}>
              下载
            </Button>
          </>
        ),
    },
  ];

  // 当前预览文件是否为 Markdown（决定是否提供渲染/源码切换）
  const isMarkdownPreview = !!previewData && isMarkdownFile(previewData.name);

  return (
    <ContentLayout
      title="文件"
      action={
        <Button onClick={() => void fetchList(listing?.path ?? '')}>
          刷新
        </Button>
      }
    >
      <Card>
        <Alert
          className="mb-[16px]"
          type="info"
          showIcon
          message="该目录为智能体文件沙箱，智能体的所有文件读写都限制在此目录内；浏览与下载均不会越出该目录。"
        />

        <div className="mb-[12px] flex items-center justify-between">
          <Breadcrumb items={crumbs} />
          {listing?.parent != null && (
            <Button
              type="link"
              onClick={() => void fetchList(listing.parent ?? '')}
            >
              返回上级
            </Button>
          )}
        </div>

        <Table<WorkspaceType.Entry>
          rowKey="path"
          loading={loading}
          dataSource={listing?.entries ?? []}
          columns={columns}
          pagination={false}
          onRow={(record) => ({
            onDoubleClick: () =>
              record.is_dir ? openDir(record) : void openPreview(record.path),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        centered
        open={previewOpen}
        title={
          <div className="flex items-center justify-between gap-[16px] pr-[24px]">
            <span className="truncate">{previewData?.name ?? '文件预览'}</span>
            {isMarkdownPreview && !previewLoading && (
              <Segmented<PreviewMode>
                size="small"
                value={previewMode}
                options={[
                  { label: '渲染', value: 'render' },
                  { label: '源码', value: 'source' },
                ]}
                onChange={setPreviewMode}
              />
            )}
          </div>
        }
        footer={null}
        width={860}
        onCancel={() => setPreviewOpen(false)}
      >
        {previewData?.truncated && (
          <Alert
            className="mb-[12px]"
            type="warning"
            showIcon
            message="文件较大，仅展示前 512 KB 内容，完整内容请下载查看。"
          />
        )}
        {previewLoading ? (
          <div className="flex justify-center py-[40px]">
            <Spin />
          </div>
        ) : isMarkdownPreview && previewMode === 'render' ? (
          <div className="max-h-[60vh] overflow-auto rounded-[6px] bg-black/5 p-[12px]">
            <Markdown content={previewData?.content ?? ''} />
          </div>
        ) : (
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all rounded-[6px] bg-black/5 p-[12px] text-[13px] leading-relaxed">
            {previewData?.content ?? ''}
          </pre>
        )}
      </Modal>
    </ContentLayout>
  );
};

export default WorkspacePage;
