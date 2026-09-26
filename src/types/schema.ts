import { z } from 'zod';

// Nguồn schema duy nhất. Type TS suy ra từ đây (z.infer) để validate import
// và dữ liệu tĩnh dùng cùng một định nghĩa.

export const TRIGRAM_KEYS = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'] as const;
export const trigramKey = z.enum(TRIGRAM_KEYS);
export type TrigramKey = z.infer<typeof trigramKey>;

export const tier = z.enum(['earth', 'human', 'heaven']);
export type Tier = z.infer<typeof tier>;

export const linePosition = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6),
]);
export type LinePosition = z.infer<typeof linePosition>;

export const STAGES = [
  'beginning', 'rising', 'peak', 'turning', 'declining', 'ending', 'stagnant', 'transitional',
] as const;
export const stageInCycle = z.enum(STAGES);
export type StageInCycle = z.infer<typeof stageInCycle>;

// ---------- Dữ liệu tĩnh ----------

export const trigramSchema = z.object({
  key: trigramKey,
  nameHanViet: z.string().min(1),
  nameHan: z.string().min(1),
  binary: z.string().regex(/^[01]{3}$/),
  image: z.string().min(1),
  asInnerState: z.string().min(1),
  asOuterSituation: z.string().min(1),
  innerSignals: z.array(z.string().min(1)).min(3).max(5),
  outerSignals: z.array(z.string().min(1)).min(3).max(5),
});
export type Trigram = z.infer<typeof trigramSchema>;

export const lineSchema = z.object({
  position: linePosition,
  yinYang: z.enum(['yin', 'yang']),
  tier,
  original: z.string().min(1),
  /** Lời hào chữ Hán, kèm nhãn (初九：…), theo Kanripo KR1a0001. */
  originalHan: z.string().min(1),
  situation: z.string().min(1),
  behavioralSignals: z.array(z.string().min(1)),
  characteristicRisk: z.string(),
  commonFailure: z.string(),
  traditionalCounsel: z.string(),
  whatTendsToFollow: z.string(),
  reflectionQuestions: z.array(z.string().min(1)),
  draft: z.boolean().optional(),
});
export type Line = z.infer<typeof lineSchema>;

export const allMovingSchema = z.object({
  original: z.string().min(1),
  originalHan: z.string().min(1),
  situation: z.string().min(1),
  characteristicRisk: z.string().min(1),
  commonFailure: z.string().min(1),
  traditionalCounsel: z.string().min(1),
  whatTendsToFollow: z.string().min(1),
  reflectionQuestions: z.array(z.string().min(1)).min(1),
});
export type AllMoving = z.infer<typeof allMovingSchema>;

export const hexagramSchema = z.object({
  kingWenNumber: z.number().int().min(1).max(64),
  nameHanViet: z.string().min(1),
  nameHan: z.string().min(1),
  nameVi: z.string().min(1),
  binary: z.string().regex(/^[01]{6}$/),
  lowerTrigram: trigramKey,
  upperTrigram: trigramKey,
  theme: z.string().min(1),
  stageInCycle,
  judgment: z.string().min(1),
  /** Lời quẻ chữ Hán, theo Kanripo KR1a0001. */
  judgmentHan: z.string().min(1),
  sequenceNote: z.string().min(1),
  oppositeHexagram: z.number().int().min(1).max(64),
  lines: z.array(lineSchema).length(6),
  /** Dụng cửu (Càn) / Dụng lục (Khôn): đọc khi cả sáu hào đều động. */
  allMoving: allMovingSchema.optional(),
  sources: z.array(z.string()).optional(),
});
export type Hexagram = z.infer<typeof hexagramSchema>;

export const lineTierSchema = z.object({
  position: linePosition,
  tier,
  summary: z.string().min(1),
  checklist: z.array(z.object({ id: z.string().min(1), question: z.string().min(1) })).min(4).max(6),
});
export type LineTier = z.infer<typeof lineTierSchema>;

// ---------- Dữ liệu người dùng ----------

const isoDate = z.string().min(1);

/** Hồ sơ mặc định: dữ liệu trước khi có nhiều hồ sơ được gán vào đây. */
export const DEFAULT_PROFILE_ID = 'me';

export const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: isoDate,
});
export type Profile = z.infer<typeof profileSchema>;

