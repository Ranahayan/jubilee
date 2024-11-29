import FlexContainer from "~/components/ui/FlexContainer";
import { Form } from "~/components/ui/Form";
import { useTranslation } from "react-i18next";
import { IFormHookProps } from "~/types/form";
import Button from "~/components/ui/Button";
import * as S from "./styles";

type Props = {
  handleAction: () => void;
  handleClose: () => void;
  form: IFormHookProps;
};

export const AddCardModal = ({ handleAction, form, handleClose }: Props) => {
  const { t } = useTranslation();

  return (
    <S.Container>
      <S.Title>{t("common.add_new_card")}</S.Title>
      <S.Subtitle>{t("orders.add_new_card_subtitle")}</S.Subtitle>
      <Form {...form} />
      <FlexContainer width="100%">
        <S.BackButton
          onClick={handleClose}
        >
          {t("settings.back_button")}
        </S.BackButton>

        <Button
          onClick={handleAction}
          color="white"
          bgColor="primary"
          width="100%"
          radius="8px"
        >
          {t("common.add_card")}
        </Button>
      </FlexContainer>
    </S.Container>
  );
};
