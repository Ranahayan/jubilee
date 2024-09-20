import { FC, ReactNode, useEffect } from "react";
import * as S from "./styles";
import { SVG } from "../SVG";
import { faClose } from "@fortawesome/pro-light-svg-icons";
import { Portal } from "~/helpers/portal";
import { useUserPilotSearchParams } from "~/hooks/useUserPilotSearchParams";


export interface IModalProps {
  isShowing: boolean;
  hide?: () => void;
  children: ReactNode;
  padding?: string;
  minWidth?: string | number;
  maxWidth?: string | number;
  hideCloseButton?: boolean;
  maxHeight?: string;
  fixedElement?: ReactNode;
  id?: string;
}

const Modal: FC<IModalProps> = ({
  isShowing,
  hide,
  children,
  padding,
  minWidth,
  maxWidth,
  maxHeight,
  hideCloseButton,
  fixedElement,
  id
}) => {
  const handleSearchParamUpdate = useUserPilotSearchParams(id, isShowing);

  const handleHide = () => {
    if (id) handleSearchParamUpdate(false, id);
    if (hide) {
      hide();
    }
  }

  if (!isShowing) return null;

  return (
    <Portal>
      <S.ModalWrapper onClick={handleHide}>
        <S.ModalContent
          maxHeight={maxHeight}
          maxWidth={maxWidth}
          minWidth={minWidth ? minWidth : "fit-content"}
          padding={padding}
          onClick={(e) => e.stopPropagation()}>
          {hide && !hideCloseButton ? (
            <S.CloseContainer onClick={handleHide}>
              <SVG icon={faClose} size="xl" />
            </S.CloseContainer>
          ) : null}
          {children}
        </S.ModalContent>
      </S.ModalWrapper>

      {fixedElement ? <S.FixedElement>
        {fixedElement}
      </S.FixedElement> : null}
    </Portal>
  );
}
  
export default Modal;
