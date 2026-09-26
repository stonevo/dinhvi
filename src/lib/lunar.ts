/**
 * Âm lịch Việt Nam, tiết khí và can chi.
 *
 * Âm lịch: thuật toán của Hồ Ngọc Đức ("Âm lịch Việt Nam", Hồ Ngọc Đức, 2004;
 * mã nguồn tham khảo amlich.js, https://www.informatik.uni-leipzig.de/~duc/amlich/),
 * vốn dựa trên các công thức thiên văn của Jean Meeus, "Astronomical Algorithms"
 * (Willmann-Bell, 1991/1998). Giữ nguyên các hàm jdFromDate, jdToDate, NewMoon,
 * SunLongitude, getLunarMonth11, getLeapMonthOffset, convertSolar2Lunar,
 * convertLunar2Solar — nhưng MÚI GIỜ CỐ ĐỊNH +7 (giờ Việt Nam), không phụ thuộc
 * múi giờ của thiết bị. Chính múi giờ +7 (so với +8 của Trung Quốc) làm cho Tết
 * Việt Nam đôi khi lệch với Tết Trung Quốc (ví dụ 1985, 2007).
 *
 * Tiết khí (thời điểm chính xác): tìm nghiệm của kinh độ biểu kiến Mặt Trời
 * = 15°·k, với kinh độ tính theo VSOP87 rút gọn (Meeus ch. 25 & Phụ lục III,
 * bảng 32.A), cộng hiệu chỉnh FK5, chương động (Meeus ch. 22, số hạng chính) và
 * quang sai; ΔT theo đa thức Espenak–Meeus. Sai số cỡ dưới một phút so với
 * Đài Thiên văn Hồng Kông. (Riêng việc xác định tháng nhuận trong thuật toán Hồ
 * Ngọc Đức vẫn dùng hàm SunLongitude độ chính xác thấp của ông, để kết quả âm
 * lịch trùng khớp với lịch đã công bố.)
 *
 * Quy ước giờ Tý (tham số `ziStartsNextDay`, mặc định true): giờ Tý kéo dài
 * 23:00–00:59. Với true, từ 23:00 được coi là đã sang NGÀY HÔM SAU cho can chi
 * ngày, ngày âm lịch (và năm/tháng âm, can chi năm nếu 23:00 là đêm giao thừa)
 * và can của giờ. Với false, ngày chỉ đổi lúc 00:00 (can chi ngày, ngày âm giữ
 * nguyên đến nửa đêm), nhưng 23:00 vẫn là giờ Tý; can của giờ Tý này vẫn tính
 * theo ngày hôm sau (quy ước "dạ Tý" — chu kỳ 60 giờ liên tục, không có hai giờ
 * Tý trùng can chi trong cùng một ngày).
 *
 * Tất cả là hàm thuần: không ngẫu nhiên, không đọc Date.now.
 */

export const TIME_ZONE = 7;

export const STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'] as const;
export const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'] as const;
export const STEMS_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** Can chi, chỉ số từ 0 (stem: Giáp=0, branch: Tý=0). */
export type CanChi = { stem: number; branch: number };

export function canChiName(c: CanChi): string {
  return `${STEMS[c.stem]} ${BRANCHES[c.branch]}`;
}
export function canChiHan(c: CanChi): string {
  return `${STEMS_HAN[c.stem]}${BRANCHES_HAN[c.branch]}`;
}

/** 24 tiết khí, chỉ số 0 = Lập Xuân (315°), mỗi tiết +15°. */
export const SOLAR_TERMS = [
  'Lập Xuân', 'Vũ Thủy', 'Kinh Trập', 'Xuân Phân', 'Thanh Minh', 'Cốc Vũ',
  'Lập Hạ', 'Tiểu Mãn', 'Mang Chủng', 'Hạ Chí', 'Tiểu Thử', 'Đại Thử',
  'Lập Thu', 'Xử Thử', 'Bạch Lộ', 'Thu Phân', 'Hàn Lộ', 'Sương Giáng',
  'Lập Đông', 'Tiểu Tuyết', 'Đại Tuyết', 'Đông Chí', 'Tiểu Hàn', 'Đại Hàn',
] as const;
export const SOLAR_TERMS_HAN = [
  '立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種', '夏至', '小暑', '大暑',
  '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
] as const;

