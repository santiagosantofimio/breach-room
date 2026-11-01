import { useEffect, useState } from "react";

const KEYSTROKE_MS = 22;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useTypedText(text: string): string {
  const [typedLength, setTypedLength] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setTypedLength(text.length);
      return;
    }
    setTypedLength(0);
    const timer = setInterval(() => {
      setTypedLength((current) => {
        if (current >= text.length) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, KEYSTROKE_MS);
    return () => clearInterval(timer);
  }, [text]);

  return text.slice(0, typedLength);
}
