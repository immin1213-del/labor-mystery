// 진행자용 설명 화면 검사: node tools/check-guide.js  (실패 시 exit 1)
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

const guidePath = path.join(root, "guide", "index.html");
if (!fs.existsSync(guidePath)) {
  console.error("FAIL: guide/index.html 없음");
  process.exit(1);
}
const guide = fs.readFileSync(guidePath, "utf8");

const slides = guide.match(/<section class="slide"[^>]*>/g) || [];
check(slides.length === 15, `slide 개수 ${slides.length} (기대 15)`);
check(slides.every(s => /data-title="[^"]+"/.test(s)), "data-title 없는 slide 있음");
check(!guide.includes("최소 1·2·3장"), "guide에 옛 규칙 문구(최소 1·2·3장) 있음");

// 실제 사건 인물명이 예시에 섞이면 안 됨(가상 예시만)
const REAL_NAMES = ["김도윤","박기준","백태우","이서현","오동석","박현석","남경아","서민준","유정한","조은서","문석영","배기현","한도윤","오세진","윤채린","차민재","하지원","구예린","이기철","김동현","정미선","박동수","최명희","강인호"];
const leaked = REAL_NAMES.filter(n => guide.includes(n));
check(leaked.length === 0, `실제 사건 인물명 포함: ${leaked.join(", ")}`);

// 허브: 옛 규칙 문구 제거 + 설명 화면 링크
const hub = fs.readFileSync(path.join(root, "index.html"), "utf8");
check(!hub.includes("최소 1·2·3장"), "허브에 옛 규칙 문구(최소 1·2·3장) 있음");
check(hub.includes('href="guide/"'), "허브에 진행자용 설명 화면 링크(guide/) 없음");

if (fails.length) { fails.forEach(f => console.error("FAIL: " + f)); process.exit(1); }
console.log(`PASS: guide ${slides.length}장`);
