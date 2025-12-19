import { createWithEqualityFn } from 'zustand/traditional';
import { ls } from '@/utils/ls';
import type { User } from '@/typing/user';

type State = {
  user?: User.User;
};
type Actions = {
  setUser: (user: User.User) => void;
  reset: () => void;
};
type Store = State & Actions;

const initialState: State = {
  user: ls.user.get() ?? null,
};

export const useUserStore = createWithEqualityFn<Store>((set) => ({
  ...initialState,
  setUser: (user: User.User) => {
    ls.user.set(user);
    set({ user });
  },
  reset: () => set({ ...initialState }),
}));
