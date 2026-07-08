import { useMemo } from 'react';
import { noInterceptorsService, service } from '@/utils/service';
import type { AxiosResponse } from 'axios';
import type { Annotation } from '@/typing/annotation';
import type { Dataset } from '@/typing/dataset';
import type { DownloadTask } from '@/typing/downloadTask';
import type { DownloadTemplate } from '@/typing/downloadTemplate';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';
import type { Task } from '@/typing/task';
import type { User } from '@/typing/user';
import type { Warehouse } from '@/typing/warehose';

export const useApi = () => {
  const task = useMemo(
    () => ({
      getTaskList: (params: Task.ListParams) =>
        service.get('/admin/task/list', { params }) as Promise<
          APIRes<PaginationData<Task.Item>>
        >,
      getTaskDetail: (params: Task.DetailParams) =>
        service.get('/admin/task/detail', { params }) as Promise<
          APIRes<Task.Item>
        >,
      // createTask: (params: Task.Item) =>
      //   service.post('/admin/task/create', params) as Promise<APIRes<number>>,
      initTask: (params: Task.InitParams) =>
        service.post('/admin/task/init', params) as Promise<APIRes<null>>,
      actionTask: (params: Task.ActionParams) =>
        service.post('/admin/task/action', params) as Promise<APIRes<null>>,
      getTaskInstanceList: (params: Task.InstanceListParams) =>
        service.get('/admin/task/instance/list', { params }) as Promise<
          APIRes<PaginationData<Task.Instance>>
        >,
      getTaskInstanceDetail: (taskInstanceUid: string) =>
        service.get('/admin/task/instance/detail', {
          params: { task_instance_uid: taskInstanceUid },
        }) as Promise<APIRes<Task.Instance>>,
      taskInstanceRePush: (params: Task.RePushParams) =>
        service.post('/admin/task/instance/re_push', params) as Promise<
          APIRes<null>
        >,
      stopTaskInstance: (params: Task.InstanceActionParams) =>
        service.post('/admin/task/instance/stop', params) as Promise<
          APIRes<null>
        >,
      getTaskInstanceResultList: (taskInstanceUid: string) =>
        service.get('/admin/task/instance/result_list', {
          params: { task_instance_uid: taskInstanceUid },
        }) as Promise<APIRes<Task.ResultList>>,
      getTaskInstanceResultDetail: (taskInstanceUid: string, opEmNo: string) =>
        service.get('/admin/task/instance/result_detail', {
          params: {
            task_instance_uid: taskInstanceUid,
            op_em_no: opEmNo,
          },
        }) as Promise<APIRes<Task.ResultDetail>>,
    }),
    [],
  );

  const dataset = useMemo(
    () => ({
      getDatasetList: (params: Dataset.ListParams) =>
        service.get('/dataset/list', { params }) as Promise<
          APIRes<PaginationData<Dataset.Item>>
        >,
      getDatasetDetail: (params: Dataset.DetailParams) =>
        service.get('/dataset/detail', { params }) as Promise<
          APIRes<Dataset.Item>
        >,
      createDataset: (params: Dataset.CreateParams) =>
        service.post('/dataset/create', params) as Promise<APIRes<number>>,
      updateDataset: (params: Dataset.UpdateParams) =>
        service.post('/dataset/update', params) as Promise<APIRes<number>>,
      deleteDataset: (uid: string) =>
        service.post('/dataset/delete', { uid }) as Promise<APIRes<null>>,
      linkRuleset: (params: Dataset.LinkParams) =>
        service.post('/dataset/link_ruleset', params) as Promise<APIRes<null>>,
      archiveDataset: (params: Dataset.ArchiveParams) =>
        service.post('/dataset/archive_and_create', params) as Promise<
          APIRes<null>
        >,
      dropDwdp: (uid: string) =>
        service.post('/dataset/drop_dwdp', { uid }) as Promise<APIRes<null>>,
      genAIFilter: (params: Dataset.GenAIFilterParams) =>
        service.post('/dataset/gen_ai_filter', params) as Promise<
          APIRes<string>
        >,
    }),
    [],
  );

  const download_task = useMemo(
    () => ({
      getDownloadTaskList: (params: DownloadTask.ListParams) =>
        service.get('/download_task/list', { params }) as Promise<
          APIRes<PaginationData<DownloadTask.Item>>
        >,
      getTemplateList: () =>
        service.get('/download_task/template_list') as Promise<
          APIRes<DownloadTask.Templates>
        >,
      createDownloadTask: (params: DownloadTask.CreateParams) =>
        service.post('/download_task/create', params) as Promise<
          APIRes<string>
        >,
      updateDownloadTask: (params: DownloadTask.UpdateParams) =>
        service.post('/admin/download_task/update', params) as Promise<
          APIRes<string>
        >,
      deleteDownloadTask: (uid: string) =>
        service.post('/admin/download_task/delete', { uid }) as Promise<
          APIRes<null>
        >,
      downloadData: (params: { uid: string }) =>
        noInterceptorsService.post('/download_task/download', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  const download_template = useMemo(
    () => ({
      getTemplateList: (params: DownloadTemplate.ListParams) =>
        service.get('/download_template/list', { params }) as Promise<
          APIRes<PaginationData<DownloadTemplate.Item>>
        >,
      getTemplateDetail: (uid: string) =>
        service.get('/download_template/detail', {
          params: { uid },
        }) as Promise<APIRes<DownloadTemplate.Item>>,
      createTemplate: (params: DownloadTemplate.CreateParams) =>
        service.post('/download_template/create', params) as Promise<
          APIRes<string>
        >,
      updateTemplate: (params: DownloadTemplate.UpdateParams) =>
        service.post('/download_template/update', params) as Promise<
          APIRes<string>
        >,
      deleteTemplate: (uid: string) =>
        service.post('/download_template/action', {
          uid,
          action: 'delete',
        } as DownloadTemplate.ActionParams) as Promise<APIRes<string>>,
      getTags: () =>
        service.get('/download_template/tags') as Promise<APIRes<string[]>>,
    }),
    [],
  );

  const encode = useMemo(
    () => ({
      getEncodeList: (params: EncodeTable.ListParams) =>
        service.get('/encode_table/list', { params }) as Promise<
          APIRes<PaginationData<EncodeTable.Item>>
        >,
      getEncodeDetail: (params: EncodeTable.DetailParams) =>
        service.get('/encode_table/detail', { params }) as Promise<
          APIRes<EncodeTable.Detail>
        >,
      createEncode: (params: EncodeTable.Detail) =>
        service.post('/admin/encode_table/create', params) as Promise<
          APIRes<number>
        >,
      updateEncode: (params: EncodeTable.Detail) =>
        service.post('/admin/encode_table/update', params) as Promise<
          APIRes<number>
        >,
      deleteEncode: (params: EncodeTable.DeleteParams) =>
        service.post('/admin/encode_table/delete', params) as Promise<
          APIRes<null>
        >,
      exportEncode: (params: { uids: string[] }) =>
        noInterceptorsService.post('/admin/encode_table/export', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  const rule = useMemo(
    () => ({
      getRuleList: (params: StructuredRuleset.ListParams) =>
        service.get('/structured_ruleset/list', { params }) as Promise<
          APIRes<PaginationData<StructuredRuleset.Item>>
        >,
      getRuleDetail: (params: StructuredRuleset.DetailParams) =>
        service.get('/structured_ruleset/detail', { params }) as Promise<
          APIRes<StructuredRuleset.Item>
        >,
      createRule: (params: StructuredRuleset.Item) =>
        service.post('/structured_ruleset/create', params) as Promise<
          APIRes<string>
        >,
      updateRule: (params: StructuredRuleset.Item) =>
        service.post('/structured_ruleset/update', params) as Promise<
          APIRes<string>
        >,
      actionRule: (params: StructuredRuleset.ActionParams) =>
        service.post('/structured_ruleset/action', params) as Promise<
          APIRes<string>
        >,
      exportRules: (params: { uids: string[] }) =>
        noInterceptorsService.post('/structured_ruleset/export', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
      getPresetFieldsList: () =>
        service.get('/structured_ruleset/get_preset_fields') as Promise<
          APIRes<StructuredRuleset.PresetFields>
        >,
      moveFields: (params: StructuredRuleset.MoveFieldsParams) =>
        service.post('/structured_ruleset/move_fields', params) as Promise<
          APIRes<string>
        >,
      testRule: (params: StructuredRuleset.TestRuleParams) => {
        const { api_key, ...rest } = params;
        return service.post('/structured_ruleset/test', rest, {
          headers: { Authorization: api_key },
        }) as Promise<APIRes<Record<string, string>>>;
      },
    }),
    [],
  );

  const pushRule = useMemo(
    () => ({
      getRuleList: (params: PushRule.ListParams) =>
        service.get('/admin/push_rule/list', { params }) as Promise<
          APIRes<PaginationData<PushRule.Item>>
        >,
      getRuleDetail: (params: PushRule.DetailParams) =>
        service.get('/admin/push_rule/detail', { params }) as Promise<
          APIRes<PushRule.Detail>
        >,
      createRule: (params: PushRule.Detail) =>
        service.post('/admin/push_rule/create', params) as Promise<
          APIRes<string>
        >,
      updateRule: (params: PushRule.Detail) =>
        service.post('/admin/push_rule/update', params) as Promise<
          APIRes<string>
        >,
      actionRule: (params: PushRule.ActionParams) =>
        service.post('/admin/push_rule/action', params) as Promise<
          APIRes<string>
        >,
      exportRule: (params: { uids: string[] }) =>
        noInterceptorsService.post('/admin/push_rule/export', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  const user = useMemo(
    () => ({
      login: (params: User.LoginParams) =>
        service.post('/user/login', params) as Promise<APIRes<User.LoginRes>>,
      create: (params: User.CreateParams) =>
        service.post('/admin/user/create', params) as Promise<APIRes<string>>,
      batchCreate: (params: User.BatchCreateParams) =>
        service.post('/admin/user/batch_create', params) as Promise<
          APIRes<string>
        >,
      getList: (params: User.ListParams) =>
        service.get('/admin/user/list', { params }) as Promise<
          APIRes<PaginationData<User.User>>
        >,
      changePwd: (params: User.ChangePwdParams) =>
        service.post('/user/change_pwd', params) as Promise<APIRes<null>>,
      resetPwd: (params: User.ResetPwdParams) =>
        service.post('/admin/user/reset_pwd', params) as Promise<APIRes<null>>,
      freeze: (params: User.FreezeParams) =>
        service.post('/admin/user/freeze', params) as Promise<APIRes<null>>,
      unfreeze: (params: User.UnfreezeParams) =>
        service.post('/admin/user/unfreeze', params) as Promise<APIRes<null>>,
    }),
    [],
  );

  const sys = useMemo(
    () => ({
      getTokenList: (params: PaginationParams) =>
        service.get('/admin/token/list', { params }) as Promise<
          APIRes<PaginationData<Tokens.Token>>
        >,
      createToken: (params: Tokens.CreateParams) =>
        service.get('/admin/token/create', { params }) as Promise<
          APIRes<string>
        >,
      deleteToken: (params: Tokens.DeleteParams) =>
        service.get('/admin/token/delete', { params }) as Promise<APIRes<null>>,
      getAuditList: (params: Audit.ListParams) =>
        service.get('/admin/audit/list', { params }) as Promise<
          APIRes<PaginationData<Audit.Log>>
        >,
      getAuditDetail: (params: Audit.DetailParams) =>
        service.get('/admin/audit/detail', { params }) as Promise<
          APIRes<Audit.Log>
        >,
      getAuditFilterOptions: () =>
        service.get('/admin/audit/filter_options') as Promise<
          APIRes<Audit.FilterOptions>
        >,
    }),
    [],
  );

  const warehouse = useMemo(
    () => ({
      getSourceSchema: () =>
        service.get('/warehouse/get_source_schema') as Promise<
          APIRes<Warehouse.SourceSchemas>
        >,
      getResourceTypes: () =>
        service.get('/warehouse/get_resource_types') as Promise<
          APIRes<Warehouse.ResourceTypeOptions>
        >,
      getSourceData: (params: Warehouse.GetSourceDataParams) =>
        service.post('/warehouse/get_source_data', params) as Promise<
          APIRes<Warehouse.SourceData>
        >,
      getPatientDetail: (params: Warehouse.GetPatientDetailParams) =>
        service.get('/warehouse/get_patient_detail', { params }) as Promise<
          APIRes<Warehouse.PatientDetail>
        >,
      getParsedPatientDetail: (
        params: Warehouse.GetParsedPatientDetailParams,
      ) =>
        service.get('/warehouse/get_parsed_patient_detail', {
          params,
        }) as Promise<APIRes<Warehouse.PatientDetail>>,
      getDashboardData: (params: Warehouse.GetDashboardDataParams) =>
        service.get('/warehouse/get_dashboard_data', { params }) as Promise<
          APIRes<Warehouse.DashboardData>
        >,
    }),
    [],
  );

  const annotation = useMemo(
    () => ({
      getProjectList: (params: Annotation.ListParams) =>
        service.get('/annotation/project/list', { params }) as Promise<
          APIRes<PaginationData<Annotation.Project>>
        >,
      getProjectDetail: (uid: string) =>
        service.get('/annotation/project/detail', {
          params: { uid },
        }) as Promise<APIRes<Annotation.Project>>,
      createProject: (params: Annotation.CreateProjectParams) =>
        service.post('/annotation/project/create', params) as Promise<
          APIRes<string>
        >,
      updateProject: (params: Annotation.UpdateProjectParams) =>
        service.post('/annotation/project/update', params) as Promise<
          APIRes<string>
        >,
      deleteProject: (uid: string) =>
        service.post('/annotation/project/delete', { uid }) as Promise<
          APIRes<string>
        >,
      getImportableDatasets: () =>
        service.get('/annotation/library/importable_datasets') as Promise<
          APIRes<Annotation.ImportableDatasetOption[]>
        >,
      importLibrary: (params: Annotation.ImportLibraryParams) =>
        service.post('/annotation/library/import', params) as Promise<
          APIRes<string>
        >,
      updateLibrary: (params: Annotation.UpdateLibraryParams) =>
        service.post('/annotation/library/update', params) as Promise<
          APIRes<string>
        >,
      deleteLibrary: (params: Annotation.DeleteLibraryParams) =>
        service.post('/annotation/library/delete', params) as Promise<
          APIRes<string>
        >,
      getLibraryDetail: (params: {
        project_uid: string;
        library_uid: string;
      }) =>
        service.get('/annotation/library/detail', { params }) as Promise<
          APIRes<Annotation.LibraryDetail>
        >,
      getLibraryDataPage: (params: Annotation.LibraryDataPageParams) =>
        service.get('/annotation/library/data_page', { params }) as Promise<
          APIRes<Annotation.LibraryDataPage>
        >,
      saveLibraryRow: (params: Annotation.SaveLibraryRowParams) =>
        service.post('/annotation/library/save_row', params) as Promise<
          APIRes<string>
        >,
      exportLibrary: (params: { project_uid: string; library_uid: string }) =>
        noInterceptorsService.get('/annotation/library/export', {
          params,
          responseType: 'blob',
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  return {
    taskApi: task,
    datasetApi: dataset,
    downloadTaskApi: download_task,
    downloadTemplateApi: download_template,
    encodeApi: encode,
    ruleApi: rule,
    pushRuleApi: pushRule,
    userApi: user,
    sysApi: sys,
    warehouseApi: warehouse,
    annotationApi: annotation,
  };
};
