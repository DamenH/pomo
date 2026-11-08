export type Mode = "focus" | "shortBreak" | "longBreak";

export interface Settings {
	focusMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
	sessionsBeforeLongBreak: number;
	autoStartBreaks: boolean;
	autoStartFocus: boolean;
	sound: boolean;
	notifications: boolean;
	theme: "system" | "light" | "dark";
}

export interface TimerState {
	mode: Mode;
	remainingMs: number;
	endsAt: number | null;
	completedFocusSessions: number;
}

export const DEFAULT_SETTINGS: Settings = {
	focusMinutes: 25,
	shortBreakMinutes: 5,
	longBreakMinutes: 15,
	sessionsBeforeLongBreak: 4,
	autoStartBreaks: false,
	autoStartFocus: false,
	sound: true,
	notifications: false,
	theme: "system",
};

export function durationMs(mode: Mode, settings: Settings): number {
	const minutes = {
		focus: settings.focusMinutes,
		shortBreak: settings.shortBreakMinutes,
		longBreak: settings.longBreakMinutes,
	}[mode];
	return minutes * 60_000;
}

export function createTimer(settings: Settings, mode: Mode = "focus"): TimerState {
	return {
		mode,
		remainingMs: durationMs(mode, settings),
		endsAt: null,
		completedFocusSessions: 0,
	};
}

export function startTimer(state: TimerState, now: number): TimerState {
	if (state.endsAt !== null) return state;
	return { ...state, endsAt: now + state.remainingMs };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
	if (state.endsAt === null) return state;
	return { ...state, remainingMs: Math.max(0, state.endsAt - now), endsAt: null };
}

export function resetTimer(state: TimerState, settings: Settings): TimerState {
	return { ...state, remainingMs: durationMs(state.mode, settings), endsAt: null };
}

export function selectMode(
	state: TimerState,
	mode: Mode,
	settings: Settings,
): TimerState {
	if (state.endsAt !== null) return state;
	return { ...state, mode, remainingMs: durationMs(mode, settings), endsAt: null };
}

export function completeTimer(
	state: TimerState,
	settings: Settings,
	now: number,
): TimerState {
	const completedFocusSessions =
		state.completedFocusSessions + (state.mode === "focus" ? 1 : 0);
	const mode: Mode =
		state.mode === "focus"
			? completedFocusSessions % settings.sessionsBeforeLongBreak === 0
				? "longBreak"
				: "shortBreak"
			: "focus";
	const shouldStart =
		mode === "focus" ? settings.autoStartFocus : settings.autoStartBreaks;
	const remainingMs = durationMs(mode, settings);

	return {
		mode,
		remainingMs,
		endsAt: shouldStart ? now + remainingMs : null,
		completedFocusSessions,
	};
}

export function skipTimer(
	state: TimerState,
	settings: Settings,
	now: number,
): TimerState {
	return completeTimer({ ...state, endsAt: now }, settings, now);
}

export function remainingAt(state: TimerState, now: number): number {
	return state.endsAt === null ? state.remainingMs : Math.max(0, state.endsAt - now);
}

export function normalizeState(
	state: TimerState,
	settings: Settings,
	now: number,
): TimerState {
	let next = state;
	let transitions = 0;
	while (next.endsAt !== null && next.endsAt <= now && transitions < 100) {
		next = completeTimer(next, settings, next.endsAt);
		transitions += 1;
	}
	return next.endsAt === null ? next : { ...next, remainingMs: remainingAt(next, now) };
}
