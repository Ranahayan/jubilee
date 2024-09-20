import { ReactNode } from "react";
import { SVG } from "~/components/ui/SVG";
import { faLock } from "@fortawesome/pro-solid-svg-icons";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import * as S from "./styles";

interface IUpgradeOverlayProps {
  children?: ReactNode;
  upgradeMessage?: ReactNode;
  icon?: Icon;
  isLocked?: boolean;
  isDisabled?: boolean;
}

const UpgradeOverlay = ({
  children,
  upgradeMessage,
  isLocked = true,
  icon,
  isDisabled,
}: IUpgradeOverlayProps) => {
  return (
    <S.Overlay>
      <S.Content isBlurred={isLocked} isDisabled={isDisabled}>
        {children}
      </S.Content>
      {isLocked && (
        <S.Message>
          <SVG color="primary" size="xl" icon={icon || (faLock as Icon)} />
          {upgradeMessage}
        </S.Message>
      )}
    </S.Overlay>
  );
};

export default UpgradeOverlay;
