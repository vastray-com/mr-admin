import { enumMapToOptions } from '@/utils/helper';

// 时间过滤类型
export enum WarehouseOverviewTimeType {
  Relative = 'relative',
  Range = 'range',
}
const OVERVIEW_TIME_TYPE_MAP: Record<WarehouseOverviewTimeType, string> = {
  [WarehouseOverviewTimeType.Relative]: '相对时间范围',
  [WarehouseOverviewTimeType.Range]: '指定时间范围',
};

// 相对时间选项
export enum WarehouseOverviewRelativeTime {
  CurWeek = 'cur_week',
  CurMonth = 'cur_month',
  CurYear = 'cur_year',
}
const OVERVIEW_RELATIVE_TIME_MAP: Record<
  WarehouseOverviewRelativeTime,
  string
> = {
  [WarehouseOverviewRelativeTime.CurWeek]: '本周',
  [WarehouseOverviewRelativeTime.CurMonth]: '本月',
  [WarehouseOverviewRelativeTime.CurYear]: '本年',
};

export default {
  OVERVIEW_TIME_TYPE_MAP,
  OVERVIEW_TIME_TYPE_OPT: enumMapToOptions(OVERVIEW_TIME_TYPE_MAP),
  OVERVIEW_RELATIVE_TIME_MAP,
  OVERVIEW_RELATIVE_TIME_OPT: enumMapToOptions(OVERVIEW_RELATIVE_TIME_MAP),
};
