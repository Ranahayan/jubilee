import { Fragment, Key } from "react";
import * as S from "./styles";
import { faAngleRight } from "@fortawesome/pro-light-svg-icons";
import { SVG } from "~/components/ui/SVG";
import { BreadcrumbItem } from "./types";

interface IBreadcrumbsProps {
  items: BreadcrumbItem[];
  highlightLastItem?: boolean;
  className?: string;
}

export const Breadcrumbs = ({
  items,
  className,
  highlightLastItem = true,
}: IBreadcrumbsProps) => {
  const filteredItems = items.filter((item) => !item.hidden);

  return (
    <S.BreadcrumbContainer className={className}>
      {filteredItems.map((item, index) => (
        <Fragment key={item.key}>
          <BreadcrumbElement
            item={item}
            key={item.key}
            isHighlighted={
              highlightLastItem && index === filteredItems.length - 1
            }
          />
          {index < filteredItems.length - 1 && (
            <SVG icon={faAngleRight} color="textSecondary" />
          )}
        </Fragment>
      ))}
    </S.BreadcrumbContainer>
  );
};

const BreadcrumbElement = ({
  item,
  isHighlighted,
}: {
  item: BreadcrumbItem;
  isHighlighted: boolean;
}): React.ReactElement => {
  switch (item.type) {
    case "button":
      return (
        <S.BreadcrumbButton
          onClick={item.onClick}
          isHighlighted={isHighlighted}>
          {item.label}
        </S.BreadcrumbButton>
      );
    case "text":
      return (
        <S.BreadcrumbText isHighlighted={isHighlighted}>
          {item.label}
        </S.BreadcrumbText>
      );
  }
};
