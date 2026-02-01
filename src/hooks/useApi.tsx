import { useMemo } from 'react';
import { noInterceptorsService, service } from '@/utils/service';
import type { AxiosResponse } from 'axios';
import type { Dataset } from '@/typing/dataset';
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
      testRule: (params: StructuredRuleset.TestRuleParams) => {
        const { api_key, ...rest } = params;
        return service.post('/structured_rule/test', rest, {
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
        service.post('/user/create', params) as Promise<APIRes<string>>,
      getList: (params: PaginationParams) =>
        service.get('/admin/user/list', { params }) as Promise<
          APIRes<PaginationData<User.User>>
        >,
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
    }),
    [],
  );

  const warehouse = useMemo(
    () => ({
      getSourceSchema: () =>
        service.get('/warehouse/get_source_schema') as Promise<
          APIRes<Warehouse.SourceSchemas>
        >,
      getSourceData: (params: Warehouse.GetSourceDataParams) =>
        service.post('/warehouse/get_source_data', params) as Promise<
          APIRes<Warehouse.SourceData>
        >,
      getPatientDetail: (params: Warehouse.GetPatientDetailParams) =>
        service.get('/warehouse/get_patient_detail', { params }) as Promise<
          APIRes<Warehouse.PatientDetail>
        >,
    }),
    [],
  );

  return {
    taskApi: task,
    datasetApi: dataset,
    encodeApi: encode,
    ruleApi: rule,
    pushRuleApi: pushRule,
    userApi: user,
    sysApi: sys,
    warehouseApi: warehouse,
  };
};
