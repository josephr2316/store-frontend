import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportesPage from "./ReportesPage";

vi.mock("../api/client", () => ({
  reportsApi: {
    weeklySales: vi.fn(() => Promise.resolve([])),
    topProducts: vi.fn(() => Promise.resolve([])),
  },
}));

const mockStore = {
  orders: [],
  balances: [],
  setError: () => {},
};

describe("ReportesPage", () => {
  it("renders Reportes title and sections", () => {
    render(<ReportesPage store={mockStore} />);
    expect(screen.getByText("Reportes")).toBeInTheDocument();
  });
  it("renders Ventas Semanales and Top Productos", () => {
    render(<ReportesPage store={mockStore} />);
    expect(screen.getAllByText("Ventas Semanales")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Top Productos")[0]).toBeInTheDocument();
  });
});
