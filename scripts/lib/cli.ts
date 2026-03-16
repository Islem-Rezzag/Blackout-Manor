export const parseCliArgs = (argv: string[]) => {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token?.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);

    if (!rawKey) {
      continue;
    }

    if (typeof inlineValue === "string") {
      args.set(rawKey, inlineValue);
      continue;
    }

    const nextToken = argv[index + 1];

    if (nextToken && !nextToken.startsWith("--")) {
      args.set(rawKey, nextToken);
      index += 1;
      continue;
    }

    args.set(rawKey, true);
  }

  return args;
};

export const getPositionalArgs = (argv: string[]) => {
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token) {
      continue;
    }

    if (token.startsWith("--")) {
      const [, inlineValue] = token.slice(2).split("=", 2);

      if (typeof inlineValue === "string") {
        continue;
      }

      const nextToken = argv[index + 1];

      if (nextToken && !nextToken.startsWith("--")) {
        index += 1;
      }

      continue;
    }

    positionals.push(token);
  }

  return positionals;
};

export const getStringArg = (
  args: Map<string, string | boolean>,
  key: string,
  fallback?: string,
) => {
  const value = args.get(key);

  if (typeof value === "string") {
    return value;
  }

  return fallback;
};

export const getNumberArg = (
  args: Map<string, string | boolean>,
  key: string,
  fallback?: number,
) => {
  const value = getStringArg(args, key);

  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getCsvNumberArg = (
  args: Map<string, string | boolean>,
  key: string,
) => {
  const value = getStringArg(args, key);

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry));
};
