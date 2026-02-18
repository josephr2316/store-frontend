import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppModal from "./WhatsAppModal";

vi.mock("../api/client", () => ({
  whatsappApi: { message: vi.fn(() => Promise.resolve({ message: "Test", waLink: "https://wa.me/1" })) },
}));

describe("WhatsAppModal", () => {
  it("returns null when orderId is falsy", () => {
    const { container } = render(<WhatsAppModal orderId={null} onClose={() => {}} toast={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
  it("renders modal when orderId is set", () => {
    render(<WhatsAppModal orderId={1} onClose={() => {}} toast={() => {}} />);
    expect(screen.getByText("Plantilla WhatsApp")).toBeInTheDocument();
  });
});
