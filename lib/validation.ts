/**
 * Validation utilities for security
 */

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates and sanitizes a UUID from route parameters
 * Throws an error if invalid
 */
export function validateUUID(uuid: string, fieldName: string = 'id'): string {
  if (!uuid || typeof uuid !== 'string') {
    throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
  }
  
  const trimmed = uuid.trim();
  if (!isValidUUID(trimmed)) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`);
  }
  
  return trimmed;
}

/**
 * Sanitizes string input to prevent injection
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Remove null bytes and trim
  let sanitized = input.replace(/\0/g, '').trim();
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

