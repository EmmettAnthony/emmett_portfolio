import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

interface ProviderOptions {
  session?: { user: { id: string; name?: string; email?: string; role?: string } } | null;
  queryClient?: QueryClient;
  theme?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function WithProviders({
  children,
  options = {},
}: {
  children: ReactNode;
  options?: ProviderOptions;
}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const session = options.session ?? { user: { id: "test-user", email: "test@example.com", role: "ADMIN" } };

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme={options.theme ?? "dark"} enableSystem={false}>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { providerOptions?: ProviderOptions },
) {
  const { providerOptions, ...renderOptions } = options ?? {};

  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <WithProviders options={providerOptions}>{children}</WithProviders>
      ),
      ...renderOptions,
    }),
  };
}

export { renderWithProviders, WithProviders, createTestQueryClient };
export type { ProviderOptions };
