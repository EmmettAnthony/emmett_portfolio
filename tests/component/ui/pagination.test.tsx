import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize = 10,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" data-testid="pagination">
      <div>
        <span data-testid="items-info">
          {startItem}-{endItem} of {totalItems}
        </span>
      </div>
      <div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          data-testid="prev-page"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            aria-current={page === currentPage ? "page" : undefined}
            aria-label={`Page ${page}`}
            data-testid={`page-${page}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          data-testid="next-page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}

describe("Pagination Component", () => {
  it("renders page numbers", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={30}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("page-1")).toBeInTheDocument();
    expect(screen.getByTestId("page-2")).toBeInTheDocument();
    expect(screen.getByTestId("page-3")).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={30}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("prev-page")).toBeDisabled();
    expect(screen.getByTestId("next-page")).not.toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={3}
        totalItems={30}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("next-page")).toBeDisabled();
    expect(screen.getByTestId("prev-page")).not.toBeDisabled();
  });

  it("calls onPageChange with correct page when clicking page numbers", async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={30}
        onPageChange={handlePageChange}
      />,
    );

    await user.click(screen.getByTestId("page-2"));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with next page when clicking next", async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={30}
        onPageChange={handlePageChange}
      />,
    );

    await user.click(screen.getByTestId("next-page"));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with previous page when clicking prev from page 2", async () => {
    const handlePageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        totalItems={30}
        onPageChange={handlePageChange}
      />,
    );

    await user.click(screen.getByTestId("prev-page"));
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it("shows correct item range info", () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} totalItems={25} onPageChange={vi.fn()} />,
    );
    expect(screen.getByTestId("items-info")).toHaveTextContent("1-10 of 25");

    rerender(
      <Pagination currentPage={3} totalPages={3} totalItems={25} onPageChange={vi.fn()} />,
    );
    expect(screen.getByTestId("items-info")).toHaveTextContent("21-25 of 25");
  });

  it("returns null when only one page", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={5} onPageChange={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid="pagination"]')).toBeNull();
  });

  it("sets aria-current on active page", () => {
    render(
      <Pagination currentPage={2} totalPages={5} totalItems={50} onPageChange={vi.fn()} />,
    );
    expect(screen.getByTestId("page-2")).toHaveAttribute("aria-current", "page");
  });

  it("has accessible label", () => {
    render(
      <Pagination currentPage={1} totalPages={3} totalItems={30} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Pagination")).toBeInTheDocument();
  });
});
