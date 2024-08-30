import { useEffect } from 'react'

export const useDebounceEffect = (callback: () => void, value: any [], delay: number) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, value);
};
