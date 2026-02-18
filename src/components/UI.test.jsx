import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Badge, Modal, Toast, Input, Select, Btn, AlertBox } from "./UI";

describe("Badge", () => {
  it("renders label for PENDING", () => {
    render(<Badge state="PENDING" />);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });
  it("renders label for DELIVERED", () => {
    render(<Badge state="DELIVERED" />);
    expect(screen.getByText("Entregado")).toBeInTheDocument();
  });
  it("renders state when unknown", () => {
    render(<Badge state="UNKNOWN" />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});

describe("Modal", () => {
  it("returns null when open is false", () => {
    const { container } = render(<Modal open={false} onClose={() => {}} title="Test">Content</Modal>);
    expect(container.firstChild).toBeNull();
  });
  it("renders title and children when open", () => {
    render(<Modal open onClose={() => {}} title="Test Modal">Content here</Modal>);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Content here")).toBeInTheDocument();
  });
  it("has role dialog", () => {
    render(<Modal open onClose={() => {}} title="My Title">C</Modal>);
    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs.length).toBeGreaterThanOrEqual(1);
  });
  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Cerrar me">C</Modal>);
    const dialog = screen.getByRole("dialog", { name: "Cerrar me" });
    const closeBtn = within(dialog).getByRole("button", { name: "Cerrar" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Toast", () => {
  it("renders message", () => {
    render(<Toast msg="Hello" onDone={() => {}} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
  it("renders message in document", () => {
    render(<Toast msg="Ok" onDone={() => {}} />);
    expect(screen.getByText("Ok")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("renders with label", () => {
    render(<Input label="Name" value="" onChange={() => {}} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
  it("renders without label", () => {
    render(<Input value="x" onChange={() => {}} />);
    expect(screen.getByDisplayValue("x")).toBeInTheDocument();
  });
});

describe("Select", () => {
  it("renders with label and options", () => {
    render(
      <Select label="Channel" value="" onChange={() => {}}>
        <option value="a">A</option>
      </Select>
    );
    expect(screen.getByText("Channel")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});

describe("Btn", () => {
  it("renders children", () => {
    render(<Btn>Click me</Btn>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });
  it("calls onClick when clicked", () => {
    const fn = vi.fn();
    render(<Btn onClick={fn}>Ok</Btn>);
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("is disabled when disabled", () => {
    render(<Btn disabled>Submit</Btn>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});

describe("AlertBox", () => {
  it("renders children", () => {
    render(<AlertBox type="warning">Warning text</AlertBox>);
    expect(screen.getByText("Warning text")).toBeInTheDocument();
  });
  it("renders with type danger", () => {
    render(<AlertBox type="danger">Error</AlertBox>);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
