import { createWithEqualityFn } from 'zustand/traditional';
import type { PushRule } from '@/typing/pushRules';
import type { StructRule } from '@/typing/structRules';

type SelectOptions = {
  label: string;
  value: string | number;
}[];

type State = {
  encodeList: Encode.List;
  encodeOptions: SelectOptions;
  structRuleList: StructRule.List;
  presetFields: StructRule.PresetFields;
  ruleOptions: SelectOptions;
  pushRuleList: PushRule.List;
  pushRuleOptions: Record<string, SelectOptions>;
};
type Actions = {
  setEncodeList: (list: Encode.List) => void;
  setStructRuleList: (list: StructRule.List) => void;
  setPresetFields: (fields: StructRule.PresetFields) => void;
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
  setEncodeList: (list: Encode.List) => {
    const encodeOptions = list.map((encode) => ({
      value: `${encode.uid}`,
      label: encode.name_cn,
    }));
    set({ encodeList: list, encodeOptions });
  },
  setStructRuleList: (list: StructRule.List) => {
    const ruleOptions = list.map((rule) => ({
      value: rule.uid,
      label: rule.name_cn,
    }));
    set({ structRuleList: list, ruleOptions });
  },
  setPresetFields: (fields: StructRule.PresetFields) =>
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
