import { useParams } from "react-router-dom";
import { useStoreLogin } from "./useStoreLogin";
import { useDebounceEffect } from "~/hooks/useDebounceEffect";

const StoreLogin = () => {
  const params = useParams();
  const storeLogin = useStoreLogin();

  useDebounceEffect(() => {
    if (params.shop_token) {
      storeLogin(params.shop_token);
    }
  }, [params.shop_token], 100);

  return null;
};

export default StoreLogin;
