import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from "@testing-library/jest-dom/matchers";
import { MemoryRouter, Routes } from "react-router-dom"
import { ReactQueryProvider } from '~/contexts/ReactQuery';
import { ThemeProvider } from 'styled-components';
import theme from "~/constants/theme";
import { ContextWrapper } from '~/contexts';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ContextWrapper>
      <ThemeProvider theme={theme}>
        <Routes>
          {children}
        </Routes>
      </ThemeProvider>
    </ContextWrapper>
  )
};