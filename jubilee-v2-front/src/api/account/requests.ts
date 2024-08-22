import { sendGet, sendPost, sendPut } from "~/api/base";
import { getAPIData } from "../helpers";
import {
  ILoginRequest,
  IRefreshTokenRequest,
  IChangePasswordRequest,
  IRegisterRequest,
  IResetPassword,
  IRateRequest,
  ICustomizationRequest,
  IEditProfileRequest,
  ISocialLoginRequest,
  SocialProviders
} from "./types";

export const login = (params: ILoginRequest) =>
  getAPIData(sendPost("auth/login/", params));

export const register = (params: IRegisterRequest) =>
  getAPIData(sendPost("auth/register/", params));

export const getUser = () => getAPIData(sendGet("auth/user/"));

export const getIntercomToken = (): Promise<{ intercom_user_jwt: string }> =>
  getAPIData(sendGet("auth/intercom_token/"));

export const changePassword = (params: IChangePasswordRequest) =>
  getAPIData(sendPost("auth/password/change/", params));

export const editProfile = (params: IEditProfileRequest) =>
  getAPIData(sendPost("auth/edit/", params));

export const resetPasswordEmail = (params: Omit<ILoginRequest, "password">) =>
  getAPIData(sendPost("auth/forget_password/", params));

export const resetPassword = (params: IResetPassword) =>
  getAPIData(sendPost("auth/reset_password/", params));

export const refreshToken = (params: IRefreshTokenRequest) =>
  sendPost("auth/token/refresh/", params);

export const logout = () => getAPIData(sendPost("auth/logout/", {}));

export const rate = (params: IRateRequest) =>
  getAPIData(sendPost("auth/rate/", params));

export const customization = (params: ICustomizationRequest) =>
  getAPIData(sendPut("widget-customization", params));

export const socialLogin = (provider: SocialProviders, params: ISocialLoginRequest) =>
  getAPIData(sendPost(`auth/social/${provider}/`, params));