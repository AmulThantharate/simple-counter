import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  defaultPersistedCounterState,
  STORAGE_KEY,
  type PersistedCounterState,
} from "@/lib/counter-state";
import { loadCounterState, saveCounterState } from "@/lib/counter-store";

type CounterState = {
  value: PersistedCounterState["value"];
  step: PersistedCounterState["step"];
  preventNegative: PersistedCounterState["preventNegative"];
  soundEnabled: PersistedCounterState["soundEnabled"];
  reducedMotion: PersistedCounterState["reducedMotion"];
  history: number[]; // past values (for undo)
  future: number[]; // values popped by undo (for redo)
};

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset" }
  | { type: "set"; value: number }
  | { type: "setStep"; step: number }
  | { type: "togglePreventNegative" }
  | { type: "toggleSound" }
  | { type: "toggleReducedMotion" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "hydrate"; state: Partial<PersistedCounterState> };

const MAX_HISTORY = 50;

const initialState: CounterState = {
  ...defaultPersistedCounterState,
  history: [],
  future: [],
};

function pushHistory(history: number[], value: number) {
  const next = [...history, value];
  if (next.length > MAX_HISTORY) next.shift();
  return next;
}

function reducer(state: CounterState, action: Action): CounterState {
  switch (action.type) {
    case "increment": {
      const next = state.value + state.step;
      return {
        ...state,
        value: next,
        history: pushHistory(state.history, state.value),
        future: [],
      };
    }
    case "decrement": {
      let next = state.value - state.step;
      if (state.preventNegative && next < 0) next = 0;
      if (next === state.value) return state;
      return {
        ...state,
        value: next,
        history: pushHistory(state.history, state.value),
        future: [],
      };
    }
    case "reset": {
      if (state.value === 0) return state;
      return {
        ...state,
        value: 0,
        history: pushHistory(state.history, state.value),
        future: [],
      };
    }
    case "set": {
      if (action.value === state.value) return state;
      return {
        ...state,
        value: action.value,
        history: pushHistory(state.history, state.value),
        future: [],
      };
    }
    case "setStep":
      return { ...state, step: Math.max(1, action.step) };
    case "togglePreventNegative": {
      const preventNegative = !state.preventNegative;
      const value = preventNegative && state.value < 0 ? 0 : state.value;
      return { ...state, preventNegative, value };
    }
    case "toggleSound":
      return { ...state, soundEnabled: !state.soundEnabled };
    case "toggleReducedMotion":
      return { ...state, reducedMotion: !state.reducedMotion };
    case "undo": {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        value: prev,
        history: state.history.slice(0, -1),
        future: [state.value, ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        ...state,
        value: next,
        history: pushHistory(state.history, state.value),
        future: rest,
      };
    }
    case "hydrate":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

function playClick(volume = 0.05) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 880;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // ignore
  }
}

export function useCounter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const redisState = await loadCounterState();

        if (!cancelled && redisState.state) {
          dispatch({ type: "hydrate", state: redisState.state });
          hydrated.current = true;
          return;
        }
      } catch {
        // ignore and fall back to localStorage
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          dispatch({ type: "hydrate", state: JSON.parse(raw) as Partial<PersistedCounterState> });
        }
      } catch {
        // ignore
      }

      if (!cancelled) {
        hydrated.current = true;
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;

    const persistedState: PersistedCounterState = {
      value: state.value,
      step: state.step,
      preventNegative: state.preventNegative,
      soundEnabled: state.soundEnabled,
      reducedMotion: state.reducedMotion,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch {
      // ignore
    }

    void saveCounterState({ data: persistedState }).catch(() => {
      // ignore so the UI remains usable when Redis is unavailable
    });
  }, [state.value, state.step, state.preventNegative, state.soundEnabled, state.reducedMotion]);

  const withSound = useCallback(
    (action: Action) => {
      dispatch(action);
      if (state.soundEnabled) playClick();
    },
    [state.soundEnabled],
  );

  const increment = useCallback(() => withSound({ type: "increment" }), [withSound]);
  const decrement = useCallback(() => withSound({ type: "decrement" }), [withSound]);
  const reset = useCallback(() => withSound({ type: "reset" }), [withSound]);
  const setStep = useCallback((step: number) => dispatch({ type: "setStep", step }), []);
  const togglePreventNegative = useCallback(() => dispatch({ type: "togglePreventNegative" }), []);
  const toggleSound = useCallback(() => dispatch({ type: "toggleSound" }), []);
  const toggleReducedMotion = useCallback(() => dispatch({ type: "toggleReducedMotion" }), []);
  const undo = useCallback(() => withSound({ type: "undo" }), [withSound]);
  const redo = useCallback(() => withSound({ type: "redo" }), [withSound]);

  return {
    ...state,
    canUndo: state.history.length > 0,
    canRedo: state.future.length > 0,
    increment,
    decrement,
    reset,
    setStep,
    togglePreventNegative,
    toggleSound,
    toggleReducedMotion,
    undo,
    redo,
  };
}
