let enabled = true;
const listeners = new Set<(enabled: boolean) => void>();

export const setManorSoundEnabled = (value: boolean) => {
  enabled = value;
  for (const listener of listeners) listener(enabled);
};

export const subscribeManorSoundEnabled = (
  listener: (enabled: boolean) => void,
) => {
  listeners.add(listener);
  listener(enabled);
  return () => {
    listeners.delete(listener);
  };
};
