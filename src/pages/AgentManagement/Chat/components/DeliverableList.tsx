import { Link } from 'react-router';
import {
  DELIVERABLE_KIND_ICONS,
  DELIVERABLE_KIND_LABELS,
  deliverablePath,
} from '@/utils/deliverables';
import type { FC } from 'react';
import type { Agent } from '@/typing/agent';

type Props = {
  /** 本轮智能体生成的交付物 */
  items?: Agent.Deliverable[];
};

/**
 * 交付物列表：把智能体生成的交付物（文件 / 数据集 / 解析规则 / 技能 / 任务等）
 * 以链接形式展示在对话中，点击跳转到对应交付物详情页。
 * 无交付物或类型暂不支持跳转时分别不渲染 / 降级为纯文本。
 */
export const DeliverableList: FC<Props> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div className="mt-[8px] rounded-[10px] border border-solid border-[rgba(56,117,246,0.16)] bg-white/50 px-[10px] py-[8px]">
      <div className="mb-[6px] flex items-center gap-[4px] text-fg-tertiary text-[12px]">
        <i className="i-icon-park-outline:link" />
        <span>交付物（{items.length}）</span>
      </div>
      <div className="flex flex-wrap gap-[6px]">
        {items.map((item, index) => {
          const to = deliverablePath(item);
          const kindLabel = DELIVERABLE_KIND_LABELS[item.kind] ?? item.kind;
          const label = item.label || item.target;
          const icon = DELIVERABLE_KIND_ICONS[item.kind];
          const key = `${item.kind}-${item.target}-${index}`;
          const inner = (
            <>
              {icon && <i className={icon} />}
              <span className="text-fg-tertiary">{kindLabel}</span>
              <span
                className="max-w-[220px] truncate font-medium"
                title={label}
              >
                {label}
              </span>
            </>
          );
          return to ? (
            <Link
              key={key}
              to={to}
              className="inline-flex items-center gap-[4px] rounded-[8px] bg-[rgba(56,117,246,0.08)] px-[8px] py-[3px] text-[12px] text-[#3875F6] no-underline hover:bg-[rgba(56,117,246,0.16)]"
            >
              {inner}
              <i className="i-icon-park-outline:arrow-right" />
            </Link>
          ) : (
            <span
              key={key}
              className="inline-flex items-center gap-[4px] rounded-[8px] bg-black/5 px-[8px] py-[3px] text-[12px]"
            >
              {inner}
            </span>
          );
        })}
      </div>
    </div>
  );
};
