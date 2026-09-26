import { describe, expect, it } from 'vitest';
import {
  BRANCHES,
  STEMS,
  canChiName,
  convertLunar2Solar,
  convertSolar2Lunar,
  dayCanChi,
  jdFromDate,
  jdToDate,
  leapMonthOfYear,
  solarTermAt,
  solarTermsOfYear,
  vnParts,
} from '../src/lib/lunar';

/** Thời điểm theo giờ Việt Nam (UTC+7) → Date. */
const vn = (y: number, m: number, d: number, h = 0, mi = 0) => new Date(Date.UTC(y, m - 1, d, h - 7, mi));
/** Thời điểm theo giờ Hồng Kông (UTC+8) → Date. */
const hkt = (y: number, m: number, d: number, h: number, mi: number) => new Date(Date.UTC(y, m - 1, d, h - 8, mi));
const minutesApart = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60000;

describe('ngày Julius', () => {
  it('jdFromDate / jdToDate', () => {
    expect(jdFromDate(1, 1, 2000)).toBe(2451545);
    expect(jdToDate(2451545)).toEqual([1, 1, 2000]);
    for (let jd = 2415021; jd < 2488070; jd += 37) {
      const [d, m, y] = jdToDate(jd);
      expect(jdFromDate(d, m, y)).toBe(jd);
    }
  });
});

describe('Tết Nguyên Đán (1/1 âm lịch) theo giờ Việt Nam', () => {
  // Nguồn: lịch Việt Nam (Hồ Ngọc Đức) và vi.wikipedia "Tết Nguyên Đán" (2026: 17/2, 2027: 6/2);
  // 2020: 25/1, 2021: 12/2, 2022: 1/2, 2023: 22/1, 2024: 10/2, 2025: 29/1 — trùng lịch vạn niên các báo VN.
  const tet: Array<[number, number, number]> = [
    [2020, 1, 25], [2021, 2, 12], [2022, 2, 1], [2023, 1, 22],
    [2024, 2, 10], [2025, 1, 29], [2026, 2, 17], [2027, 2, 6],
  ];
  it.each(tet)('Tết %i', (y, m, d) => {
    expect(convertLunar2Solar(1, 1, y, false)).toEqual([d, m, y]);
    expect(convertSolar2Lunar(d, m, y)).toEqual({ day: 1, month: 1, year: y, leap: false });
    // Hôm trước là ngày cuối tháng Chạp năm trước.
    const [pd, pm, py] = jdToDate(jdFromDate(d, m, y) - 1);
    const prev = convertSolar2Lunar(pd, pm, py);
    expect(prev.month).toBe(12);
    expect(prev.year).toBe(y - 1);
    expect([29, 30]).toContain(prev.day);
  });

  it('các năm Việt Nam khác Trung Quốc do múi giờ +7', () => {
    // 1985: VN ăn Tết 21/1/1985, TQ 20/2/1985 (baonghean.vn "Lịch Âm dương năm 1985";
    // diendan.org "Năm Ất Sửu cầm tinh con trâu hai đầu?").
    expect(convertLunar2Solar(1, 1, 1985, false)).toEqual([21, 1, 1985]);
    // Với múi giờ +8 thuật toán cho đúng Tết Trung Quốc 20/2/1985.
    expect(convertLunar2Solar(1, 1, 1985, false, 8)).toEqual([20, 2, 1985]);
    // 2007: VN 17/2/2007, TQ 18/2/2007 (RFA 7/2/2007 "Vì sao lại có sự khác biệt trong âm lịch
    // của Việt Nam và Trung Quốc?"; Tuổi Trẻ "Vì sao lịch VN và Trung Quốc lệch nhau?").
    expect(convertLunar2Solar(1, 1, 2007, false)).toEqual([17, 2, 2007]);
    expect(convertLunar2Solar(1, 1, 2007, false, 8)).toEqual([18, 2, 2007]);
  });
});

