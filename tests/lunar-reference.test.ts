// Đối chiếu lịch âm Việt Nam (src/lib/lunar.ts, UTC+7) với ngày đã công bố.
// Nguồn Tết 2000–2030 và tháng nhuận: mỗi năm đối chiếu ít nhất hai trang lịch vạn niên Việt Nam
//   (xemlicham.com/am-lich/nam/<năm>/thang/<tháng>/ngay/<ngày>, ngaydep.com/xem-ngay-<ngày>-thang-<tháng>-nam-<năm>.html,
//   baohatinh.vn/cong-cu/lich-am/<dd-mm-yyyy> — riêng Tết); 2020–2030 thêm bảng ở en.wikipedia "Tết";
//   tháng nhuận đối chiếu thêm bảng Đài Thiên văn Hồng Kông (hko.gov.hk …/T<năm>e.txt).
// Lưu ý: các trang lịch là bảng tính sẵn (có thể cùng thuật toán), nên các ca VN ≠ TQ dưới đây dùng
// nguồn báo chí: Nhân Dân "Chung quanh thông tin về ngày âm lịch khác nhau trên một số loại lịch"
// (nhandan.vn …post489744.html) và VnExpress "Lịch sai do dịch sách Trung Quốc" (vnexpress.net …2814087.html).
import { describe, expect, it } from 'vitest';
import { convertLunar2Solar, convertSolar2Lunar, leapMonthOfYear } from '../src/lib/lunar';

const TET: Array<[number, number, number]> = [
  [2000, 2, 5], [2001, 1, 24], [2002, 2, 12], [2003, 2, 1], [2004, 1, 22], [2005, 2, 9], [2006, 1, 29], [2007, 2, 17],
  [2008, 2, 7], [2009, 1, 26], [2010, 2, 14], [2011, 2, 3], [2012, 1, 23], [2013, 2, 10], [2014, 1, 31], [2015, 2, 19],
  [2016, 2, 8], [2017, 1, 28], [2018, 2, 16], [2019, 2, 5], [2020, 1, 25], [2021, 2, 12], [2022, 2, 1], [2023, 1, 22],
  [2024, 2, 10], [2025, 1, 29], [2026, 2, 17], [2027, 2, 6], [2028, 1, 26], [2029, 2, 13], [2030, 2, 2],
];

describe('Tết Nguyên Đán Việt Nam 2000–2030 (31 năm)', () => {
  it.each(TET)('Tết %i: %i/%i', (y, m, d) => {
    expect(convertSolar2Lunar(d, m, y)).toEqual({ day: 1, month: 1, year: y, leap: false });
    expect(convertLunar2Solar(1, 1, y, false)).toEqual([d, m, y]);
  });
});

// Năm, tháng nhuận, ngày dương bắt đầu tháng nhuận.
const LEAP: Array<[number, number, [number, number, number]]> = [
  [2001, 4, [23, 5, 2001]], [2004, 2, [21, 3, 2004]], [2006, 7, [24, 8, 2006]], [2009, 5, [23, 6, 2009]],
  [2012, 4, [21, 5, 2012]], [2014, 9, [24, 10, 2014]], [2017, 6, [23, 7, 2017]], [2020, 4, [23, 5, 2020]],
  [2023, 2, [22, 3, 2023]], [2025, 6, [25, 7, 2025]], [2028, 5, [23, 6, 2028]],
];

describe('tháng nhuận 2000–2030', () => {
  it.each(LEAP)('%i nhuận tháng %i', (y, lm, [d, m, yy]) => {
    expect(leapMonthOfYear(y)).toBe(lm);
    expect(convertSolar2Lunar(d, m, yy)).toEqual({ day: 1, month: lm, year: y, leap: true });
    expect(convertLunar2Solar(1, lm, y, true)).toEqual([d, m, yy]);
  });

  it('các năm còn lại trong 2000–2030 không nhuận', () => {
    const leapYears = new Set(LEAP.map(([y]) => y));
    for (let y = 2000; y <= 2030; y++) if (!leapYears.has(y)) expect(leapMonthOfYear(y), String(y)).toBe(0);
  });
});

describe('những năm lịch Việt Nam (UTC+7) khác lịch Trung Quốc (UTC+8)', () => {
  it.each([
    // [năm, VN dd/mm, TQ dd/mm] — Nhân Dân; 2030 thêm en.wikipedia "Tết" / "Chinese New Year".
    [1968, [29, 1], [30, 1]],
    [1969, [16, 2], [17, 2]],
    [1985, [21, 1], [20, 2]],
    [2007, [17, 2], [18, 2]],
    [2030, [2, 2], [3, 2]],
  ] as Array<[number, [number, number], [number, number]]>)('Tết %i: VN %j, TQ %j', (y, [vd, vm], [cd, cm]) => {
    expect(convertLunar2Solar(1, 1, y, false)).toEqual([vd, vm, y]);
    expect(convertLunar2Solar(1, 1, y, false, 8)).toEqual([cd, cm, y]);
  });

  it('1984–1985: TQ nhuận tháng 10/1984, VN không nhuận 1984 mà nhuận tháng 2/1985 (21/3–19/4/1985)', () => {
    expect(leapMonthOfYear(1984)).toBe(0);
    expect(leapMonthOfYear(1984, 8)).toBe(10);
    expect(leapMonthOfYear(1985)).toBe(2);
    expect(convertSolar2Lunar(21, 3, 1985)).toEqual({ day: 1, month: 2, year: 1985, leap: true });
    expect(convertSolar2Lunar(19, 4, 1985)).toMatchObject({ month: 2, leap: true });
    expect(convertSolar2Lunar(23, 11, 1984)).toEqual({ day: 1, month: 11, year: 1984, leap: false });
  });

  it('2006: tháng 6 âm VN bắt đầu 25/6, TQ 26/6 (VnExpress)', () => {
    expect(convertLunar2Solar(1, 6, 2006, false)).toEqual([25, 6, 2006]);
    expect(convertLunar2Solar(1, 6, 2006, false, 8)).toEqual([26, 6, 2006]);
  });

  it('2008: tháng 11 âm VN bắt đầu 27/11, TQ 28/11 (VnExpress)', () => {
    expect(convertLunar2Solar(1, 11, 2008, false)).toEqual([27, 11, 2008]);
    expect(convertLunar2Solar(1, 11, 2008, false, 8)).toEqual([28, 11, 2008]);
  });
});
