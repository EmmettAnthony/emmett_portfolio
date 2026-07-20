import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import {
  FieldWrapper,
  FormInput,
  FormSelect,
  FormTextarea,
  FormFileUpload,
} from "../FormFields";

// Mock framer-motion
vi.mock("framer-motion")
;

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("FieldWrapper", () => {
  it("renders label and children", () => {
    render(
      <FieldWrapper label="Full Name">
        <input data-testid="child-input" />
      </FieldWrapper>,
    );
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByTestId("child-input")).toBeInTheDocument();
  });

  it("shows required asterisk when required is true", () => {
    render(
      <FieldWrapper label="Email" required>
        <input />
      </FieldWrapper>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show asterisk when required is false", () => {
    render(
      <FieldWrapper label="Phone">
        <input />
      </FieldWrapper>,
    );
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows error message with alert role", () => {
    render(
      <FieldWrapper label="Name" error="Name is required">
        <input />
      </FieldWrapper>,
    );
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("does not render error when no error provided", () => {
    const { container } = render(
      <FieldWrapper label="Name">
        <input />
      </FieldWrapper>,
    );
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <FieldWrapper label="Name" className="custom-class">
        <input />
      </FieldWrapper>,
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});

describe("FormInput", () => {
  it("renders input element", () => {
    render(<FormInput data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
  });

  it("passes placeholder prop", () => {
    render(<FormInput placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<FormInput ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("applies error styling", () => {
    const { container } = render(<FormInput error="Error" />);
    const input = container.querySelector("input");
    expect(input?.className).toContain("border-red-500");
  });

  it("does not apply error styling without error", () => {
    const { container } = render(<FormInput />);
    const input = container.querySelector("input");
    expect(input?.className).not.toContain("border-red-500");
  });

  it("passes additional className", () => {
    const { container } = render(<FormInput className="extra-class" />);
    const input = container.querySelector("input");
    expect(input?.className).toContain("extra-class");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<FormInput onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("FormSelect", () => {
  const options = [
    { value: "web", label: "Web Development" },
    { value: "mobile", label: "Mobile App" },
  ] as const;

  it("renders select element with options", () => {
    render(<FormSelect options={options} data-testid="test-select" />);
    expect(screen.getByTestId("test-select")).toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
  });

  it("renders placeholder as first option", () => {
    render(<FormSelect options={options} placeholder="Choose..." />);
    const select = screen.getByRole("combobox");
    expect(select.querySelector('option[value=""]')).toBeTruthy();
    // The disabled option containing placeholder text
    const firstOption = select.querySelector('option[value=""]');
    expect(firstOption).toHaveTextContent("Choose...");
  });

  it("uses default placeholder", () => {
    render(<FormSelect options={options} />);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("applies error styling", () => {
    const { container } = render(<FormSelect options={options} error="Error" />);
    const select = container.querySelector("select");
    expect(select?.className).toContain("border-red-500");
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<FormSelect ref={ref} options={options} />);
    expect(ref).toHaveBeenCalled();
  });
});

describe("FormTextarea", () => {
  it("renders textarea element", () => {
    render(<FormTextarea data-testid="test-textarea" />);
    expect(screen.getByTestId("test-textarea")).toBeInTheDocument();
  });

  it("passes placeholder prop", () => {
    render(<FormTextarea placeholder="Describe your project" />);
    expect(screen.getByPlaceholderText("Describe your project")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<FormTextarea ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("applies error styling", () => {
    const { container } = render(<FormTextarea error="Error" />);
    const textarea = container.querySelector("textarea");
    expect(textarea?.className).toContain("border-red-500");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<FormTextarea onChange={handleChange} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "test message" } });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe("FormFileUpload", () => {
  it("renders upload area when no file selected", () => {
    render(
      <IntlWrapper>
        <FormFileUpload value={null} onChange={() => {}} />
      </IntlWrapper>,
    );
    expect(screen.getByText(/drop a file or click/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, PNG, JPG up to 10MB/i)).toBeInTheDocument();
  });

  it("shows file info when file is selected", () => {
    const file = new File(["test"], "report.pdf", { type: "application/pdf" });
    render(
      <IntlWrapper>
        <FormFileUpload value={file} onChange={() => {}} />
      </IntlWrapper>,
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText(/click to replace/i)).toBeInTheDocument();
  });

  it("renders file input with accept attribute", () => {
    render(
      <IntlWrapper>
        <FormFileUpload value={null} onChange={() => {}} accept=".pdf,.docx" />
      </IntlWrapper>,
    );
    const fileInput = screen.getByLabelText(/attach/i) as HTMLInputElement;
    expect(fileInput.type).toBe("file");
    expect(fileInput.accept).toBe(".pdf,.docx");
  });

  it("calls onChange when file is selected", () => {
    const handleChange = vi.fn();
    render(
      <IntlWrapper>
        <FormFileUpload value={null} onChange={handleChange} />
      </IntlWrapper>,
    );
    const file = new File(["test"], "doc.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/attach/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalledWith(file);
  });

  it("shows error message with alert role", () => {
    render(
      <IntlWrapper>
        <FormFileUpload value={null} onChange={() => {}} error="File too large" />
      </IntlWrapper>,
    );
    expect(screen.getByText("File too large")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("File too large");
  });

  it("applies error styling when error is present", () => {
    const { container } = render(
      <IntlWrapper>
        <FormFileUpload value={null} onChange={() => {}} error="Error" />
      </IntlWrapper>,
    );
    const uploadArea = container.querySelector(".border-red-500");
    expect(uploadArea).toBeInTheDocument();
  });

  it("applies success styling when file is selected", () => {
    const file = new File(["test"], "doc.pdf", { type: "application/pdf" });
    const { container } = render(
      <IntlWrapper>
        <FormFileUpload value={file} onChange={() => {}} />
      </IntlWrapper>,
    );
    const uploadArea = container.querySelector(".border-green-500");
    expect(uploadArea).toBeInTheDocument();
  });
});
