import { Card, Flex, Tag } from 'antd';
import { type FC, useCallback } from 'react';
import { datasetFilterDB2FE } from '@/pages/DatasetManagement/helper';
import { useCacheStore } from '@/store/useCacheStore';
import { ENUM_VARS } from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';

type Props = {
  filter: Dataset.Filter;
};

export const DatasetFilterDisplay: FC<Props> = ({ filter }) => {
  const feFilter = datasetFilterDB2FE(filter);
  const sourceSchema = useCacheStore((s) => s.sourceSchemaList);

  const getTableColumns = useCallback(
    (tableName: string) => {
      const table = sourceSchema.find((t) => t.value === tableName);
      return table ? table.columns : [];
    },
    [sourceSchema],
  );

  return (
    <div className="flex gap-[12px] flex-wrap">
      {feFilter.map((f, fi) => {
        return (
          <Card
            key={fi}
            className="w-[480px]"
            styles={{ body: { padding: '12px' } }}
          >
            <div className="flex items-center gap-[12px]">
              <Tag color="magenta" className="text-[14px]">
                {`过滤器 ${fi + 1}`}
              </Tag>
              <h2 className="text-[16px] font-medium">
                {ENUM_VARS.DATASET.FILTER_LOGIC_MAP[f.logic]}
              </h2>
            </div>

            <div className="mt-[16px] flex flex-col gap-[12px]">
              {f.group.map((g, gi) => {
                return (
                  <Card key={g.table} styles={{ body: { padding: '12px' } }}>
                    <div className="flex items-center gap-[12px] mb-[8px]">
                      <Tag color="blue">{`条件组 ${gi + 1}`}</Tag>
                      <p>
                        {sourceSchema.find((s) => s.value === g.table)?.label ||
                          g.table}
                      </p>
                    </div>

                    <div className="flex flex-col gap-y-[8px]">
                      {g.conditions.map((c, ci) => {
                        return (
                          <Card key={ci}>
                            <Tag
                              color="orange"
                              className="pos-absolute top-0 left-0"
                            >
                              {ENUM_VARS.DATASET.FILTER_LOGIC_MAP[c.logic]}
                            </Tag>

                            <div className="mt-[8px]">
                              {c.cols.map((c, coli) => {
                                return (
                                  <Flex
                                    key={coli}
                                    gap="12px"
                                    className="py-[4px] items-center"
                                  >
                                    <span>
                                      {
                                        getTableColumns(g.table).find(
                                          (col) => col.value === c.column,
                                        )?.label
                                      }
                                    </span>
                                    <span>
                                      {
                                        ENUM_VARS.DATASET.FILTER_OPERATOR_MAP[
                                          c.operator
                                        ]
                                      }
                                    </span>
                                    <span>{c.value}</span>
                                  </Flex>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
