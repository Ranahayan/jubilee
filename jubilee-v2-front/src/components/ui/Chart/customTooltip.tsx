import { SVG } from "../SVG";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import * as S from "./styles";

interface ICustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: unknown[];
  tooltipIcon?: Icon;
  tooltipFormatValue?: (value: unknown) => string;
  tooltipFormatLabel?: (value: unknown) => string;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  tooltipIcon,
  tooltipFormatValue,
  tooltipFormatLabel
}: ICustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <>
        {payload.map((data: any, i) => (
          <S.Tooltip key={i} color={data.stroke}>
            {tooltipIcon ? (
              <S.TooltipIcon color={data.stroke}>
                <SVG icon={tooltipIcon as Icon} />
              </S.TooltipIcon>
            ) : null}
            <S.TooltipContent>
              <p>{tooltipFormatValue? tooltipFormatValue(data.value) : data.value}</p>
              <span>{tooltipFormatLabel? tooltipFormatLabel(label): label}</span>
            </S.TooltipContent>
          </S.Tooltip>
        ))}
      </>
    );
  }

  return null;
};

export default CustomTooltip;