describe('tháng nhuận', () => {
  // 2020 nhuận tháng 4 (từ 23/5/2020), 2023 nhuận tháng 2 (từ 22/3/2023),
  // 2025 nhuận tháng 6 (25/7–22/8/2025) — thanhnien.vn, nongnghiepmoitruong.vn,
  // bachhoaxanh.com "Tháng 6 nhuận âm lịch 2025 bắt đầu từ ngày nào", vtcnews.vn "Vì sao năm 2023 có hai tháng 2".
  it.each([
    [2020, 4, [23, 5, 2020]],
    [2023, 2, [22, 3, 2023]],
    [2025, 6, [25, 7, 2025]],
  ] as Array<[number, number, [number, number, number]]>)('%i nhuận tháng %i', (y, lm, start) => {
    expect(leapMonthOfYear(y)).toBe(lm);
    expect(convertLunar2Solar(1, lm, y, true)).toEqual(start);
    expect(convertSolar2Lunar(start[0], start[1], start[2])).toEqual({ day: 1, month: lm, year: y, leap: true });
    // Tháng thường cùng số vẫn tồn tại, trước tháng nhuận.
    const normal = convertLunar2Solar(1, lm, y, false)!;
    expect(jdFromDate(...start) - jdFromDate(...normal)).toBeGreaterThanOrEqual(29);
  });

  it('2025: 22/8 là 29/6 nhuận, 23/8 là 1/7', () => {
    expect(convertSolar2Lunar(22, 8, 2025)).toEqual({ day: 29, month: 6, year: 2025, leap: true });
    expect(convertSolar2Lunar(23, 8, 2025)).toEqual({ day: 1, month: 7, year: 2025, leap: false });
  });

  it('năm không nhuận', () => {
    for (const y of [2021, 2022, 2024, 2026, 2027]) expect(leapMonthOfYear(y)).toBe(0);
    expect(convertLunar2Solar(1, 4, 2026, true)).toBeNull();
    expect(convertLunar2Solar(1, 5, 2025, true)).toBeNull();
  });
});

describe('can chi ngày', () => {
  it('1/1/2000 = Mậu Ngọ, 25/11 năm Kỷ Mão, tháng Bính Tý (licham.net, xemlicham.com, amlich.uio.vn)', () => {
    expect(canChiName(dayCanChi(jdFromDate(1, 1, 2000)))).toBe('Mậu Ngọ');
    const p = vnParts(vn(2000, 1, 1, 12));
    expect(p.lunar).toEqual({ day: 25, month: 11, year: 1999, leap: false });
    expect(canChiName(p.yearCanChi)).toBe('Kỷ Mão');
    expect(canChiName(p.monthCanChi)).toBe('Bính Tý');
  });

  it('26/9/2026 = ngày Quý Mão, 16/8 Bính Ngọ, tháng Đinh Dậu, tiết Thu Phân (suckhoedoisong.vn, baonghean.vn, xemlicham.com)', () => {
    const p = vnParts(vn(2026, 9, 26, 10));
    expect(canChiName(p.dayCanChi)).toBe('Quý Mão');
    expect(p.lunar).toEqual({ day: 16, month: 8, year: 2026, leap: false });
    expect(canChiName(p.yearCanChi)).toBe('Bính Ngọ');
    expect(canChiName(p.monthCanChi)).toBe('Đinh Dậu');
    expect(p.solarTerm.name).toBe('Thu Phân');
    expect(p.yearBranchNumber).toBe(7); // Ngọ
  });

  it('chu kỳ 60 ngày liên tục', () => {
    const a = dayCanChi(2451545);
    const b = dayCanChi(2451545 + 60);
    expect(b).toEqual(a);
    const c = dayCanChi(2451546);
    expect(c.stem).toBe((a.stem + 1) % 10);
    expect(c.branch).toBe((a.branch + 1) % 12);
  });
});

