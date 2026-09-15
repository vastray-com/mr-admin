import { App } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAgentStore } from '@/store/useAgentStore';
import { streamAgentChat } from '@/utils/agentStream';
import { appendDeliverables } from '@/utils/deliverables';
import { normalizeToolArgs } from '@/utils/toolArgs';
import type { Agent } from '@/typing/agent';

/** 本地乐观消息 id 前缀 */
const LOCAL_ID_PREFIX = 'local-';
let localSeq = 0;
const nextLocalId = () => `${LOCAL_ID_PREFIX}${Date.now()}-${localSeq++}`;

/** 从接口异常中提取可读错误信息 */
const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = err.response?.data?.message || err.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
};

/** 服务端消息 → 界面消息 */
const toChatItem = (message: Agent.Message): Agent.ChatItem => ({
  id: message.uid,
  role: message.role,
  content: message.content,
  createdAt: message.created_at,
  status: message.status,
  phase: message.phase,
  trace: message.trace ?? [],
  deliverables: message.deliverables,
  streaming: message.status === 'running',
});

/** 是否处于执行中（流式输出或后台仍有 running 消息） */
const isRunningItem = (item: Agent.ChatItem) =>
  item.streaming || item.status === 'running';

/**
 * 智能体对话状态机：会话管理、消息历史、SSE 流式对话与后台任务轮询。
 *
 * 说明：一轮对话在后台独立执行，SSE 只是实时通道；断线后通过
 * `list_messages` 轮询即可回看 running/最终状态，因此本 Hook 在
 * 「未处于本地流式、但仍有 running 消息」时会定时拉取消息历史。
 */
