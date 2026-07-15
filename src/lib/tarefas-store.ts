import { useSyncExternalStore } from "react";

type State = Record<string, boolean>;
const KEY = "tarefas.v1";

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
function emit() {
  listeners.forEach((l) => l());
}

export function taskKey(t: string, m: string, a: string, l: string) {
  return `${t}:${m}:${a}:${l}`;
}

export function toggleTask(k: string) {
  state = { ...state, [k]: !state[k] };
  persist();
  emit();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getSnapshot() {
  return state;
}
export function getServerSnapshot(): State {
  return {};
}

export function useTarefas() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}