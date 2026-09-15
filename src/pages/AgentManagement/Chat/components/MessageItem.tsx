import { Avatar, Button, Tag } from 'antd';
import clsx from 'clsx';
import { Markdown } from '@/components/Markdown';
import { DeliverableList } from '@/pages/AgentManagement/Chat/components/DeliverableList';
import { ToolProgress } from '@/pages/AgentManagement/Chat/components/ToolProgress';
import type { FC } from 'react';
import type { Agent } from '@/typing/agent';

type Props = {
  item: Agent.ChatItem;
  /** 是否展示重试入口（仅最近一条失败消息） */
  showRetry?: boolean;
  onRetry?: () => void;
};

/** 单条对话消息：用户右侧气泡，助手左侧（Markdown + 工具进度 + 执行明细） */
export const MessageItem: FC<Props> = ({ item, showRetry, onRetry }) => {
  if (item.role === 'user') {
    return (
      <div className="mb-[16px] flex justify-end">
        <div className="max-w-[80%] break-words rounded-[12px] bg-[#3875f6] px-[14px] py-[10px] text-[14px] text-white whitespace-pre-wrap">
          {item.content}
        </div>
      </div>
    );
  }

  const running = item.streaming || item.status === 'running';
  const failed = item.status === 'error';

  return (
    <div className="mb-[18px] flex gap-[10px]">
      <Avatar
        size={32}
        className="shrink-0 bg-[#eef4ff] text-[#3875f6]"
        icon={<i className="i-icon-park-outline:robot-one" />}
      />
      <div className="min-w-0 flex-1">
        {item.tools && item.tools.length > 0 && (
          <ToolProgress tools={item.tools} />
        )}

        {running && item.phase && (
          <div className="mb-[6px] flex items-center gap-[6px] text-[#3875f6] text-[12px]">
            <i className="i-line-md:loading-twotone-loop" />
            <span>{item.phase}</span>
          </div>
        )}

        {item.content ? (
          <div
            className={clsx(
              'rounded-[12px] px-[14px] py-[10px]',
              failed
                ? 'bg-[#fff1f0] text-[#cf1322]'
                : 'border border-solid border-[rgba(56,117,246,0.16)] bg-[#eef4ff]',
            )}
          >
            {failed ? (
              <span className="break-words text-[13px] whitespace-pre-wrap">
                {item.content}
              </span>
            ) : (
              <Markdown content={item.content} />
            )}
          </div>
        ) : running ? (
          <div className="text-[#3875f6] text-[13px]">正在思考…</div>
        ) : null}

        <DeliverableList items={item.deliverables} />

        <div className="mt-[6px] flex items-center gap-[8px]">
          {item.status === 'stopped' && <Tag>已停止</Tag>}
          {failed && <Tag color="error">执行失败</Tag>}
          {showRetry && failed && onRetry && (
            <Button size="small" type="link" onClick={onRetry}>
              重试
            </Button>
          )}
        </div>

        {item.trace && item.trace.length > 0 && (
          <details className="mt-[6px] text-fg-tertiary text-[12px]">
            <summary className="cursor-pointer select-none">
              执行明细（{item.trace.length}）
            </summary>
            <ul className="mt-[4px] list-disc pl-[18px]">
              {item.trace.map((line, index) => (
                <li
                  key={`${item.id}-trace-${index}`}
                  className="my-[2px] break-words"
                >
                  {line}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
};
