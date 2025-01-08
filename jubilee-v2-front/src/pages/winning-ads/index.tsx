import * as S from "./styles";
import Separator from "~/components/ui/Separator";
import CustomersAvatar from "~/assets/png/customers.png";
import { winningsOffer } from "~/constants/winningsOffer";
import { useTranslation } from "react-i18next";

const WinningAds = () => {
  const { t } = useTranslation();

  const handleFreeTrial = () => {
    const link = "https://www.dropshiptool.io/?utm_source=jubilee&utm_medium=sidebar&utm_campaign=findwinningads"
    window.open(link, "_blank");
  }

  return (
    <S.Container>
      <S.PageTitle>{t("dropshipping.find_winning_ads")}</S.PageTitle>
      <S.Content>
        <S.Hero>
          <S.HeroText>
            <h1>
              {t("dropshipping.discover")} <span>{t("cancel.winning")}</span> {t("dropshipping.and_top")}{" "}
              <span>{t("dropshipping.viral_ads")}</span>
            </h1>
            <p>
              {t("dropshipping.track_over_3_million_shopify_stores")}
            </p>
            <S.Checklist>
              <li>{t("dropshipping.get_top_facebook_ad_examples_and_creatives")}.</li>
              <li>{t("dropshipping.track_real_products_to_find_winners")}</li>
              <li>{t("dropshipping.discover_top_performing_ads")}</li>
            </S.Checklist>
            <S.CTAButton onClick={handleFreeTrial}>
              {t("connect.start_free_trial")}
            </S.CTAButton>
            <S.CustomerBadge>
              <img src={CustomersAvatar} alt="Customer avatars" loading="lazy" />
              <span>{t("dropshipping.join_over_50k_customers")}</span>
            </S.CustomerBadge>
          </S.HeroText>
          <S.HeroImage>
            <img src="https://alidrop-production-frontend-app.s3.us-east-1.amazonaws.com/assets/winning_ads/hero-img.avif"
                 alt="Product Performance Example" loading="lazy" />
          </S.HeroImage>
        </S.Hero>

        <Separator type="horizontal" />

        <S.WhatWeOffer>
          <S.OfferHeading>{t("dropshipping.what_we_offer")}</S.OfferHeading>
          <S.OfferGrid>
            {winningsOffer.map((offer, index) => (
              <S.OfferCard key={index}>
                <S.IconWrapper>
                  <img src={offer.icon} alt="icon" loading="lazy"/>
                </S.IconWrapper>
                <h4>{offer.title}</h4>
                <p>{offer.description}</p>
              </S.OfferCard>
            ))}
          </S.OfferGrid>
        </S.WhatWeOffer>
      </S.Content>
    </S.Container>
  );
};

export default WinningAds;
