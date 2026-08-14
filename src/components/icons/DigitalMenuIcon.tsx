export function DigitalMenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g transform="translate(12 12) scale(1.18) translate(-12 -12)">
        <path d="M3 6.5h8" />
        <path d="M3 12h8" />
        <path d="M3 17.5h8" />
        <path d="M13.25 19.75h7.5" />
        <path d="M13.25 19.75a3.75 3.75 0 0 1 7.5 0" />
        <circle cx="17" cy="13.75" r="1.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
