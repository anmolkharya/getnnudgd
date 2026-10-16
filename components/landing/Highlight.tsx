import { Fragment } from "react";

/**
 * Renders `text` with one fragment picked out in the brand colour, like the
 * highlighted word in a heading. If the fragment is not found, the text is
 * shown unchanged.
 */
export function Highlight({ text, highlight }: { text: string; highlight?: string }) {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || at < 0) return <Fragment>{text}</Fragment>;
  return (
    <Fragment>
      {text.slice(0, at)}
      <span className="text-accent">{highlight}</span>
      {text.slice(at + highlight.length)}
    </Fragment>
  );
}
