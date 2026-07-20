import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, ReactNode } from "react";

interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return <>{children}</>;
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

export * from "@testing-library/react";
export { customRender as render, userEvent };
