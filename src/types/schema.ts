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
  sequenceNote: z.string().min(1),
  oppositeHexagram: z.number().int().min(1).max(64),
  lines: z.array(lineSchema).length(6),
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

export const domainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: isoDate,
  archived: z.boolean(),
});
export type Domain = z.infer<typeof domainSchema>;

export const WITNESS_STAGES = ['beginning', 'rising', 'peak', 'turning', 'declining', 'ending', 'unknown'] as const;

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
});
export type Positioning = z.infer<typeof positioningSchema>;

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
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  cycle: 'quarter',
  reminderDay: 1,
  notificationsEnabled: false,
  locale: 'vi',
};

export const BACKUP_SCHEMA_VERSION = 1;

export const backupSchema = z.object({
  app: z.literal('dinhvi'),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: isoDate,
  domains: z.array(domainSchema),
  positionings: z.array(positioningSchema),
  drafts: z.array(draftSchema),
  settings: settingsSchema,
});
export type Backup = z.infer<typeof backupSchema>;
