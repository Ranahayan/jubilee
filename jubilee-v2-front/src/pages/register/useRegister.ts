import { useNavigate, useSearchParams } from "react-router-dom";
import { register } from "~/api/account/requests";
import { paths } from "~/router/paths";
import { setJWT, setRefreshToken } from "~/helpers/auth";
import { useAccount } from "~/hooks/useAccount";
import { IFormHookProps } from "~/types/form";
import handleErrors from "~/helpers/handleErrors";
import { useTranslation } from "react-i18next";
import { signupPartnerStack } from "~/helpers/signupPartnerStack";
import { usePartnerStack } from "~/hooks/usePartnerStack";
import { useUTM } from "~/hooks/useUTM";
import { triggerGTMDirectSignup, triggerGTMSignup } from "~/helpers/gtm";

export const useRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAccount } = useAccount();
  const { psXID } = usePartnerStack();
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
  const [searchParams] = useSearchParams();

  return async (form: IFormHookProps) => {
    const isValid = form.validate();
    if (!isValid || form.hasErrors) return;
    const values = form.getValues();
    if (!values || !values.name || !values.email) return;

    const toastMessages = {
      loading: t("auth.loading"),
      success: t("auth.success_register"),
      error: t("auth.error"),
    };

    const params = {
      name: values.name as string,
      email: (values.email as string).toLowerCase(),
      ps_xid: psXID,
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
      utm_sitelink: sitelink
    };

    const { response } = await handleErrors(
      () => register(params),
      toastMessages
    );
    if (response) {
      signupPartnerStack(values.email as string, response.user.id);
      await setJWT(response.access);
      await setRefreshToken(response.refresh);

      if (searchParams.has("email")) {
        triggerGTMSignup();
      } else {
        triggerGTMDirectSignup();
      }

      setAccount(response.user);
      navigate(paths.app.home);
    }
  };
};
