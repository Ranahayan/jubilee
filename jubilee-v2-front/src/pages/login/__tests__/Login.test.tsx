import "@testing-library/jest-dom";
import { vi, Mock } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "~/pages/login";
import { useLogin } from "~/pages/login/useLogin";
import { paths } from "~/router/paths";
import { TestWrapper } from "~/helpers/testSetup";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("~/pages/login/useLogin", () => ({
  useLogin: vi.fn(),
}));

vi.mock("react-use-intercom", () => ({
  useIntercom: vi.fn(() => ({ boot: vi.fn() })),
}));

vi.mock("~/hooks/useMediaQuery", () => ({
  useMediaQuery: vi.fn(),
}));

describe("LoginPage", () => {
  it("renders correctly", () => {
    render(
      <MemoryRouter initialEntries={[paths.auth.login]}>
        <TestWrapper>
          <Route path={paths.auth.login} element={<LoginPage />} />
        </TestWrapper>
      </MemoryRouter>
    );

    expect(screen.getByText("auth.signin.top_text")).toBeInTheDocument();
    expect(screen.getByText("auth.signin.title")).toBeInTheDocument();
    expect(screen.getByText("auth.signin.bottom_button")).toBeInTheDocument();
  });

  it("calls useLogin hook when form is submitted", () => {
    const mockHandleLogin = vi.fn();
    (useLogin as Mock).mockReturnValue(mockHandleLogin);

    render(
      <MemoryRouter initialEntries={[paths.auth.login]}>
        <TestWrapper>
          <Route path={paths.auth.login} element={<LoginPage />} />
        </TestWrapper>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("auth.signin.bottom_button"));
    expect(mockHandleLogin).toHaveBeenCalled();
  });

  it("navigates to register page when sign up button is clicked", () => {
    let testLocation: any;

    const TestRoute = () => {
      const location = useLocation();
      testLocation = location;
      return null;
    };

    render(
      <MemoryRouter initialEntries={[paths.auth.login]}>
        <TestWrapper>
          <Route path={paths.auth.login} element={<LoginPage />} />
          <Route path="*" element={<TestRoute />} />
        </TestWrapper>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("auth.signin.link"));
    expect(testLocation.pathname).toBe(paths.auth.register);
  });
});
