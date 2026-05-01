export type PersistedCounterState = {
  value: number;
  step: number;
  preventNegative: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
};

export const STORAGE_KEY = "counter-app:state:v1";
export const COUNTER_REDIS_KEY = "counter-app:state:v1";

export const defaultPersistedCounterState: PersistedCounterState = {
  value: 0,
  step: 1,
  preventNegative: false,
  soundEnabled: false,
  reducedMotion: false,
};
