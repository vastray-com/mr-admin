import type { Dataset } from '@/typing/dataset';
import type {
  DatasetFilterLogic,
  DatasetFilterOperator,
} from '@/typing/enum/dataset';

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
      [g.logic]: g.group.map((item) => {
        return {
          [item.table]: item.conditions.map((condition) => {
            return {
              [condition.logic]: condition.cols.map((col) => ({
                [col.column]: [
                  {
                    [col.operator]: col.value,
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
