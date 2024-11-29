import { useEffect, useState } from "react";
import Modal from "~/components/ui/Modal";
import { Plans } from ".";

export const ShowPlansModal = () => {
  const [ShowPlansModal, setShowPlansModal] = useState(false);
  const plansModal = localStorage.getItem("plansModal") === "true";

  useEffect(() => {
    if (plansModal) {
      setShowPlansModal(true);
    }
  }, [plansModal]);

  const close = () => {
    setShowPlansModal(false);
    localStorage.setItem("plansModal", "false");
  };

  return (
    <Modal id="plans-modal" hide={close} isShowing={ShowPlansModal} minWidth="80%">
      <Plans closeModal={() => setShowPlansModal(!ShowPlansModal)} />
    </Modal>
  );
};
