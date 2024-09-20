import LoaderSVG from "~/assets/svg/loader.svg?react";
import * as S from "./styles";

type Props = { fullWidth?: boolean };

const Loader = ({ fullWidth }: Props) => {
  return (
    <S.LoaderContainer fullWidth={fullWidth}>
      <LoaderSVG />
    </S.LoaderContainer>
  );
};

export default Loader;
