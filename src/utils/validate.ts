import type { Slot } from '../types';

/**
 * Asserts that value is a non-empty string.
 * Throws DeploygateError if validation fails.
 */
export function assertNonEmptyString(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a non-empty string, got: ${typeof value}`);
  }
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

/**
 * Asserts that value is a valid slot ('preview' or 'production').
 * Throws Error if validation fails.
 */
export function assertValidSlot(value: unknown): asserts value is Slot {
  if (value !== 'preview' && value !== 'production') {
    throw new Error(`slot must be 'preview' or 'production', got: ${value}`);
  }
}

/**
 * Asserts that value is a valid domain string.
 * Uses a basic regex to check domain format: starts with alphanumeric,
 * contains alphanumeric/dash/dot, and ends with valid TLD.
 * Throws Error if validation fails.
 */
export function assertValidDomain(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`domain must be a string, got: ${typeof value}`);
  }

  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(value)) {
    throw new Error(`Invalid domain format: ${value}`);
  }
}
