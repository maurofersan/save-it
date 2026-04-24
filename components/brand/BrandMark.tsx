import Image from "next/image";
import Link from "next/link";

/** Tight inset: the file has generous transparent margins; outer box stays h/w fixed. */
const markSizeClass: Record<"sm" | "md" | "lg", string> = {
  sm: "c-brand__mark--sm h-9 w-9 rounded-lg p-px",
  md: "c-brand__mark--md h-10 w-10 rounded-xl p-px",
  lg: "c-brand__mark--lg h-16 w-16 rounded-2xl p-px sm:h-[4.5rem] sm:w-[4.5rem]",
};

/** Sin placa blanca: logo PNG directo (p. ej. login / héroe). */
const bareSizeClass: Record<"sm" | "md" | "lg", string> = {
  sm: "h-12 w-12",
  md: "h-24 w-24",
  lg: "h-40 w-40 sm:h-44 sm:w-44",
};

export type BrandMarkSize = keyof typeof markSizeClass;

type BrandMarkProps = {
  size?: BrandMarkSize;
  href?: string;
  priority?: boolean;
  className?: string;
  /**
   * `default` — caja clásica (blanco) para shell y listados.
   * `bare` — solo el recurso, sin fondo (login / héroe).
   */
  variant?: "default" | "bare";
  /** Use when visible copy (e.g. “SAVE IT”) is next to the mark to avoid duplicate announcements. */
  decorative?: boolean;
};

export function BrandMark({
  size = "md",
  href,
  priority,
  className,
  variant = "default",
  decorative,
}: BrandMarkProps) {
  const alt = decorative ? "" : "SAVE IT";

  const mark =
    variant === "bare" ? (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${bareSizeClass[size]} ${className ?? ""}`}
        aria-hidden={decorative ? true : undefined}
      >
        <Image
          src="/logo-saveit.png"
          alt={alt}
          width={256}
          height={256}
          sizes="(max-width: 1024px) 160px, 200px"
          className="h-full w-full object-contain object-center drop-shadow-sm"
          priority={priority}
        />
      </span>
    ) : (
      <span
        className={`c-brand__mark inline-grid shrink-0 place-items-center bg-white ${markSizeClass[size]} ${className ?? ""}`}
        aria-hidden={decorative ? true : undefined}
      >
        <Image
          src="/logo-saveit.png"
          alt={alt}
          width={256}
          height={256}
          sizes="(max-width: 1024px) 72px, 80px"
          className="c-brand__image block h-full w-full object-contain object-center"
          priority={priority}
        />
      </span>
    );

  if (href) {
    return (
      <Link
        href={href}
        className="c-brand c-brand--link inline-flex shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={decorative ? "Inicio" : "SAVE IT — inicio"}
      >
        {mark}
      </Link>
    );
  }

  return <span className="c-brand inline-flex shrink-0">{mark}</span>;
}
