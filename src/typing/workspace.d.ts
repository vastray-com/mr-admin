/**
 * 智能体文件工作区（沙箱）相关类型
 * 与后端 /api/workspace 接口一一对应。
 */
export declare namespace Workspace {
  /** 工作区内的文件/目录条目 */
  type Entry = {
    /** 名称（不含路径） */
    name: string;
    /** 相对工作区根目录的路径 */
    path: string;
    /** 是否为目录 */
    is_dir: boolean;
    /** 文件大小（字节，目录为 0） */
    size: number;
    /** 最后修改时间（`YYYY-MM-DD HH:MM:SS`） */
    modified_at?: string | null;
  };

  /** 目录列表结果 */
  type Listing = {
    /** 当前目录相对路径（根目录为空串） */
    path: string;
    /** 上级目录相对路径（根目录为 null） */
    parent: string | null;
    /** 当前目录下的文件与子目录 */
    entries: Entry[];
  };

  /** 文本文件预览结果 */
  type FilePreview = {
    /** 文件名称（不含路径） */
    name: string;
    /** 文件相对工作区根目录的路径 */
    path: string;
    /** 文件大小（字节） */
    size: number;
    /** 内容是否因超出预览上限被截断 */
    truncated: boolean;
    /** 文件文本内容 */
    content: string;
  };
}
