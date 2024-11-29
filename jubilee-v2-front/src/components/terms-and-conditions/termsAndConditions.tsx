import { Trans } from "react-i18next";
import { useState } from "react";
import { Terms } from "~/constants/terms";
import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./termsAndConditions.style";

export const TermsAndConditions = ({
  color,
  textDecoration,
}: S.IAnchorText) => {
  const [isChecked, setIsChecked] = useState(true);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  return (
    <FlexContainer alignItems="flex-start" gap={0.8}>
      <S.CheckboxInput
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
      />
      <S.TermsText>
        <Trans
          i18nKey="checkout.terms"
          components={{
            1: (
              <S.AnchorText
                color={color}
                textDecoration={textDecoration}
                href={Terms.privacy}
                target="_blank"
              />
            ),
            2: (
              <S.AnchorText
                color={color}
                textDecoration={textDecoration}
                href={Terms.terms}
                target="_blank"
              />
            ),
            3: (
              <S.AnchorText
                color={color}
                textDecoration={textDecoration}
                href={Terms.refund}
                target="_blank"
              />
            ),
          }}
        />
      </S.TermsText>
    </FlexContainer>
  );
};