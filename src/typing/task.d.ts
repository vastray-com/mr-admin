declare namespace Task {
  // 获取任务列表的参数
  type ListParams = PaginationParams;

  // 获取任务详情的参数
  type DetailParams = {
    task_id: number;
  };

  // 任务项
  type Item = {
    id: number;
    // 0: 一次性任务, 1: 循环任务
    task_type: 0 | 1;
    mr_tpl_id: number;
    date_start: string;
    date_end: string;
    category_list: string;
    // 0: 关闭, 1: 开启
    status: 0 | 1;
    // 循环任务的 cron 表达式
    cron: string;
    // 循环任务的间隔时间
    interval: number;
    // 并发数
    concurrency: number;
    // 执行次数
    execute_count: number;
    create_time: string;
    update_time: string;
  };
  type List = Item[];

  // 获取任务实例列表的参数
  type InstanceListParams = PaginationParams & {
    task_id: number;
  };

  // 实例项
  type Instance = {
    id: number;
    task_id: number;
    // 0: 进行中, 1: 已完成, 2: 失败
    status: 0 | 1 | 2;
    task_start_time: string;
    task_duration: number;
    mr_total: number;
    mr_finish: number;
    mr_fail: number;
    create_time: string;
    update_time: string;
  };
  type InstanceList = Instance[];

  // 生成结果项
  type ResultListItem = {
    id: number;
    task_id: number;
    task_instance_id: number;
    op_em_no: string;
    reg_date: string;
    visit_no: string;
    // 0: 未执行, 1: 已执行, 2: 执行失败
    is_execute: 0 | 1 | 2;
    date_time_start: string;
    date_time_end: string;
    create_time: string;
    update_time: string;
    input_summary: string;
  };
  type ResultList = ResultListItem[];
  type ResultDetail = {
    op_em_no: string;
    input: string;
    output: string;
  };
}
