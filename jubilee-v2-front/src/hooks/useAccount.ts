import { useCallback, useContext, useEffect, useState } from "react";
import { getUser, getIntercomToken } from "~/api/account/requests";
import { AccountContext } from "~/contexts/Account";
import { IAccount } from "~/types/account";
import { Userpilot } from "userpilot";
import _debounce from "lodash/debounce";
import { useIntercom } from "react-use-intercom";
import { intercomKey } from "~/helpers/environment";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { useStore } from "~/hooks/useStore";

let intercomBootedForAccountId: string | null = null;

export const useAccount = () => {
  const { account, setAccount } = useContext(AccountContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterCom, setIsInterCom] = useState(false);
  const { boot, show } = useIntercom();
  const { store } = useStore();

  const bootIntercomForAccount = async (account: IAccount) => {
    if (!intercomKey) {
      setIsInterCom(false);
      return;
    }
    if (intercomBootedForAccountId === account.id.toString()) return;
    intercomBootedForAccountId = account.id.toString();

    let intercom_user_jwt: string;
    try {
      ({ intercom_user_jwt } = await getIntercomToken());
    } catch (error) {
      intercomBootedForAccountId = null;
      console.error("Failed to fetch Intercom token", error);
      return;
    }

    setIsInterCom(true);
    boot({
      email: account.email,
      userId: `jubilee_${account.id.toString()}`,
      name: account.name,
      intercomUserJwt: intercom_user_jwt,
      customAttributes: {
        app: "jubilee",
        shop_name: store?.name,
        shop_url: store?.url,
        shop_email: store?.email,
        shop_phone: store?.phone,
      },
    });
  };

  const bootIntercom = () => (account ? bootIntercomForAccount(account) : null);

  const showIntercom = () => {
    if (account) show();
  };

  const setAccountWithThirdParties = (acc: IAccount | null) => {
    setAccount(acc);

    if (acc) {
      Userpilot.identify(acc.id.toString(), {
        email: acc.email,
        created_at: acc.created_at,
        name: acc.name,
        payment_provider: acc.payment_provider,
        signup_origin: acc.signup_origin,
      });
      if (acc.active_subscription || DISABLE_PAYMENTS) {
        bootIntercomForAccount(acc);
      }
    }
  };

  const getAccount = async () => {
    setIsLoading(true);
    const profile = (await getUser()) as IAccount;
    setAccountWithThirdParties(profile);
    setIsLoading(false);
    return profile;
  };
  const debouncedGetAccount = useCallback(_debounce(getAccount, 200), []);

  useEffect(() => {
    if (!account) {
      debouncedGetAccount();
      setIsLoading(false);
    }
  }, []);

  const isPerpetual = () => {
    if (!account) return false;
    return account.last_subscription?.plan?.name === "Perpetual Unicorn Plan";
  };

  return {
    account,
    isInterCom,
    setAccount: setAccountWithThirdParties,
    getAccount,
    refetch: getAccount,
    isPerpetual: isPerpetual(),
    bootIntercom,
    isLoading,
    showIntercom,
  };
};