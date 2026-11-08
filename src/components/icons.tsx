import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

export function SettingsIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.58 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.58 1.7 1.7 0 0 0 10 3V3h4v.08A1.7 1.7 0 0 0 15.05 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06L19.82 7l-.06.06A1.7 1.7 0 0 0 19.42 9 1.7 1.7 0 0 0 21 10v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
		</Icon>
	);
}

export function ResetIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
			<path d="M3 3v5h5" />
		</Icon>
	);
}

export function SkipIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m5 5 10 7L5 19V5Z" />
			<path d="M19 5v14" />
		</Icon>
	);
}

export function CloseIcon(props: IconProps) {
	return (
		<Icon {...props}>
			<path d="m6 6 12 12M18 6 6 18" />
		</Icon>
	);
}
