export declare namespace DownloadTemplate {
  type Item = {
    uid: string;
    name: string;
    file_name: string;
    content_base64?: string;
    tag?: string;
    comment?: string;
    creator?: string;
    creator_name?: string;
    created_at: string;
    updated_at: string;
  };

  type List = Item[];

  type ListParams = PaginationParams & {
    name?: string;
    tag?: string;
  };

  type CreateParams = {
    name: string;
    file_name: string;
    content_base64: string;
    tag?: string;
    comment?: string;
  };

  type UpdateParams = {
    uid: string;
    name?: string;
    file_name?: string;
    content_base64?: string;
    tag?: string;
    comment?: string;
  };

  type ActionParams = {
    uid: string;
    action: 'delete';
  };
}
