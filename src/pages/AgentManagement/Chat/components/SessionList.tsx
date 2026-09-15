import { Button, Empty, Tooltip } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import type { FC } from 'react';
import type { Agent } from '@/typing/agent';

type Props = {
  /** 会话列表 */
  sessions: Agent.Session[];
  /** 当前选中的会话 uid */
  activeUid?: string;
  /** 切换会话 */
  onSelect: (uid: string) => void;
  /** 新建会话 */
  onCreate: () => void;
  /** 停止指定会话正在执行的任务 */
  onStop: (uid: string) => void;
  /** 删除指定会话 */
  onDelete: (session: Agent.Session) => void;
};

/** 格式化会话更新时间（紧凑展示） */
const formatUpdatedAt = (value?: string | null): string =>
  value ? dayjs(value).format('MM-DD HH:mm') : '';

/** 会话执行状态图标：执行中显示旋转加载图标，否则显示消息图标 */
const SessionStatusIcon: FC<{ running?: boolean; active: boolean }> = ({
  running,
  active,
}) =>
  running ? (
    <Tooltip title="执行中">
      <i className="i-line-md:loading-twotone-loop shrink-0 animate-spin text-[14px] text-[#3875f6]" />
    </Tooltip>
  ) : (
    <i
      className={clsx(
        'i-icon-park-outline:message-one shrink-0 text-[14px]',
        active ? 'text-[#3875f6]' : 'text-fg-tertiary',
      )}
    />
  );

/**
 * 会话历史列表（全屏模式下的左侧栏）。
 * 展示全部会话，支持切换、新建与删除。
 */
export const SessionList: FC<Props> = ({
  sessions,
  activeUid,
  onSelect,
  onCreate,
  onStop,
  onDelete,
}) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="flex items-center justify-between gap-[8px] px-[12px] py-[10px]"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
        <span className="truncate text-fg-title text-[14px] font-medium">
          历史记录
        </span>
        <Tooltip title="新建会话">
          <Button
            size="small"
            type="primary"
            aria-label="新建会话"
            icon={<i className="i-icon-park-outline:plus" />}
            onClick={onCreate}
          />
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-[8px]">
        {sessions.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无历史记录"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-[4px]">
            {sessions.map((item) => {
              const active = item.uid === activeUid;
              const updatedAt = formatUpdatedAt(item.updated_at);
              return (
                <div
                  key={item.uid}
                  className={clsx(
                    'group flex cursor-pointer items-center gap-[6px] rounded-[8px] px-[10px] py-[8px] transition-colors',
                    active ? 'bg-[rgba(56,117,246,0.12)]' : 'hover:bg-white/50',
                  )}
                  onClick={() => onSelect(item.uid)}
                >
                  <SessionStatusIcon running={item.running} active={active} />
                  <div className="min-w-0 flex-1">
                    <div
                      className={clsx(
                        'truncate text-[13px]',
                        active
                          ? 'text-[#3875f6] font-medium'
                          : 'text-fg-primary',
                      )}
                    >
                      {item.title || '新的对话'}
                    </div>
                    {updatedAt && (
                      <div className="truncate text-fg-tertiary text-[11px]">
                        {updatedAt}
                      </div>
                    )}
                  </div>
                  {item.running && (
                    <Tooltip title="停止执行">
                      <Button
                        type="text"
                        size="small"
                        aria-label="停止执行"
                        className="shrink-0 text-[#3875f6]"
                        icon={<i className="i-icon-park-outline:pause" />}
                        onClick={(event) => {
                          event.stopPropagation();
                          onStop(item.uid);
                        }}
                      />
                    </Tooltip>
                  )}
                  <Button
                    type="text"
                    size="small"
                    aria-label="删除会话"
                    className={clsx(
                      'shrink-0 transition-opacity',
                      active
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100',
                    )}
                    icon={
                      <i className="i-icon-park-outline:delete text-[13px]" />
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
