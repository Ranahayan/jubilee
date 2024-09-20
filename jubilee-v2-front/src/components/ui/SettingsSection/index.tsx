import React from "react";
import * as S from "./styles";

type Props = {
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
};

const SettingsSection = ({ leftSide, rightSide }: Props) => {
  return (
    <S.SettingsSection>
      <S.LeftSide>{leftSide}</S.LeftSide>
      <S.RightSide>{rightSide}</S.RightSide>
    </S.SettingsSection>
  );
};

export default SettingsSection;
