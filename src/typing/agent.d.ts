/**
 * 智能体（Agent）对话与技能/任务相关类型
 * 与后端 /api/agent 接口一一对应。
 */
export declare namespace Agent {
  /** 会话信息 */
  type Session = {
    uid: string;
    title: string;
    actor: string;
    /** 是否有任务正在后台执行（会话列表据此展示执行状态图标） */
    running?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  };

  /** 消息角色 */
  type Role = 'user' | 'assistant';

  /** 交付物类型：file 文件 / dataset 数据集 / ruleset 解析规则 / skill 技能 / task 定时任务 / data_project 数据项目 / data_view 数据视图 */
  type DeliverableKind =
    | 'file'
    | 'dataset'
    | 'ruleset'
    | 'skill'
    | 'task'
    | 'data_project'
    | 'data_view';

  /** 智能体生成的交付物（在对话中以链接形式展示，点击跳转对应详情页） */
  type Deliverable = {
    /** 交付物类型 */
    kind: DeliverableKind;
    /** 交付物标识：业务资源 uid（file 为工作区相对路径） */
    target: string;
    /** 交付物展示名称 */
    label: string;
  };

  /** 消息状态：running 表示该条消息对应的任务仍在后台执行 */
  type MessageStatus = 'running' | 'done' | 'error' | 'stopped';

  /** 单条消息 */
  type Message = {
    uid: string;
    session_uid: string;
    role: Role;
    /** 消息状态 */
    status: MessageStatus;
    /** 执行阶段描述（running 期间展示当前进度） */
    phase: string;
    /** 执行明细步骤（running 期间可回看的工具调用等） */
    trace: string[];
    /** 本轮生成的交付物（可选） */
    deliverables?: Deliverable[];
    content: string;
    created_at?: string | null;
  };

  /** 流式事件：type 用于区分不同阶段 */
  type Event =
    | { type: 'user_message'; message: Message }
    | { type: 'token'; text: string }
    | { type: 'tool_call'; name: string; args: unknown }
    | {
        type: 'tool_result';
        name: string;
        ok: boolean;
        /** 该工具本轮产出的交付物（供前端实时展示为可跳转链接） */
        deliverables?: Deliverable[];
      }
    | {
        type: 'context_compacted';
        stage: string;
        tokens_before: number;
        tokens_after: number;
        exhausted: boolean;
      }
    | { type: 'done'; message: Message; session: Session }
    | { type: 'error'; message: string };

  /** 会话上下文压缩提示 */
  type ContextCompactedInfo = {
    /** 压缩阶段标识（框架阶段名，或 "budget"） */
    stage: string;
    /** 压缩前估算 token 数 */
    tokensBefore: number;
    /** 压缩后估算 token 数 */
    tokensAfter: number;
    /** 是否为迭代/预算耗尽 */
    exhausted: boolean;
  };

  /** 界面内工具调用进度条目 */
  type ChatTool = {
    name: string;
    status: 'running' | 'ok' | 'failed';
    /** 工具调用入参（原始对象，供格式化展示，不直接渲染 JSON） */
    args?: Record<string, unknown> | null;
    detail?: string;
  };

  /** 界面内部使用的消息（含客户端临时状态） */
  type ChatItem = {
    id: string;
    role: Role;
    content: string;
    createdAt?: string | null;
    /** 消息状态（来自服务端持久化；本地乐观消息无此字段） */
    status?: MessageStatus;
    /** 执行阶段描述 */
    phase?: string;
    /** 执行明细步骤 */
    trace?: string[];
    /** 本轮生成的交付物（可跳转到对应详情页） */
    deliverables?: Deliverable[];
    /** 是否正在流式输出 */
    streaming?: boolean;
    /** 流式期间展示的工具调用进度 */
    tools?: ChatTool[];
    /** 是否为本轮失败后的可重试错误 */
    retryable?: boolean;
  };

  /** 技能：可注入智能体上下文的执行指令 */
  type Skill = {
    uid: string;
    name: string;
    description: string;
    content: string;
    built_in: boolean;
    enabled: boolean;
    actor: string;
    created_at?: string | null;
    updated_at?: string | null;
  };

  /** 创建/更新技能载荷 */
  type SkillPayload = {
    name: string;
    description: string;
    content: string;
    enabled: boolean;
  };

  /** 调度类型 */
  type ScheduleType = 'interval' | 'daily' | 'weekly';

  /** 定时任务 */
  type Task = {
    uid: string;
    name: string;
    requirement: string;
    skill_uids: string[];
    schedule_type: ScheduleType;
    schedule_interval_minutes: number;
    schedule_time: string;
    schedule_weekday: number;
    enabled: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    last_run_status: 'running' | 'succeeded' | 'failed' | null;
    run_count: number;
    actor: string;
    created_at?: string | null;
    updated_at?: string | null;
  };

  /** 创建/更新任务载荷 */
  type TaskPayload = {
    name: string;
    requirement: string;
    skill_uids: string[];
    schedule_type: ScheduleType;
    schedule_interval_minutes: number;
    schedule_time: string;
    schedule_weekday: number;
    enabled: boolean;
  };

  /** 任务执行记录 */
  type TaskRun = {
    uid: string;
    task_uid: string;
    task_name: string;
    trigger: 'scheduled' | 'manual';
    status: 'running' | 'succeeded' | 'failed';
    started_at: string | null;
    finished_at: string | null;
    output: string | null;
    error: string | null;
  };
}