export const useAgentChat = () => {
  const { agentApi } = useApi();
  const { message } = App.useApp();
  const setAgentRunning = useAgentStore((s) => s.setRunning);

  const [sessions, setSessions] = useState<Agent.Session[]>([]);
  const [activeUid, setActiveUid] = useState<string>();
  const [messages, setMessages] = useState<Agent.ChatItem[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [compacting, setCompacting] = useState(false);

  /** 当前流的中止函数 */
  const abortRef = useRef<(() => void) | null>(null);
  /** 运行序号：用于丢弃已被替换的旧流的回调 */
  const runSeqRef = useRef(0);
  const activeUidRef = useRef<string | undefined>(undefined);
  /** 是否处于本地流式的同步快照（供事件回调读取） */
  const streamingRef = useRef(false);

  useEffect(() => {
    activeUidRef.current = activeUid;
  }, [activeUid]);

  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  // 卸载时中止本地流（服务端任务仍在后台执行，可重新打开后回看）
  useEffect(
    () => () => {
      runSeqRef.current += 1;
      abortRef.current?.();
      setAgentRunning(false);
    },
    [setAgentRunning],
  );

  /** 中止本地流并复位执行态 */
  const cancelStream = useCallback(() => {
    runSeqRef.current += 1;
    abortRef.current?.();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  /** 拉取会话列表 */
  const refreshSessions = useCallback(async (): Promise<
    Agent.Session[] | null
  > => {
    try {
      const res = await agentApi.listSessions();
      if (res.code === 200) {
        setSessions(res.data);
        return res.data;
      }
      message.error(res.message || '获取会话列表失败');
    } catch (error) {
      message.error(getErrorMessage(error, '获取会话列表失败'));
    }
    return null;
  }, [agentApi, message]);

  /** 拉取指定会话的消息历史 */
  const loadMessages = useCallback(
    async (uid: string, silent = false) => {
      if (!silent) {
        setLoadingMessages(true);
      }
      try {
        const res = await agentApi.listMessages(uid);
        // 会话已切换：丢弃过期响应
        if (activeUidRef.current !== uid) {
          return;
        }
        if (res.code === 200) {
          setMessages(res.data.map(toChatItem));
        } else if (!silent) {
          message.error(res.message || '获取消息历史失败');
        }
      } catch (error) {
        if (!silent && activeUidRef.current === uid) {
          message.error(getErrorMessage(error, '获取消息历史失败'));
        }
      } finally {
        if (!silent && activeUidRef.current === uid) {
          setLoadingMessages(false);
        }
      }
    },
    [agentApi, message],
  );

  /** 切换会话 */
  const selectSession = useCallback(
    async (uid: string) => {
      cancelStream();
      // 同步更新 ref，确保后续请求能通过会话校验
      activeUidRef.current = uid;
      setActiveUid(uid);
      setMessages([]);
      await loadMessages(uid);
    },
    [cancelStream, loadMessages],
  );

  /** 新建会话并切换过去 */
  const createSession = useCallback(
    async (title?: string) => {
      try {
        const res = await agentApi.createSession(title);
        if (res.code === 200) {
          await refreshSessions();
          await selectSession(res.data.uid);
        } else {
          message.error(res.message || '创建会话失败');
        }
      } catch (error) {
        message.error(getErrorMessage(error, '创建会话失败'));
      }
    },
    [agentApi, message, refreshSessions, selectSession],
  );

  /** 删除会话（删除当前会话时自动切换到下一个） */
  const removeSession = useCallback(
    async (uid: string) => {
      try {
        const res = await agentApi.deleteSession(uid);
        if (res.code !== 200) {
          message.error(res.message || '删除会话失败');
          return;
        }
        message.success('会话已删除');
        const list = await refreshSessions();
        if (uid !== activeUidRef.current) {
          return;
        }
        cancelStream();
        const next = list?.[0];
        if (next) {
          await selectSession(next.uid);
        } else {
          activeUidRef.current = undefined;
          setActiveUid(undefined);
          setMessages([]);
        }
      } catch (error) {
        message.error(getErrorMessage(error, '删除会话失败'));
      }
    },
    [agentApi, message, refreshSessions, cancelStream, selectSession],
  );

  /** 局部更新某条助手消息 */
  const patchAssistant = useCallback(
    (id: string, patch: Partial<Agent.ChatItem>) => {
      setMessages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  /** 处理单个流式事件 */
  const handleEvent = useCallback(
    (assistantId: string, event: Agent.Event) => {
      switch (event.type) {
        case 'user_message':
          // 用服务端落库的用户消息替换本地乐观消息
          setMessages((prev) =>
            prev.map((item) =>
              item.role === 'user' && item.id.startsWith(LOCAL_ID_PREFIX)
                ? {
                    ...item,
                    id: event.message.uid,
                    createdAt: event.message.created_at,
                  }
                : item,
            ),
          );
          break;
        case 'token':
          if (event.text) {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantId
                  ? { ...item, content: item.content + event.text }
                  : item,
              ),
            );
          }
          break;
        case 'tool_call':
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    tools: [
                      ...(item.tools ?? []),
                      {
                        name: event.name,
                        status: 'running',
                        args: normalizeToolArgs(event.args),
                      },
                    ],
                  }
                : item,
            ),
          );
          break;
        case 'tool_result':
          setMessages((prev) =>
            prev.map((item) => {
              if (item.id !== assistantId) {
                return item;
              }
              const tools = [...(item.tools ?? [])];
              for (let i = tools.length - 1; i >= 0; i -= 1) {
                if (
                  tools[i].name === event.name &&
                  tools[i].status === 'running'
                ) {
                  tools[i] = {
                    ...tools[i],
                    status: event.ok ? 'ok' : 'failed',
                  };
                  break;
                }
              }
              // 实时追加该工具产出的交付物（按资源去重）
              const deliverables = appendDeliverables(
                item.deliverables,
                event.deliverables,
              );
              return { ...item, tools, deliverables };
            }),
          );
          break;
        case 'context_compacted': {
          const line =
            event.stage === 'budget'
              ? `本轮迭代预算已接近上限${event.exhausted ? '（已耗尽，即将收尾）' : ''}`
              : `上下文已压缩（${event.stage}：${event.tokens_before} → ${event.tokens_after} tokens）`;
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? { ...item, trace: [...(item.trace ?? []), line] }
                : item,
            ),
          );
          break;
        }
        case 'done':
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? {
                    ...toChatItem(event.message),
                    id: assistantId,
                    tools: item.tools,
                    // 落库交付物与流式期间已展示的合并（避免回写延迟导致丢失）
                    deliverables: appendDeliverables(
                      event.message.deliverables,
                      item.deliverables,
                    ),
                  }
                : item,
            ),
          );
          break;
        case 'error':
          patchAssistant(assistantId, {
            streaming: false,
            status: 'error',
            phase: '',
            content: event.message,
            retryable: true,
          });
          break;
      }
    },
    [patchAssistant],
  );

  /** 发送消息并开启流式对话 */
  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text) {
        return;
      }
      if (!activeUid) {
        message.warning('请先选择或新建一个会话');
        return;
      }
      if (streamingRef.current) {
        message.warning('当前已有任务在执行，请稍候或先停止');
        return;
      }

      const seq = runSeqRef.current + 1;
      runSeqRef.current = seq;
      setStreaming(true);

      const assistantId = nextLocalId();
      setMessages((prev) => [
        ...prev,
        { id: nextLocalId(), role: 'user', content: text },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          status: 'running',
          phase: '任务已提交，正在排队/执行…',
          trace: [],
          tools: [],
          streaming: true,
        },
      ]);

      const uid = activeUid;
      // 乐观标记该会话为执行中，执行状态图标即时更新
      setSessions((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, running: true } : item,
        ),
      );
      abortRef.current = streamAgentChat(uid, text, {
        onEvent: (event) => {
          if (runSeqRef.current !== seq) return;
          handleEvent(assistantId, event);
        },
        onTransportError: (msg) => {
          if (runSeqRef.current !== seq) return;
          message.error(msg);
          patchAssistant(assistantId, {
            streaming: false,
            status: 'error',
            phase: '',
            content: msg,
          });
        },
        onClose: () => {
          if (runSeqRef.current !== seq) return;
          abortRef.current = null;
          setStreaming(false);
          // 刷新会话列表以同步标题/更新时间；若仍有 running 消息则交给轮询兜底
          void refreshSessions();
        },
      });
    },
    [activeUid, message, handleEvent, patchAssistant, refreshSessions],
  );

  /** 停止指定会话正在执行的任务（运行中的会话可随时停止） */
  const stopSession = useCallback(
    async (uid: string) => {
      try {
        const res = await agentApi.stopSession(uid);
        if (res.code !== 200) {
          message.error(res.message || '停止失败');
          return;
        }
        message.success('已停止当前任务');
        // 乐观清除该会话执行中标记，执行状态图标即时更新
        setSessions((prev) =>
          prev.map((item) =>
            item.uid === uid ? { ...item, running: false } : item,
          ),
        );
        // 停止的是当前会话：同步中止本地流并刷新消息
        if (uid === activeUidRef.current) {
          cancelStream();
          await loadMessages(uid);
        }
        await refreshSessions();
      } catch (error) {
        message.error(getErrorMessage(error, '停止失败'));
      }
    },
    [agentApi, message, cancelStream, loadMessages, refreshSessions],
  );

  /** 停止当前会话正在执行的任务（供输入区停止按钮使用） */
  const stopRun = useCallback(async () => {
    if (activeUid) {
      await stopSession(activeUid);
    }
  }, [activeUid, stopSession]);

  /** 重试最近一次失败的消息（后台执行，无流式，靠轮询回看） */
  const retryRun = useCallback(async () => {
    if (!activeUid) return;
    try {
      const res = await agentApi.retrySession(activeUid);
      if (res.code !== 200) {
        message.error(res.message || '重试失败');
        return;
      }
      message.success('已重新执行');
      await loadMessages(activeUid);
    } catch (error) {
      message.error(getErrorMessage(error, '重试失败'));
    }
  }, [activeUid, agentApi, message, loadMessages]);

  /** 基于压缩上下文新建会话并切换过去 */
  const compactToNewSession = useCallback(async () => {
    if (!activeUid) return;
    setCompacting(true);
    try {
      const res = await agentApi.compactSession(activeUid);
      if (res.code === 200) {
        message.success('已基于压缩上下文新建会话');
        await refreshSessions();
        await selectSession(res.data.uid);
      } else {
        message.error(res.message || '压缩上下文失败');
      }
    } catch (error) {
      message.error(getErrorMessage(error, '压缩上下文失败'));
    } finally {
      setCompacting(false);
    }
  }, [activeUid, agentApi, message, refreshSessions, selectSession]);

  /** 手动刷新当前会话消息历史 */
  const refreshMessages = useCallback(
    () => (activeUid ? loadMessages(activeUid) : Promise.resolve()),
    [activeUid, loadMessages],
  );

  // 首次进入：拉取会话列表并默认选中第一个
  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    (async () => {
      const list = await refreshSessions();
      if (list && list.length > 0) {
        await selectSession(list[0].uid);
      }
    })();
  }, [refreshSessions, selectSession]);

  // 后台仍有 running 消息且本地不在流式时，定时轮询消息历史
  const hasRunning = messages.some(isRunningItem);
  const busy = streaming || hasRunning;
  useEffect(() => {
    if (!activeUid || streaming || !hasRunning) {
      return;
    }
    const timer = setInterval(() => {
      void loadMessages(activeUid, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeUid, streaming, hasRunning, loadMessages]);

  // 任一会话在后台执行时，定时刷新会话列表，保证各会话执行状态图标实时
  const anyRunning = busy || sessions.some((item) => item.running);
  useEffect(() => {
    if (!anyRunning) {
      return;
    }
    const timer = setInterval(() => {
      void refreshSessions();
    }, 3000);
    return () => clearInterval(timer);
  }, [anyRunning, refreshSessions]);

  // 同步运行态到全局 store（供收起侧栏时的悬浮入口角标读取）
  useEffect(() => {
    setAgentRunning(anyRunning);
  }, [anyRunning, setAgentRunning]);

  return {
    sessions,
    activeUid,
    activeSession: sessions.find((item) => item.uid === activeUid),
    messages,
    streaming,
    busy,
    loadingMessages,
    compacting,
    selectSession,
    createSession,
    removeSession,
    refreshSessions,
    refreshMessages,
    sendMessage,
    stopSession,
    stopRun,
    retryRun,
    compactToNewSession,
  };
};
