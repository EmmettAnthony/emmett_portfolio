import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantColors = {
    danger: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  return (
    <div role="alertdialog" aria-label={title} data-testid="confirm-dialog">
      <div data-testid="dialog-content">
        <h2>{title}</h2>
        <p>{message}</p>
        <div>
          <button
            onClick={onCancel}
            disabled={loading}
            data-testid="dialog-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={variantColors[variant]}
            data-testid="dialog-confirm"
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

describe("ConfirmDialog Component", () => {
  it("renders when open", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Invoice")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Delete"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm clicked", async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Sure?"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("dialog-confirm"));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel clicked", async () => {
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />,
    );
    await user.click(screen.getByTestId("dialog-cancel"));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when loading", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />,
    );
    expect(screen.getByTestId("dialog-confirm")).toBeDisabled();
    expect(screen.getByTestId("dialog-cancel")).toBeDisabled();
    expect(screen.getByTestId("dialog-confirm")).toHaveTextContent("Processing...");
  });

  it("has alertdialog role", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Invoice"
        message="Sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Save"
        message="Save changes?"
        confirmLabel="Yes, Save"
        cancelLabel="No, Go Back"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Yes, Save")).toBeInTheDocument();
    expect(screen.getByText("No, Go Back")).toBeInTheDocument();
  });
});
