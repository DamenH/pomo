import { useEffect, useState } from "react";
import { ResetIcon, SettingsIcon, SkipIcon } from "./components/icons";
import { SettingsSheet } from "./components/SettingsSheet";
import { type Mode } from "./timer/pomodoro";
import { usePomodoro } from "./timer/usePomodoro";

const MODES: { id: Mode; label: string; shortLabel: string }[] = [
	{ id: "focus", label: "Focus", shortLabel: "Focus" },
	{ id: "shortBreak", label: "Short break", shortLabel: "Short" },
	{ id: "longBreak", label: "Long break", shortLabel: "Long" },
];

function formatTime(milliseconds: number) {
	const seconds = Math.ceil(milliseconds / 1_000);
	const minutes = Math.floor(seconds / 60);
	const minuteText = String(minutes).padStart(2, "0");
	const secondText = String(seconds % 60).padStart(2, "0");
	return { minuteText, secondText, label: `${minuteText}:${secondText}` };
}

export default function App() {
	const {
		timer,
		settings,
		remainingMs,
		progress,
		toggle,
		reset,
		skip,
		chooseMode,
		updateSettings,
	} = usePomodoro();
	const [settingsOpen, setSettingsOpen] = useState(false);
	const time = formatTime(remainingMs);
	const activeSession = timer.completedFocusSessions % settings.sessionsBeforeLongBreak;

	useEffect(() => {
		document.documentElement.dataset.theme = settings.theme;
	}, [settings.theme]);

	useEffect(() => {
		document.documentElement.dataset.mode = timer.mode;
		const mode = MODES.find(({ id }) => id === timer.mode)?.label ?? "Pomo";
		document.title = `${time.label} · ${timer.endsAt === null ? "Pomo" : mode}`;
	}, [time.label, timer.endsAt, timer.mode]);

	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (event.code !== "Space" || settingsOpen) return;
			const target = event.target as HTMLElement;
			if (["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(target.tagName))
				return;
			event.preventDefault();
			toggle();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [settingsOpen, toggle]);

	const circumference = 2 * Math.PI * 142;

	return (
		<div className="app-shell min-h-[100dvh] bg-(--bg) text-(--ink)">
			<header className="app-header mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pt-7">
				<h1 className="text-[15px] font-semibold tracking-[-0.01em]">Pomo</h1>
				<button
					className="icon-button -mr-2"
					type="button"
					aria-label="Open settings"
					onClick={() => setSettingsOpen(true)}
				>
					<SettingsIcon className="size-[21px]" />
				</button>
			</header>

			<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-8">
				<nav
					className="mode-nav mt-7 grid w-full max-w-[360px] grid-cols-3 gap-1 rounded-2xl bg-(--surface) p-1 shadow-[inset_0_0_0_1px_var(--hairline)] sm:mt-9"
					aria-label="Timer mode"
				>
					{MODES.map((mode) => (
						<button
							key={mode.id}
							className={`min-h-10 rounded-xl px-2 text-[13px] font-medium transition ${timer.mode === mode.id ? "bg-(--segment) text-(--ink) shadow-sm" : "text-(--muted) hover:text-(--ink)"}`}
							type="button"
							aria-current={timer.mode === mode.id ? "page" : undefined}
							disabled={timer.endsAt !== null}
							onClick={() => chooseMode(mode.id)}
						>
							<span className="hidden min-[390px]:inline">
								{mode.label}
							</span>
							<span className="min-[390px]:hidden">{mode.shortLabel}</span>
						</button>
					))}
				</nav>

				<section
					className="timer-section flex flex-1 flex-col items-center justify-center py-6"
					aria-label="Timer"
				>
					<div className="timer-ring relative grid size-[min(78vw,340px)] place-items-center sm:size-[360px]">
						<svg
							className="absolute inset-0 size-full -rotate-90"
							viewBox="0 0 304 304"
							aria-hidden="true"
						>
							<circle
								className="text-(--ring-track)"
								cx="152"
								cy="152"
								r="142"
								fill="none"
								stroke="currentColor"
								strokeWidth="8"
							/>
							<circle
								className="text-(--accent) transition-[stroke-dashoffset] duration-300 ease-linear"
								cx="152"
								cy="152"
								r="142"
								fill="none"
								stroke="currentColor"
								strokeWidth="8"
								strokeLinecap="round"
								strokeDasharray={circumference}
								strokeDashoffset={
									circumference *
									(1 - Math.max(0, Math.min(1, progress)))
								}
							/>
						</svg>
						<div className="relative text-center">
							<div
								className="flex items-center justify-center text-[clamp(4rem,19vw,6.6rem)] font-[520] leading-none tabular-nums"
								aria-label={time.label}
								aria-live="off"
							>
								<span className="tracking-[-0.065em]">
									{time.minuteText}
								</span>
								<span
									className="px-[5px] tracking-normal"
									aria-hidden="true"
								>
									:
								</span>
								<span className="tracking-[-0.065em] opacity-60">
									{time.secondText}
								</span>
							</div>
							<div
								className="mt-4 flex items-center justify-center gap-2"
								aria-label={`${activeSession} of ${settings.sessionsBeforeLongBreak} focus sessions complete`}
							>
								{Array.from(
									{ length: settings.sessionsBeforeLongBreak },
									(_, index) => (
										<span
											key={index}
											className={`size-1.5 rounded-full transition ${index < activeSession ? "bg-(--accent)" : "bg-(--dot)"}`}
										/>
									),
								)}
							</div>
						</div>
					</div>

					<button
						className="primary-button mt-8 min-h-14 min-w-40 rounded-2xl bg-(--accent) px-8 text-[17px] font-semibold text-white shadow-[0_12px_35px_color-mix(in_srgb,var(--accent)_27%,transparent)] transition hover:brightness-105 active:scale-[0.97]"
						type="button"
						onClick={toggle}
					>
						{timer.endsAt === null ? "Start" : "Pause"}
					</button>

					<div className="secondary-actions mt-5 flex items-center gap-3">
						<button
							className="icon-button"
							type="button"
							aria-label="Reset timer"
							title="Reset"
							onClick={reset}
						>
							<ResetIcon className="size-5" />
						</button>
						<button
							className="icon-button"
							type="button"
							aria-label="Skip timer"
							title="Skip"
							onClick={skip}
						>
							<SkipIcon className="size-5" />
						</button>
					</div>
				</section>
			</main>

			<SettingsSheet
				open={settingsOpen}
				settings={settings}
				onClose={() => setSettingsOpen(false)}
				onSave={updateSettings}
			/>
		</div>
	);
}
