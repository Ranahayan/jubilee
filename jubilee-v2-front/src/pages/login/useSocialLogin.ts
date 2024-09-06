import { paths } from "~/router/paths";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccount } from "~/hooks/useAccount";
import { useQueryClient } from "@tanstack/react-query";
import handleErrors from "~/helpers/handleErrors";
import { setJWT, setRefreshToken } from "~/helpers/auth";
import { socialLogin } from "~/api/account/requests";
import { SocialProviders, ISocialLoginRequest } from "~/api/account/types";
import { useUTM } from "~/hooks/useUTM";

export const useSocialLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAccount } = useAccount();
  const client = useQueryClient();
  const { 
    campaign, 
    campaignid,
    source, 
    medium, 
    term, 
    content,
    medium_variant,
    device,
    network,
    placement,
    loc_physical,
    adgroup,
    assetgroupid,
    creative,
    keyword,
    keywordid,
    searchterm,
    matchtype,
    location,
    sitelink
  } = useUTM();

  return async (provider: SocialProviders, tokens: ISocialLoginRequest) => {
    if (!tokens || !tokens.access_token || !tokens.id_token) return;

    const toastMessages = {
      loading: t("auth.loading"),
      success: t("auth.success_login"),
      error: t("auth.error"),
    };

    const params: any = {
      utm_campaign: campaign,
      utm_campaignid: campaignid,
      utm_source: source,
      utm_medium: medium,
      utm_term: term,
      utm_content: content,
      utm_medium_variant: medium_variant,
      utm_device: device,
      utm_network: network,
      utm_placement: placement,
      utm_loc_physical: loc_physical,
      utm_adgroup: adgroup,
      utm_assetgroupid: assetgroupid,
      utm_creative: creative,
      utm_keyword: keyword,
      utm_keywordid: keywordid,
      utm_searchterm: searchterm,
      utm_matchtype: matchtype,
      utm_location: location,
      utm_sitelink: sitelink,
      access_token: tokens.access_token,
      id_token: tokens.id_token,
    };

    const { response } = await handleErrors(
      () => socialLogin(provider, params as ISocialLoginRequest),
      toastMessages
    );
    if (response) {
      client.clear();
      await setJWT(response.access);
      await setRefreshToken(response.refresh);
      setAccount(response.user);
      navigate(paths.app.home);
    }
  };
};
