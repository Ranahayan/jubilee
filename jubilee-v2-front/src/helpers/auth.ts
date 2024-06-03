export const getHasJWT = (): boolean => !!localStorage.getItem("auth_token");
export const getJWT = (): string | null => localStorage.getItem("auth_token");
export const setJWT = (authToken: string): void =>
  localStorage.setItem("auth_token", authToken);

export const getHasRefreshToken = (): boolean =>
  !!localStorage.getItem("refresh_token");
export const getRefreshToken = (): string | null =>
  localStorage.getItem("refresh_token");
export const setRefreshToken = (refreshToken: string): void =>
  localStorage.setItem("refresh_token", refreshToken);
