import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string, direction: "asc" | "desc") => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  pageSize?: number;
}

function Table<T extends { id: string | number }>({
  data,
  columns,
  onSort,
  onRowClick,
  emptyMessage = "No data",
  loading = false,
}: TableProps<T>) {
  if (loading) {
    return <div data-testid="loading-state">Loading...</div>;
  }

  if (data.length === 0) {
    return <div data-testid="empty-state">{emptyMessage}</div>;
  }

  return (
    <div role="region" aria-label="Data table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => onSort?.(col.key, "asc") : undefined}
                aria-sort={col.sortable ? "none" : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              style={{ cursor: onRowClick ? "pointer" : undefined }}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : String(item[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: string;
}

const columns: Column<TestItem>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  {
    key: "status",
    header: "Status",
    render: (item) => <span data-testid={`status-${item.id}`}>{item.status}</span>,
  },
];

const testData: TestItem[] = [
  { id: "1", name: "Alice", email: "alice@example.com", status: "Active" },
  { id: "2", name: "Bob", email: "bob@example.com", status: "Inactive" },
];

describe("Table Component", () => {
  it("renders table headers", () => {
    render(<Table data={testData} columns={columns} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<Table data={testData} columns={columns} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("renders custom cell renderers", () => {
    render(<Table data={testData} columns={columns} />);
    expect(screen.getByTestId("status-1")).toHaveTextContent("Active");
  });

  it("shows empty state when no data", () => {
    render(<Table data={[]} columns={columns} emptyMessage="No records found" />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No records found");
  });

  it("shows loading state", () => {
    render(<Table data={[]} columns={columns} loading />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  it("calls onSort when sortable header clicked", async () => {
    const handleSort = vi.fn();
    const user = userEvent.setup();
    render(<Table data={testData} columns={columns} onSort={handleSort} />);
    await user.click(screen.getByText("Name"));
    expect(handleSort).toHaveBeenCalledWith("name", "asc");
  });

  it("calls onRowClick when row clicked", async () => {
    const handleRowClick = vi.fn();
    const user = userEvent.setup();
    render(<Table data={testData} columns={columns} onRowClick={handleRowClick} />);
    await user.click(screen.getByText("Alice"));
    expect(handleRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: "1", name: "Alice" }));
  });

  it("has accessible region", () => {
    render(<Table data={testData} columns={columns} />);
    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "Data table");
  });
});
