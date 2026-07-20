// ──────────────────────────────────────────────────────────────────────────────
// NotificationInboxPage — SSE-Query Invalidation Unit Tests
// ──────────────────────────────────────────────────────────────────────────────
// Tests the useEffect that watches unreadCount from useNotifications and
// invalidates the ["notifications-inbox"] react-query cache when a new
// notification arrives via SSE (sseConnected + increasing count).
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// ─── Mocks must be defined before any imports that use them ─────────────────

const mockInvalidateQueries = vi.fn();
const mockUseInfiniteQuery = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("framer-motion")
;

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// ─── This is what we're testing — we control its return values ──────────────
const mockUseNotifications = vi.fn();

vi.mock("@/lib/i18n", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => mockUseNotifications(),
}));

// Must import after mocks
import NotificationInboxPage from "../page";

// ─── Default mock return values ─────────────────────────────────────────────

const BASE_MOCK = {
  unreadCount: 0,
  sseConnected: false,
  refresh: vi.fn(),
};

const BASE_INFINITE_QUERY = {
  data: { pages: [] },
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  isLoading: false,
  isError: false,
};

beforeEach(() => {
  vi.clearAllMocks();

  // Default: no notifications, SSE disconnected
  mockUseNotifications.mockReturnValue({ ...BASE_MOCK });
  mockUseInfiniteQuery.mockReturnValue({ ...BASE_INFINITE_QUERY });
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("NotificationInboxPage SSE-query invalidation", () => {
  describe("initial render", () => {
    it("does NOT invalidate queries on mount when SSE is disconnected", () => {
      // unreadCount=0, sseConnected=false by default
      render(<NotificationInboxPage />);

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it("does NOT invalidate queries on mount when SSE is connected but count is 0", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 0,
        sseConnected: true,
      });
      render(<NotificationInboxPage />);

      // unreadCount (0) is NOT > prevUnreadRef.current (0)
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it("does NOT invalidate queries on mount when unreadCount > 0 but SSE is disconnected", () => {
      // This simulates initial API fetch returning unread count before SSE connects
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 5,
        sseConnected: false,
      });
      render(<NotificationInboxPage />);

      // Effect guards: sseConnected must be true
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("SSE-connected invalidation", () => {
    it("invalidates inbox query when SSE is connected and unreadCount increases", () => {
      // Start with 0 unread (SSE not yet connected)
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 0,
        sseConnected: false,
      });
      const { rerender } = render(<NotificationInboxPage />);
      expect(mockInvalidateQueries).not.toHaveBeenCalled();

      // Now SSE connects and a new notification arrives
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 1,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);

      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["notifications-inbox"],
      });
    });

    it("invalidates only once when count increases by multiple", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 0,
        sseConnected: true,
      });
      const { rerender } = render(<NotificationInboxPage />);
      vi.clearAllMocks();

      // Jump from 0 → 3 unread (batch of notifications)
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 3,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);

      // Should invalidate exactly once (unreadCount (3) > prevUnreadRef.current (0))
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    });

    it("does NOT invalidate when SSE disconnects and count stays same", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 2,
        sseConnected: true,
      });
      const { rerender } = render(<NotificationInboxPage />);
      // Initial render: sseConnected=true && 2>0 → invalidates (expected on connect)
      vi.clearAllMocks();

      // SSE disconnects but count unchanged
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 2,
        sseConnected: false,
      });
      rerender(<NotificationInboxPage />);

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("non-invalidation cases", () => {
    it("does NOT invalidate when SSE is disconnected and unreadCount increases (polling noise)", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 0,
        sseConnected: false,
      });
      const { rerender } = render(<NotificationInboxPage />);
      vi.clearAllMocks();

      // unreadCount increased but SSE is disconnected — this could be from the
      // initial fetch resolving, not a real-time push
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 3,
        sseConnected: false,
      });
      rerender(<NotificationInboxPage />);

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it("does NOT invalidate when unreadCount decreases", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 5,
        sseConnected: true,
      });
      const { rerender } = render(<NotificationInboxPage />);
      // Initial render: sseConnected=true && 5>0 → invalidates (expected on connect)
      vi.clearAllMocks();

      // User marked some as read — count goes down
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 2,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);

      // unreadCount (2) is NOT > prevUnreadRef.current (5)
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });

    it("does NOT invalidate when unreadCount stays the same", () => {
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 3,
        sseConnected: true,
      });
      const { rerender } = render(<NotificationInboxPage />);
      // Initial render: sseConnected=true && 3>0 → invalidates (expected on connect)
      vi.clearAllMocks();

      // No change in count
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 3,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);

      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });

  describe("effect dependency changes", () => {
    it("invalidates on second SSE push (count: 1→2)", () => {
      // Render with initial count 0, SSE connected
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 0,
        sseConnected: true,
      });
      const { rerender } = render(<NotificationInboxPage />);
      vi.clearAllMocks();

      // First push: 0 → 1
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 1,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["notifications-inbox"],
      });
      vi.clearAllMocks();

      // Second push: 1 → 2
      mockUseNotifications.mockReturnValue({
        ...BASE_MOCK,
        unreadCount: 2,
        sseConnected: true,
      });
      rerender(<NotificationInboxPage />);

      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["notifications-inbox"],
      });
    });
  });
});
