import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const invoiceFormSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  amount: z.coerce.number().positive("Amount must be positive").max(999999.99, "Amount too large"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().min(5, "Description must be at least 5 characters").max(500),
  notes: z.string().max(1000).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

function InvoiceForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (data: InvoiceFormData) => void;
  defaultValues?: Partial<InvoiceFormData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="invoice-form">
      <div>
        <label htmlFor="customerName">Customer Name</label>
        <input id="customerName" {...register("customerName")} data-testid="field-customerName" />
        {errors.customerName && <span role="alert" data-testid="error-customerName">{errors.customerName.message}</span>}
      </div>

      <div>
        <label htmlFor="customerEmail">Customer Email</label>
        <input id="customerEmail" type="email" {...register("customerEmail")} data-testid="field-customerEmail" />
        {errors.customerEmail && <span role="alert" data-testid="error-customerEmail">{errors.customerEmail.message}</span>}
      </div>

      <div>
        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" step="0.01" {...register("amount")} data-testid="field-amount" />
        {errors.amount && <span role="alert" data-testid="error-amount">{errors.amount.message}</span>}
      </div>

      <div>
        <label htmlFor="dueDate">Due Date</label>
        <input id="dueDate" type="date" {...register("dueDate")} data-testid="field-dueDate" />
        {errors.dueDate && <span role="alert" data-testid="error-dueDate">{errors.dueDate.message}</span>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" {...register("description")} data-testid="field-description" />
        {errors.description && <span role="alert" data-testid="error-description">{errors.description.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting} data-testid="form-submit">
        {isSubmitting ? "Creating..." : "Create Invoice"}
      </button>
    </form>
  );
}

describe("Invoice Form Validation", () => {
  it("renders all form fields", () => {
    render(<InvoiceForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId("field-customerName")).toBeInTheDocument();
    expect(screen.getByTestId("field-customerEmail")).toBeInTheDocument();
    expect(screen.getByTestId("field-amount")).toBeInTheDocument();
    expect(screen.getByTestId("field-dueDate")).toBeInTheDocument();
    expect(screen.getByTestId("field-description")).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    render(<InvoiceForm onSubmit={vi.fn()} />);
    fireEvent.submit(screen.getByTestId("invoice-form"));

    expect(await screen.findByTestId("error-customerName")).toBeInTheDocument();
    expect(await screen.findByTestId("error-customerEmail")).toBeInTheDocument();
    expect(await screen.findByTestId("error-amount")).toBeInTheDocument();
    expect(await screen.findByTestId("error-dueDate")).toBeInTheDocument();
    expect(await screen.findByTestId("error-description")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm onSubmit={vi.fn()} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "invalid-email");
    await user.type(screen.getByTestId("field-amount"), "100");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "Test description for invoice");
    fireEvent.submit(screen.getByTestId("invoice-form"));

    const error = await screen.findByTestId("error-customerEmail", {}, { timeout: 3000 });
    expect(error).toHaveTextContent(/invalid/i);
  });

  it("validates negative amount", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm onSubmit={vi.fn()} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "john@example.com");
    await user.type(screen.getByTestId("field-amount"), "-50");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "Test description for invoice");
    await user.click(screen.getByTestId("form-submit"));

    const error = await screen.findByTestId("error-amount", {}, { timeout: 3000 });
    expect(error).toHaveTextContent(/positive/i);
  });

  it("validates description minimum length", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm onSubmit={vi.fn()} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "john@example.com");
    await user.type(screen.getByTestId("field-amount"), "100");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "No");
    fireEvent.submit(screen.getByTestId("invoice-form"));

    const error = await screen.findByTestId("error-description", {}, { timeout: 3000 });
    expect(error).toHaveTextContent(/characters/i);
  });

  it("submits form with valid data", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InvoiceForm onSubmit={handleSubmit} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "john@example.com");
    await user.type(screen.getByTestId("field-amount"), "1500");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "Website development services for Q1 2024");
    await user.click(screen.getByTestId("form-submit"));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "John Doe",
        customerEmail: "john@example.com",
        amount: 1500,
        dueDate: "2024-12-31",
        description: "Website development services for Q1 2024",
      }),
      expect.anything(),
    );
  });

  it("pre-populates default values", () => {
    render(
      <InvoiceForm
        onSubmit={vi.fn()}
        defaultValues={{
          customerName: "Jane Smith",
          customerEmail: "jane@example.com",
          amount: 2500,
          dueDate: "2024-11-30",
          description: "Existing invoice description",
        }}
      />,
    );
    expect(screen.getByTestId("field-customerName")).toHaveValue("Jane Smith");
    expect(screen.getByTestId("field-customerEmail")).toHaveValue("jane@example.com");
  });

  it("validates amount upper bound", async () => {
    const user = userEvent.setup();
    render(<InvoiceForm onSubmit={vi.fn()} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "john@example.com");
    await user.type(screen.getByTestId("field-amount"), "9999999999");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "Test description here");
    await user.click(screen.getByTestId("form-submit"));

    expect(await screen.findByTestId("error-amount")).toHaveTextContent("Amount too large");
  });

  it("resets form after submission", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<InvoiceForm onSubmit={handleSubmit} />);

    await user.type(screen.getByTestId("field-customerName"), "John Doe");
    await user.type(screen.getByTestId("field-customerEmail"), "john@example.com");
    await user.type(screen.getByTestId("field-amount"), "100");
    await user.type(screen.getByTestId("field-dueDate"), "2024-12-31");
    await user.type(screen.getByTestId("field-description"), "Valid description for the invoice item");
    await user.click(screen.getByTestId("form-submit"));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
