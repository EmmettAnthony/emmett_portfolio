import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import { BookingSection } from "../BookingSection";

// Mock framer-motion
vi.mock("framer-motion")
;

// Mock AnimateOnScroll
vi.mock("@/components/shared/AnimateOnScroll", () => ({
  AnimateOnScroll: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderComponent() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BookingSection />
    </NextIntlClientProvider>,
  );
}

describe("BookingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("renders booking section title", () => {
      renderComponent();
      // The title appears both as heading and button text - use getAllByText
      expect(screen.getAllByText("Book a Free Consultation").length).toBeGreaterThan(0);
    });

    it("renders booking description", () => {
      renderComponent();
      expect(screen.getByText(/Let's hop on a quick call to discuss your project/)).toBeInTheDocument();
    });

    it("renders feature list items", () => {
      renderComponent();
      expect(screen.getByText("30 min call")).toBeInTheDocument();
      expect(screen.getByText("No commitment required")).toBeInTheDocument();
      expect(screen.getByText("Let's discuss your project")).toBeInTheDocument();
    });

    it("renders availability info", () => {
      renderComponent();
      expect(screen.getByText(/Available Monday – Friday/)).toBeInTheDocument();
      expect(screen.getByText(/9:00 AM – 6:00 PM/)).toBeInTheDocument();
    });

    it("renders alt CTA to Google Calendar", () => {
      renderComponent();
      expect(screen.getByText(/Or use Google Calendar/)).toBeInTheDocument();
    });
  });

  describe("booking form", () => {
    it("allows typing in phone and company fields", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));

      const phoneInput = screen.getByPlaceholderText("+1 (555) 000-0000");
      const companyInput = screen.getByPlaceholderText("Acme Inc.");

      await user.type(phoneInput, "+1-555-123-4567");
      await user.type(companyInput, "Test Corp");

      expect(phoneInput).toHaveValue("+1-555-123-4567");
      expect(companyInput).toHaveValue("Test Corp");
    });

    it("includes phone and company in form submission", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");
      await user.type(screen.getByPlaceholderText("+1 (555) 000-0000"), "+1-555-1234");
      await user.type(screen.getByPlaceholderText("Acme Inc."), "Acme");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("+1-555-1234"),
        });
      });
    });

    it("opens Google Calendar link when alt CTA is clicked", async () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByText(/Or use Google Calendar/));

      expect(openSpy).toHaveBeenCalledWith(
        "https://calendar.app.google/wRyaaUEGemxPDZ4Y8",
        "_blank",
        "noopener,noreferrer"
      );      openSpy.mockRestore();
    });

    it("shows booking form when CTA button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Click the "Book a Free Consultation" button (not the heading)
      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));

      expect(screen.getByText("Schedule a Call")).toBeInTheDocument();
      expect(screen.getByText(/Fill in your details and preferred time/)).toBeInTheDocument();
    });

    it("renders all form placeholders in booking form", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));

      expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("john@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("+1 (555) 000-0000")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Acme Inc.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Briefly describe/)).toBeInTheDocument();
    });

    it("shows validation errors for empty required fields", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Date is required")).toBeInTheDocument();
    });

    it("shows email validation error for invalid email", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: /book a free consultation/i }));

      await user.type(screen.getByPlaceholderText("John Doe"), "John");
      await user.type(screen.getByPlaceholderText("john@example.com"), "invalid-email");

      // Verify inputs have values
      expect(screen.getByPlaceholderText("John Doe")).toHaveValue("John");
      expect(screen.getByPlaceholderText("john@example.com")).toHaveValue("invalid-email");

      // Click submit button by text content (more reliable than role query)
      const submitText = screen.getByText("Book Consultation");
      const submitForm = submitText.closest("form");
      expect(submitForm).toBeInTheDocument();

      // Submit the form directly
      const form = document.querySelector("form")!;
      fireEvent.submit(form);

      // The validation error for invalid email from en.json
      await waitFor(() => {
        expect(screen.getByText("Invalid email")).toBeInTheDocument();
      });
    });

    it("submits form with correct data", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("John Doe"),
        });
      });
    });

    it("shows success state after successful submission", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText("Consultation Booked!")).toBeInTheDocument();
      });
    });

    it("shows error alert on API failure", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({ ok: false });
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      });
    });

    it("has cancel button to go back to initial state", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      expect(screen.getByText("Schedule a Call")).toBeInTheDocument();

      const cancelBtns = screen.getAllByText("Cancel");
      await user.click(cancelBtns[0]);

      expect(screen.getByRole("button", { name: "Book a Free Consultation" })).toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("handles non-Error thrown value in handleSubmit catch", async () => {
      // Mock fetch to reject with a string (not an Error)
      mockFetch.mockRejectedValue("string-error");
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      });
    });

    it("shows error alert on network failure (fetch throws)", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      });
    });

    it("shows loading state while submitting form", async () => {
      // Make fetch never resolve to stay in loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("shows success title and description", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText("Consultation Booked!")).toBeInTheDocument();
        expect(screen.getByText(/I've received your booking request/)).toBeInTheDocument();
      });
    });

    it("allows booking another consultation from success state", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("button", { name: "Book a Free Consultation" }));
      await user.type(screen.getByPlaceholderText("John Doe"), "John Doe");
      await user.type(screen.getByPlaceholderText("john@example.com"), "john@example.com");

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.click(dateInput);
      await user.type(dateInput, "2026-07-20");

      await user.click(screen.getByRole("button", { name: "Book Consultation" }));

      await waitFor(() => {
        expect(screen.getByText("Consultation Booked!")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Book another"));

      expect(screen.getByRole("button", { name: "Book a Free Consultation" })).toBeInTheDocument();
    });
  });
});
