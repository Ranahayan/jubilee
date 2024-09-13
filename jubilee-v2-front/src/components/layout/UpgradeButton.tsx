import { Icon } from "@fortawesome/fontawesome-svg-core";
import { faStarCircle } from "@fortawesome/pro-solid-svg-icons";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { excludePaths } from "~/constants/paths";
import Button from "~/components/ui/Button";
import { SVG } from "~/components/ui/SVG";
import { triggerShowPlansModal } from "~/helpers/customEvents";
import { useAccount } from "~/hooks/useAccount";
import { DISABLE_PAYMENTS } from "~/helpers/plans";

export const UpgradeButton = () => {
  const { t } = useTranslation();
  const { account } = useAccount();

  if (
    excludePaths.find((path) => new RegExp(path).test(window.location.pathname))
  )
    return null;

  if (DISABLE_PAYMENTS) return null;

  if (account ? !!account.active_subscription : false) return null;

  return (
    <Fragment>
      <Button
        onClick={() => triggerShowPlansModal()}
        bgColor="green"
        color="white"
        fontSize="16px"
        width="249px"
        radius={32}
        shadow="md"
        alignSelf="flex-end"
        title={t("settings.upgrade_button_title") as string}>
        <SVG icon={faStarCircle as Icon} size="xl" />
        {t("settings.upgrade_button")}
      </Button>
    </Fragment>
  );
};
