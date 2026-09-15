import {
  App,
  Button,
  Dropdown,
  Empty,
  Select,
  Space,
  Spin,
  Tooltip,
} from 'antd';
import clsx from 'clsx';
import { type FC, type ReactNode, useEffect, useRef } from 'react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatComposer } from '@/pages/AgentManagement/Chat/components/ChatComposer';
import { MessageItem } from '@/pages/AgentManagement/Chat/components/MessageItem';
import { SessionList } from '@/pages/AgentManagement/Chat/components/SessionList';
import type { Agent } from '@/typing/agent';

type Props = {
  /** 是否全屏：全屏时历史记录移至左侧栏，对话内容占满右侧 */
  fullscreen?: boolean;
  /** 头部右侧自定义操作（如全屏/收起），由容器传入 */
  extra?: ReactNode;
};

/**
 * 智能体对话面板主体：会话切换工具栏 + 消息流 + 输入区。
 * 适配窄侧栏与全屏两种宽度：停靠时用下拉框切换会话并限制消息列宽；
 * 全屏时左侧展示历史记录列表，右侧对话内容占满剩余宽度。
 */
export const AgentChatPanel: FC<Props> = ({ fullscreen = false, extra }) => {
  const { modal } = App.useApp();
  const {
    sessions,
    activeUid,
    activeSession,
    messages,
    busy,
    loadingMessages,
    compacting,
    selectSession,
    createSession,
    removeSession,
    refreshMessages,
    sendMessage,
    stopSession,
    stopRun,
    retryRun,
    compactToNewSession,
  } = useAgentChat();

  // 消息变化时滚动到底部
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const lastMessageId = messages[messages.length - 1]?.id;

  // 当前会话执行状态：执行中给出状态图标与文案
  const statusChip = busy ? (
    <span className="flex items-center gap-[4px] text-[12px] text-[#3875f6]">
      <i className="i-line-md:loading-twotone-loop animate-spin" />
      执行中
    </span>
  ) : null;

  const sessionOptions = sessions.map((item) => ({
    value: item.uid,
    label: item.title || '新的对话',
  }));

  /** 删除会话（未指定时删除当前会话） */
  const confirmDelete = (session?: Agent.Session) => {
    const target = session ?? activeSession;
    if (!target) return;
    modal.confirm({
      title: '删除会话',
      content: `确认删除会话「${target.title}」及其全部消息吗？`,
      okButtonProps: { danger: true },
      onOk: () => removeSession(target.uid),
    });
  };

  const moreMenu = {
    items: [
      {
        key: 'refresh',
        label: '刷新消息',
        icon: <i className="i-icon-park-outline:refresh" />,
        disabled: !activeUid,
      },
      {
        key: 'compact',
        label: '压缩续接',
        icon: <i className="i-icon-park-outline:history" />,
        disabled: !activeUid || busy,
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        label: '删除当前会话',
        danger: true,
        icon: <i className="i-icon-park-outline:delete" />,
        disabled: !activeUid,
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'refresh') {
        void refreshMessages();
      } else if (key === 'compact') {
        void compactToNewSession();
      } else if (key === 'delete') {
        confirmDelete();
      }
    },
  };

  const moreButton = (
    <Dropdown trigger={['click']} menu={moreMenu}>
      <Button
        size="small"
        aria-label="更多操作"
        loading={compacting}
        icon={<i className="i-icon-park-outline:more" />}
      />
    </Dropdown>
  );

  const messagesNode = (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
      {loadingMessages ? (
        <div className="flex h-full items-center justify-center">
          <Spin />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="开始和智能体对话吧"
          />
        </div>
      ) : (
        // 停靠（窄侧栏）时限制消息列宽；全屏时占满右侧宽度
        <div
          className={clsx(
            'w-full px-[16px] py-[14px]',
            fullscreen ? '' : 'mx-auto max-w-[860px]',
          )}
        >
          {messages.map((item) => (
            <MessageItem
              key={item.id}
              item={item}
              showRetry={item.id === lastMessageId}
              onRetry={retryRun}
            />
          ))}
        </div>
      )}
    </div>
  );

  const composer = (
    <ChatComposer
      busy={busy}
      disabled={!activeUid}
      onSend={sendMessage}
      onStop={stopRun}
    />
  );

  // 全屏：左侧历史记录 + 右侧对话内容占满剩余宽度
  if (fullscreen) {
    return (
      <div className="flex h-full w-full">
        <aside
          className="h-full w-[240px] shrink-0"
          style={{ borderRight: '1px solid rgba(0, 0, 0, 0.06)' }}
        >
          <SessionList
            sessions={sessions}
            activeUid={activeUid}
            onSelect={(uid) => void selectSession(uid)}
            onCreate={() => void createSession()}
            onStop={(uid) => void stopSession(uid)}
            onDelete={confirmDelete}
          />
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div
            className="flex items-center justify-between gap-[8px] px-[16px] py-[10px]"
            style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
          >
            <div className="flex min-w-0 items-center gap-[8px]">
              <i className="i-icon-park-outline:robot-one text-[18px] text-[#3875f6]" />
              <span className="truncate text-fg-title text-[15px] font-medium">
                {activeSession?.title || '智能体对话'}
              </span>
              {statusChip}
            </div>
            <Space size={4}>
              {moreButton}
              {extra}
            </Space>
          </div>

          {messagesNode}
          {composer}
        </div>
      </div>
    );
  }

  // 停靠（窄侧栏）：顶部标题 + 会话下拉工具栏 + 消息流 + 输入区
  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="flex items-center justify-between gap-[8px] px-[12px] py-[10px]"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
        <div className="flex min-w-0 items-center gap-[8px]">
          <i className="i-icon-park-outline:robot-one text-[18px] text-[#3875f6]" />
          <span className="truncate text-fg-title text-[15px] font-medium">
            智能体对话
          </span>
        </div>
        <Space size={4}>
          {statusChip}
          {extra}
        </Space>
      </div>

      <div
        className="flex items-center gap-[8px] px-[12px] py-[8px]"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
        <Select
          className="min-w-0 flex-1"
          size="small"
          value={activeUid}
          placeholder="选择会话"
          options={sessionOptions}
          onChange={(uid) => void selectSession(uid)}
          popupMatchSelectWidth={false}
          showSearch
          optionFilterProp="label"
          optionRender={(option) => {
            const running = sessions.some(
              (item) => item.uid === option.value && item.running,
            );
            return (
              <div className="flex items-center gap-[6px]">
                {running && (
                  <i className="i-line-md:loading-twotone-loop shrink-0 animate-spin text-[#3875f6]" />
                )}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {running && option.value && (
                  <Button
                    type="text"
                    size="small"
                    aria-label="停止执行"
                    className="shrink-0 text-[#3875f6]"
                    icon={<i className="i-icon-park-outline:pause" />}
                    onClick={(event) => {
                      // 阻止冒泡，避免点击停止时切换会话
                      event.stopPropagation();
                      void stopSession(String(option.value));
                    }}
                  />
                )}
              </div>
            );
          }}
        />
        <Tooltip title="新建会话">
          <Button
            size="small"
            type="primary"
            aria-label="新建会话"
            icon={<i className="i-icon-park-outline:plus" />}
            onClick={() => void createSession()}
          />
        </Tooltip>
        {moreButton}
      </div>

      {messagesNode}
      {composer}
    </div>
  );
};
