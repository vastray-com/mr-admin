import { createWithEqualityFn } from 'zustand/traditional';
import { ls } from '@/utils/ls';

type State = {
  user: LocalStorage.User | null;
};
type Actions = {
  setUser: (user: LocalStorage.User) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  user: ls.user.get() ?? null,
};

export const useUserStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setUser: (user: LocalStorage.User) => set({ user }),
  reset: () => set({ ...initialState }),
}));
