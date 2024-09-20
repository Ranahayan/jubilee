import { ICustomization } from "~/types/customization";
import { Header } from "./header";
import { Tabs } from "./tabs";
import Separator from "../Separator";
import Container from "../Container";
import { CustomizationContainer } from "./styles";
import { useMemo } from "react";

export const CustomizationWrapper = ({
  returnUrl,
  handleAction,
  form,
  children,
  tabs,
  checkRemoveBranding,
  handleRemoveBranding,
  disableRemoveBranding,
  onTabChange,
  disabled,
  hideTabs,
  iconButtonSave,
  handleDownload,
}: ICustomization) => {
  const memoizedHeader = useMemo(
    () => (
      <Header
        disabled={disabled}
        handleDownload={handleDownload}
        returnUrl={returnUrl}
        handleAction={handleAction}
        iconButtonSave={iconButtonSave}
      />
    ),
    [returnUrl, handleAction]
  );

  return (
    <Container
      flexDirection="column"
      bgColor="transparent"
      width="100%"
      height="100%"
      padding="0"
      alignItems="flex-start">
      {memoizedHeader}
      <CustomizationContainer>
        <Tabs
          tabs={tabs}
          form={form}
          checkRemoveBranding={checkRemoveBranding}
          handleRemoveBranding={handleRemoveBranding}
          disableRemoveBranding={disableRemoveBranding}
          onTabChange={onTabChange}
          hideTabs={hideTabs}
        />
        <Separator type="vertical" />
        <Container
          bgColor="transparent"
          width="100%"
          justifyContent="center"
          alignItems="flex-start">
          {children}
        </Container>
      </CustomizationContainer>
    </Container>
  );
};
