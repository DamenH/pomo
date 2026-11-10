import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Settings } from "../timer/pomodoro";
import { CloseIcon } from "./icons";

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface SettingsSheetProps {
	open: boolean;
	settings: Settings;
	onClose(): void;
	onSave(settings: Settings): void;
}

function NumberField({
	label,
	value,
	min,
	max,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	onChange(value: number): void;
}) {
	return (
		<label className="flex items-center justify-between gap-4 py-2.5">
			<span className="text-[15px] text-(--ink)">{label}</span>
			<span className="flex items-center gap-2">
				<input
					className="w-16 rounded-xl border border-(--line) bg-(--field) px-2.5 py-1.5 text-right font-medium tabular-nums outline-none focus:border-(--accent)"
					type="number"
					inputMode="numeric"
					min={min}
					max={max}
					value={value}
					onChange={(event) => onChange(Number(event.target.value))}
				/>
				<span className="w-8 text-xs text-(--muted)">min</span>
			</span>
		</label>
	);
}

function Switch({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange(checked: boolean): void;
}) {
	return (
		<label className="flex min-h-11 items-center justify-between gap-4 py-2">
			<span className="text-[15px] text-(--ink)">{label}</span>
			<input
				className="switch"
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
			/>
		</label>
	);
}

export function SettingsSheet({ open, settings, onClose, onSave }: SettingsSheetProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [draft, setDraft] = useState(settings);
	const [copyStatus, setCopyStatus] = useState("");

	useEffect(() => {
		if (!copyStatus) return;
		const timeout = window.setTimeout(() => setCopyStatus(""), 2000);
		return () => window.clearTimeout(timeout);
	}, [copyStatus]);
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
		null,
	);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			setDraft(settings);
			dialog.showModal();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	}, [open, settings]);

	useEffect(() => {
		if (!open) return;
		const viewport = window.visualViewport;
		const updateViewport = () => {
			const dialog = dialogRef.current;
			if (!dialog) return;
			dialog.style.setProperty(
				"--settings-viewport-height",
				`${viewport?.height ?? window.innerHeight}px`,
			);
			dialog.style.setProperty(
				"--settings-viewport-top",
				`${viewport?.offsetTop ?? 0}px`,
			);
		};
		updateViewport();
		window.addEventListener("resize", updateViewport);
		viewport?.addEventListener("resize", updateViewport);
		viewport?.addEventListener("scroll", updateViewport);
		return () => {
			window.removeEventListener("resize", updateViewport);
			viewport?.removeEventListener("resize", updateViewport);
			viewport?.removeEventListener("scroll", updateViewport);
		};
	}, [open]);

	useEffect(() => {
		const capture = (event: Event) => {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		};
		window.addEventListener("beforeinstallprompt", capture);
		return () => window.removeEventListener("beforeinstallprompt", capture);
	}, []);

	async function submit(event: FormEvent) {
		event.preventDefault();
		const next = {
			...draft,
			focusMinutes: Math.min(120, Math.max(1, draft.focusMinutes)),
			shortBreakMinutes: Math.min(60, Math.max(1, draft.shortBreakMinutes)),
			longBreakMinutes: Math.min(90, Math.max(1, draft.longBreakMinutes)),
			sessionsBeforeLongBreak: Math.min(
				8,
				Math.max(2, draft.sessionsBeforeLongBreak),
			),
		};
		if (next.notifications && Notification.permission === "default") {
			const permission = await Notification.requestPermission();
			next.notifications = permission === "granted";
		}
		onSave(next);
		onClose();
	}

	return (
		<dialog
			ref={dialogRef}
			className="settings-sheet m-0 w-full max-w-none overflow-hidden rounded-t-[28px] border-0 bg-(--panel) p-0 text-(--ink) shadow-2xl sm:max-w-[430px] sm:rounded-[28px]"
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onClose={onClose}
		>
			<form className="flex h-full min-h-0 flex-col" onSubmit={submit}>
				<header className="flex shrink-0 items-center justify-between border-b border-(--hairline) px-5 py-4">
					<h2 className="text-base font-semibold">Settings</h2>
					<button
						className="icon-button -mr-2"
						type="button"
						aria-label="Close settings"
						onClick={onClose}
					>
						<CloseIcon className="size-5" />
					</button>
				</header>

				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
					<section aria-labelledby="timers-heading">
						<h3 id="timers-heading" className="section-label">
							Timers
						</h3>
						<NumberField
							label="Focus"
							value={draft.focusMinutes}
							min={1}
							max={120}
							onChange={(focusMinutes) =>
								setDraft({ ...draft, focusMinutes })
							}
						/>
						<NumberField
							label="Short break"
							value={draft.shortBreakMinutes}
							min={1}
							max={60}
							onChange={(shortBreakMinutes) =>
								setDraft({ ...draft, shortBreakMinutes })
							}
						/>
						<NumberField
							label="Long break"
							value={draft.longBreakMinutes}
							min={1}
							max={90}
							onChange={(longBreakMinutes) =>
								setDraft({ ...draft, longBreakMinutes })
							}
						/>
						<label className="flex items-center justify-between gap-4 py-2.5">
							<span className="text-[15px]">Long break after</span>
							<select
								className="rounded-xl border border-(--line) bg-(--field) px-2.5 py-1.5 outline-none focus:border-(--accent)"
								value={draft.sessionsBeforeLongBreak}
								onChange={(event) =>
									setDraft({
										...draft,
										sessionsBeforeLongBreak: Number(
											event.target.value,
										),
									})
								}
							>
								{[2, 3, 4, 5, 6, 7, 8].map((count) => (
									<option key={count} value={count}>
										{count} sessions
									</option>
								))}
							</select>
						</label>
					</section>

					<section
						className="mt-5 border-t border-(--hairline) pt-4"
						aria-labelledby="flow-heading"
					>
						<h3 id="flow-heading" className="section-label">
							Flow
						</h3>
						<Switch
							label="Auto-start breaks"
							checked={draft.autoStartBreaks}
							onChange={(autoStartBreaks) =>
								setDraft({ ...draft, autoStartBreaks })
							}
						/>
						<Switch
							label="Auto-start focus"
							checked={draft.autoStartFocus}
							onChange={(autoStartFocus) =>
								setDraft({ ...draft, autoStartFocus })
							}
						/>
						<Switch
							label="Sound"
							checked={draft.sound}
							onChange={(sound) => setDraft({ ...draft, sound })}
						/>
						{"Notification" in window && (
							<Switch
								label="Notifications"
								checked={draft.notifications}
								onChange={(notifications) =>
									setDraft({ ...draft, notifications })
								}
							/>
						)}
					</section>

					<section
						className="mt-5 border-t border-(--hairline) pt-4"
						aria-labelledby="appearance-heading"
					>
						<h3 id="appearance-heading" className="section-label">
							Appearance
						</h3>
						<div
							className="grid grid-cols-3 gap-1 rounded-xl bg-(--field) p-1"
							role="radiogroup"
							aria-label="Theme"
						>
							{(["system", "light", "dark"] as const).map((theme) => (
								<button
									key={theme}
									className={`rounded-lg px-3 py-2 text-sm capitalize transition ${draft.theme === theme ? "bg-(--segment) font-medium shadow-sm" : "text-(--muted)"}`}
									type="button"
									role="radio"
									aria-checked={draft.theme === theme}
									onClick={() => setDraft({ ...draft, theme })}
								>
									{theme}
								</button>
							))}
						</div>
					</section>

					{installPrompt && (
						<button
							className="mt-6 w-full rounded-xl border border-(--line) px-4 py-3 text-sm font-medium"
							type="button"
							onClick={async () => {
								await installPrompt.prompt();
								await installPrompt.userChoice;
								setInstallPrompt(null);
							}}
						>
							Install Pomo
						</button>
					)}
				</div>

				<footer className="shrink-0 border-t border-(--hairline) bg-(--panel) p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
					<button
						className="w-full rounded-2xl bg-(--accent) px-5 py-3.5 font-semibold text-white shadow-[0_8px_28px_color-mix(in_srgb,var(--accent)_25%,transparent)] transition active:scale-[0.98]"
						type="submit"
					>
						Done
					</button>
					<div className="mt-2 text-center text-[10px] leading-4 text-(--muted)">
						<button
							type="button"
							className="select-all font-mono opacity-70 hover:opacity-100"
							aria-label="Copy build version"
							title="Copy build version"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(
										import.meta.env.VITE_BUILD_HASH,
									);
									setCopyStatus("Copied");
								} catch {
									setCopyStatus("Select the hash to copy");
								}
							}}
						>
							Build {import.meta.env.VITE_BUILD_HASH}
						</button>
						<span role="status" className="ml-2 empty:hidden">
							{copyStatus}
						</span>
					</div>
				</footer>
			</form>
		</dialog>
	);
}
