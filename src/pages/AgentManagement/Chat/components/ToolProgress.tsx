import { Spin } from 'antd';
import clsx from 'clsx';
import { Fragment } from 'react';
import { describeToolArgs } from '@/utils/toolArgs';
import type { FC } from 'react';
import type { Agent } from '@/typing/agent';

/** 工具名 → 中文展示名 */
const TOOL_LABELS: Record<string, string> = {
  warehouse_list_tables: '浏览数据仓库表',
  warehouse_table_metadata: '查看数仓表结构',
  warehouse_query: '查询数据仓库',
  current_time: '获取当前时间',
  skill_list: '查询技能库',
  skill_create: '创建技能',
  skill_update: '更新技能',
  task_list: '查询定时任务',
  task_get: '查询任务详情',
  task_create: '创建定时任务',
  task_set_enabled: '启停定时任务',
  list_dir: '浏览工作区目录',
  read_file: '读取文件',
  grep: '检索文件内容',
};

/** 工具展示名（未知工具回退为原始名称） */
export const toolLabel = (name: string): string => TOOL_LABELS[name] ?? name;

type Props = {
  tools: Agent.ChatTool[];
};

/** 流式期间的工具调用进度：工具名 + 参数（按可读形式展示，不直接输出 JSON） */
export const ToolProgress: FC<Props> = ({ tools }) => {
  if (tools.length === 0) {
    return null;
  }
  return (
    <div className="mb-[8px] flex flex-col gap-[6px]">
      {tools.map((tool, index) => {
        const argItems = describeToolArgs(tool.name, tool.args);
        return (
          <div
            key={`${tool.name}-${index}`}
            className="flex flex-col gap-[2px]"
          >
            <div className="flex items-center gap-[6px] text-[12px]">
              {tool.status === 'running' ? (
                <Spin size="small" />
              ) : (
                <i
                  className={
                    tool.status === 'ok'
                      ? 'i-icon-park-outline:check text-[#52c41a]'
                      : 'i-icon-park-outline:close text-[#ff4d4f]'
                  }
                />
              )}
              <span className="text-fg-secondary">{toolLabel(tool.name)}</span>
              <span className="text-fg-tertiary">{tool.name}</span>
              {tool.status === 'failed' && (
                <span className="text-[#ff4d4f]">失败</span>
              )}
            </div>

            {argItems.length > 0 && (
              <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-[8px] gap-y-[2px] pl-[22px] text-[12px]">
                {argItems.map((item) => (
                  <Fragment key={item.key}>
                    <dt className="whitespace-nowrap text-fg-tertiary">
                      {item.label}
                    </dt>
                    <dd
                      className={clsx(
                        'min-w-0 text-fg-secondary',
                        item.code && 'font-mono',
                        item.long ? 'line-clamp-2 break-all' : 'truncate',
                      )}
                      title={item.long ? item.value : undefined}
                    >
                      {item.value}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
};
