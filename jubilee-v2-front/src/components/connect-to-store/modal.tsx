import { useEffect, useState } from "react";
import { ConnectToStore } from "~/components/connect-to-store";
import Modal from "~/components/ui/Modal";
import { SHOW_CONNECT_STORE_MODAL } from "~/helpers/customEvents";

export const ModalConnectToStore = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    const handleShowModal = () => {
      setShowConnectModal(true);
    };

    // @ts-ignore
    window.addEventListener(SHOW_CONNECT_STORE_MODAL, handleShowModal);
    return () => {
      // @ts-ignore
      window.removeEventListener(SHOW_CONNECT_STORE_MODAL, handleShowModal);
    };
  }, []);

  return (
    <Modal
      id="connect-to-store"
      hide={() => setShowConnectModal(false)}
      isShowing={showConnectModal}
      padding="24px"
      minWidth="min(90%, 482px)">
      <ConnectToStore />
    </Modal>
  )
}