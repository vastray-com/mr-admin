import type { DatasetResourceType } from '@/typing/enum/dataset';
import type { DownloadTaskStatus } from '@/typing/enum/downloadTask';

export declare namespace DownloadTask {
  type BaseItem = {
    // 申请人
    applicant_uid: string;
    applicant_name: string;
    // 审核人 uid，初始值为 null，表示未审核
    examiner_uid: string | null;
    examiner_name: string | null;
    failed_reason: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };

  // 获取列表的参数
  type ListParams = PaginationParams;

  // 创建参数
  type CreateParamsBase = {
    // 数据集 uid
    dataset_uid: string;
    // 下载数据包含的 resource type 列表，有值为下载原始数据
    resource_list?: DatasetResourceType[];
    // 模版名称，有值为下载为质控数据
    template_name?: string;
    // 暂不使用
    archive_uid?: string;
  };
  type CreateParams = {
    // 开始日期 YYYY-MM-DD，回顾数据集留空
    from_date?: string;
    // 截止日期 YYYY-MM-DD，回顾数据集留空
    to_date?: string;
  } & CreateParamsBase;

  // 创建参数（前端）
  type CreateParamsFE = {
    date_range: [Dayjs, Dayjs];
  } & CreateParamsBase;

  // 审批参数
  type UpdateParams = { uid: string; status: DownloadTaskStatus };

  // 列表项
  type Item = UpdateParams & CreateParams & BaseItem;
  type List = Item[];

  // 模版项
  type Template = {
    name: string;
  };
  type Templates = Template[];
}
