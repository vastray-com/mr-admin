import type { User } from '@/typing/user';

const KEYS = {
  ACCESS_TOKEN: 'aat',
  // REFRESH_TOKEN: 'rto',
  USER: 'user',
};

export const ls: User.LSUtil = {
  token: {
    // get: () => ({
    //   at: localStorage.getItem(KEYS.ACCESS_TOKEN) || '',
    //   rt: localStorage.getItem(KEYS.REFRESH_TOKEN) || '',
    // }),
    // set: (values) => {
    //   localStorage.setItem(KEYS.ACCESS_TOKEN, values.at);
    //   localStorage.setItem(KEYS.REFRESH_TOKEN, values.rt);
    // },
    // clear: () => {
    //   localStorage.removeItem(KEYS.ACCESS_TOKEN);
    //   localStorage.removeItem(KEYS.REFRESH_TOKEN);
    // },
    get: () => localStorage.getItem(KEYS.ACCESS_TOKEN) || '',
    set: (values) => localStorage.setItem(KEYS.ACCESS_TOKEN, values),
    clear: () => localStorage.removeItem(KEYS.ACCESS_TOKEN),
  },
  user: {
    get: () => JSON.parse(localStorage.getItem(KEYS.USER) || 'null'),
    set: (value) => localStorage.setItem(KEYS.USER, JSON.stringify(value)),
    clear: () => localStorage.removeItem(KEYS.USER),
  },
  clearAll: () => {
    ls.token.clear();
    ls.user.clear();
  },
};