export const domainSchema = z.object({
  id: z.string().min(1),
  /** Hồ sơ sở hữu lĩnh vực; bản ghi và nháp đi theo lĩnh vực. */
  profileId: z.string().min(1).default(DEFAULT_PROFILE_ID),
  name: z.string().min(1),
  createdAt: isoDate,
  archived: z.boolean(),
});
export type Domain = z.infer<typeof domainSchema>;

export const WITNESS_STAGES = ['beginning', 'rising', 'peak', 'turning', 'declining', 'ending', 'unknown'] as const;

/** Giá trị một hào khi gieo: 6 lão âm, 7 thiếu dương, 8 thiếu âm, 9 lão dương. */
export const lineValue = z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)]);

export const witnessSchema = z.object({
  who: z.string(),
  theirStage: z.enum(WITNESS_STAGES),
  theirLineGuess: z.number().int().min(1).max(6).nullable(),
  note: z.string(),
  askedAt: isoDate,
});
export type Witness = z.infer<typeof witnessSchema>;

const yesPartlyNo = z.enum(['yes', 'partly', 'no']);

export const hindsightSchema = z.object({
  reviewedAt: isoDate,
  actualHexagram: z.number().int().min(1).max(64).nullable(),
  actualLine: z.number().int().min(1).max(6).nullable(),
  selfWasRight: yesPartlyNo,
  whatHappened: z.string(),
  willNotDoKept: z.enum(['yes', 'partly', 'no', 'na']),
  notes: z.string(),
});
export type Hindsight = z.infer<typeof hindsightSchema>;

export const positioningSchema = z.object({
  id: z.string().min(1),
  domainId: z.string().min(1),
  period: z.string().regex(/^\d{4}-(Q[1-4]|(0[1-9]|1[0-2]))$/),
  createdAt: isoDate,

  // Bước 1
  facts: z.array(z.string()),

  // Bước 2
  innerTrigram: trigramKey,
  innerEvidence: z.string(),
  outerTrigram: trigramKey,
  outerEvidence: z.string(),
  hexagram: z.number().int().min(1).max(64),

  // Bước 3
  sequenceCheck: z.enum(['fits', 'partly', 'doesNotFit', 'skipped']),
  sequenceNote: z.string(),

  // Bước 4
  tier,
  tierEvidence: z.string(),
  line: linePosition,
  tierChecklistAnswers: z.record(z.string(), z.boolean()),
  behavioralSignalsMatched: z.array(z.number().int().min(0)),

  // Bước 5
  painfulSentence: z.string(),
  painType: z.enum(['specific', 'vague', 'none']),
  reflectionAnswers: z.array(z.string()).optional(),

  // Bước 6
  criticHexagram: z.number().int().min(1).max(64).nullable(),
  criticLine: z.number().int().min(1).max(6).nullable(),
  criticComparison: z.string(),

  // Bước 7
  witness: witnessSchema.nullable(),

  // Bước 8
  finalHexagram: z.number().int().min(1).max(64),
  finalLine: z.number().int().min(1).max(6),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  changedAfterTests: z.boolean(),
  willNotDo: z.string().min(1),
  notes: z.string(),

  // Kỳ sau
  hindsight: hindsightSchema.nullable(),

  /** Cách có quẻ ở bước 2. Thiếu = 'self' (bản ghi trước khi có chức năng gieo). */
  method: z.enum(['self', 'cast']).optional(),
  /** Sáu giá trị hào khi gieo (6/7/8/9, từ dưới lên). */
  castLines: z.array(lineValue).length(6).optional(),
});
export type Positioning = z.infer<typeof positioningSchema>;

/** Ngữ cảnh câu hỏi khi gieo (dùng cho diễn giải theo ngữ cảnh và Dụng thần). */
export const CONTEXT_KEYS = ['work', 'love', 'money', 'health', 'travel'] as const;
export const contextKey = z.enum(CONTEXT_KEYS);
export type ContextKey = z.infer<typeof contextKey>;

/** Cách lập quẻ của một lần gieo. */
export const CAST_METHODS = ['coins', 'coins-manual', 'meihua-time', 'meihua-number', 'meihua-text'] as const;
export const castMethod = z.enum(CAST_METHODS);
export type CastMethod = z.infer<typeof castMethod>;

