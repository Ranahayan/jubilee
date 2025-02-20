import PageTitle from "~/components/ui/PageTitle";
import Tabs from "~/components/ui/Tabs";
import { settingsTabs } from "../tabs";
import { useTranslation } from "react-i18next";
import { Plans } from "~/components/plans";
import { useAccount } from "~/hooks/useAccount";

const PlansSettingsPage = () => {
  const { t } = useTranslation();
  const initialIsAnnual = window.location.href.includes("?annual=true");
  const { account } = useAccount();

  return (
    <div>
      <PageTitle>{t("settings.title")}</PageTitle>
      <Tabs flexDirection="column" tabs={settingsTabs(account)}>
        <Plans initialIsAnnual={initialIsAnnual} />
      </Tabs>
    </div>
  );
};

export default PlansSettingsPage;
