import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="modal-overlay"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="document"
        className={sizeClasses[size]}
        data-testid="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div data-testid="modal-header">
          <h2>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            data-testid="modal-close"
          >
            X
          </button>
        </div>
        <div data-testid="modal-body">{children}</div>
      </div>
    </div>
  );
}

describe("Modal Component", () => {
  it("renders when open", () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal">Content</Modal>);
    expect(screen.getByTestId("modal-overlay")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test Modal">Content</Modal>);
    expect(screen.queryByTestId("modal-overlay")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Test">Content</Modal>);
    await user.click(screen.getByTestId("modal-close"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Test">Content</Modal>);
    await user.click(screen.getByTestId("modal-overlay"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when content clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Test">Content</Modal>);
    await user.click(screen.getByTestId("modal-content"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("has correct aria attributes", () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Delete Confirmation">Content</Modal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Delete Confirmation");
  });

  it("renders children", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test">
        <p>Modal body content</p>
        <button>Action</button>
      </Modal>,
    );
    expect(screen.getByText("Modal body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
