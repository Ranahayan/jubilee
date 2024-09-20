import { faSearch } from "@fortawesome/pro-solid-svg-icons";
import Button from "~/components/ui/Button";
import Input from "~/components/ui/Input";
import { SVG } from "~/components/ui/SVG";
import * as S from "./styles";
import { SVGIcon } from "~/components/ui/SVG/types";
import { useTranslation } from "react-i18next";
import { useState } from "react";

type Props = {
  onClick: (value: string) => void;
  width?: string;
  placeholder?: string;
  buttonLabel?: string;
};

export const Search = ({ onClick, width, placeholder, buttonLabel }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === "Enter" || event.code === "NumpadEnter") {
      onClick(value);
    }

    if (event.code === "Escape") {
      setValue("");
      onClick("");
    }
  };

  return (
    <S.FlexContainerRelative
      justifyContent="flex-start"
      width={width || "100%"}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        type="string"
        onKeyDown={handleKeyDown}
        borderColor="transparent"
        style={{ height: "50px", padding: "0 42px" }}
      />
      <S.AbsoluteIcon>
        <SVG icon={faSearch as SVGIcon} color="secondary" />
      </S.AbsoluteIcon>
      <S.AbsoluteButtonContainer>
        <Button
          color="white"
          bgColor="primary"
          padding="12px 20px"
          onClick={() => onClick(value)}>
          {buttonLabel || t("dropshipping.search_placeholder")}
        </Button>
      </S.AbsoluteButtonContainer>
    </S.FlexContainerRelative>
  );
};
