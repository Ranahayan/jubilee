import { Fragment } from "react";
import * as S from "./styles";
import { DOTS, usePagination } from "~/hooks/usePagination";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { SVG } from "../SVG";
import {
  faChevronLeft,
  faChevronRight,
  faChevronsLeft,
  faChevronsRight,
} from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "../SVG/types";

type Props = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number | string) => void;
};

export const Pagination = ({
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
}: Props) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const isPhone = useMediaQuery("mobileL");

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    pageSize,
  });

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  const onFirstPage = () => {
    onPageChange(1);
  };

  const onLastPage = () => {
    onPageChange(totalPages);
  };

  return (
    <S.ButtonsContainer>
      <S.ButtonArea>
        {isPhone && (
          <S.PaginationButton onClick={onFirstPage} disabled={isFirstPage}>
            <SVG icon={faChevronsLeft as SVGIcon} color="text" />
          </S.PaginationButton>
        )}
        <S.PaginationButton onClick={onPrevious} disabled={isFirstPage}>
          <SVG icon={faChevronLeft as SVGIcon} color="text" />
        </S.PaginationButton>
        {paginationRange?.map((pageNumber, index) => (
          <Fragment key={index}>
            {pageNumber === DOTS ? (
              <S.NumberStyle dots={true}>{DOTS}</S.NumberStyle>
            ) : (
              <S.NumberStyle
                active={pageNumber === currentPage}
                onClick={() => onPageChange(pageNumber)}>
                {pageNumber}
              </S.NumberStyle>
            )}
          </Fragment>
        ))}
        <S.PaginationButton onClick={onNext} disabled={isLastPage}>
          <SVG icon={faChevronRight as SVGIcon} color="text" />
        </S.PaginationButton>
        {isPhone && (
          <S.PaginationButton onClick={onLastPage} disabled={isLastPage}>
            <SVG icon={faChevronsRight as SVGIcon} color="text" />
          </S.PaginationButton>
        )}
      </S.ButtonArea>
    </S.ButtonsContainer>
  );
};
