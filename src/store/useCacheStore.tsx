import { createWithEqualityFn } from 'zustand/traditional';
import type { StructRule } from '@/typing/structRules';

type State = {
  encodeList: Encode.List;
  structRuleList: StructRule.List;
};
type Actions = {
  setEncodeList: (list: Encode.List) => void;
  setStructRuleList: (list: StructRule.List) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  encodeList: [],
  structRuleList: [],
};

export const useCacheStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setEncodeList: (list: Encode.List) => set({ encodeList: list }),
  setStructRuleList: (list: StructRule.List) => set({ structRuleList: list }),
  reset: () => set({ ...initialState }),
}));
