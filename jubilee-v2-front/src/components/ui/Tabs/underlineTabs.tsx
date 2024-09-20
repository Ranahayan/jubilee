import { useTranslation } from "react-i18next";
import Container from "../Container";
import * as S from "./underlineTabs.styles";
import { SVG } from "../SVG";
import { UIFlexProps } from "~/types/style";
import { CustomizationTab } from "~/types/customization";

interface Itabs extends CustomizationTab {
  onClick: () => void;
  isNew?: boolean;
}

interface TabsProps extends UIFlexProps {
  tabs: CustomizationTab[];
  children?: React.ReactNode;
  flexDirection?: "row" | "column";
  onChange: (tab: CustomizationTab) => void;
  margin?: string;
  hide?: boolean;
}

const UnderlineTab = ({ labelKey, isActive, icon, onClick, isNew }: Itabs) => {
  const { t } = useTranslation();
  return (
    <S.Tab onClick={onClick} className={isActive ? "active" : ""}>
      {icon ? (
        <SVG icon={icon} color={isActive ? "primary" : "textSecondary"} />
      ) : null}
      {t(labelKey)}
      {isNew && (
        <S.NewBadge>
          <S.NewBadgeText>New</S.NewBadgeText>
        </S.NewBadge>
      )}
    </S.Tab>
  );
};

const UnderlineTabs = ({
  flexDirection,
  justifyContent,
  children,
  onChange,
  bgColor,
  radius,
  margin,
  padding,
  tabs,
  hide,
}: TabsProps) => {
  return (
    <>
      <S.TabContainer
        justifyContent={justifyContent}
        bgColor={bgColor}
        radius={radius}
        margin={margin}
        hide={hide}>
        {tabs?.map((tab) => (
          <UnderlineTab
            key={tab.labelKey}
            {...tab}
            onClick={() => onChange(tab)}
          />
        ))}
      </S.TabContainer>
      {children ? (
        <Container
          flexDirection={flexDirection || "row"}
          width="100%"
          justifyContent="flex-start"
          flat
          bgColor="transparent"
          padding={padding || "15px"}>
          {children}
        </Container>
      ) : null}
    </>
  );
};

export default UnderlineTabs;
