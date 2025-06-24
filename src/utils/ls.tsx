const KEYS = {
  ACCESS_TOKEN: 'aat',
  REFRESH_TOKEN: 'rto',
};

export const ls: LocalStorage.Utils = {
  token: {
    get: () => ({
      at: localStorage.getItem(KEYS.ACCESS_TOKEN) || '',
      rt: localStorage.getItem(KEYS.REFRESH_TOKEN) || '',
    }),
    set: (values) => {
      localStorage.setItem(KEYS.ACCESS_TOKEN, values.at);
      localStorage.setItem(KEYS.REFRESH_TOKEN, values.rt);
    },
    clear: () => {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
    },
  },
};
