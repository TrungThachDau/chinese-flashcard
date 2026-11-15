import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "./FaqAccordion";

const faqs = [
  { question: "Question one", answer: "Answer one" },
  { question: "Question two", answer: "Answer two" },
];

describe("FaqAccordion", () => {
  it("shows the first answer by default", () => {
    render(<FaqAccordion faqs={faqs} />);

    expect(screen.getByText("Answer one")).toBeVisible();
    expect(screen.queryByText("Answer two")).not.toBeInTheDocument();
  });

  it("switches to another answer when its question is clicked", () => {
    render(<FaqAccordion faqs={faqs} />);

    fireEvent.click(screen.getByRole("button", { name: /Question two/ }));

    expect(screen.getByText("Answer two")).toBeVisible();
    expect(screen.queryByText("Answer one")).not.toBeInTheDocument();
  });

  it("closes the open answer when its question is clicked", () => {
    render(<FaqAccordion faqs={faqs} />);

    fireEvent.click(screen.getByRole("button", { name: /Question one/ }));

    expect(screen.queryByText("Answer one")).not.toBeInTheDocument();
  });
});