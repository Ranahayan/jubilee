import { useTranslation } from "react-i18next";
import FlexContainer from "../ui/FlexContainer";
import Modal from "../ui/Modal";
import * as S from "./styles";
import Text from "../ui/Text";
import Separator from "../ui/Separator";
import Button from "../ui/Button";
import { IProduct } from "~/types/dropshipping";
import { useNavigate } from "react-router-dom";
import { paths } from "~/router/paths";
import CustomCheckbox from "../ui/Checkbox";
import ProductCard from "~/pages/home/components/ProductCard";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { useEffect, useState } from "react";

type Props = {
  isShowing: boolean;
  hide: () => void;
  products: IProduct[];
  handleAddToImportList: (id: string) => void;
  handleSampleOrder?: (id: string, isPremium?: boolean) => void;
};

const HIDE_MODAL_KEY = "hideSimilarModalUntil";

export const SimilarModal = ({
  isShowing,
  hide,
  products,
  handleAddToImportList,
  handleSampleOrder,
}: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAboveTablet = useMediaQuery("tablet");
  const [hideModal, setHideModal] = useState(false);

  useEffect(() => {
    const hideUntil = localStorage.getItem(HIDE_MODAL_KEY);
    if (hideUntil && new Date(hideUntil) > new Date()) {
      setHideModal(true);
    }
  }, []);

  const handleHideModal = () => {
    if (hideModal) {
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 15);
      localStorage.setItem(HIDE_MODAL_KEY, hideUntil.toISOString());
    } else {
      localStorage.removeItem(HIDE_MODAL_KEY);
      setHideModal(false);
    }
  };

  if (localStorage.getItem(HIDE_MODAL_KEY) !== null) return null;

  return (
    <Modal id="similar-products" isShowing={isShowing} padding="24px">
      <FlexContainer
        width={isAboveTablet ? "855px" : "100%"}
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="flex-start">
        <FlexContainer
          width="100%"
          flexDirection="column"
          alignItems="flex-start"
          gap="8px"
          justifyContent="flex-start">
          <S.Title>{t("similar.imported")}</S.Title>
          <Text secondary>{t("similar.imported_desc")}</Text>
        </FlexContainer>
        <Separator type="horizontal" />
        <FlexContainer justifyContent="space-between" width="100%">
          <S.SubTitle>{t("similar.similar_products")}</S.SubTitle>
          <Button
            color="primary"
            bgColor="white"
            style={{ fontSize: "16px", fontWeight: "600" }}>
            {t("similar.import_all")}
          </Button>
        </FlexContainer>
        <S.ProductsContainer>
          {products?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToImportList={() => handleAddToImportList(product.id)}
              handleSampleOrder={() => handleSampleOrder?.(product.id, product.is_premium)}
            />
          ))}
        </S.ProductsContainer>
        <Separator type="horizontal" />
        <FlexContainer
          justifyContent="space-between"
          width="100%"
          flexDirection={isAboveTablet ? "row" : "column"}>
          <CustomCheckbox
            label={t("similar.hide") as string}
            onChange={() => setHideModal(!hideModal)}
            checked={hideModal}
          />
          <FlexContainer>
            <Button
              color="text"
              bgColor="white"
              padding="12px 18px"
              onClick={() => {
                handleHideModal();
                navigate(paths.app.importList)
              }}
              style={{ fontWeight: "600" }}>
              {t("similar.import_list")}
            </Button>
            <Button
              color="white"
              bgColor="primary"
              padding="12px 18px"
              onClick={() => {
                handleHideModal();
                hide();
              }}
              style={{ fontWeight: "600" }}>
              {t("similar.import_more")}
            </Button>
          </FlexContainer>
        </FlexContainer>
      </FlexContainer>
    </Modal>
  );
};