describe('tiết khí so với Đài Thiên văn Hồng Kông', () => {
  // Nguồn: Hong Kong Observatory, "Date and Time of the 24 Solar Terms",
  // https://www.hko.gov.hk/en/gts/astronomy/data/files/24SolarTerms_2025.xml và _2026.xml
  // (giờ Hồng Kông UTC+8; giờ Việt Nam = trừ 1 giờ). Thứ tự: Tiểu Hàn … Đông Chí.
  const HKO: Record<number, string[]> = {
    2025: [
      '01-05 10:33', '01-20 04:00', '02-03 22:10', '02-18 18:07', '03-05 16:07', '03-20 17:01',
      '04-04 20:49', '04-20 03:56', '05-05 13:57', '05-21 02:55', '06-05 17:57', '06-21 10:42',
      '07-07 04:05', '07-22 21:29', '08-07 13:52', '08-23 04:34', '09-07 16:52', '09-23 02:19',
      '10-08 08:41', '10-23 11:51', '11-07 12:04', '11-22 09:36', '12-07 05:05', '12-21 23:03',
    ],
    2026: [
      '01-05 16:23', '01-20 09:45', '02-04 04:02', '02-18 23:52', '03-05 21:59', '03-20 22:46',
      '04-05 02:40', '04-20 09:39', '05-05 19:49', '05-21 08:37', '06-05 23:48', '06-21 16:25',
      '07-07 09:57', '07-23 03:13', '08-07 19:43', '08-23 10:19', '09-07 22:41', '09-23 08:05',
      '10-08 14:29', '10-23 17:38', '11-07 17:52', '11-22 15:23', '12-07 10:53', '12-22 04:50',
    ],
  };
  const parse = (y: number, s: string) => {
    const [md, hm] = s.split(' ');
    const [m, d] = md.split('-').map(Number);
    const [h, mi] = hm.split(':').map(Number);
    return hkt(y, m, d, h, mi);
  };

  it('Lập Xuân 2026 = 04/02/2026 03:02 giờ VN (HKO 04:02 HKT), ±15 phút', () => {
    const t = solarTermsOfYear(2026).find((x) => x.name === 'Lập Xuân')!;
    expect(minutesApart(t.date, vn(2026, 2, 4, 3, 2))).toBeLessThanOrEqual(15);
  });

  it('Đông Chí 2025 = 21/12/2025 22:03 giờ VN (HKO 23:03 HKT), ±15 phút', () => {
    const t = solarTermsOfYear(2025).find((x) => x.name === 'Đông Chí')!;
    expect(minutesApart(t.date, vn(2025, 12, 21, 22, 3))).toBeLessThanOrEqual(15);
  });

  it.each([2025, 2026])('đủ 24 tiết năm %i, mỗi tiết lệch ≤ 5 phút', (y) => {
    const terms = solarTermsOfYear(y);
    expect(terms).toHaveLength(24);
    expect(terms[0].name).toBe('Tiểu Hàn');
    expect(terms[2].name).toBe('Lập Xuân');
    expect(terms[23].name).toBe('Đông Chí');
    terms.forEach((t, i) => {
      expect(minutesApart(t.date, parse(y, HKO[y][i]))).toBeLessThanOrEqual(5);
      if (i > 0) expect(t.date.getTime()).toBeGreaterThan(terms[i - 1].date.getTime());
    });
  });

  it('solarTermAt quanh ranh giới Lập Xuân 2026', () => {
    expect(solarTermAt(vn(2026, 2, 4, 2, 50)).name).toBe('Đại Hàn');
    const after = solarTermAt(vn(2026, 2, 4, 3, 15));
    expect(after.name).toBe('Lập Xuân');
    expect(minutesApart(after.date, vn(2026, 2, 4, 3, 2))).toBeLessThanOrEqual(15);
    expect(solarTermAt(vn(2026, 9, 26)).name).toBe('Thu Phân');
    expect(solarTermAt(vn(2026, 1, 1)).name).toBe('Đông Chí');
  });
});

describe('can chi tháng theo tiết khí', () => {
  it('qua Lập Xuân 2026: Kỷ Sửu → Canh Dần; năm âm vẫn Ất Tỵ (Tết là 17/2)', () => {
    const before = vnParts(vn(2026, 2, 4, 2, 30));
    const after = vnParts(vn(2026, 2, 4, 3, 30));
    expect(canChiName(before.monthCanChi)).toBe('Kỷ Sửu');
    expect(canChiName(after.monthCanChi)).toBe('Canh Dần');
    expect(canChiName(before.yearCanChi)).toBe('Ất Tỵ');
    expect(canChiName(after.yearCanChi)).toBe('Ất Tỵ');
    expect(after.lunar.month).toBe(12);
  });

  it('qua Lập Xuân 2025 (03/02 21:10 giờ VN): Đinh Sửu → Mậu Dần', () => {
    expect(canChiName(vnParts(vn(2025, 2, 3, 20)).monthCanChi)).toBe('Đinh Sửu');
    expect(canChiName(vnParts(vn(2025, 2, 3, 22)).monthCanChi)).toBe('Mậu Dần');
  });

  it('tháng Tý (Đại Tuyết → Tiểu Hàn) 2025–2026 là Mậu Tý', () => {
    expect(canChiName(vnParts(vn(2025, 12, 15)).monthCanChi)).toBe('Mậu Tý');
    expect(canChiName(vnParts(vn(2026, 1, 3)).monthCanChi)).toBe('Mậu Tý');
    expect(canChiName(vnParts(vn(2026, 1, 10)).monthCanChi)).toBe('Kỷ Sửu');
  });
});

