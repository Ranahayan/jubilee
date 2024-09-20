import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { TabProps, TabsProps } from "~/types/tabs";
import Container from "../Container";
import * as S from "./styles";
import { useMemo } from "react";

// Tabs component should only serve as a url redirector
// Each individual tab should be a separate component/route
// Tabs component should only be responsible for rendering the tabs as clickable buttons, and the content of the active tab

const Tab = ({ tab, isActive }: TabProps) => {
  const { t } = useTranslation();
  return (
    <S.Tab className={isActive ? "active" : ""} to={tab.path}>
      {t(tab.labelKey)}
    </S.Tab>
  );
};

const Tabs = ({ tabs, children, flexDirection, bgColor }: TabsProps) => {
  // get path from react-router-dom
  // find the tab with the same path
  // set isActive to true
  const { pathname } = useLocation();
  // get second path after /settings to let tab active in a subsection
  const secondPath = useMemo(() => {
    const match = pathname.match(/\/([^\/]+)\/([^\/]+)/);
    return match ? match[2] : "";
  }, [pathname]);

  return (
    <S.OuterContainer>
      <S.TabContainer>
        {tabs.map((tab) => (
          <Tab
            key={tab.path}
            tab={tab}
            isActive={
              pathname === tab.path ||
              (pathname.includes(secondPath) && tab.path.includes(secondPath))
            }
          />
        ))}
      </S.TabContainer>
      <Container
        flexDirection={flexDirection || "row"}
        gap={2.0}
        flat
        padding="0"
        bgColor={bgColor || "white"}>
        {children}
      </Container>
    </S.OuterContainer>
  );
};

export default Tabs;
