/** 智能体对话侧栏默认宽度（px） */
export const AGENT_DOCK_WIDTH_DEFAULT = 440;

/** 侧栏最小宽度（px） */
export const AGENT_DOCK_WIDTH_MIN = 320;

/** 侧栏最大宽度（px） */
export const AGENT_DOCK_WIDTH_MAX = 900;

/** 侧栏偏好（持久化到 localStorage） */
export type AgentDockPrefs = {
  /** 是否展开 */
  open: boolean;
  /** 是否全屏 */
  fullscreen: boolean;
  /** 停靠宽度（px） */
  width: number;
};

const STORAGE_KEY = 'agent_dock_prefs';

const DEFAULT_PREFS: AgentDockPrefs = {
  open: false,
  fullscreen: false,
  width: AGENT_DOCK_WIDTH_DEFAULT,
};

/** 把宽度夹取到合法区间 */
export const clampDockWidth = (width: number): number =>
  Math.min(
    AGENT_DOCK_WIDTH_MAX,
    Math.max(AGENT_DOCK_WIDTH_MIN, Math.round(width)),
  );

/** 读取侧栏偏好（缺失或异常时回退默认值） */
export const loadAgentDockPrefs = (): AgentDockPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFS;
    }
    const parsed = JSON.parse(raw) as Partial<AgentDockPrefs>;
    return {
      open: !!parsed.open,
      fullscreen: !!parsed.fullscreen,
      width: clampDockWidth(parsed.width ?? AGENT_DOCK_WIDTH_DEFAULT),
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

/** 保存侧栏偏好（存储不可用时静默忽略） */
export const saveAgentDockPrefs = (prefs: AgentDockPrefs): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 忽略存储异常（如隐私模式/配额不足）
  }
};