describe('can chi giờ và quy ước giờ Tý', () => {
  it('giờ Hợi rồi giờ Tý nối tiếp: 26/9/2026 (Quý Mão) 22:30 → Quý Hợi; 23:30 → Giáp Tý', () => {
    const hoi = vnParts(vn(2026, 9, 26, 22, 30));
    expect(canChiName(hoi.hourCanChi)).toBe('Quý Hợi');
    expect(hoi.hourBranchNumber).toBe(12);

    const zi = vnParts(vn(2026, 9, 26, 23, 30));
    expect(canChiName(zi.hourCanChi)).toBe('Giáp Tý');
    expect(zi.hourBranchNumber).toBe(1);
    expect(canChiName(zi.dayCanChi)).toBe('Giáp Thìn'); // đã sang ngày hôm sau
    expect(zi.lunar).toEqual({ day: 17, month: 8, year: 2026, leap: false });
    expect(zi.solar.day).toBe(26); // ngày dương theo giờ VN vẫn là 26

    const zi0 = vnParts(vn(2026, 9, 27, 0, 30));
    expect(canChiName(zi0.hourCanChi)).toBe('Giáp Tý');
    expect(canChiName(zi0.dayCanChi)).toBe('Giáp Thìn');
  });

  it('ziStartsNextDay = false: ngày đổi lúc 00:00, 23:00 vẫn là giờ Tý', () => {
    const p = vnParts(vn(2026, 9, 26, 23, 30), { ziStartsNextDay: false });
    expect(canChiName(p.dayCanChi)).toBe('Quý Mão');
    expect(p.lunar.day).toBe(16);
    expect(p.hourBranchNumber).toBe(1);
    expect(BRANCHES[p.hourCanChi.branch]).toBe('Tý');
    expect(STEMS[p.hourCanChi.stem]).toBe('Giáp');
  });

  it('bảng can giờ Tý theo can ngày (Giáp/Kỷ→Giáp, Ất/Canh→Bính, Bính/Tân→Mậu, Đinh/Nhâm→Canh, Mậu/Quý→Nhâm)', () => {
    const expected = ['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm', 'Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm'];
    const jd0 = jdFromDate(1, 1, 2000);
    for (let i = 0; i < 10; i++) {
      const [d, m, y] = jdToDate(jd0 + i);
      const p = vnParts(vn(y, m, d, 0, 30));
      expect(STEMS[p.hourCanChi.stem]).toBe(expected[p.dayCanChi.stem]);
    }
  });

  it('giờ Ngọ 12:00 ngày Mậu Ngọ 1/1/2000 là Mậu Ngọ', () => {
    const p = vnParts(vn(2000, 1, 1, 12));
    expect(canChiName(p.hourCanChi)).toBe('Mậu Ngọ');
    expect(p.hourBranchNumber).toBe(7);
  });

  it('đêm giao thừa 16/2/2026 23:30: đã là mùng 1 Tết Bính Ngọ (mặc định), còn Ất Tỵ nếu tắt quy ước', () => {
    const on = vnParts(vn(2026, 2, 16, 23, 30));
    expect(on.lunar).toEqual({ day: 1, month: 1, year: 2026, leap: false });
    expect(canChiName(on.yearCanChi)).toBe('Bính Ngọ');
    expect(on.yearBranchNumber).toBe(7);
    const off = vnParts(vn(2026, 2, 16, 23, 30), { ziStartsNextDay: false });
    expect(off.lunar.month).toBe(12);
    expect(off.lunar.year).toBe(2025);
    expect(canChiName(off.yearCanChi)).toBe('Ất Tỵ');
    expect(off.yearBranchNumber).toBe(6);
  });

  it('giờ Việt Nam cố định +7, không phụ thuộc múi giờ thiết bị', () => {
    // 2026-09-26 17:00 UTC = 27/9 00:00 giờ VN.
    const p = vnParts(new Date(Date.UTC(2026, 8, 26, 17, 0)));
    expect(p.solar).toEqual({ year: 2026, month: 9, day: 27, hour: 0, minute: 0, second: 0 });
    expect(canChiName(p.dayCanChi)).toBe('Giáp Thìn');
  });
});

describe('khứ hồi dương → âm → dương', () => {
  // Bao gồm 7/5/2054 và 9/4/2062 — hai ngày mà bản gốc amlich.js trả về "mùng 0".
  it('mỗi ngày 1950–2080', () => {
    const start = jdFromDate(1, 1, 1950);
    const end = jdFromDate(31, 12, 2080);
    let prev = convertSolar2Lunar(...jdToDate(start - 1));
    for (let jd = start; jd <= end; jd++) {
      const [d, m, y] = jdToDate(jd);
      const l = convertSolar2Lunar(d, m, y);
      expect(convertLunar2Solar(l.day, l.month, l.year, l.leap)).toEqual([d, m, y]);
      // Tính liên tục: ngày âm tăng 1, hoặc sang tháng mới (mùng 1) sau ngày 29/30.
      if (l.day === 1) expect([29, 30]).toContain(prev.day);
      else expect(l.day).toBe(prev.day + 1);
      prev = l;
    }
  });
});
