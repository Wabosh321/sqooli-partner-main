/**
 * Utility functions for PII masking
 */

export const maskEmail = (email?: string): string => {
  if (!email) return "***REDACTED***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***REDACTED***";
  const localPart = parts[0];
  const masked =
    localPart.charAt(0) +
    "*".repeat(localPart.length - 2) +
    localPart.charAt(localPart.length - 1);
  return `${masked}@${parts[1]}`;
};

export const maskPhone = (phone?: string): string => {
  if (!phone) return "***REDACTED***";
  return (
    phone.slice(0, 3) +
    "*".repeat(Math.max(0, phone.length - 6)) +
    phone.slice(-3)
  );
};

export const maskCard = (card?: string): string => {
  if (!card) return "***REDACTED***";
  return "*".repeat(card.length - 4) + card.slice(-4);
};

export const maskSSN = (ssn?: string): string => {
  if (!ssn) return "***REDACTED***";
  return "***-**-" + ssn.slice(-4);
};

export const sanitizeAuthData = (data: any): any => {
  if (!data) return data;

  const sanitized = { ...data };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
};

export const sanitizeUserData = (data: any): any => {
  if (!data) return data;

  const sanitized = { ...data };

  if (sanitized.email) {
    sanitized.email = maskEmail(sanitized.email);
  }

  if (sanitized.phone) {
    sanitized.phone = maskPhone(sanitized.phone);
  }

  if (sanitized.password) {
    sanitized.password = "***REDACTED***";
  }

  return sanitized;
};
