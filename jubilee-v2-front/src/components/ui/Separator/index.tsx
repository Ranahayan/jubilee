import { UIProps } from "~/types/style";
import * as S from "./styles";

export type SeparatorType = "horizontal" | "vertical";

type Props = {
  type: SeparatorType;
  className?: string;
} & Pick<UIProps, "margin" | "padding">;

const Separator = ({ type, margin = 0, className, padding }: Props) => {
  if (type === "horizontal")
    return <S.HorizontalSeparator className={className} margin={margin} />;
  return (
    <S.VerticalSeparator
      className={className}
      margin={margin}
      padding={padding}
    />
  );
};

export default Separator;
