// In khung JSON cho một dải quẻ, với mọi trường tính được đã điền sẵn.
//   npx tsx scripts/skeleton.ts 9 22 > data-src/chunks/hex-09-22.json
import type { LinePosition } from '../src/types/schema';
import { hexagramBinary, lineYinYang, oppositeHexagram, tierOfLine, trigramsOf } from '../src/lib/iching';
import { lineLabel } from '../src/data/validate';

const [from, to] = process.argv.slice(2).map(Number);
const out = [];
for (let n = from; n <= to; n++) {
  const { lower, upper } = trigramsOf(n);
  out.push({
    kingWenNumber: n,
    nameHanViet: '',
    nameHan: '',
    nameVi: '',
    binary: hexagramBinary(n),
    lowerTrigram: lower,
    upperTrigram: upper,
    theme: '',
    stageInCycle: '',
    judgment: '',
    sequenceNote: '',
    oppositeHexagram: oppositeHexagram(n),
    lines: ([1, 2, 3, 4, 5, 6] as LinePosition[]).map((position) => {
      const yinYang = lineYinYang(n, position);
      return {
        position,
        yinYang,
        tier: tierOfLine(position),
        original: `${lineLabel(position, yinYang)}: `,
        situation: '',
        behavioralSignals: [],
        characteristicRisk: '',
        commonFailure: '',
        traditionalCounsel: '',
        whatTendsToFollow: '',
        reflectionQuestions: [],
      };
    }),
    sources: [],
  });
}
console.log(JSON.stringify(out, null, 2));
