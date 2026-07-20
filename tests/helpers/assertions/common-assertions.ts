import { expect } from "vitest";

export function assertLoadingState(container: HTMLElement) {
  expect(container.querySelector('[role="status"]')).toBeTruthy();
}

export function assertEmptyState(container: HTMLElement) {
  expect(container.querySelector('[data-testid="empty-state"]')).toBeTruthy();
}

export function assertErrorState(container: HTMLElement) {
  expect(container.querySelector('[data-testid="error-state"]')).toBeTruthy();
}

export function assertSuccessState(container: HTMLElement) {
  expect(container.querySelector('[data-testid="success-state"]')).toBeTruthy();
}

export function assertAriaLabel(element: HTMLElement, label: string) {
  expect(element).toHaveAttribute("aria-label", label);
}

export function assertDisabled(element: HTMLElement) {
  expect(element).toBeDisabled();
}

export function assertEnabled(element: HTMLElement) {
  expect(element).not.toBeDisabled();
}

export function assertVisible(element: HTMLElement) {
  expect(element).toBeVisible();
}

export function assertHidden(element: HTMLElement) {
  expect(element).not.toBeVisible();
}

export function assertHasFocus(element: HTMLElement) {
  expect(element).toHaveFocus();
}

export function assertRequired(element: HTMLElement) {
  expect(element).toHaveAttribute("required");
}

export function assertHasClass(element: HTMLElement, className: string) {
  expect(element).toHaveClass(className);
}

export function assertTextContent(element: HTMLElement, text: string) {
  expect(element).toHaveTextContent(text);
}

export function assertValue(element: HTMLElement, value: string) {
  expect(element).toHaveValue(value);
}
