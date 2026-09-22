/**
 * App wordmark. Deliberately not EPFL-like: lowercase, no red square, no Swiss-cross cut-outs.
 * The dot is the "available" signal, in brand red.
 */
export function Wordmark({ size = "text-lg" }: { size?: string }) {
  return (
    <span className={`${size} font-bold tracking-tight leading-none`}>
      dispo<span className="text-accent">.</span>
    </span>
  );
}
