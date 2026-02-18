import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderHistoryModal from "./OrderHistoryModal";

vi.mock("../api/client", () => ({
  ordersApi: { history: vi.fn(() => Promise.resolve([])) },
}));

describe("OrderHistoryModal", () => {
  it("returns null when orderId is falsy", () => {
    const { container } = render(<OrderHistoryModal orderId={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
  it("renders modal when orderId is set", () => {
    render(<OrderHistoryModal orderId={1} onClose={() => {}} />);
    expect(screen.getByText("Historial del Pedido")).toBeInTheDocument();
  });
});
