// 数据集类型
export enum DownloadTaskStatus {
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Declined = 'declined',
  Exporting = 'exporting',
  Finished = 'finished',
  Failed = 'failed',
}
const STATUS_MAP: Record<DownloadTaskStatus, string> = {
  [DownloadTaskStatus.PendingApproval]: '待审批',
  [DownloadTaskStatus.Approved]: '已批准',
  [DownloadTaskStatus.Declined]: '已拒绝',
  [DownloadTaskStatus.Exporting]: '导出中',
  [DownloadTaskStatus.Finished]: '已完成',
  [DownloadTaskStatus.Failed]: '导出失败',
};

export default {
  STATUS_MAP,
};
