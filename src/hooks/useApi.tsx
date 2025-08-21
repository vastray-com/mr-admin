import { useMemo } from 'react';
import { noInterceptorsService, service } from '@/utils/service';
import type { AxiosResponse } from 'axios';
import type { StructRule } from '@/typing/structRules';
import type { Task } from '@/typing/task';

export const useApi = () => {
  const task = useMemo(
    () => ({
      createTask: (params: Task.Item) =>
        service.post('/task/create', params) as Promise<APIRes<number>>,
      actionTask: (params: Task.ActionParams) =>
        service.post('/task/action', params) as Promise<APIRes<null>>,
      getTaskList: (params: Task.ListParams) =>
        service.get('/task/list', { params }) as Promise<
          APIRes<PaginationData<Task.Item>>
        >,
      getTaskDetail: (params: Task.DetailParams) =>
        service.get('/task/detail', { params }) as Promise<APIRes<Task.Item>>,
      getTaskInstanceList: (params: Task.InstanceListParams) =>
        service.get('/task/instance_list', { params }) as Promise<
          APIRes<PaginationData<Task.Instance>>
        >,
      getTaskInstanceDetail: (taskInstanceId: number) =>
        service.get('/task/instance_detail', {
          params: { task_instance_id: taskInstanceId },
        }) as Promise<APIRes<Task.Instance>>,
      getTaskInstanceResultList: (taskInstanceId: number) =>
        service.get('/task/instance_detail/result_list', {
          params: { task_instance_id: taskInstanceId },
        }) as Promise<APIRes<Task.ResultList>>,
      getTaskInstanceResultDetail: async (
        taskInstanceId: number,
        opEmNo: string,
      ) =>
        service.get('/task/instance_detail/result_detail', {
          params: {
            task_instance_id: taskInstanceId,
            op_em_no: opEmNo,
          },
        }) as Promise<APIRes<Task.ResultDetail>>,
    }),
    [],
  );

  const encode = useMemo(
    () => ({
      getEncodeList: (params: Encode.ListParams) =>
        service.get('/admin/encode/list', { params }) as Promise<
          APIRes<PaginationData<Encode.Item>>
        >,
      getEncodeDetail: (params: Encode.DetailParams) =>
        service.get('/admin/encode/detail', { params }) as Promise<
          APIRes<Encode.Detail>
        >,
      createEncode: (params: Encode.Detail) =>
        service.post('/admin/encode/create', params) as Promise<APIRes<number>>,
      updateEncode: (params: Encode.Detail) =>
        service.post('/admin/encode/update', params) as Promise<APIRes<number>>,
      actionEncode: (params: Encode.ActionParams) =>
        service.post('/admin/encode/update', params) as Promise<APIRes<null>>,
      exportEncode: (params: { ids: number[] }) =>
        noInterceptorsService.post('/admin/encode/export', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  const rule = useMemo(
    () => ({
      getRuleList: (params: StructRule.GetListParams) =>
        service.get('/admin/structured_rule/list', { params }) as Promise<
          APIRes<PaginationData<StructRule.Item>>
        >,
      getRuleDetail: (params: StructRule.DetailParams) =>
        service.get('/admin/structured_rule/detail', { params }) as Promise<
          APIRes<StructRule.Detail>
        >,
      createRule: (params: StructRule.Detail) =>
        service.post('/admin/structured_rule/create', params) as Promise<
          APIRes<number>
        >,
      updateRule: (params: StructRule.Detail) =>
        service.post('/admin/structured_rule/update', params) as Promise<
          APIRes<number>
        >,
      actionRule: (params: StructRule.ActionParams) =>
        service.post('/admin/structured_rule/action', params) as Promise<
          APIRes<number>
        >,
      exportRules: (params: { ids: number[] }) =>
        noInterceptorsService.post('/admin/structured_rule/export', params, {
          responseType: 'blob', // 设置响应类型为 Blob
        }) as Promise<AxiosResponse<Blob>>,
    }),
    [],
  );

  return {
    taskApi: task,
    encodeApi: encode,
    ruleApi: rule,
  };
};
