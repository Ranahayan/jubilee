import { navItems } from "~/constants/sidebar";
import Button from "~/components/ui/Button";
import { isFontAwesomeIcon, SVG } from "~/components/ui/SVG";
import LogoSvg from "~/assets/svg/logo.svg?react";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import * as S from "./Sidebar.style";
import {
  ChangeEvent,
  createElement,
  FC,
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { paths } from "~/router/paths";
import { faBars } from "@fortawesome/pro-light-svg-icons";
import { StyledLink } from "~/components/ui/Styled/Link";
import FlexContainer from "~/components/ui/FlexContainer";

import { Userpilot } from "userpilot";
import { useLocation } from "react-router-dom";
import { useAccount } from "~/hooks/useAccount";
import { Notifications } from "~/components/notifications";
import { ISidebarCount } from "~/api/sidebarCounts/types";
import { HelpCenterModal } from "~/components/helpCenterModal";
import { INavItem, ISidebarIcon } from "~/types/routing";
import { DISABLE_PAYMENTS } from "~/helpers/plans";
import { useStore } from "~/hooks/useStore";
import theme from "~/constants/theme";

Userpilot.initialize("NX-f9dabb4f");

export const Brand = () => {
  return (
    <S.LinkContainer>
      <StyledLink to={paths.app.home}>
        <S.BrandContainer>
          <LogoSvg style={{ height: 40, width: "94px" }} />
        </S.BrandContainer>
      </StyledLink>
    </S.LinkContainer>
  );
};

interface MenuItemProps extends INavItem {
  openHelpCenter?: () => void;
  closeMobileSidebar?: () => void;
}

const MenuItem = (props: MenuItemProps) => {
  const {
    path,
    openInNewTab,
    icon,
    sectionLabel,
    namePath,
    getCountQuery,
    showHelpCenterModal,
    openHelpCenter,
    closeMobileSidebar,
    onClick,
    isOnlySVG,
    isNew,
  } = props;
  const { t } = useTranslation();
  const { data } = getCountQuery ? getCountQuery() : { data: { count: 0 } };
  const { store } = useStore();

  if (!!store && namePath === "nav.connect-store") {
    return null;
  }

  return (
    <Fragment key={path}>
      {sectionLabel ? (
        <S.MenuItemTitle>{t(sectionLabel)}</S.MenuItemTitle>
      ) : null}
      <S.NavItem
        style={{ textDecoration: "none", width: "100%" }}
        to={path}
        key={path}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        onClick={(e) => {
          closeMobileSidebar?.();
          if (showHelpCenterModal && openHelpCenter) {
            e.preventDefault();
            openHelpCenter();
          }

          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}>
        {({ isActive }: { isActive: boolean }) => (
          <Button
            variant={isActive ? "filled" : "default"}
            color={isActive ? "primary" : "text"}
            fontWeight={isActive ? 600 : 500}
            bgColor={isActive ? "primaryLight" : "white"}
            radius={0.75}
            gap={"26px"}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            justifyContent="flex-start">
            {icon && (
              <SidebarIcon
                icon={icon}
                isOnlySVG={isOnlySVG}
                isActive={isActive}
              />
            )}
            {t(namePath)}
            {!!data && !!(data as ISidebarCount).count && (
              <S.Count>{(data as ISidebarCount).count as number}</S.Count>
            )}

            {isNew && (
              <S.NewContainer>
                <S.NewText>New</S.NewText>
              </S.NewContainer>
            )}
          </Button>
        )}
      </S.NavItem>
    </Fragment>
  );
};

const Menu = ({ closeMobileSidebar }: { closeMobileSidebar?: () => void }) => {
  const location = useLocation();
  const { account } = useAccount();
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  useEffect(() => {
    if (account) {
      Userpilot.reload();
    }
  }, [account, location]);

  const settingsIndex = useMemo(
    () =>
      navItems.findIndex(({ path }) =>
        DISABLE_PAYMENTS
          ? path === paths.settings.account
          : path === paths.settings.plans
      ),
    [navItems]
  );

  const [itemsBeforeSettings, itemsAfterSettings] = useMemo(() => {
    return [
      navItems.slice(0, settingsIndex),
      navItems.slice(settingsIndex, navItems.length),
    ];
  }, []);

  const helpCenterPath = useMemo(
    () => navItems.find(({ showHelpCenterModal }) => showHelpCenterModal)?.path,
    [navItems]
  );

  return (
    <S.NavContainer>
      <FlexContainer
        height="100%"
        flexDirection="column"
        justifyContent="space-between">
        <S.MenuItensContainer gap={0}>
          {itemsBeforeSettings.map((navItem) => (
            <MenuItem
              key={navItem.path}
              closeMobileSidebar={closeMobileSidebar}
              {...navItem}
            />
          ))}
        </S.MenuItensContainer>
        <S.MenuItensContainer>
          {itemsAfterSettings.map((navItem) => (
            <MenuItem
              key={navItem.path}
              openHelpCenter={() => setShowHelpCenter(true)}
              closeMobileSidebar={closeMobileSidebar}
              {...navItem}
            />
          ))}
        </S.MenuItensContainer>
      </FlexContainer>
      <HelpCenterModal
        path={String(helpCenterPath)}
        isShowing={showHelpCenter}
        hide={() => setShowHelpCenter(false)}
      />
    </S.NavContainer>
  );
};

const DesktopSidebar = () => {
  return (
    <S.SidebarContainer>
      <Brand />
      <Menu />
    </S.SidebarContainer>
  );
};

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <S.SidebarContainer>
      <Notifications />
      <Brand />
      <S.MobileMenuButton onClick={() => setIsOpen(!isOpen)}>
        <SVG icon={faBars} size="lg" />
      </S.MobileMenuButton>
      {isOpen && (
        <S.MobileMenu>
          <Menu closeMobileSidebar={() => setIsOpen(false)} />
        </S.MobileMenu>
      )}
    </S.SidebarContainer>
  );
};

const renderSideBarIcon = ({
  icon,
  isOnlySVG,
  isActive,
}: {
  icon: ISidebarIcon;
  isOnlySVG?: boolean;
  isActive: boolean;
}) => {
  if (isOnlySVG) {
    return <img src={icon as any} alt="Svg icon" />;
  }

  if (isFontAwesomeIcon(icon)) {
    return <SVG icon={icon as any} svgProp={{ width: 18 }} />;
  }
  return createElement(icon as FC<{ style?: React.CSSProperties }>, {
    style: { width: 20, height: 20, flexShrink: 0 },
  });
};

const SidebarIcon = ({
  icon,
  isActive,
  isOnlySVG = false,
}: {
  isActive: boolean;
  icon: ISidebarIcon;
  isOnlySVG?: boolean;
}) => <>{renderSideBarIcon({ icon, isOnlySVG, isActive })}</>;

const Sidebar = () => {
  const isTabletAndUp = useMediaQuery("tablet");
  if (isTabletAndUp) return <DesktopSidebar />;
  return <MobileSidebar />;
};

export default Sidebar;