export function solarTermLongitude(index: number): number {
  return (315 + 15 * index) % 360;
}

const INT = Math.floor;
const PI = Math.PI;

// ---------------------------------------------------------------------------
// Thuật toán Hồ Ngọc Đức
// ---------------------------------------------------------------------------

/** Số ngày Julius (JDN) của ngày dd/mm/yy (lịch Gregory; Julius trước 15/10/1582). */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}

/** Ngược lại của jdFromDate: trả về [ngày, tháng, năm]. */
export function jdToDate(jd: number): [number, number, number] {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
}

/** Thời điểm sóc (trăng mới) thứ k tính từ 1/1/1900, dạng ngày Julius (UT). */
export function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return jd1 + C1 - deltat;
}

/** Kinh độ Mặt Trời (radian, 0..2π) — công thức độ chính xác thấp của Hồ Ngọc Đức. */
export function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - PI * 2 * INT(L / (PI * 2));
  return L;
}

/** Cung (0..11, mỗi cung 30°) của Mặt Trời lúc 0h giờ địa phương ngày dayNumber. */
function getSunLongitudeSector(dayNumber: number, timeZone = TIME_ZONE): number {
  return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
}

function getNewMoonDay(k: number, timeZone = TIME_ZONE): number {
  return INT(newMoon(k) + 0.5 + timeZone / 24);
}

