import type { Agent } from '@/typing/agent';

/** 交付物类型 → 中文展示名 */
export const DELIVERABLE_KIND_LABELS: Record<string, string> = {
  file: '文件',
  dataset: '数据集',
  ruleset: '解析规则',
  skill: '技能',
  task: '定时任务',
  data_project: '数据项目',
  data_view: '数据视图',
};

/** 交付物类型 → 图标类名 */
export const DELIVERABLE_KIND_ICONS: Record<string, string> = {
  file: 'i-icon-park-outline:file-text',
  dataset: 'i-icon-park-outline:data',
  ruleset: 'i-icon-park-outline:sort-amount-down',
  skill: 'i-icon-park-outline:robot-one',
  task: 'i-icon-park-outline:command',
  data_project: 'i-icon-park-outline:database-network',
  data_view: 'i-icon-park-outline:table-file',
};

/**
 * 把交付物映射为站内详情页路径。
 *
 * @param item 交付物（类型 + 标识 + 展示名）
 * @returns 详情页路径；返回 `null` 表示该类型暂不支持跳转（界面以纯文本展示）
 */
export const deliverablePath = (item: Agent.Deliverable): string | null => {
  const target = item.target?.trim();
  if (!target) {
    return null;
  }
  switch (item.kind) {
    case 'dataset':
      return `/data/dataset/detail/${encodeURIComponent(target)}`;
    case 'ruleset':
      return `/rule_management/ruleset/${encodeURIComponent(target)}`;
    case 'skill':
      return `/agent/skills?uid=${encodeURIComponent(target)}`;
    case 'task':
      return `/agent/tasks?uid=${encodeURIComponent(target)}`;
    case 'data_project':
      return `/data_project/detail/${encodeURIComponent(target)}`;
    case 'data_view':
      return `/data_project/view/${encodeURIComponent(target)}`;
    case 'file': {
      // 文件交付物：定位到所在目录并打开该文件预览
      const segments = target.replace(/^\/+/, '').split('/').filter(Boolean);
      const name = segments.pop();
      if (!name) {
        return null;
      }
      const params = new URLSearchParams();
      const dir = segments.join('/');
      if (dir) {
        params.set('path', dir);
      }
      params.set('file', name);
      return `/workspace?${params.toString()}`;
    }
    default:
      return null;
  }
};

/**
 * 按（类型 + 标识）去重追加交付物。
 *
 * @param current 现有交付物
 * @param incoming 新增交付物（可为空）
 * @returns 去重合并后的交付物；无新增时原样返回 `current`
 */
export const appendDeliverables = (
  current?: Agent.Deliverable[],
  incoming?: Agent.Deliverable[],
): Agent.Deliverable[] | undefined => {
  if (!incoming || incoming.length === 0) {
    return current;
  }
  const list = [...(current ?? [])];
  for (const item of incoming) {
    const duplicated = list.some(
      (kept) => kept.kind === item.kind && kept.target === item.target,
    );
    if (!duplicated) {
      list.push(item);
    }
  }
  return list;
};
