// Pure evaluator for the calculator's expression syntax. Mirrors the original
// inline evaluate() exactly, minus the DOM/state side-effects: it validates,
// auto-closes brackets, computes, and classifies the result. The caller decides
// what to do with each status (render error, reject fractions, commit, etc.).
//
// Game syntax: digits, + - x ÷ ^ √ ( ) . and spaces. Returns:
//   { status: "empty" }                      — nothing to evaluate
//   { status: "invalid", closed? }           — bad characters, or eval failed / non-finite
//   { status: "fraction", closed, value }    — a non-whole result (rejected by the game)
//   { status: "ok",       closed, value }    — a whole-number result
// `closed` is the expression with any unclosed "(" auto-closed (present whenever
// the character set was valid), so the caller can keep its display in sync.
export function evalExpression(expr) {
  if (expr === "") return { status: "empty" };
  if (!/^[0-9+\-x÷^√().\s]*$/.test(expr)) return { status: "invalid" };

  const unclosed = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
  const closed = unclosed > 0 ? expr + ")".repeat(unclosed) : expr;

  const js = closed
    .replace(/√/g, "Math.sqrt")
    .replace(/x/g, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**");

  let value;
  try {
    value = Function('"use strict"; return (' + js + ");")();
  } catch (e) {
    return { status: "invalid", closed };
  }
  if (typeof value !== "number" || !isFinite(value)) return { status: "invalid", closed };

  const rounded = Math.round(value * 1e6) / 1e6;
  if (!Number.isInteger(rounded)) return { status: "fraction", closed, value: rounded };
  return { status: "ok", closed, value: rounded };
}
