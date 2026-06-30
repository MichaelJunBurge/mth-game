// Pure scoring + result-comparison logic. No DOM, no globals.

// Score for an unsolved submission: the value you reached plus the sum of any of
// the six numbers you never used (unused numbers are a penalty). Closer to the
// goal is better. `reached` is the last result (null/undefined counts as 0).
export function computeScore({ reached, slotUsed, slotValues }) {
  let unusedSum = 0;
  for (let i = 0; i < slotValues.length; i++) {
    if (!slotUsed[i] && slotValues[i] !== null && slotValues[i] !== undefined) {
      unusedSum += slotValues[i];
    }
  }
  return (reached === null || reached === undefined ? 0 : reached) + unusedSum;
}

// The goal a submission is judged against: 0 if the target was folded into the
// working (winding backwards to zero), otherwise the target itself.
export function goalFor({ targetUsed, target }) {
  return targetUsed ? 0 : target;
}

export function distance(score, goal) {
  return Math.abs(score - goal);
}

// Compare my result to the opponent's: closer to the goal wins; ties broken by a
// faster time; only a dead heat on both is a tie. ("win" | "lose" | "tie")
export function verdict(me, them) {
  if (me.distance !== them.distance) return me.distance < them.distance ? "win" : "lose";
  if (Math.round(me.timeSec) !== Math.round(them.timeSec)) {
    return me.timeSec < them.timeSec ? "win" : "lose";
  }
  return "tie";
}
