declare namespace LocalStorage {
  type Token = {
    at: string; // Access Token
    rt: string; // Refresh Token
  };

  type Utils = {
    token: {
      get: () => Token;
      set: (value: Token) => void;
      clear: () => void;
    };
  };
}
