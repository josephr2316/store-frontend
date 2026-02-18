import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import LoginPage from "./LoginPage";
import { authApi } from "../api/client";

describe("LoginPage", () => {
  it("renders login form", () => {
    const { container } = render(<LoginPage onLogin={() => {}} />);
    expect(within(container).getByPlaceholderText("Nombre de usuario")).toBeInTheDocument();
    expect(within(container).getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(within(container).getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
  it("calls onLogin when submit", async () => {
    const onLogin = vi.fn();
    vi.spyOn(authApi, "login").mockResolvedValue({ token: "fake-token" });
    const { container } = render(<LoginPage onLogin={onLogin} />);
    const userInput = within(container).getAllByPlaceholderText("Nombre de usuario")[0];
    const passInput = within(container).getByPlaceholderText("••••••••");
    const submitBtn = within(container).getByRole("button", { name: /iniciar sesión/i });
    fireEvent.change(userInput, { target: { value: "admin" } });
    fireEvent.change(passInput, { target: { value: "pass" } });
    fireEvent.click(submitBtn);
    await waitFor(() => { expect(onLogin).toHaveBeenCalled(); });
    vi.restoreAllMocks();
  });
});
