import { createWithEqualityFn } from 'zustand/traditional';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';
import type { Warehouse } from '@/typing/warehose';

type SelectOptions = {
  label: string;
  value: string | number;
}[];

type State = {
  presetFields: StructuredRuleset.PresetFields;
  encodeTableList: EncodeTable.List;
  encodeTableOptions: SelectOptions;
  structuredRulesetList: StructuredRuleset.List;
  structuredRulesetOptions: SelectOptions;
  pushRuleList: PushRule.List;
  pushRuleOptions: Record<string, SelectOptions>;
  sourceSchemaList: Warehouse.SourceSchemas;
  resourceTypeOptions: SelectOptions;
  resourceTypeMap: Record<string, string>;
};
type Actions = {
  setPresetFields: (fields: StructuredRuleset.PresetFields) => void;
  setEncodeTableList: (list: EncodeTable.List) => void;
  setStructuredRulesetList: (list: StructuredRuleset.List) => void;
  setPushRuleList: (list: PushRule.List) => void;
  setSourceSchema: (list: Warehouse.SourceSchemas) => void;
  setResourceTypeOptions: (list: Warehouse.ResourceTypeOptions) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  encodeTableList: [],
  encodeTableOptions: [],
  structuredRulesetList: [],
  presetFields: [],
  structuredRulesetOptions: [],
  pushRuleList: [],
  pushRuleOptions: {},
  sourceSchemaList: [],
  resourceTypeOptions: [],
  resourceTypeMap: {},
};

export const useCacheStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setEncodeTableList: (list: EncodeTable.List) => {
    const encodeTableOptions = list.map((encode) => ({
      value: `${encode.uid}`,
      label: encode.name,
    }));
    set({ encodeTableList: list, encodeTableOptions });
  },
  setStructuredRulesetList: (list: StructuredRuleset.List) => {
    const structuredRulesetOptions = list.map((ruleset) => ({
      value: ruleset.uid,
      label: ruleset.name_cn,
    }));
    set({ structuredRulesetList: list, structuredRulesetOptions });
  },
  setPresetFields: (fields: StructuredRuleset.PresetFields) =>
    set({ presetFields: fields }),
  setPushRuleList: (list: PushRule.List) => {
    const pushRuleOptions: Record<string, SelectOptions> = {};
    list.forEach((item) => {
      if (!pushRuleOptions[item.structured_ruleset_uid]) {
        pushRuleOptions[item.structured_ruleset_uid] = [];
      }
      pushRuleOptions[item.structured_ruleset_uid].push({
        value: item.uid,
        label: item.name,
      });
    });
    set({ pushRuleList: list, pushRuleOptions });
  },
  setSourceSchema: (list: Warehouse.SourceSchemas) =>
    set({ sourceSchemaList: list }),
  setResourceTypeOptions: (list: Warehouse.ResourceTypeOptions) => {
    const resourceTypeOptions = list.map((item) => ({
      value: item.value,
      label: item.label,
    }));
    const resourceTypeMap = list.reduce<Record<string, string>>((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {});
    set({ resourceTypeOptions, resourceTypeMap });
  },
  reset: () => set({ ...initialState }),
}));
