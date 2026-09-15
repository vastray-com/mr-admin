import { Button, Tooltip } from 'antd';
import clsx from 'clsx';
import { type FC, useCallback } from 'react';
import { AgentChatPanel } from '@/pages/AgentManagement/Chat/AgentChatPanel';
import {
  AGENT_DOCK_WIDTH_MAX,
  clampDockWidth,
} from '@/pages/AgentManagement/dockPrefs';
import type { MouseEvent as ReactMouseEvent } from 'react';

type Props = {
  /** 是否展开 */
  open: boolean;
  /** 是否全屏 */
  fullscreen: boolean;
  /** 停靠宽度（px） */
  width: number;
  /** 拖拽调整宽度回调 */
  onResize: (width: number) => void;
  onClose: () => void;
  onToggleFullscreen: () => void;
};

/**
 * 智能体对话右侧侧栏。
 *
 * - 展开（非全屏）：作为布局中的普通侧栏参与横向排布，**挤压**页面内容而非覆盖；
 *   左侧边缘可拖拽调整宽度。
 * - 全屏：脱离文档流固定铺满视口。
 * - 收起：宽度收敛为 0 并保持挂载（以 `inert` 禁用交互），
 *   保留对话状态与进行中的流式输出。
 * - 配色：与页面左侧栏一致，使用半透明玻璃底（`bg-white/30` + 模糊）。
 */
export const AgentChatDock: FC<Props> = ({
  open,
  fullscreen,
  width,
  onResize,
  onClose,
  onToggleFullscreen,
}) => {
  const isFullscreen = open && fullscreen;

  const startResize = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      const onMove = (moveEvent: MouseEvent) => {
        const maxWidth = Math.min(
          AGENT_DOCK_WIDTH_MAX,
          window.innerWidth - 240,
        );
        const next = clampDockWidth(
          Math.min(maxWidth, startWidth + (startX - moveEvent.clientX)),
        );
        onResize(next);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.userSelect = '';
      };

      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [width, onResize],
  );

  return (
    <div
      className={clsx(
        'h-full overflow-hidden bg-white/30',
        isFullscreen
          ? 'fixed inset-0 z-50 backdrop-blur-2xl'
          : 'relative shrink-0 rounded-[16px] backdrop-blur-[6px]',
      )}
      inert={!open}
      style={
        isFullscreen
          ? { width: '100vw' }
          : {
              width: open ? width : 0,
              marginLeft: open ? 12 : 0,
              border: open ? '1px solid rgba(0, 0, 0, 0.08)' : undefined,
              transition: 'width 0.2s ease, margin-left 0.2s ease',
            }
      }
    >
      {open && !isFullscreen && (
        <div
          className="absolute top-0 left-0 z-10 h-full w-[6px] cursor-col-resize hover:bg-[rgba(56,117,246,0.16)]"
          onMouseDown={startResize}
          title="拖动调整宽度"
        />
      )}

      <AgentChatPanel
        fullscreen={isFullscreen}
        extra={
          <>
            <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
              <Button
                size="small"
                type="text"
                aria-label={fullscreen ? '退出全屏' : '全屏'}
                icon={
                  <i
                    className={
                      fullscreen
                        ? 'i-icon-park-outline:off-screen-one'
                        : 'i-icon-park-outline:full-screen-one'
                    }
                  />
                }
                onClick={onToggleFullscreen}
              />
            </Tooltip>
            <Tooltip title="收起">
              <Button
                size="small"
                type="text"
                aria-label="收起侧栏"
                icon={<i className="i-icon-park-outline:close" />}
                onClick={onClose}
              />
            </Tooltip>
          </>
        }
      />
    </div>
  );
};
