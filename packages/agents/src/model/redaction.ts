const SECRET_PATTERN = /\b(sk|sess)-[A-Za-z0-9_-]{12,}\b/g;

const redactStringValue = (value: string, secrets: readonly string[]) => {
  let redacted = value.replaceAll(SECRET_PATTERN, "[REDACTED_SECRET]");

  for (const secret of secrets) {
    if (!secret) {
      continue;
    }

    redacted = redacted.split(secret).join("[REDACTED_SECRET]");
  }

  return redacted;
};

export const redactSecrets = (
  value: unknown,
  secrets: readonly string[] = [],
): unknown => {
  if (typeof value === "string") {
    return redactStringValue(value, secrets);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry, secrets));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        redactSecrets(entry, secrets),
      ]),
    );
  }

  return value;
};
