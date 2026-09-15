import { ls } from '@/utils/ls';
import type { Agent } from '@/typing/agent';

/** SSE 数据行前缀 */
const SSE_DATA_PREFIX = 'data:';

type StreamHandlers = {
  /** 收到一条已解析的智能体事件 */
  onEvent: (event: Agent.Event) => void;
  /** 请求失败或连接异常（非正常中止） */
  onTransportError?: (message: string) => void;
  /** 流结束（正常结束或中止） */
  onClose?: () => void;
};

/** 解析单个 SSE 事件块（含可能的多行 data），非数据帧返回 null */
const parseSseChunk = (chunk: string): Agent.Event | null => {
  const dataLines = chunk
    .split('\n')
    .filter((line) => line.startsWith(SSE_DATA_PREFIX))
    .map((line) => line.slice(SSE_DATA_PREFIX.length).replace(/^ /, ''));
  if (dataLines.length === 0) {
    return null;
  }
  try {
    return JSON.parse(dataLines.join('\n')) as Agent.Event;
  } catch {
    return null;
  }
};

/**
 * 以 POST 方式发起智能体流式对话（SSE）并逐条回调事件。
 *
 * 浏览器原生 `EventSource` 不支持 POST 与自定义请求头，这里改用
 * `fetch` + `ReadableStream` 自行解析 SSE 帧。
 *
 * @param sessionUid 会话 UID
 * @param content 用户消息内容
 * @param handlers 事件与生命周期回调
 * @returns 中止函数，调用后立即断开当前连接
 */
export const streamAgentChat = (
  sessionUid: string,
  content: string,
  handlers: StreamHandlers,
): (() => void) => {
  const controller = new AbortController();

  const run = async () => {
    try {
      const response = await fetch(`/api/agent/sessions/${sessionUid}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${ls.token.get()}`,
        },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = `请求失败（${response.status}）`;
        try {
          const data = (await response.json()) as { message?: string };
          if (data?.message) {
            message = data.message;
          }
        } catch {
          // 响应非 JSON，保留默认提示
        }
        handlers.onTransportError?.(message);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0) {
          const event = parseSseChunk(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          if (event) {
            handlers.onEvent(event);
          }
          boundary = buffer.indexOf('\n\n');
        }
      }

      // 处理结尾可能缺失分隔空行的残留帧
      const tail = parseSseChunk(buffer);
      if (tail) {
        handlers.onEvent(tail);
      }
    } catch (error) {
      // 主动中止属正常流程，不作为错误提示
      if ((error as Error)?.name !== 'AbortError') {
        handlers.onTransportError?.('连接智能体服务失败，请稍后重试');
      }
    } finally {
      handlers.onClose?.();
    }
  };

  run();

  return () => controller.abort();
};
