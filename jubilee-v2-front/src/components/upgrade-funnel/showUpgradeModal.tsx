import Modal from "~/components/ui/Modal";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { UpgradeFunnel } from "~/components/upgrade-funnel";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { useAccount } from "~/hooks/useAccount";

export const ShowUpgradeModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { account } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

  const planId = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("plan_id") || "";
  }, [location.search]);

  useEffect(() => {
    if (planId) setShowModal(true);
  }, [planId]);

  useEffect(() => {
    if (account?.has_used_stripe_upgrade_funnel_coupon) {
      setShowModal(false);
    }
  }, [account]);

  const redirectAndClose = () => {
    if (searchParams.has("plan_id")) {
      const plan_id = searchParams.get("plan_id");
      if (plan_id) {
        searchParams.delete("plan_id");
        setSearchParams(searchParams);
      }
    }
    setShowModal(false);
  };

  return (
    <Modal
      id="upgrade-funnel"
      hide={redirectAndClose}
      isShowing={showModal && !DISABLE_PAYMENTS}
      padding="0">
      <UpgradeFunnel planId={planId} close={redirectAndClose} />
    </Modal>
  );
};
