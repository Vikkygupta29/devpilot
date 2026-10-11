import type { SVGProps } from "react";

export function DevPilotIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className={className}
			{...props}
		>
			<rect width="32" height="32" rx="8" fill="#00C988" />
			<path
				d="M8.5 10.5L14.5 16L8.5 21.5"
				stroke="#09090B"
				strokeWidth="2.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M16.5 21.5H23.5"
				stroke="#09090B"
				strokeWidth="2.75"
				strokeLinecap="round"
			/>
		</svg>
	);
}

