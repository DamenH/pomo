import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	DEFAULT_SETTINGS,
	completeTimer,
	createTimer,
	durationMs,
	normalizeState,
	pauseTimer,
	remainingAt,
	resetTimer,
	selectMode,
	skipTimer,
	startTimer,
	type Mode,
	type Settings,
	type TimerState,
} from "./pomodoro";

const STORAGE_KEY = "pomo:state:v1";

interface StoredState {
	settings: Settings;
	timer: TimerState;
}

function loadStoredState(): StoredState {
	try {
		const parsed = JSON.parse(
			localStorage.getItem(STORAGE_KEY) ?? "null",
		) as Partial<StoredState> | null;
		const settings = { ...DEFAULT_SETTINGS, ...parsed?.settings };
		const timer = parsed?.timer
			? normalizeState(parsed.timer, settings, Date.now())
			: createTimer(settings);
		return { settings, timer };
	} catch {
		return { settings: DEFAULT_SETTINGS, timer: createTimer(DEFAULT_SETTINGS) };
	}
}

function playChime() {
	const AudioContextClass = window.AudioContext;
	const context = new AudioContextClass();
	const gain = context.createGain();
	gain.gain.setValueAtTime(0.0001, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
	gain.connect(context.destination);
	[0, 0.16].forEach((offset, index) => {
		const oscillator = context.createOscillator();
		oscillator.type = "sine";
		oscillator.frequency.value = index === 0 ? 659.25 : 783.99;
		oscillator.connect(gain);
		oscillator.start(context.currentTime + offset);
		oscillator.stop(context.currentTime + offset + 0.7);
	});
	window.setTimeout(() => void context.close(), 1_200);
}

function modeLabel(mode: Mode) {
	return { focus: "Focus", shortBreak: "Short break", longBreak: "Long break" }[mode];
}

export function usePomodoro() {
	const initial = useMemo(loadStoredState, []);
	const [settings, setSettingsState] = useState(initial.settings);
	const [timer, setTimer] = useState(initial.timer);
	const [now, setNow] = useState(Date.now());
	const timerRef = useRef(timer);
	const settingsRef = useRef(settings);

	useEffect(() => {
		timerRef.current = timer;
		settingsRef.current = settings;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, timer }));
	}, [settings, timer]);

	const finish = useCallback((completed: TimerState, at: number) => {
		const currentSettings = settingsRef.current;
		const next = completeTimer(completed, currentSettings, at);
		if (currentSettings.sound) playChime();
		if (currentSettings.notifications && Notification.permission === "granted") {
			new Notification(`${modeLabel(next.mode)} is ready`, {
				body: next.mode === "focus" ? "Time to focus." : "Take a breath.",
				icon: "./icon-192.png",
			});
		}
		setTimer(next);
	}, []);

	useEffect(() => {
		if (timer.endsAt === null) return;
		const tick = () => {
			const current = Date.now();
			setNow(current);
			const active = timerRef.current;
			if (active.endsAt !== null && active.endsAt <= current)
				finish(active, active.endsAt);
		};
		const interval = window.setInterval(tick, 250);
		tick();
		return () => window.clearInterval(interval);
	}, [finish, timer.endsAt]);

	useEffect(() => {
		const sync = () => {
			const current = Date.now();
			setNow(current);
			const active = timerRef.current;
			if (active.endsAt !== null && active.endsAt <= current)
				finish(active, active.endsAt);
		};
		document.addEventListener("visibilitychange", sync);
		window.addEventListener("focus", sync);
		return () => {
			document.removeEventListener("visibilitychange", sync);
			window.removeEventListener("focus", sync);
		};
	}, [finish]);

	const toggle = useCallback(() => {
		const current = Date.now();
		setNow(current);
		setTimer((state) =>
			state.endsAt === null
				? startTimer(state, current)
				: pauseTimer(state, current),
		);
	}, []);

	const reset = useCallback(() => {
		setTimer((state) => resetTimer(state, settingsRef.current));
	}, []);

	const skip = useCallback(() => {
		setTimer((state) => skipTimer(state, settingsRef.current, Date.now()));
	}, []);

	const chooseMode = useCallback((mode: Mode) => {
		setTimer((state) => selectMode(state, mode, settingsRef.current));
	}, []);

	const updateSettings = useCallback((next: Settings) => {
		setSettingsState(next);
		setTimer((state) =>
			state.endsAt === null
				? { ...state, remainingMs: durationMs(state.mode, next) }
				: state,
		);
	}, []);

	const remainingMs = remainingAt(timer, now);
	const totalMs = durationMs(timer.mode, settings);

	return {
		timer,
		settings,
		remainingMs,
		progress: 1 - remainingMs / totalMs,
		toggle,
		reset,
		skip,
		chooseMode,
		updateSettings,
	};
}
