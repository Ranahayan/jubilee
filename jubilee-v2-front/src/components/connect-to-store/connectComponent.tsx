import * as S from "./styles";
import { TFunction } from "i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import ShopifyLogo from "~/assets/svg/shopify-logo.svg";
import { SVG } from "~/components/ui/SVG";
import { faLinkSimple } from "@fortawesome/pro-solid-svg-icons";
import Input from "~/components/ui/Input";
import { getColor } from "~/helpers/style";
import theme from "~/constants/theme";
import LogoSimpleNoBg from "~/assets/svg/logo-simple-no-bg.svg";

type ConnectComponentProps = {
  storeURL: string;
  setStoreURL: React.Dispatch<React.SetStateAction<string>>;
  connect: () => void;
  redirectToShopify: () => void;
  t: TFunction<"translation", undefined, "translation">;
};

export const ConnectComponent = ({
  storeURL,
  setStoreURL,
  connect,
  redirectToShopify,
  t,
}: ConnectComponentProps) => {
  return (
    <FlexContainer
      flexDirection="column"
      data-testid="connect-container"
      gap={2.0}>
      <S.HeaderContainer>
        <S.HeaderImgContainer backgroundColor="primaryLight">
          <img src={LogoSimpleNoBg} />
        </S.HeaderImgContainer>

        <S.HeaderImgSeparatorContainer>
          <SVG icon={faLinkSimple} size="lg" color="#048A81" />
        </S.HeaderImgSeparatorContainer>

        <S.HeaderImgContainer backgroundColor="#D2EDA9">
          <img src={ShopifyLogo} />
        </S.HeaderImgContainer>
      </S.HeaderContainer>

      <FlexContainer flexDirection="column" gap={0.8}>
        <S.Title>{t("connect.connect_store")}</S.Title>

        <S.Description>{t("connect.description")}</S.Description>
      </FlexContainer>

      <FlexContainer
        alignItems="flex-start"
        width="100%"
        flexDirection="column"
        gap={0.6}>
        <S.InputLabelStyleStyled>
          {t("connect.shopify_url")}
        </S.InputLabelStyleStyled>

        <S.InputContainer>
          <Input
            type="string"
            placeholder={t("connect.store_name") ?? ""}
            value={storeURL}
            onChange={(e) => setStoreURL(e.target.value.trim())}
            wrapperStyle={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: "none",
              borderColor: getColor("border")({ theme }),
            }}
          />

          <S.ShopifyInputContent>
            {t("connect.my_shopify")}
          </S.ShopifyInputContent>
        </S.InputContainer>
      </FlexContainer>

      <S.ConnectButton size="lg" onClick={connect}>
        {t("connect.connect_store")}
      </S.ConnectButton>

      <S.Footer>
        <span>{t("connect.shopify_acc")}</span>
        <S.RedirectToShopifyButton onClick={redirectToShopify}>
          {t("connect.try")}
        </S.RedirectToShopifyButton>
      </S.Footer>
    </FlexContainer>
  );
};
