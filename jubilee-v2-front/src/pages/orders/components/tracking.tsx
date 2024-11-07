import { faTruck } from "@fortawesome/pro-solid-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import * as S from "../styles";
import { useRef, useState } from "react";
import useClickOutside from "~/hooks/useClickOutside";
import Modal from "~/components/ui/Modal";
import { ShowTrackingInfo } from "~/components/show-tracking-info/showTrackingInfo";

interface TrackingProps {
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export const Tracking = ({
  trackingNumber,
  trackingUrl,
  carrier,
}: TrackingProps) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => {
    setShow(false);
  });

  const isDisabled = !trackingNumber || !trackingUrl;

  const handleClick = () => {
    if (isDisabled) return;
    setShow(!show);
  };

  return (
    <S.DropdownContainer
      ref={ref}
      className={isDisabled ? "disabled" : ""}
      role="button"
      aria-haspopup="true"
      aria-expanded="false">
      <S.DropdownButton onClick={handleClick}>
        <SVG icon={faTruck as SVGIcon} size="sm"/>
      </S.DropdownButton>

      <Modal
        id="tracking-info"
        hideCloseButton hide={() => setShow(false)}
        isShowing={show}
        padding="24px 28px"
      >
        <ShowTrackingInfo
          hide={() => setShow(false)}
          trackingNumber={trackingNumber}
          carrier={carrier}
          trackingUrl={trackingUrl}
        />
      </Modal>
    </S.DropdownContainer>
  );
};
