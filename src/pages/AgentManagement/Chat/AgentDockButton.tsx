import { Badge, Tooltip } from 'antd';
import clsx from 'clsx';
import type { FC } from 'react';

type Props = {
  /** 对话侧栏是否展开 */
  open: boolean;
  /** 是否有智能体任务正在执行 */
  running: boolean;
  /** 切换侧栏开合 */
  onToggle: () => void;
};

/**
 * 智能体对话入口按钮（顶栏右上角、用户头像左侧）。
 *
 * 点击开合右侧对话侧栏：收起态为品牌蓝渐变实心圆角按钮，展开态切换为浅色态；
 * 后台任务执行中以角标提示。
 */
export const AgentDockButton: FC<Props> = ({ open, running, onToggle }) => (
  <Tooltip title={open ? '收起智能体对话' : '打开智能体对话'}>
    <Badge dot={running} color="#3875f6" offset={[-2, 2]}>
      <button
        type="button"
        aria-label={open ? '收起智能体对话' : '打开智能体对话'}
        aria-pressed={open}
        onClick={onToggle}
        className={clsx(
          'h-[40px] w-[40px] flex cursor-pointer items-center justify-center',
          'border-none rounded-[12px] transition-all duration-200 active:scale-95',
          open
            ? 'bg-[#eef4ff] text-[#3875f6] shadow-[0_0_0_1px_rgba(56,117,246,0.25)]'
            : 'bg-gradient-to-br from-[#5b93ff] via-[#4a83fb] to-[#3875f6] text-white shadow-[0_6px_16px_rgba(56,117,246,0.35)] hover:shadow-[0_8px_22px_rgba(56,117,246,0.5)] hover:brightness-105',
        )}
      >
        <i className="i-icon-park-solid:robot-one text-[24px]" />
      </button>
    </Badge>
  </Tooltip>
);
