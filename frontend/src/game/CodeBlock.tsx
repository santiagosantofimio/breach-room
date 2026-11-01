interface CodeBlockProps {
  label: string;
  code: string;
  comparedTo: string;
  ChangedLine: "del" | "ins";
}

function indentOf(line: string): number {
  return (line.length - line.trimStart().length) / 2;
}

export function CodeBlock({ label, code, comparedTo, ChangedLine }: CodeBlockProps) {
  const unchanged = new Set(comparedTo.split("\n").map((line) => line.trim()));

  return (
    <figure>
      <figcaption>{label}</figcaption>
      <pre tabIndex={0} aria-label={label}>
        <code>
          {code.split("\n").map((line, index) => {
            const text = line.trimStart();
            return (
              <span key={index} className="code-line" style={{ marginLeft: `${indentOf(line)}ch` }}>
                {unchanged.has(line.trim()) ? text : <ChangedLine>{text}</ChangedLine>}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
