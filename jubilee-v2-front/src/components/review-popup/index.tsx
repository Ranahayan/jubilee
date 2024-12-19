import React, { useEffect, useMemo, useState } from "react";
import * as S from "./styles";
import Modal from "~/components/ui/Modal";
import { useTranslation } from "react-i18next";
import Rating from "./Rating";
import { ReviewValueType } from "./types";
import Button from "~/components/ui/Button";
import handleErrors from "~/helpers/handleErrors";
import { rate } from "~/api/account/requests";
import { IRateRequest } from "~/api/account/types";
import ShopifyRatingSVG from "~/assets/svg/ratings/shopify.svg?react";
import { SHOPIFY_RATE_LINK } from "~/constants/shopify";
import MainStar from "~/assets/svg/ratings/main.svg?react";
import FlexContainer from "../ui/FlexContainer";
import { SVG } from "../ui/SVG";
import { faArrowRight } from "@fortawesome/pro-regular-svg-icons";
import LoaderSVG from "~/assets/svg/loader.svg?react";
import { useAccount } from "~/hooks/useAccount";
import { useNavigate } from "react-router-dom";

const RATINGS: ReviewValueType[] = [1, 2, 3, 4, 5];

const ReviewPopup = () => {
  const { account } = useAccount();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showShopify, setShowShopify] = useState<boolean>(false);
  const [selectedRating, setSelectedRating] = useState<ReviewValueType | null>(
    null
  );
  const [feedback, setFeedback] = useState("");
  const showFeedbackTextArea = useMemo(() => {
    if (!selectedRating) return false;
    return selectedRating <= 4;
  }, [selectedRating]);
  const { t } = useTranslation();

  useEffect(() => {
    setIsVisible(window.location.href.includes("show_rating=true"));
  }, []);

  const onClose = () => {
    if (
      account &&
      !account?.active_subscription &&
      !account?.has_subscribed_before
    ) {
      setIsVisible(false);
      navigate("?onboarding=true");
    } else {
      setIsVisible(false);
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    const data = {
      rating: selectedRating,
      feedback: showFeedbackTextArea ? feedback : null,
    } as IRateRequest;

    const toastMessages = {
      error: t("review_popup.error"),
      loading: t("review_popup.loading"),
      success: t("review_popup.success"),
    };

    await handleErrors(() => rate(data), toastMessages);
    setLoading(false);

    if (selectedRating === 5) {
      setShowShopify(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (selectedRating === 5) {
      onSubmit();
    }
  }, [selectedRating]);

  const goToShopify = () => {
    setShowShopify(false);
    onClose();
    const newWindow = window.open(
      SHOPIFY_RATE_LINK,
      "_blank",
      "noopener,noreferrer"
    );
    if (newWindow) newWindow.opener = null;
  };

  return (
    <Modal
      id="review-popup"
      isShowing={isVisible}
      hide={() => setIsVisible(false)}
      minWidth="370px"
      padding="25px 30px">
      <S.Container>
        {!showShopify ? (
          <FlexContainer
            justifyContent="center"
            alignItems="center"
            flexDirection="column">
            <MainStar />
            <S.ModalTitle>{t("review_popup.title")}</S.ModalTitle>
            <S.ModalDescription>
              {t("review_popup.description")}
            </S.ModalDescription>
            {showFeedbackTextArea ? (
              <S.FeedbackTextArea
                //@ts-ignore
                placeholder={t("review_popup.feedback_placeholder")}
                onChange={(e) => setFeedback(e.target.value)}
              />
            ) : (
              <S.RatingsContainer>
                {RATINGS.map((value) => (
                  <Rating
                    key={value}
                    value={value}
                    selectedValue={selectedRating}
                    onSelect={setSelectedRating}
                  />
                ))}
              </S.RatingsContainer>
            )}
            {selectedRating ? (
              <S.SubmitButton onClick={onSubmit}>
                {loading ? (
                  <S.Loader>
                    <LoaderSVG />
                  </S.Loader>
                ) : (
                  t("review_popup.submit")
                )}
              </S.SubmitButton>
            ) : // <S.DoItLaterButton onClick={() => setIsVisible(false)}>
            //   {t("review_popup.do_it_later")}
            // </S.DoItLaterButton>
            null}
          </FlexContainer>
        ) : (
          <S.ShopifyWrapper>
            <ShopifyRatingSVG />
            <S.ShopifyTitle>{t("review_popup.shopify_title")}</S.ShopifyTitle>
            <S.ShopifyDescription>
              {t("review_popup.shopify_description")}
            </S.ShopifyDescription>
            <Button
              width="100%"
              bgColor="primary"
              fontWeight={500}
              alignSelf="center"
              color="white"
              onClick={goToShopify}>
              {t("review_popup.shopify_rate")}
              <SVG icon={faArrowRight} size="1x" color="white" />
            </Button>
          </S.ShopifyWrapper>
        )}
      </S.Container>
    </Modal>
  );
};

export default ReviewPopup;
