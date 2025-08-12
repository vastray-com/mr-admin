import { createWithEqualityFn } from 'zustand/traditional';

type State = {
  encodeList: Encode.List;
};
type Actions = {
  setEncodeList: (list: Encode.List) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  encodeList: [],
};

export const useCacheStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setEncodeList: (list: Encode.List) => set({ encodeList: list }),
  reset: () => set({ ...initialState }),
}));
