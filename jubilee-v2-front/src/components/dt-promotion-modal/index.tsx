import * as S from "./styles";
import { useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import selectedImage from "~/assets/png/winning-spy-ad.png";
import roundCheckIcon from "~/assets/svg/check-success.svg";
import Modal from "../ui/Modal";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { useTranslation } from "react-i18next";

const dropshiptoolLink =
  "https://www.dropshiptool.io/?utm_source=jubilee&utm_medium=onboardingmodal&utm_campaign=findwinningads";


function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export function DTPromotionModal() {
  const { t } = useTranslation();
  const isMobile = useIsMobile(908);
  const location = useLocation();

  const [isShowing, setIsShowing] = useState(true);

  const planId = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("plan_id") || "";
  }, [location.search]);

  return (
    <Modal
      id="dt-promotion-funnel"
      minWidth= {isMobile ? "90%" : "904px"}
      maxWidth= {isMobile ? "" : "912px"}
      maxHeight= {isMobile ? "" : "462px"}
      isShowing={isShowing && planId != ""}
      padding="0">
      <S.ModalContainer>
        <S.ContentGrid isMobile={isMobile}>
          <S.ImageWrapper isMobile={isMobile}>
            <S.Image src={selectedImage} isMobile={isMobile} alt="Winning Spy Ads" />
          </S.ImageWrapper>
          
          <S.TextContent isMobile={isMobile}>
            <S.Heading>
              {t("dropshipping.discover")} <S.BlueText>{t("cancel.winning")}</S.BlueText> {" "}
              {t("dropshipping.and_the_hottest")} <S.BlueText>{t("dropshipping.viral_ads")}</S.BlueText>
            </S.Heading>

            <S.Subheading>
              {t("dropshipping.find_and_monitor_store")}.
            </S.Subheading>
            
            <S.FeatureList>
              <S.FeatureItem>
                <img src={roundCheckIcon} alt="Checkmark" />
                <span>{t("dropshipping.get_top_facebook_ad_examples_and_creatives")}.</span>
              </S.FeatureItem>
              <S.FeatureItem>
                <img src={roundCheckIcon} alt="Checkmark" />
                <span>{t("dropshipping.track_real_products_to_find_winners")}.</span>
              </S.FeatureItem>
              <S.FeatureItem>
                <img src={roundCheckIcon} alt="Checkmark" />
                <span>{t("dropshipping.discover_top_performing_ads")}.</span>
              </S.FeatureItem>
            </S.FeatureList>
            
            <S.CtaButton isMobile={isMobile} onClick={() => window.open(dropshiptoolLink, "_blank", "noopener,noreferrer")}>
              {t("connect.start_free_trial")}
            </S.CtaButton>
          </S.TextContent>
          <S.ContinueButton isMobile={isMobile} onClick={() => setIsShowing(false)}>
            <span>
              {t("connect.continue_to_dashboard")}
            </span>
            <SVG icon={faArrowRight as Icon} size="sm" />
          </S.ContinueButton>
        </S.ContentGrid>
      </S.ModalContainer>
    </Modal>
  );
}
