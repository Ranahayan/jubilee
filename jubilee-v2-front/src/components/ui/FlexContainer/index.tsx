import { UIFlexProps } from "~/types/style";
import * as S from "./styles";

interface Props extends UIFlexProps {
  children?: React.ReactNode;
}

const FlexContainer: React.FC<Props> = (props) => {
  const { children, ...rest } = props;
  return <S.Container {...rest}>{children}</S.Container>;
};

export default FlexContainer;
