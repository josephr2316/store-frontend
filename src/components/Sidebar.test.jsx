import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Sidebar from "./Sidebar";

describe("Sidebar", () => {
  it("renders app title and nav tabs", () => {
    render(<Sidebar activeTab="Pedidos" onTabChange={() => {}} pendingCount={0} onLogout={() => {}} />);
    expect(screen.getByText("Tienda")).toBeInTheDocument();
    expect(screen.getByText("Sistema de Gestión")).toBeInTheDocument();
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("Caja")).toBeInTheDocument();
    expect(screen.getByText("Reportes")).toBeInTheDocument();
  });
  it("renders Estados de pedido section", () => {
    render(<Sidebar activeTab="Caja" onTabChange={() => {}} pendingCount={0} onLogout={() => {}} />);
    expect(screen.getAllByText("Estados de pedido").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pendiente")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Entregado")[0]).toBeInTheDocument();
  });
  it("shows pending count badge when pendingCount > 0", () => {
    render(<Sidebar activeTab="Pedidos" onTabChange={() => {}} pendingCount={3} onLogout={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
  it("calls onTabChange when tab clicked", () => {
    const onTabChange = vi.fn();
    const { container } = render(<Sidebar activeTab="Pedidos" onTabChange={onTabChange} pendingCount={0} onLogout={() => {}} />);
    const cajaBtn = within(container).getByRole("button", { name: /caja/i });
    fireEvent.click(cajaBtn);
    expect(onTabChange).toHaveBeenCalledWith("Caja");
  });
  it("calls onLogout when Cerrar sesión clicked", () => {
    const onLogout = vi.fn();
    const { container } = render(<Sidebar activeTab="Pedidos" onTabChange={() => {}} pendingCount={0} onLogout={onLogout} />);
    const logoutBtn = within(container).getByRole("button", { name: /cerrar sesión/i });
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
