import { useEffect, useMemo, useState } from "react";
import { ConnectToStore } from "~/components/connect-to-store";
import { useStore } from "~/hooks/useStore";
import Modal from "~/components/ui/Modal";

type Props = {
  hideAfterClose?: boolean;
};

export const ShowConnectModal = ({ hideAfterClose = false }: Props) => {
  const { store, isLoading } = useStore();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const hasUserStore = useMemo(() => store?.url, [store]);
  const hasUserSeenShopifyModal =
    localStorage.getItem("closedShopifyModal") !== "true";
  const refreshedPage = sessionStorage.getItem("refreshedPage") === "true";

  useEffect(() => {
    // Show connect modal if didn't connect the store before,
    // hasn't seen the Shopify modal,
    // and the connect modal is not already shown
    if (
      !refreshedPage &&
      !isLoading &&
      !hasUserStore &&
      hasUserSeenShopifyModal &&
      !showConnectModal
    ) {
      setShowConnectModal(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("refreshedPage", "false"); // Reset the flag to false only when the user refreshes the page
    };

    window.onbeforeunload = handleBeforeUnload;

    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const closeConnectModal = () => {
    setShowConnectModal(false);
    sessionStorage.setItem("refreshedPage", "true");
    hideAfterClose ? localStorage.setItem("closedShopifyModal", "true") : null;
  };

  return (
    <Modal
      id="connect-to-store"
      hide={closeConnectModal}
      isShowing={showConnectModal}
      padding="24px"
      minWidth="min(90%, 482px)">
      <ConnectToStore />
    </Modal>
  );
};
