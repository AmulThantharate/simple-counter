import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route } from "./health";

describe("Health Route", () => {
  it("renders health status information", () => {
    const HealthComponent = Route.options.component!;
    render(<HealthComponent />);
    
    expect(screen.getByText("Health Status")).toBeInTheDocument();
    expect(screen.getByText(/status/)).toBeInTheDocument();
    expect(screen.getByText(/"ok"/)).toBeInTheDocument();
  });
});
