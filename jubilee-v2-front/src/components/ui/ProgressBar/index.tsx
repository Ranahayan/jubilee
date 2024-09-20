// ProgressBar.tsx
import React from "react";
import * as S from "./styles";
import { UIFlexProps } from "~/types/style";

type ProgressBarProps = {
  progress: number;
};

const ProgressBar: React.FC<ProgressBarProps & UIFlexProps> = ({
  progress,
  ...rest
}) => {
  // Ensure progress is within the range of 0 to 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <S.ProgressBarContainer {...rest}>
      <S.ProgressBarFill {...rest} progress={clampedProgress} />
    </S.ProgressBarContainer>
  );
};

export default ProgressBar;
