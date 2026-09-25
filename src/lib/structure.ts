// Cấu trúc một hào, tính thẳng từ hình quẻ theo các quy tắc của Thập Dực:
// đắc chính (dương ở vị lẻ, âm ở vị chẵn), đắc trung (hào 2, 5), ứng (1–4, 2–5, 3–6
// khác tính âm dương), và quan hệ với hào kề (âm cưỡi trên dương, âm đỡ dưới dương).

export type LineStructure = {
  position: number;
  yang: boolean;
  /** Đắc chính: dương ở vị lẻ (1, 3, 5) hoặc âm ở vị chẵn (2, 4, 6). */
  correct: boolean;
  /** Đắc trung: ở giữa quái dưới (2) hoặc quái trên (5). */
  central: boolean;
  trigram: 'lower' | 'upper';
  /** Hào cùng vị trong quái kia (1–4, 2–5, 3–6). */
  partner: number;
  partnerYang: boolean;
  /** Có ứng: hào tương ứng khác tính âm dương. */
  resonates: boolean;
  /** Hào âm ngay trên một hào dương (thừa cương, thường bất an). */
  ridesYang: boolean;
  /** Hào âm ngay dưới một hào dương (thừa thuận, được nương). */
  supportsYang: boolean;
};

/** `binary`: ký tự đầu là hào 1 (dưới cùng), '1' = dương. */
export function lineStructure(binary: string, position: number): LineStructure {
  if (!/^[01]{6}$/.test(binary)) throw new RangeError(`Hình quẻ không hợp lệ: ${binary}`);
  if (!Number.isInteger(position) || position < 1 || position > 6) throw new RangeError(`Vị trí hào không hợp lệ: ${position}`);
  const yangAt = (p: number) => binary[p - 1] === '1';
  const yang = yangAt(position);
  const partner = position > 3 ? position - 3 : position + 3;
  return {
    position,
    yang,
    correct: yang === (position % 2 === 1),
    central: position === 2 || position === 5,
    trigram: position <= 3 ? 'lower' : 'upper',
    partner,
    partnerYang: yangAt(partner),
    resonates: yangAt(partner) !== yang,
    ridesYang: !yang && position > 1 && yangAt(position - 1),
    supportsYang: !yang && position < 6 && yangAt(position + 1),
  };
}
