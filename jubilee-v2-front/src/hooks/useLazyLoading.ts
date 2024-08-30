import { FetchNextPageOptions, InfiniteQueryObserverResult } from '@tanstack/react-query';
import { MutableRefObject, useCallback } from 'react';

interface IUseLazyLoading {
  observer: MutableRefObject<IntersectionObserver | null>;
  isLoading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage: (options?: FetchNextPageOptions | undefined) => Promise<InfiniteQueryObserverResult<any, unknown>>
}

export const useLazyLoading = ({ observer, isLoading, hasNextPage, fetchNextPage }: IUseLazyLoading) => {
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    })
    if (node) observer.current.observe(node);
  }, [isLoading, hasNextPage]);

  return lastElementRef;
};
