import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { storeConnect } from "~/api/store/requests";
import handleErrors from "~/helpers/handleErrors";
import { ConnectComponent } from "./connectComponent";

// type SuccessComponentProps = {
//   redirect: any;
//   t: TFunction<"translation", undefined, "translation">;
// }

export const ConnectToStore = () => {
  const [storeURL, setStoreURL] = useState("");
  const { t } = useTranslation();
  const shopifyURL =
    "https://www.shopify.com/commerce-coach/spocket?irclickid=VAXyY2RIIxyIUx2QlLxXR37TUkGX5nUlqRmY140&irgwc=1&partner=3232249";

  const redirectToShopify = () => {
    window.open(shopifyURL, "_blank");
  };

  const connect = async () => {
    // if users copy paste their entire shopify url this value will be used
    const storeURLFormatted = storeURL.includes("myshopify")
      ? storeURL
      : `https://${storeURL}.myshopify.com`;

    const params = {
      shop_url: storeURLFormatted,
    };

    const toastMessages = {
      loading: t("connect.redirecting"),
      success: t("connect.redirecting"),
      error: t("connect.redirecting_error"),
    };

    const { response } = await handleErrors(
      () => storeConnect(params),
      toastMessages
    );
    if (response.auth_url) window.open(response.auth_url, "_self");
  };

  return (
    <ConnectComponent
      storeURL={storeURL}
      setStoreURL={setStoreURL}
      connect={connect}
      redirectToShopify={redirectToShopify}
      t={t}
    />
  );
};

// const SuccessComponent = ({ redirect, t }: SuccessComponentProps) => {
//   return (
//     <S.SuccessContainer>
//       <S.ShopifyImgContainer>
//         <ShopifyIcon />
//       </S.ShopifyImgContainer>

//       <CheckIcon />
//       <S.SuccessTitle>{t("connect.success_title")}</S.SuccessTitle>

//       <S.SuccessDescription>{t("connect.success_desc")}</S.SuccessDescription>

//       <S.ButtonContainer>
//         <Button width="100%" onClick={redirect} bgColor="primary" color="white">
//           {t("connect.dashboard")}
//         </Button>
//       </S.ButtonContainer>
//     </S.SuccessContainer>
//   )
// }
