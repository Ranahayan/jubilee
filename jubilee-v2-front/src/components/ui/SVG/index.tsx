import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SVGIcon } from "./types";
import { IconDefinition, SizeProp } from "@fortawesome/fontawesome-svg-core";
import { IThemeColors } from "~/types/theme";
import * as S from "./styles";
interface IProps {
  icon: SVGIcon;
  svgProp?: React.SVGProps<SVGSVGElement>;
  size?: SizeProp;
  color?: keyof IThemeColors | string;
  invertY?: boolean;
}

export const isFontAwesomeIcon = (icon: unknown): icon is IconDefinition => {
  return (
    !!icon &&
    typeof icon === "object" &&
    "iconName" in icon &&
    "prefix" in icon
  );
};

export const SVG = (props: IProps) => {
  const { icon, svgProp, size, ...rest } = props;
  const width = svgProp?.width || undefined;
  const transform = props.invertY ? "scale(-1, 1)" : "none";

  return (
    <S.FontAwesomeIconWrapper color={props.color} transform={transform}>
      {/* @ts-ignore */}
      <FontAwesomeIcon size={size} icon={icon} width={width} {...rest} />
    </S.FontAwesomeIconWrapper>
  );
};
