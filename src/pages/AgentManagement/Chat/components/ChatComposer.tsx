import { Button, Input } from 'antd';
import { type FC, useState } from 'react';

type Props = {
  /** 是否已有任务在执行（用于禁用发送/展示停止） */
  busy: boolean;
  /** 是否禁用输入（未选择会话） */
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

/** 对话输入区：Enter 发送、Shift + Enter 换行，执行中可停止 */
export const ChatComposer: FC<Props> = ({ busy, disabled, onSend, onStop }) => {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || busy || disabled) {
      return;
    }
    onSend(text);
    setValue('');
  };

  return (
    <div
      className="px-[16px] pt-[10px] pb-[14px]"
      style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}
    >
      <Input.TextArea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="向智能体提问，可查询平台数据、管理技能与定时任务…"
        autoSize={{ minRows: 2, maxRows: 6 }}
        disabled={disabled}
      />

      <div className="mt-[8px] flex items-center justify-between">
        <span className="text-fg-tertiary text-[12px]">
          Enter 发送 · Shift + Enter 换行
        </span>
        <div className="flex items-center gap-[8px]">
          {busy && (
            <Button
              danger
              onClick={onStop}
              icon={<i className="i-icon-park-outline:pause" />}
            >
              停止
            </Button>
          )}
          <Button
            type="primary"
            onClick={submit}
            disabled={busy || disabled || !value.trim()}
            icon={<i className="i-icon-park-outline:send" />}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};
