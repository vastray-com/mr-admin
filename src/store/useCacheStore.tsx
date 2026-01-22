import { createWithEqualityFn } from 'zustand/traditional';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';

type SelectOptions = {
  label: string;
  value: string | number;
}[];

type State = {
  encodeList: EncodeTable.List;
  encodeOptions: SelectOptions;
  structRuleList: StructuredRuleset.List;
  presetFields: StructuredRuleset.PresetFields;
  ruleOptions: SelectOptions;
  pushRuleList: PushRule.List;
  pushRuleOptions: Record<string, SelectOptions>;
};
type Actions = {
  setEncodeList: (list: EncodeTable.List) => void;
  setStructRuleList: (list: StructuredRuleset.List) => void;
  setPresetFields: (fields: StructuredRuleset.PresetFields) => void;
  setPushRuleList: (list: PushRule.List) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  encodeList: [],
  encodeOptions: [],
  structRuleList: [],
  presetFields: [],
  ruleOptions: [],
  pushRuleList: [],
  pushRuleOptions: {},
};

export const useCacheStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setEncodeList: (list: EncodeTable.List) => {
    const encodeOptions = list.map((encode) => ({
      value: `${encode.uid}`,
      label: encode.name_cn,
    }));
    set({ encodeList: list, encodeOptions });
  },
  setStructRuleList: (list: StructuredRuleset.List) => {
    const ruleOptions = list.map((rule) => ({
      value: rule.uid,
      label: rule.name_cn,
    }));
    set({ structRuleList: list, ruleOptions });
  },
  setPresetFields: (fields: StructuredRuleset.PresetFields) =>
    set({ presetFields: fields }),
  setPushRuleList: (list: PushRule.List) => {
    const pushRuleOptions: Record<string, SelectOptions> = {};
    list.forEach((item) => {
      if (!pushRuleOptions[item.structured_rule_uid]) {
        pushRuleOptions[item.structured_rule_uid] = [];
      }
      pushRuleOptions[item.structured_rule_uid].push({
        value: item.uid,
        label: item.name_cn,
      });
    });
    set({ pushRuleList: list, pushRuleOptions });
  },
  reset: () => set({ ...initialState }),
}));
