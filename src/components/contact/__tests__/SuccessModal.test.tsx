import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuccessModal } from "../SuccessModal";

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      close: "Close",
      messageSent: "Message Sent Successfully!",
      messageSentDesc: "Thank you for reaching out!",
      bookConsultation: "Book a Free Consultation",
      viewPortfolio: "View My Portfolio",
      continueBrowsing: "Continue Browsing",
      consultationBooked: "Consultation Booked!",
      consultationBookedDesc: "I'll confirm the time",
      done: "Done",
      bookHeading: "Book a Free Consultation",
      bookDesc: "Pick a date and time",
      preferredDate: "Preferred Date",
      preferredTime: "Preferred Time",
      errorMsg: "Something went wrong",
      back: "Back",
      bookNow: "Book Now",
    };
    return translations[key] || key;
  },
}));

// Mock framer-motion
vi.mock("framer-motion")
;

const mockFetch = vi.fn();
global.fetch = mockFetch;

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  email: "john@example.com",
  name: "John Doe",
  contactId: "contact-123",
};

describe("SuccessModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("modal visibility", () => {
    it("renders when open is true", () => {
      render(<SuccessModal {...defaultProps} />);
      expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      const { container } = render(<SuccessModal {...defaultProps} open={false} />);
      expect(container.innerHTML).toBe("");
    });

    it("calls onClose when close button is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} onClose={onClose} />);

      const closeBtn = screen.getByLabelText("Close");
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("initial success state", () => {
    it("shows success message", () => {
      render(<SuccessModal {...defaultProps} />);
      expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
    });

    it("shows success description", () => {
      render(<SuccessModal {...defaultProps} />);
      expect(screen.getByText("Thank you for reaching out!")).toBeInTheDocument();
    });

    it("renders book consultation button", () => {
      render(<SuccessModal {...defaultProps} />);
      expect(screen.getAllByText("Book a Free Consultation").length).toBeGreaterThan(0);
    });

    it("renders view portfolio link", () => {
      render(<SuccessModal {...defaultProps} />);
      const portfolioLink = screen.getByText("View My Portfolio");
      expect(portfolioLink).toBeInTheDocument();
      expect(portfolioLink.closest("a")).toHaveAttribute("href", "/portfolio");
    });

    it("renders continue browsing button", () => {
      render(<SuccessModal {...defaultProps} />);
      expect(screen.getByText("Continue Browsing")).toBeInTheDocument();
    });

    it("calls onClose when continue browsing is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText("Continue Browsing"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("booking step", () => {
    it("navigates to booking step when book consultation is clicked", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      expect(screen.getByText("Pick a date and time")).toBeInTheDocument();
    });

    it("renders date and time inputs in booking step", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      // Date and time inputs - find by type
      const dateInput = document.querySelector('input[type="date"]');
      const timeInput = document.querySelector('input[type="time"]');
      expect(dateInput).toBeInTheDocument();
      expect(timeInput).toBeInTheDocument();
    });

    it("renders back button in booking step", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("goes back to initial state when back is clicked", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);
      await user.click(screen.getByText("Back"));

      expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
    });
  });

  describe("booking submission", () => {
    it("submits booking with correct data", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("john@example.com"),
        });
      });
    });

    it("includes name, email, contactId in booking payload", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            preferredDate: "2026-07-20",
            preferredTime: null,
            contactId: "contact-123",
            source: "CONTACT_FORM",
          }),
        });
      });
    });

    it("shows booking success after successful submission", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Consultation Booked!")).toBeInTheDocument();
      });
    });

    it("shows error message on booking failure", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: false });
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });
    });

    it("does not submit booking without date", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);
      await user.click(screen.getByText("Book Now"));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles booking with preferred time", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
      await user.click(timeInput);
      await user.type(timeInput, "14:00");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("14:00"),
        });
      });
    });
  });

  describe("booking edge cases", () => {
    it("does not submit booking when email is undefined even with date set", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} email={undefined} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows error on network failure (catch block)", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error("Network error"));
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });
    });

    it("disables book now button during loading state", async () => {
      // Keep the fetch promise pending to simulate loading
      let resolvePromise!: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(pendingPromise);

      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        const bookNowBtn = screen.getByText("Book Now").closest("button");
        expect(bookNowBtn).toBeDisabled();
      });

      // Resolve the pending promise to clean up
      resolvePromise({ ok: true });
    });

    it("uses empty name fallback when name is undefined", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} name={undefined} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"name":""'),
        });
      });
    });

    it("uses null contactId fallback when contactId is undefined", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} contactId={undefined} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"contactId":null'),
        });
      });
    });
  });

  describe("timer callback coverage", () => {
    it("triggers setTimeout reset callback after booking failure (else branch)", async () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      mockFetch.mockResolvedValue({ ok: false });
      const user = userEvent.setup();

      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      // Find the 4000ms setTimeout callback and invoke it directly
      const resetCallback = setTimeoutSpy.mock.calls.find(
        (call) => call[1] === 4000
      )?.[0] as () => void;
      expect(resetCallback).toBeDefined();
      resetCallback();

      // After the callback fires, bookStatus resets to "idle" — error disappears
      await waitFor(() => {
        expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
      });

      setTimeoutSpy.mockRestore();
    });

    it("triggers setTimeout reset callback after network failure (catch block)", async () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      mockFetch.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();

      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      // Find the 4000ms setTimeout callback and invoke it directly
      const resetCallback = setTimeoutSpy.mock.calls.find(
        (call) => call[1] === 4000
      )?.[0] as () => void;
      expect(resetCallback).toBeDefined();
      resetCallback();

      // After the callback fires, bookStatus resets to "idle" — error disappears
      await waitFor(() => {
        expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
      });

      setTimeoutSpy.mockRestore();
    });
  });

  describe("booking success state", () => {
    it("shows consultation booked message after booking success", async () => {
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Consultation Booked!")).toBeInTheDocument();
        expect(screen.getByText("Done")).toBeInTheDocument();
      });
    });

    it("closes modal when done is clicked after booking", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SuccessModal {...defaultProps} onClose={onClose} />);

      const bookBtns = screen.getAllByText("Book a Free Consultation");
      await user.click(bookBtns[0]);

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByText("Book Now"));

      await waitFor(() => {
        expect(screen.getByText("Done")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Done"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
