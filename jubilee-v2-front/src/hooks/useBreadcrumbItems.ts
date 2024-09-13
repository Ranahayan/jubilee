import { DefaultTFuncReturn } from "i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BreadcrumbItem } from "~/components/breadcrumbs/types";

type SegmentBuilder = SegmentBuilderWithValue | SegmentBuilderWithoutValue;

type SegmentBuilderWithValue = {
  translation: (value: string) => DefaultTFuncReturn;
  onClick?: ((value: string) => void) | (() => void);
};

type SegmentBuilderWithoutValue = {
  translation: DefaultTFuncReturn;
  onClick?: () => void;
};

type ClickableSegmentBuilder = SegmentBuilder & {
  clickable?: boolean;
};

type Args = {
  baseItems?: SegmentBuilderWithoutValue[];
  routeItems?: (ClickableSegmentBuilder | null)[];
  searchParamItems?: Record<string, ClickableSegmentBuilder>;
};

export const useBreadcrumbItems = ({
  baseItems = [],
  routeItems = [],
  searchParamItems = {},
}: Args): BreadcrumbItem[] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const routeParts = location.pathname.split("/").filter((part) => part !== "");

  const filteredRouteItems = routeParts.filter((_value, index) => {
    const routeItem = routeItems.at(index);
    return !!routeItem;
  });

  const filteredSearchParamItems = Array.from(searchParams.entries()).filter(
    ([key]) => key in searchParamItems
  );

  const totalLength =
    baseItems.length +
    filteredRouteItems.length +
    filteredSearchParamItems.length;

  const baseSegments = baseItems.map((builder, i) =>
    buildWithSegmentBuilderWithoutValue(
      builder.translation,
      builder,
      i === totalLength - 1
    )
  );

  const routeSegments = routeParts
    .map((part, index) => {
      const routeItem = routeItems.at(index);
      if (!routeItem) {
        return null;
      }

      const builder = fromClickableSegmentBuilder(routeItem, part, () =>
        navigate(`/${routeParts.slice(0, index + 1).join("/")}`)
      );

      return buildWithSegmentBuilder(
        part,
        part,
        builder,
        index + baseItems.length === totalLength - 1
      );
    })
    .filter((segment): segment is BreadcrumbItem => !!segment);

  const searchParamSegments = filteredSearchParamItems.map(
    ([key, value], i) => {
      const builder = fromClickableSegmentBuilder(
        searchParamItems[key],
        value,
        () => {
          setSearchParams(
            Object.fromEntries(filteredSearchParamItems.slice(0, i + 1))
          );
        }
      );

      return buildWithSegmentBuilder(
        key,
        value,
        builder,
        i + baseSegments.length + filteredRouteItems.length === totalLength - 1
      );
    }
  );

  return [...baseSegments, ...routeSegments, ...searchParamSegments];
};

const fromClickableSegmentBuilder = (
  builder: ClickableSegmentBuilder,
  value: string,
  onClick: () => void
): SegmentBuilder => {
  const { clickable, ...rest } = builder;

  if (clickable === false) {
    return {
      ...rest,
      onClick: rest.onClick ? () => rest.onClick?.(value) : undefined,
    };
  }

  return {
    ...rest,
    onClick: () => {
      rest.onClick?.(value);
      onClick();
    },
  };
};

const isSegmentBuilderWithValue = (
  segmentBuilder: SegmentBuilder
): segmentBuilder is SegmentBuilderWithValue => {
  return typeof segmentBuilder.translation === "function";
};

const buildWithSegmentBuilder = (
  key: DefaultTFuncReturn,
  value: string,
  segmentBuilder: SegmentBuilder,
  isLast: boolean
) => {
  if (isSegmentBuilderWithValue(segmentBuilder)) {
    return buildWithSegmentBuilderWithValue(key, value, segmentBuilder, isLast);
  }

  return buildWithSegmentBuilderWithoutValue(key, segmentBuilder, isLast);
};

const buildWithSegmentBuilderWithValue = (
  key: DefaultTFuncReturn,
  value: string,
  segmentBuilder: SegmentBuilderWithValue,
  isLast: boolean
): BreadcrumbItem => {
  return buildWithSegmentBuilderWithoutValue(
    key,
    {
      translation: segmentBuilder.translation(value),
      onClick:
        segmentBuilder.onClick !== undefined
          ? () => segmentBuilder.onClick?.(value)
          : undefined,
    },
    isLast
  );
};

const buildWithSegmentBuilderWithoutValue = (
  key: DefaultTFuncReturn,
  segmentBuilder: SegmentBuilderWithoutValue,
  isLast: boolean
): BreadcrumbItem => {
  if (!isLast && segmentBuilder.onClick !== undefined) {
    return {
      type: "button",
      label: segmentBuilder.translation,
      key: key ? String(key) : undefined,
      onClick: segmentBuilder.onClick,
    };
  }

  return {
    type: "text",
    label: segmentBuilder.translation,
    key: key ? String(key) : undefined,
  };
};
