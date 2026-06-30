// Internationalization: the string dictionary, current-language state, and the
// t() lookup. DOM-free — index.html owns applyLang() (which writes to the DOM).

export const I18N = {
  en: {
    "menu.resume": "Resume", "menu.reset": "Reset", "menu.home": "Home",
    "menu.help": "Help", "menu.back": "Back", "menu.lang": "한국어",
    "theme.dark": "Dark mode", "theme.light": "Light mode",
    "auto.on": "Auto (=) on", "auto.off": "Auto (=) off", "auto.sign": "Auto ({s})",
    "quit": "End game", "submit": "Submit",
    "guide.walk": "Walkthrough", "guide.rules": "Rules",
    "win.solvedIn": "Solved in", "win.yourScore": "Your score",
    "win.youWin": "You win", "win.youLose": "You lose", "win.tie": "Tie",
    "win.solvedIt": "Solved it", "win.bangZero": "Bang on zero!",
    "win.bangTarget": "Bang on the target!", "win.bangOn": "Bang on {g}",
    "win.from": "{d} from {g}", "win.score": "{s} · {d} from {g}",
    "win.home": "Home", "win.share": "Share",
    "win.theyScored": "They scored {x}", "win.theyAway": "They scored {x} ({d} away)",
    "beat": "Beat {x}",
    "toast.copied": "Challenge link copied", "toast.help": "Open the menu (≡) any time during play",
    "share.time": "Beat my time of {t}!", "share.score": "Beat my score of {s}!",
    "tour.next": "Next", "tour.done": "Done", "tour.exit": "Exit",
    "guide.overview": "Overview",
    "guide.profile": "Profile",
    "profile.soon": "Profiles & leaderboards are coming soon.",
    "mp.title": "Multiplayer",
    "mp.soon": "Coming soon",
    "mode.ranked": "Ranked",
    "overview": [
      "Reach the target number, or work all the way down to 0, using each of your six numbers exactly once.",
      "You don't have to be exact — you're scored by how close you get. If nobody solves it, the closest answer wins, and a faster time breaks ties.",
    ],
    "rules": [
      "Tap the 000 target to roll a number from 100–999.",
      "On each slot, tap ▲ for a big number (20–100) or ▼ for a small one (1–10). Draw all six.",
      "Tap a number, then a symbol (+ − × ÷ ^ √), then another number. The target itself can be used once.",
      "Every result you make becomes a chip you can tap to reuse.",
      "Auto (=) solves each step as you go — turn it off to build a whole expression, then press =.",
      "Auto sign sets which symbol drops in automatically when you tap two numbers in a row.",
      "c: tap to undo a step, hold to keep deleting. = banks the current line so you can start fresh.",
      "Tap a side of the screen — or swipe — to move between calculators; past the last adds a new one. The sketchpad is on the far left.",
      "Press and hold anywhere on a calculator to delete that page.",
      "Swipe up for help and swipe down for the menu — on any page. Submit (green, or in the menu) ends the round once all six numbers are used.",
    ],
    "walk": [
      "This is your target. Tap it to roll a number from 100 to 999.",
      "On each number, tap ▲ for a big number or ▼ for a small one. Draw all six to begin.",
      "These are your six numbers. Tap one, a symbol, then another to make a calculation.",
      "Your calculations show here. Tap to open the full list. c undoes, = banks the line.",
      "These dots are your pages. Tap a side of the screen — or swipe — to switch calculators. The sketchpad is on the far left.",
      "Swipe up for help, swipe down for the menu — on any page; tap outside either to close it. Submit ends the round once all six numbers are used.",
      "Closest to the target wins. If nobody solves it, whoever gets closest takes it — and a faster time breaks a tie. Have fun!",
    ],
  },
  ko: {
    "menu.resume": "계속하기", "menu.reset": "다시하기", "menu.home": "홈",
    "menu.help": "도움말", "menu.back": "뒤로", "menu.lang": "English",
    "theme.dark": "다크 모드", "theme.light": "라이트 모드",
    "auto.on": "자동 (=) 켜짐", "auto.off": "자동 (=) 꺼짐", "auto.sign": "자동 ({s})",
    "quit": "게임 종료", "submit": "제출",
    "guide.walk": "둘러보기", "guide.rules": "규칙",
    "win.solvedIn": "해결 시간", "win.yourScore": "내 점수",
    "win.youWin": "승리", "win.youLose": "패배", "win.tie": "무승부",
    "win.solvedIt": "해결 완료", "win.bangZero": "정확히 0!",
    "win.bangTarget": "정확히 목표 달성!", "win.bangOn": "정확히 {g}",
    "win.from": "{g}에서 {d} 차이", "win.score": "{s} · {g}에서 {d} 차이",
    "win.home": "홈", "win.share": "공유",
    "win.theyScored": "상대 점수 {x}", "win.theyAway": "상대 점수 {x} ({d} 차이)",
    "beat": "목표 {x}",
    "toast.copied": "도전 링크가 복사되었습니다", "toast.help": "게임 중 언제든 메뉴(≡)를 열 수 있어요",
    "share.time": "내 기록 {t} 깨보세요!", "share.score": "내 점수 {s} 깨보세요!",
    "tour.next": "다음", "tour.done": "완료", "tour.exit": "나가기",
    "guide.overview": "개요",
    "guide.profile": "프로필",
    "profile.soon": "프로필과 리더보드가 곧 추가됩니다.",
    "mp.title": "멀티플레이어",
    "mp.soon": "곧 출시 예정",
    "mode.ranked": "랭크",
    "overview": [
      "여섯 개의 숫자를 각각 한 번씩만 사용해 목표 숫자에 도달하거나 0까지 줄이세요.",
      "꼭 정확할 필요는 없어요 — 얼마나 가까운지로 점수가 매겨집니다. 아무도 못 맞히면 가장 가까운 답이 이기고, 동점이면 더 빠른 기록이 이깁니다.",
    ],
    "rules": [
      "000 목표를 눌러 100~999 사이의 숫자를 뽑으세요.",
      "각 칸에서 ▲를 누르면 큰 수(20~100), ▼를 누르면 작은 수(1~10)가 나옵니다. 여섯 개를 모두 뽑으세요.",
      "숫자를 누르고 기호(+ − × ÷ ^ √)를 누른 뒤 다른 숫자를 누르세요. 목표 숫자도 한 번 사용할 수 있어요.",
      "만든 결과는 눌러서 다시 쓸 수 있는 칩이 됩니다.",
      "자동 (=)은 매 단계를 자동으로 계산합니다 — 끄면 식을 다 만든 뒤 =를 누르세요.",
      "자동 기호는 두 숫자를 연달아 누를 때 자동으로 들어갈 기호를 정합니다.",
      "c: 한 번 누르면 한 단계 되돌리기, 길게 누르면 계속 지웁니다. =는 현재 줄을 정리합니다.",
      "화면 양옆을 누르거나 좌우로 스와이프하면 계산기를 넘기고, 마지막에서 더 넘기면 새 계산기가 생깁니다. 맨 왼쪽은 스케치패드입니다.",
      "계산기를 길게 누르면 그 페이지를 삭제할 수 있어요.",
      "어느 페이지에서든 위로 스와이프하면 도움말, 아래로 스와이프하면 메뉴가 열립니다. 숫자를 모두 쓰면 제출(초록색 또는 메뉴)로 라운드를 끝냅니다.",
    ],
    "walk": [
      "이것은 목표 숫자입니다. 눌러서 100~999 사이의 숫자를 뽑으세요.",
      "각 숫자에서 ▲는 큰 수, ▼는 작은 수입니다. 여섯 개를 모두 뽑아 시작하세요.",
      "여섯 개의 숫자입니다. 숫자, 기호, 다른 숫자를 차례로 눌러 계산하세요.",
      "계산 결과가 여기에 표시됩니다. 눌러서 전체 목록을 여세요. c는 되돌리기, =는 줄 정리입니다.",
      "이 점들은 페이지입니다. 화면 양옆을 누르거나 좌우로 스와이프해 계산기를 넘기세요. 맨 왼쪽은 스케치패드입니다.",
      "어느 페이지에서든 위로 스와이프하면 도움말, 아래로 스와이프하면 메뉴가 열려요. 바깥을 누르면 닫힙니다. 숫자를 모두 쓰면 제출로 끝낼 수 있어요.",
      "목표에 가장 가까우면 승리! 아무도 못 맞히면 가장 가까운 사람이 이기고, 동점이면 더 빠른 기록이 이깁니다. 즐겁게 플레이하세요!",
    ],
  },
};

let lang = "en";
export function getLang() { return lang; }
export function setLang(l) { lang = l; }

// Look up a key for the current language, falling back to English then the key
// itself. Substitutes {placeholders} from `vars` when the value is a string.
export function t(key, vars) {
  let s = (I18N[lang] && I18N[lang][key]);
  if (s == null) s = I18N.en[key];
  if (s == null) s = key;
  if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
