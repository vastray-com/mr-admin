import {
  DatasetFilterLogic,
  DatasetFilterOperator,
} from '@/typing/enum/dataset';
import type { Dataset } from '@/typing/dataset';

// 数据库结构依赖前缀区分层级（见 `common/src/warehouse/expr.rs` 的 `Expr::from_key_value`）：
// 表名用 `#`、列名用 `@`、逻辑符与操作符用 `$`。AI 生成结果可能漏写前缀，
// 缺少前缀会让后端解析直接 panic，因此这里统一补正。
const LOGIC_ALIASES: Record<string, DatasetFilterLogic> = {
  and: DatasetFilterLogic.And,
  $and: DatasetFilterLogic.And,
  or: DatasetFilterLogic.Or,
  $or: DatasetFilterLogic.Or,
};

const OPERATOR_ALIASES: Record<string, DatasetFilterOperator> = {
  eq: DatasetFilterOperator.Equal,
  '=': DatasetFilterOperator.Equal,
  '==': DatasetFilterOperator.Equal,
  ne: DatasetFilterOperator.NotEqual,
  '!=': DatasetFilterOperator.NotEqual,
  '<>': DatasetFilterOperator.NotEqual,
  gt: DatasetFilterOperator.GreaterThan,
  '>': DatasetFilterOperator.GreaterThan,
  gte: DatasetFilterOperator.GreaterThanOrEqual,
  '>=': DatasetFilterOperator.GreaterThanOrEqual,
  lt: DatasetFilterOperator.LessThan,
  '<': DatasetFilterOperator.LessThan,
  lte: DatasetFilterOperator.LessThanOrEqual,
  '<=': DatasetFilterOperator.LessThanOrEqual,
  contains: DatasetFilterOperator.Contains,
  not_contains: DatasetFilterOperator.NotContains,
  notcontains: DatasetFilterOperator.NotContains,
};

/** 抹掉可能缺失/写错的 `#`/`@`/`$` 前缀，再补上正确前缀 */
const withKeyPrefix = (raw: string, prefix: '#' | '@' | '$'): string =>
  `${prefix}${String(raw ?? '')
    .trim()
    .replace(/^[#@$]+/, '')}`;

/** 归一化逻辑符：统一为 `$AND`/`$OR` */
const normalizeLogic = (raw: string): DatasetFilterLogic => {
  const key = String(raw ?? '')
    .trim()
    .replace(/^\$+/, '')
    .toLowerCase();
  return LOGIC_ALIASES[key] ?? DatasetFilterLogic.And;
};

/** 归一化操作符：统一为 `$` 前缀的规范写法 */
const normalizeOperator = (raw: string): DatasetFilterOperator => {
  const key = String(raw ?? '')
    .trim()
    .replace(/^\$+/, '')
    .toLowerCase();
  return OPERATOR_ALIASES[key] ?? (String(raw) as DatasetFilterOperator);
};

export const isVisitNoFilter = (
  filter: Dataset.FilterValue | null | undefined,
): filter is Dataset.VisitNoFilter => {
  if (!Array.isArray(filter)) return false;
  return filter.length === 0 || typeof filter[0] === 'string';
};

export const normalizeVisitNos = (rawText: string): Dataset.VisitNoFilter => {
  const values = rawText
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
};

export const datasetFilterFE2DB = (
  f: Dataset.FilterFEInput,
): Dataset.Filter => {
  return f.map((g) => {
    return {
      [normalizeLogic(g.logic)]: g.group.map((item) => {
        return {
          [withKeyPrefix(item.table, '#')]: item.conditions.map((condition) => {
            return {
              [normalizeLogic(condition.logic)]: condition.cols.map((col) => ({
                [withKeyPrefix(col.column, '@')]: [
                  {
                    [normalizeOperator(col.operator)]: col.value,
                  },
                ],
              })),
            };
          }),
        };
      }),
    };
  });
};

export const datasetFilterDB2FE = (
  f: Dataset.Filter,
): Dataset.FilterFEInput => {
  return f.map((group) => {
    const [logic, tables] = Object.entries(group)[0];
    return {
      logic: logic as DatasetFilterLogic,
      group: (tables ?? []).map((t) => {
        const [table, conditions] = Object.entries(t)[0];
        return {
          table,
          conditions: conditions.map((condition) => {
            const [logic, cols] = Object.entries(condition)[0];
            return {
              logic: logic as DatasetFilterLogic,
              cols: cols.map((col) => {
                const [column, operations] = Object.entries(col)[0];
                const [operation] = operations;
                const [operator, value] = Object.entries(operation)[0];
                return {
                  column,
                  operator: operator as DatasetFilterOperator,
                  value,
                };
              }),
            };
          }),
        };
      }),
    };
  });
};