/** JDN ngày bắt đầu tháng 11 âm lịch (tháng chứa Đông Chí) của năm yy. */
export function getLunarMonth11(yy: number, timeZone = TIME_ZONE): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitudeSector(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

/** Vị trí tháng nhuận (tính từ tháng 11 bắt đầu ở a11) trong năm có 13 tháng. */
export function getLeapMonthOffset(a11: number, timeZone = TIME_ZONE): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitudeSector(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export type LunarDate = { day: number; month: number; year: number; leap: boolean };

/** Dương lịch → âm lịch Việt Nam (UTC+7). */
export function convertSolar2Lunar(dd: number, mm: number, yy: number, timeZone = TIME_ZONE): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  let k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  // Bản gốc chỉ thử k+1 rồi k; vì sóc thực lệch sóc trung bình tới ~0,6 ngày nên
  // hiếm khi (vd 7/5/2054, 9/4/2062) cả hai đều rơi sau dayNumber → "mùng 0".
  // Dò tiếp cho chắc chắn: monthStart = sóc cuối cùng ≤ dayNumber.
  while (getNewMoonDay(k + 1, timeZone) > dayNumber) k--;
  while (getNewMoonDay(k + 2, timeZone) <= dayNumber) k++;
  const monthStart = getNewMoonDay(k + 1, timeZone);
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}

/**
 * Âm lịch → dương lịch [ngày, tháng, năm]. Trả về null nếu `leap` = true mà
 * tháng đó không phải tháng nhuận của năm.
 */
export function convertLunar2Solar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap: boolean,
  timeZone = TIME_ZONE,
): [number, number, number] | null {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    // Tháng nhuận nằm ở vị trí leapOff, mang số của tháng ngay trước nó.
    // (Bản gốc dùng leapOff − 2, cho 0 thay vì 12 khi nhuận tháng Chạp.)
    const leapMonth = ((9 + leapOff) % 12) + 1;
    if (lunarLeap && lunarMonth !== leapMonth) return null;
    if (lunarLeap || off >= leapOff) off += 1;
  } else if (lunarLeap) {
    return null;
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/** Tháng nhuận của năm âm lịch `lunarYear` (1..12), hoặc 0 nếu không nhuận. */
export function leapMonthOfYear(lunarYear: number, timeZone = TIME_ZONE): number {
  // Tháng 1..10 của năm Y nằm trong chu kỳ bắt đầu từ tháng 11 năm dương Y−1;
  // tháng 11, 12 (nhuận) của năm Y nằm trong chu kỳ bắt đầu từ tháng 11 năm Y.
  for (const [base, wantLate] of [[lunarYear - 1, false], [lunarYear, true]] as const) {
    const a11 = getLunarMonth11(base, timeZone);
    const b11 = getLunarMonth11(base + 1, timeZone);
    if (b11 - a11 <= 365) continue;
    const leapMonth = ((9 + getLeapMonthOffset(a11, timeZone)) % 12) + 1;
    if ((leapMonth >= 11) === wantLate) return leapMonth;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Kinh độ biểu kiến Mặt Trời chính xác (VSOP87 rút gọn) — cho tiết khí
// ---------------------------------------------------------------------------

type Term = readonly [number, number, number];

// Meeus, Astronomical Algorithms, Phụ lục III (Trái Đất, L), đơn vị 1e-8 rad.
const L0: Term[] = [
  [175347046, 0, 0], [3341656, 4.6692568, 6283.07585], [34894, 4.6261, 12566.1517],
  [3497, 2.7441, 5753.3849], [3418, 2.8289, 3.5231], [3136, 3.6277, 77713.7715],
  [2676, 4.4181, 7860.4194], [2343, 6.1352, 3930.2097], [1324, 0.7425, 11506.7698],
  [1273, 2.0371, 529.691], [1199, 1.1096, 1577.3435], [990, 5.233, 5884.927],
  [902, 2.045, 26.298], [857, 3.508, 398.149], [780, 1.179, 5223.694],
  [753, 2.533, 5507.553], [505, 4.583, 18849.228], [492, 4.205, 775.523],
  [357, 2.92, 0.067], [317, 5.849, 11790.629], [284, 1.899, 796.298],
  [271, 0.315, 10977.079], [243, 0.345, 5486.778], [206, 4.806, 2544.314],
  [205, 1.869, 5573.143], [202, 2.458, 6069.777], [156, 0.833, 213.299],
  [132, 3.411, 2942.463], [126, 1.083, 20.775], [115, 0.645, 0.98],
  [103, 0.636, 4694.003], [102, 0.976, 15720.839], [102, 4.267, 7.114],
  [99, 6.21, 2146.17], [98, 0.68, 155.42], [86, 5.98, 161000.69],
  [85, 1.3, 6275.96], [85, 3.67, 71430.7], [80, 1.81, 17260.15],
  [79, 3.04, 12036.46], [75, 1.76, 5088.63], [74, 3.5, 3154.69],
  [74, 4.68, 801.82], [70, 0.83, 9437.76], [62, 3.98, 8827.39],
  [61, 1.82, 7084.9], [57, 2.78, 6286.6], [56, 4.39, 14143.5],
  [56, 3.47, 6279.55], [52, 0.19, 12139.55], [52, 1.33, 1748.02],
  [51, 0.28, 5856.48], [49, 0.49, 1194.45], [41, 5.37, 8429.24],
  [41, 2.4, 19651.05], [39, 6.17, 10447.39], [37, 6.04, 10213.29],
  [37, 2.57, 1059.38], [36, 1.71, 2352.87], [36, 1.78, 6812.77],
  [33, 0.59, 17789.85], [30, 0.44, 83996.85], [30, 2.74, 1349.87],
  [25, 3.16, 4690.48],
];
const L1: Term[] = [
  [628331966747, 0, 0], [206059, 2.678235, 6283.07585], [4303, 2.6351, 12566.1517],
  [425, 1.59, 3.523], [119, 5.796, 26.298], [109, 2.966, 1577.344],
  [93, 2.59, 18849.23], [72, 1.14, 529.69], [68, 1.87, 398.15],
  [67, 4.41, 5507.55], [59, 2.89, 5223.69], [56, 2.17, 155.42],
  [45, 0.4, 796.3], [36, 0.47, 775.52], [29, 2.65, 7.11],
  [21, 5.34, 0.98], [19, 1.85, 5486.78], [19, 4.97, 213.3],
  [17, 2.99, 6275.96], [16, 0.03, 2544.31], [16, 1.43, 2146.17],
  [15, 1.21, 10977.08], [12, 2.83, 1748.02], [12, 3.26, 5088.63],
  [12, 5.27, 1194.45], [12, 2.08, 4694.0], [11, 0.77, 553.57],
  [10, 1.3, 6286.6], [10, 4.24, 1349.87], [9, 2.7, 242.73],
  [9, 5.64, 951.72], [8, 5.3, 2352.87], [6, 2.65, 9437.76], [6, 4.67, 4690.48],
];
const L2: Term[] = [
  [52919, 0, 0], [8720, 1.0721, 6283.0758], [309, 0.867, 12566.152],
  [27, 0.05, 3.52], [16, 5.19, 26.3], [16, 3.68, 155.42], [10, 0.76, 18849.23],
  [9, 2.06, 77713.77], [7, 0.83, 775.52], [5, 4.66, 1577.34], [4, 1.03, 7.11],
  [4, 3.44, 5573.14], [3, 5.14, 796.3], [3, 6.05, 5507.55], [3, 1.19, 242.73],
  [3, 6.12, 529.69], [3, 0.31, 398.15], [3, 2.28, 553.57], [2, 4.38, 5223.69],
  [2, 3.75, 0.98],
];
const L3: Term[] = [
  [289, 5.844, 6283.076], [35, 0, 0], [17, 5.49, 12566.15], [3, 5.2, 155.42],
  [1, 4.72, 3.52], [1, 5.3, 18849.23], [1, 5.97, 242.73],
];
const L4: Term[] = [[114, 3.142, 0], [8, 4.13, 6283.08], [1, 3.84, 12566.15]];
const L5: Term[] = [[1, 3.14, 0]];
// Bán kính vectơ R (chỉ cần cho quang sai; vài số hạng đầu là đủ).
const R0: Term[] = [
  [100013989, 0, 0], [1670700, 3.0984635, 6283.07585], [13956, 3.05525, 12566.1517],
  [3084, 5.1985, 77713.7715], [1628, 1.1739, 5753.3849], [1576, 2.8469, 7860.4194],
];
const R1: Term[] = [[103019, 1.10749, 6283.07585], [1721, 1.0644, 12566.1517]];

function series(terms: Term[], t: number): number {
  let s = 0;
  for (const [a, b, c] of terms) s += a * Math.cos(b + c * t);
  return s;
}

/** ΔT = TT − UT (giây), đa thức Espenak–Meeus (NASA, 2006). */
export function deltaT(year: number): number {
  const y = year;
  if (y < 1800) {
    const u = (y - 1820) / 100;
    return -20 + 32 * u * u;
  }
  if (y < 1860) {
    const t = y - 1800;
    return 13.72 - 0.332447 * t + 0.0068612 * t ** 2 + 0.0041116 * t ** 3 - 0.00037436 * t ** 4
      + 0.0000121272 * t ** 5 - 0.0000001699 * t ** 6 + 0.000000000875 * t ** 7;
  }
  if (y < 1900) {
    const t = y - 1860;
    return 7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174;
  }
  if (y < 1920) {
    const t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (y < 1941) {
    const t = y - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (y < 1961) {
    const t = y - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (y < 1986) {
    const t = y - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (y < 2005) {
    const t = y - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  if (y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  if (y < 2150) {
    return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  }
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}

const JD_UNIX_EPOCH = 2440587.5;
const MS_PER_DAY = 86400000;

/** Ngày Julius (UT, có phần thập phân) của một thời điểm. */
export function julianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}
export function dateFromJulianDay(jd: number): Date {
  return new Date(Math.round((jd - JD_UNIX_EPOCH) * MS_PER_DAY));
}

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Kinh độ biểu kiến của Mặt Trời (độ, 0..360) tại ngày Julius UT `jdUT`. */
export function apparentSunLongitude(jdUT: number): number {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  const jde = jdUT + deltaT(year) / 86400;
  const tau = (jde - 2451545) / 365250; // thiên niên kỷ Julius
  const L =
    (series(L0, tau) + series(L1, tau) * tau + series(L2, tau) * tau ** 2 + series(L3, tau) * tau ** 3
      + series(L4, tau) * tau ** 4 + series(L5, tau) * tau ** 5) / 1e8;
  const R = (series(R0, tau) + series(R1, tau) * tau) / 1e8;
  let lon = (L * 180) / PI + 180; // địa tâm
  const T = tau * 10;
  lon -= 0.09033 / 3600; // FK5
  // Chương động theo kinh độ (Meeus ch. 22, độ chính xác ~0.5").
  const dr = PI / 180;
  const omega = (125.04452 - 1934.136261 * T) * dr;
  const Ls = (280.4665 + 36000.7698 * T) * dr;
  const Lm = (218.3165 + 481267.8813 * T) * dr;
  const dpsi = -17.2 * Math.sin(omega) - 1.32 * Math.sin(2 * Ls) - 0.23 * Math.sin(2 * Lm) + 0.21 * Math.sin(2 * omega);
  lon += dpsi / 3600;
  lon -= 20.4898 / 3600 / R; // quang sai
  return norm360(lon);
}

/** Thời điểm (JD UT) Mặt Trời đạt kinh độ `target` độ, gần `jdGuess` (trong ±~20 ngày). */
function solveSunLongitude(target: number, jdGuess: number): number {
  let jd = jdGuess;
  for (let i = 0; i < 50; i++) {
    let d = target - apparentSunLongitude(jd);
    d = ((d + 540) % 360) - 180; // về (-180, 180]
    const step = d / 0.98564736; // ngày
    jd += step;
    if (Math.abs(step) < 1e-7) break;
  }
  return jd;
}

export type SolarTermInstant = {
  /** 0 = Lập Xuân … 23 = Đại Hàn */
  index: number;
  name: string;
  longitude: number;
  /** Thời điểm bắt đầu tiết (tuyệt đối). */
  date: Date;
};

function termInstant(index: number, jd: number): SolarTermInstant {
  return { index, name: SOLAR_TERMS[index], longitude: solarTermLongitude(index), date: dateFromJulianDay(jd) };
}

/**
 * 24 tiết khí bắt đầu trong năm dương lịch `y` (theo giờ Việt Nam), xếp theo
 * thời gian: Tiểu Hàn (~5/1), Đại Hàn, Lập Xuân, …, Đại Tuyết, Đông Chí (~22/12).
 */
export function solarTermsOfYear(y: number): SolarTermInstant[] {
  const out: SolarTermInstant[] = [];
  // Tiểu Hàn (285°) ≈ 5/1; kế tiếp mỗi 15° ≈ 15.22 ngày.
  const start = jdFromDate(5, 1, y) - 0.5 - TIME_ZONE / 24;
  for (let j = 0; j < 24; j++) {
    const index = (22 + j) % 24;
    const guess = start + j * 15.2184;
    out.push(termInstant(index, solveSunLongitude(solarTermLongitude(index), guess)));
  }
  return out;
}

/** Tiết khí đang hiệu lực tại thời điểm `date` (tiết gần nhất đã bắt đầu). */
export function solarTermAt(date: Date): SolarTermInstant {
  const jd = julianDay(date);
  const lon = apparentSunLongitude(jd);
  let index = INT(norm360(lon - 315) / 15) % 24;
  let d = norm360(lon - solarTermLongitude(index));
  let t = solveSunLongitude(solarTermLongitude(index), jd - d / 0.98564736);
  if (t > jd) {
    index = (index + 23) % 24;
    d = norm360(lon - solarTermLongitude(index));
    t = solveSunLongitude(solarTermLongitude(index), jd - d / 0.98564736);
  }
  return termInstant(index, t);
}

// ---------------------------------------------------------------------------
// Can chi
// ---------------------------------------------------------------------------

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Can chi của năm (âm lịch hoặc năm tiết khí) Y. */
export function yearCanChi(year: number): CanChi {
  return { stem: mod(year + 6, 10), branch: mod(year + 8, 12) };
}

/** Can chi của ngày có số ngày Julius `jd`. */
export function dayCanChi(jd: number): CanChi {
  return { stem: mod(jd + 9, 10), branch: mod(jd + 1, 12) };
}

/**
 * Can chi tháng theo tiết khí. `monthIndex` 0 = tháng Dần (từ Lập Xuân) … 11 =
 * tháng Sửu; `solarYear` là năm tiết khí (đổi tại Lập Xuân). Can tháng Dần:
 * Giáp/Kỷ → Bính, Ất/Canh → Mậu, Bính/Tân → Canh, Đinh/Nhâm → Nhâm, Mậu/Quý → Giáp.
 */
export function monthCanChi(solarYear: number, monthIndex: number): CanChi {
  const ys = yearCanChi(solarYear).stem;
  const firstStem = mod((ys % 5) * 2 + 2, 10);
  return { stem: mod(firstStem + monthIndex, 10), branch: mod(2 + monthIndex, 12) };
}

/**
 * Can chi giờ. Can giờ Tý: Giáp/Kỷ → Giáp, Ất/Canh → Bính, Bính/Tân → Mậu,
 * Đinh/Nhâm → Canh, Mậu/Quý → Nhâm. `dayStem` là can của ngày mà giờ Tý đó mở đầu.
 */
export function hourCanChi(dayStem: number, hourBranch: number): CanChi {
  return { stem: mod((dayStem % 5) * 2 + hourBranch, 10), branch: hourBranch };
}

/** Chi của giờ địa phương (0..23): Tý = 23:00–00:59. */
export function hourBranchOf(hour: number): number {
  return INT((hour + 1) / 2) % 12;
}

export type VnParts = {
  /** Ngày giờ dương lịch theo giờ Việt Nam (UTC+7). */
  solar: { year: number; month: number; day: number; hour: number; minute: number; second: number };
  /** JDN của "ngày can chi" (đã tính quy ước giờ Tý). */
  jd: number;
  lunar: LunarDate;
  yearCanChi: CanChi;
  monthCanChi: CanChi;
  dayCanChi: CanChi;
  hourCanChi: CanChi;
  /** 1..12, Tý = 1 */
  hourBranchNumber: number;
  /** 1..12, Tý = 1 (theo năm âm lịch) */
  yearBranchNumber: number;
  solarTerm: SolarTermInstant;
};

/**
 * Phân tích một thời điểm theo lịch Việt Nam (UTC+7, không phụ thuộc múi giờ
 * thiết bị). Xem quy ước giờ Tý ở đầu tệp.
 */
export function vnParts(date: Date, opts?: { ziStartsNextDay?: boolean }): VnParts {
  const ziNext = opts?.ziStartsNextDay ?? true;
  const local = new Date(date.getTime() + TIME_ZONE * 3600000);
  const solar = {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  };
  const civilJd = jdFromDate(solar.day, solar.month, solar.year);
  const lateZi = solar.hour >= 23;
  const jd = ziNext && lateZi ? civilJd + 1 : civilJd;
  const [ld, lm, ly] = jdToDate(jd);
  const lunar = convertSolar2Lunar(ld, lm, ly);

  const term = solarTermAt(date);
  const monthIndex = INT(term.index / 2);
  // Năm tiết khí: đổi tại Lập Xuân. Tiết từ Lập Xuân (0) đến Đại Tuyết/Đông Chí
  // (20, 21) nằm trong năm dương hiện tại nếu tháng ≥ 2; Tiểu Hàn/Đại Hàn (22, 23)
  // thuộc năm trước khi rơi vào tháng 1.
  let solarYear = solar.year;
  if (solar.month <= 2 && (term.index >= 20)) solarYear -= 1;

  const hb = hourBranchOf(solar.hour);
  // Can giờ Tý muộn (23:00) luôn tính theo ngày hôm sau (chu kỳ 60 giờ liên tục).
  const hourDayStem = dayCanChi(lateZi ? civilJd + 1 : civilJd).stem;

  const yc = yearCanChi(lunar.year);
  return {
    solar,
    jd,
    lunar,
    yearCanChi: yc,
    monthCanChi: monthCanChi(solarYear, monthIndex),
    dayCanChi: dayCanChi(jd),
    hourCanChi: hourCanChi(hourDayStem, hb),
    hourBranchNumber: hb + 1,
    yearBranchNumber: yc.branch + 1,
    solarTerm: term,
  };
}
