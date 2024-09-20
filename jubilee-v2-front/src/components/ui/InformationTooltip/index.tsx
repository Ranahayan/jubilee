import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Tooltip } from "react-tooltip";
import { SVG } from "../SVG";
import { faCircleInfo } from "@fortawesome/pro-light-svg-icons";
import * as S from "./styles";
import "react-tooltip/dist/react-tooltip.css";

type Props = {
  body: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
};

const InformationTooltip = ({ body }: Props) => {
  const tooltipID = useMemo(() => {
    return uuidv4();
  }, []);

  if (!tooltipID) return null;

  return (
    <S.SVGWrapper>
      <SVG icon={faCircleInfo} data-tooltip-id={tooltipID} />
      <Tooltip
        style={{
          padding: 0,
          borderRadius: 5,
          boxShadow: "6px 15px 39px rgba(0, 0, 0, 0.08)",
          opacity: 1,
        }}
        noArrow
        render={() => body}
        id={tooltipID}
      />
    </S.SVGWrapper>
  );
};

export default InformationTooltip;
