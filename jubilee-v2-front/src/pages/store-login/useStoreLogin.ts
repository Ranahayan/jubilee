import { useNavigate } from "react-router-dom";
import { storeLogin } from "~/api/store/requests";
import { ILoginResponse } from "~/api/account/types";
import { paths } from "~/router/paths";
import { setJWT, setRefreshToken } from "~/helpers/auth";
import { useAccount } from "~/hooks/useAccount";
import { useQueryClient } from "@tanstack/react-query";

export const useStoreLogin = () => {
  const navigate = useNavigate();
  const { setAccount } = useAccount();
  const client = useQueryClient();

  return async (storeToken: string) => {
    const params = {
      shop_token: storeToken,
    };

    client.clear();
    await setJWT("");
    await setRefreshToken("");
    try {
      const res = (await storeLogin(params)) as ILoginResponse;
      await setJWT(res.access);
      await setRefreshToken(res.refresh);
      setAccount(res.user);
      navigate(paths.app.home);
    } catch (e) {
      console.error(e);
    }
  };
};
