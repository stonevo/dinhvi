// Chuỗi giao diện tiếng Việt. Giọng: trung tính, không mệnh lệnh về đời sống,
// không tiên tri. Chỉ mô tả và đặt câu hỏi.
export const vi = {
  'app.name': 'Định Vị',
  'app.tagline': 'Nhật ký tự định vị định kỳ',

  'nav.home': 'Lĩnh vực',
  'nav.trajectory': 'Quỹ đạo',
  'nav.calibration': 'Hiệu chỉnh',
  'nav.settings': 'Cài đặt',

  'home.intro':
    'Mỗi kỳ, với từng lĩnh vực, bạn tự xác định mình đang đứng ở quẻ nào, hào nào — rồi đọc lời hào như ghi chép của những người từng đứng ở đúng chỗ ấy.',
  'home.period': 'Kỳ hiện tại: {period}',
  'home.addDomain': 'Thêm lĩnh vực',
  'home.domainPlaceholder': 'Tên lĩnh vực',
  'home.archive': 'Cất đi',
  'home.status.needsReview': 'Cần nhìn lại kỳ trước',
  'home.status.needsPositioning': 'Cần định vị kỳ này',
  'home.status.draft': 'Đang viết dở',
  'home.status.done': 'Xong',

  'settings.cycle': 'Chu kỳ',
  'settings.cycle.quarter': 'Hàng quý',
  'settings.cycle.month': 'Hàng tháng',
  'settings.reminderDay': 'Ngày nhắc trong kỳ',
  'settings.backup': 'Sao lưu',
  'settings.backup.hint':
    'Toàn bộ dữ liệu chỉ nằm trong trình duyệt này. Xuất ra JSON để tự giữ bản sao.',
  'settings.export': 'Xuất JSON',
  'settings.import': 'Nhập JSON',
  'settings.import.confirm':
    'Nhập file này thay thế TOÀN BỘ dữ liệu hiện có. Tiếp tục?',
  'settings.import.done': 'Đã nhập {domains} lĩnh vực, {positionings} bản ghi.',
  'settings.privacy': 'Không có máy chủ, không tài khoản, không gửi dữ liệu đi đâu.',

  'common.save': 'Lưu',
  'common.cancel': 'Huỷ',
  'common.back': 'Quay lại',
  'common.next': 'Tiếp',
  'common.loading': 'Đang tải…',
} as const;

export type MessageKey = keyof typeof vi;
