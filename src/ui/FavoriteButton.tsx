import type { Ref } from "react";

export function FavoriteButton({
  pressed,
  title,
  onToggle,
  className,
  buttonRef,
}: {
  pressed: boolean;
  title: string;
  onToggle: () => void;
  className: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={className}
      aria-pressed={pressed}
      aria-label={favoriteLabel(title)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      Favori
    </button>
  );
}

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="icon heart" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-filled={filled ? "true" : "false"}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </svg>
  );
}

function favoriteLabel(title: string): string {
  return `Favori, ${title}`;
}
