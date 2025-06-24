declare namespace LocalStorage {
  type Token = {
    at: string; // Access Token
    rt: string; // Refresh Token
  };

  type User = {
    id: number;
    name: string;
  };

  type Utils = {
    token: {
      get: () => Token;
      set: (value: Token) => void;
      clear: () => void;
    };
    user: {
      get: () => User;
      set: (value: User) => void;
      clear: () => void;
    };
    clearAll: () => void;
  };
}
