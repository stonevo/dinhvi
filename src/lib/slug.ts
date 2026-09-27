/** Chuỗi không dấu, chữ thường, nối bằng "-": dùng làm neo cho tiêu đề mục (vd. ?h=day-thi-voi). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
