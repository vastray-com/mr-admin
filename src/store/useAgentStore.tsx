import { createWithEqualityFn } from 'zustand/traditional';

type State = {
  /** 是否有智能体任务正在执行（收起侧栏时用于悬浮按钮角标提示） */
  running: boolean;
};

type Actions = {
  setRunning: (running: boolean) => void;
};

type Store = State & Actions;

/**
 * 智能体运行态：由对话状态机 `useAgentChat` 写入，供布局层（悬浮入口角标）读取。
 */
export const useAgentStore = createWithEqualityFn<Store>((set) => ({
  running: false,
  setRunning: (running: boolean) => set({ running }),
}));
