import type { StaticData } from '../../data/load';
import type { DraftData } from '../draft';

export type StepProps = {
  d: DraftData;
  set: (patch: Partial<DraftData>) => void;
  data: StaticData;
  goTo: (step: number) => void;
  /** Tên lĩnh vực đang định vị (dùng làm chủ đề khi hỏi nhân chứng qua link). */
  domainName?: string;
};
