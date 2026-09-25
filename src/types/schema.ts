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
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  cycle: 'quarter',
  reminderDay: 1,
  notificationsEnabled: false,
  locale: 'vi',
  activeProfileId: DEFAULT_PROFILE_ID,
};

/**
 * v2: thêm casts. v3: thêm profiles, quickNotes, và scope ('all' | 'profile').
 * File cũ vẫn nhập được: thiếu thì dùng mặc định (một hồ sơ "Tôi").
 */
export const BACKUP_SCHEMA_VERSION = 3;

export const backupSchema = z.object({
  app: z.literal('dinhvi'),
  schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  scope: z.enum(['all', 'profile']).default('all'),
  profiles: z.array(profileSchema).default([]),
  quickNotes: z.array(quickNoteSchema).default([]),
  exportedAt: isoDate,
  domains: z.array(domainSchema),
  positionings: z.array(positioningSchema),
  drafts: z.array(draftSchema),
  settings: settingsSchema,
  casts: z.array(castRecordSchema).default([]),
});
export type Backup = z.infer<typeof backupSchema>;