/** Đối chiếu kết quả của một lần gieo. */
export const castOutcomeSchema = z.object({
  verdict: z.enum(['yes', 'partial', 'no']),
  note: z.string(),
  at: isoDate,
});
export type CastOutcome = z.infer<typeof castOutcomeSchema>;

/** Một lần gieo ở mục "Gieo quẻ" — tách khỏi bản ghi định vị. */
export const castRecordSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1).default(DEFAULT_PROFILE_ID),
  createdAt: isoDate,
  question: z.string(),
  lines: z.array(lineValue).length(6),
  primary: z.number().int().min(1).max(64),
  moving: z.array(z.number().int().min(1).max(6)),
  transformed: z.number().int().min(1).max(64).nullable(),
  notes: z.string(),
  /** Ngữ cảnh câu hỏi (bản ghi cũ không có). */
  context: contextKey.optional(),
  method: castMethod.default('coins'),
  /** Dữ liệu đầu vào của phép lập quẻ (số, chữ, giờ) để xem lại. */
  methodInput: z.string().optional(),
  /** Ngày hẹn đối chiếu kết quả (YYYY-MM-DD). */
  checkOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  outcome: castOutcomeSchema.optional(),
  /** Giới tính người hỏi (chỉ dùng chọn Dụng thần khi hỏi tình cảm). */
  askerGender: z.enum(['male', 'female']).optional(),
});
export type CastRecord = z.infer<typeof castRecordSchema>;

/** Ghi nhanh giữa các kỳ: một quẻ, một hào, một dòng — không tính vào hiệu chỉnh. */
export const quickNoteSchema = z.object({
  id: z.string().min(1),
  domainId: z.string().min(1),
  createdAt: isoDate,
  period: z.string().min(1),
  method: z.enum(['pick', 'cast']),
  hexagram: z.number().int().min(1).max(64),
  line: z.number().int().min(1).max(6),
  castLines: z.array(lineValue).length(6).optional(),
  note: z.string(),
});
export type QuickNote = z.infer<typeof quickNoteSchema>;

/** Nháp của luồng 8 bước. Tách bảng để bản ghi chính luôn đầy đủ. */
export const draftSchema = z.object({
  id: z.string().min(1),
  domainId: z.string().min(1),
  period: z.string().min(1),
  step: z.number().int().min(0).max(8),
  data: z.record(z.string(), z.unknown()),
  updatedAt: isoDate,
});
export type PositioningDraft = z.infer<typeof draftSchema>;

