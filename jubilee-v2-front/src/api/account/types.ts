import { IAccount, IOnboardingChoices } from "~/types/account";

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
}
export interface ILoginResponse {
  access: string;
  refresh: string;
  user: IAccount;
}

export interface IResetPassword {
  token: string;
  password: string;
  repeat_password: string;
}

export interface IRefreshTokenRequest {
  refresh: string;
}
export interface IRefreshTokenResponse {
  access: string;
  access_token_expiration: string; // ISO 8601
}

export interface IChangePasswordRequest {
  old_password?: string | null;
  new_password1: string;
  new_password2: string;
  name?: string;
  email?: string;
}

export interface IEditProfileRequest {
  name?: string;
  email?: string;
  onboarding_choices?: IOnboardingChoices;
}

export interface IRateRequest {
  rating: number;
  feedback: string | null;
}

export interface ICustomizationRequest {
  desktop_title?: string;
  desktop_hashtag_filter?: string;
  desktop_max_row_count?: number;
  desktop_max_column_count?: number;
  desktop_alignment?: string;
  desktop_main_padding?: number;
  desktop_main_border_radius?: number;
  desktop_allow_load_more?: boolean;
  desktop_post_padding?: number;
  desktop_on_click_popup?: boolean;
  desktop_bg_color?: string;
  desktop_primary_color?: string;
  mobile_title?: string;
  mobile_hashtag_filter?: string;
  mobile_max_row_count?: number;
  mobile_max_column_count?: number;
  mobile_alignment?: string;
  mobile_main_padding?: number;
  mobile_main_border_radius?: number;
  mobile_allow_load_more?: boolean;
  mobile_post_padding?: number;
  mobile_on_click_popup?: boolean;
  mobile_bg_color?: string;
  mobile_primary_color?: string;
  remove_powered_by?: boolean;
}

export interface ISocialLoginRequest {
  access_token: string;
  id_token: string;
}

export type SocialProviders = "google" | "facebook";
