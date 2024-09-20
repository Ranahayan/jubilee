import { faCheckCircle } from "@fortawesome/pro-solid-svg-icons";
import { Fragment } from "react";
import { SVGIcon } from "../SVG/types";
import { SVG } from "../SVG";
import FlexContainer from "../FlexContainer";
import Text from "../Text";

import * as S from "./styles";
import { useTranslation } from "react-i18next";

type Props = {
  img?: string;
  isPublished: boolean;
  title: string;
  created?: string;
  onClick?: () => void;
}

export const InfoCard = ({ img, isPublished = false, title, created, onClick }: Props) => {
  const { t } = useTranslation();

  return (
    <Fragment>
      <S.ImgContent src={img} onClick={onClick} />
      <S.FooterCard>
        <FlexContainer alignItems="flex-start" flexDirection="column" gap="4px">
          <FlexContainer gap="6px">
            <SVG icon={faCheckCircle as SVGIcon} color={isPublished ? "primary" : "textSecondary"} size="xs"/>
            <S.PublishedText isPublished={isPublished}>
              {isPublished ? t("common.published") : t("common.not_published")}
            </S.PublishedText>
          </FlexContainer>

          <Text>{title}</Text>
        </FlexContainer>

        <S.DateText>{created}</S.DateText>
      </S.FooterCard>
    </Fragment>
  )
}