export const settingsSchema = z.object({
  id: z.literal('settings'),
  cycle: z.enum(['quarter', 'month']),
  /** Ngày trong kỳ để nhắc (1..28). */
  reminderDay: z.number().int().min(1).max(28),
  notificationsEnabled: z.boolean(),
  locale: z.enum(['vi']),
  /** Kỳ gần nhất đã gửi thông báo nhắc — để không nhắc lặp trong cùng kỳ. */
  lastReminderPeriod: z.string().optional(),
  /** Hồ sơ đang dùng trên máy này. */
  activeProfileId: z.string().min(1).default(DEFAULT_PROFILE_ID),
  /** Đã xem màn hướng dẫn lần đầu. */
  onboarded: z.boolean().optional(),
  /** Ngày (YYYY-MM-DD, giờ VN) đã nhắc đối chiếu lần gieo — mỗi ngày nhắc tối đa một lần. */
  lastCastReminderOn: z.string().optional(),
  /** Âm thanh và rung khi gieo xu. */
  castSound: z.boolean().default(true),
  /** Từ 23h tính sang ngày mới (giờ Tý đầu ngày) khi lấy can chi và ngày âm. */
  ziStartsNextDay: z.boolean().default(true),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  cycle: 'quarter',
  reminderDay: 1,
  notificationsEnabled: false,
  locale: 'vi',
  activeProfileId: DEFAULT_PROFILE_ID,
  castSound: true,
  ziStartsNextDay: true,
};

/** Tiến độ học một thẻ ở trang "Học" (lặp lại ngắt quãng), theo hồ sơ. */
export const studyStateSchema = z.object({
  /** `${profileId}|${cardId}` */
  id: z.string().min(1),
  profileId: z.string().min(1),
  cardId: z.string().min(1),
  /** Lần ôn tới (epoch ms). */
  due: z.number(),
  /** Khoảng cách hiện tại, tính bằng ngày (0 = đang học lại trong ngày). */
  interval: z.number().min(0),
  ease: z.number().min(1),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  firstSeen: z.number(),
  lastReviewed: z.number(),
});
export type StudyState = z.infer<typeof studyStateSchema>;

/**
 * v2: thêm casts. v3: thêm profiles, quickNotes, và scope ('all' | 'profile').
 * v4: thêm study (tiến độ trang Học).
 * File cũ vẫn nhập được: thiếu thì dùng mặc định (một hồ sơ "Tôi").
 */
export const BACKUP_SCHEMA_VERSION = 4;

export const backupSchema = z.object({
  app: z.literal('dinhvi'),
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  scope: z.enum(['all', 'profile']).default('all'),
  profiles: z.array(profileSchema).default([]),
  quickNotes: z.array(quickNoteSchema).default([]),
  exportedAt: isoDate,
  domains: z.array(domainSchema),
  positionings: z.array(positioningSchema),
  drafts: z.array(draftSchema),
  settings: settingsSchema,
  casts: z.array(castRecordSchema).default([]),
  study: z.array(studyStateSchema).default([]),
});
export type Backup = z.infer<typeof backupSchema>;

// ---- Kinh & Truyện: dịch sát, Thoán, Tượng, giảng, ý các nhà chú giải ----
// Chữ Hán trích từ Kanripo KR1a0001; phần tiếng Việt tự dịch và tự giảng từ
// Thập Dực, Trình Di (Y Xuyên Dịch truyện, KR1a0016), Chu Hy (Chu Dịch bản nghĩa, KR1a0031).

export const commentaryViewSchema = z.object({
  /** Tên nhà chú giải, vd. "Trình Di", "Chu Hy". */
  source: z.string().min(1),
  text: z.string().min(1),
});
export type CommentaryView = z.infer<typeof commentaryViewSchema>;

export const commentaryPartSchema = z.object({
  /** Dịch sát nghĩa lời quẻ / lời hào. */
  literal: z.string(),
  /** Tượng truyện chữ Hán (Đại tượng cho lời quẻ, Tiểu tượng cho hào). */
  imageHan: z.string().min(1),
  image: z.string(),
  /** Giảng: vì sao lời như vậy (hình tượng, vị trí hào, quan hệ các hào). */
  explain: z.string(),
  /** Ý riêng của từng nhà chú giải, nhất là chỗ họ hiểu khác nhau. */
  views: z.array(commentaryViewSchema),
});
export type CommentaryPart = z.infer<typeof commentaryPartSchema>;

export const hexagramCommentarySchema = z.object({
  kingWenNumber: z.number().int().min(1).max(64),
  judgment: commentaryPartSchema.extend({
    /** Thoán truyện chữ Hán. */
    tuanHan: z.string().min(1),
    tuan: z.string(),
  }),
  lines: z.array(commentaryPartSchema).length(6),
  /** Dụng cửu / Dụng lục (Càn, Khôn). */
  allMoving: commentaryPartSchema.optional(),
  /** Văn ngôn (chỉ Càn, Khôn), từng đoạn: chữ Hán, bản dịch, giảng, ý các nhà chú giải. */
  wenyan: z
    .array(
      z.object({
        han: z.string().min(1),
        /** Tiêu đề ngắn của đoạn, vd. "Bốn đức nguyên, hanh, lợi, trinh". */
        title: z.string(),
        vi: z.string(),
        explain: z.string(),
        views: z.array(commentaryViewSchema),
      }),
    )
    .optional(),
});
export type HexagramCommentary = z.infer<typeof hexagramCommentarySchema>;

// ---- Diễn giải theo ngữ cảnh (công việc, tình cảm, tài chính, sức khoẻ, đi xa) ----
// Lời diễn giải của app, bám nghĩa lời quẻ / lời hào; public/data/contexts.json.

export const contextTextsSchema = z.object({
  work: z.string().min(1),
  love: z.string().min(1),
  money: z.string().min(1),
  health: z.string().min(1),
  travel: z.string().min(1),
});
export type ContextTexts = z.infer<typeof contextTextsSchema>;

export const hexagramContextsSchema = z.object({
  kingWenNumber: z.number().int().min(1).max(64),
  judgment: contextTextsSchema,
  lines: z.array(contextTextsSchema).length(6),
  allMoving: contextTextsSchema.optional(),
});
export type HexagramContexts = z.infer<typeof hexagramContextsSchema>;
