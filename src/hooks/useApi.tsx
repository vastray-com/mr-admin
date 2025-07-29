import { useMemo } from 'react';
import { service } from '@/utils/service';

export const useApi = () => {
  const task = useMemo(
    () => ({
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
    }),
    [],
  );

  return {
    taskApi: task,
    encodeApi: encode,
  };
};
