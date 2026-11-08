import { describe, expect, it } from "vitest";
import {
	DEFAULT_SETTINGS,
	completeTimer,
	createTimer,
	normalizeState,
	pauseTimer,
	startTimer,
} from "./pomodoro";

describe("pomodoro timer", () => {
	it("uses an absolute deadline so pausing survives delayed ticks", () => {
		const running = startTimer(createTimer(DEFAULT_SETTINGS), 1_000);
		const paused = pauseTimer(running, 61_000);

		expect(paused.remainingMs).toBe(24 * 60_000);
		expect(paused.endsAt).toBeNull();
	});

	it("offers a long break after the configured number of focus sessions", () => {
		let state = createTimer(DEFAULT_SETTINGS);
		for (let session = 1; session <= 4; session += 1) {
			state = completeTimer(state, DEFAULT_SETTINGS, session * 1_000);
			expect(state.mode).toBe(session === 4 ? "longBreak" : "shortBreak");
			if (session < 4)
				state = completeTimer(state, DEFAULT_SETTINGS, session * 1_000 + 1);
		}
	});

	it("catches up after the page was suspended when auto-start is enabled", () => {
		const settings = {
			...DEFAULT_SETTINGS,
			focusMinutes: 1,
			shortBreakMinutes: 1,
			autoStartBreaks: true,
			autoStartFocus: true,
		};
		const running = startTimer(createTimer(settings), 0);
		const restored = normalizeState(running, settings, 130_000);

		expect(restored.mode).toBe("focus");
		expect(restored.completedFocusSessions).toBe(1);
		expect(restored.endsAt).toBe(180_000);
	});
});
