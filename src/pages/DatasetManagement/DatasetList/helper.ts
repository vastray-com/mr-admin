import type { Dataset } from '@/typing/dataset';
import type {
  DatasetFilterLogic,
  DatasetFilterOperator,
  DatasetFilterTable,
} from '@/typing/enum';

export const datasetFilterFE2DB = (
  f: Dataset.FilterFEInput,
): Dataset.Filter => {
  return f.map((g) => {
    return {
      [g.logic]: g.group.map((item) => {
        return {
          [item.table]: item.conditions.map((col) => ({
            [col.column]: [
              {
                [col.operator]: col.value,
              },
            ],
          })),
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
      group: tables.map((t) => {
        const [table, cols] = Object.entries(t)[0];
        return {
          table: table as DatasetFilterTable,
          conditions: cols.map((col) => {
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
  });
};
