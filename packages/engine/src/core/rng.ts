export type DeterministicRng = {
  seed: number;
};

const normalizeSeed = (seed: number) => seed >>> 0;

export const createDeterministicRng = (seed: number): DeterministicRng => ({
  seed: normalizeSeed(seed),
});

export const nextRandom = (
  rng: DeterministicRng,
): { rng: DeterministicRng; value: number } => {
  let state = normalizeSeed(rng.seed + 0x6d2b79f5);

  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);

  const value = ((state ^ (state >>> 14)) >>> 0) / 4294967296;

  return {
    rng: { seed: state >>> 0 },
    value,
  };
};

export const shuffleDeterministically = <T>(
  input: readonly T[],
  seed: number,
): { items: T[]; nextSeed: number } => {
  const items = [...input];
  let rng = createDeterministicRng(seed);

  for (let index = items.length - 1; index > 0; index -= 1) {
    const step = nextRandom(rng);
    rng = step.rng;

    const swapIndex = Math.floor(step.value * (index + 1));
    const current = items[index];
    items[index] = items[swapIndex] as T;
    items[swapIndex] = current as T;
  }

  return { items, nextSeed: rng.seed };
};
