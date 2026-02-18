import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportesPage from "./ReportesPage";

vi.mock("../api/client", () => ({
  reportsApi: {
    weeklySales: vi.fn(() => Promise.resolve([])),
    salesInRange: vi.fn(() => Promise.resolve({ from: "2025-02-18", to: "2026-02-18", totalAmount: 0, totalOrders: 0, byWeek: [] })),
    topProducts: vi.fn(() => Promise.resolve({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })),
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
  it("renders Ventas por semana and Top Productos", () => {
    render(<ReportesPage store={mockStore} />);
    expect(screen.getAllByText(/Ventas por semana/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Top Productos").length).toBeGreaterThan(0);
  });
});
