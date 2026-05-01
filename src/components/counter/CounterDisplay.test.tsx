// @bun-test-env jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CounterDisplay } from "./CounterDisplay";

// Mock MilestoneCelebration since it might have animations/effects we don't need to test here
vi.mock("./MilestoneCelebration", () => ({
  MilestoneCelebration: () => <div data-testid="milestone-celebration" />,
}));

describe("CounterDisplay", () => {
  it("renders the correct value", () => {
    render(<CounterDisplay value={42} />);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders correctly with reducedMotion", () => {
    render(<CounterDisplay value={123} reducedMotion={true} />);
    expect(screen.getByText("123")).toBeInTheDocument();
  });

  it("has the correct accessibility label", () => {
    render(<CounterDisplay value={5} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Counter value 5");
  });
});
