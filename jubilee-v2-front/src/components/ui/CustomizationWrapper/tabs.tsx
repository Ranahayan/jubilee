import { useMemo, useState } from "react";
import Container from "../Container";
import UnderlineTabs from "../Tabs/underlineTabs";
import { Section } from "./section";
import { CustomizationTab } from "~/types/customization";
import { IFormHookProps } from "~/types/form";
import { StyledContainer } from "./styles";
import { RemoveBranding } from "../RemoveBranding";
import { useTranslation } from "react-i18next";
import { triggerShowPlansModal } from "~/helpers/customEvents";

type Props = {
  tabs: CustomizationTab[];
  form: IFormHookProps;
  checkRemoveBranding?: boolean;
  handleRemoveBranding?: () => void;
  disableRemoveBranding?: boolean;
  onTabChange?: (tabIndex: number) => void;
  hideTabs?: boolean;
};

export const Tabs = ({
  tabs,
  form,
  checkRemoveBranding,
  handleRemoveBranding,
  disableRemoveBranding,
  onTabChange,
  hideTabs,
}: Props) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(tabs?.[0].labelKey || null);

  const tabsConfig = useMemo(() => {
    return tabs?.map((tab) => {
      tab.isActive = tab.labelKey === currentTab;
      return tab;
    });
  }, [currentTab]);

  const handleChangeTab = (tab: CustomizationTab) => {
    setCurrentTab(tab.labelKey);
    if (onTabChange) onTabChange(tabs.indexOf(tab));
  };

  return (
    <StyledContainer>
      <UnderlineTabs
        tabs={tabsConfig}
        justifyContent="space-around"
        onChange={handleChangeTab}
        bgColor="white"
        padding="0px"
        radius="6px"
        hide={hideTabs}>
        {tabs?.map((tab) =>
          tab.labelKey === currentTab ? (
            <Container
              key={tab.labelKey}
              width="100%"
              flexDirection="column"
              alignItems="flex-start"
              bgColor="transparent"
              padding="0px">
              {tab?.sections?.map((section) => (
                <Section
                  key={section.labelKey}
                  showUpgradeIcon={section.showUpgradeIcon}
                  label={t(section.labelKey as string) || ""}
                  form={form}
                  fields={section.fields}
                  description={section.description}
                />
              ))}
            </Container>
          ) : null
        )}
      </UnderlineTabs>

      {handleRemoveBranding && (
        <Container width="100%" justifyContent="flex-start">
          <RemoveBranding
            title={t("common.remove_branding_title")}
            label={t("common.remove_branding_label")}
            warningText={t("common.remove_branding_warn")}
            onClick={() => triggerShowPlansModal()}
            checked={checkRemoveBranding || false}
            onChange={handleRemoveBranding}
            disabled={disableRemoveBranding || false}
          />
        </Container>
      )}
    </StyledContainer>
  );
};
