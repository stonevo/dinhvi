import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  hexagramCommentarySchema, hexagramSchema, lineTierSchema, trigramSchema,
  type Hexagram, type HexagramCommentary, type LineTier, type Trigram, type TrigramKey,
} from '../types/schema';

// Dữ liệu tĩnh nằm ở public/data để người tự host sửa được mà không build lại.
// Service worker precache các file này, nên vẫn dùng được offline.

export type StaticData = {
  trigrams: Record<TrigramKey, Trigram>;
  trigramList: Trigram[];
  hexagrams: Hexagram[];
  lineTiers: LineTier[];
  hexagram: (n: number) => Hexagram;
};

async function fetchJson<T>(name: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}`);
  if (!res.ok) throw new Error(`Không tải được ${name} (${res.status})`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    throw new Error(`${name} sai định dạng: ${i.path.join('.')} — ${i.message}`);
  }
  return parsed.data;
}

let cache: Promise<StaticData> | null = null;

export function loadStaticData(): Promise<StaticData> {
  cache ??= Promise.all([
    fetchJson('trigrams.json', z.array(trigramSchema)),
    fetchJson('hexagrams.json', z.array(hexagramSchema).length(64)),
    fetchJson('lineTiers.json', z.array(lineTierSchema).length(6)),
  ]).then(([trigramList, hexagrams, lineTiers]) => {
    const byNumber = new Map(hexagrams.map((h) => [h.kingWenNumber, h]));
    return {
      trigramList,
      trigrams: Object.fromEntries(trigramList.map((t) => [t.key, t])) as Record<TrigramKey, Trigram>,
      hexagrams,
      lineTiers,
      hexagram: (n: number) => {
        const h = byNumber.get(n);
        if (!h) throw new RangeError(`Không có quẻ ${n}`);
        return h;
      },
    };
  });
  cache.catch(() => {
    cache = null; // cho phép thử lại
  });
  return cache;
}

export function useStaticData(): { data: StaticData | null; error: string | null } {
  const [state, setState] = useState<{ data: StaticData | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    loadStaticData().then(
      (data) => alive && setState({ data, error: null }),
      (e: unknown) => alive && setState({ data: null, error: String(e instanceof Error ? e.message : e) }),
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

// Kinh & Truyện (dịch sát, Thoán, Tượng, giảng) nằm ở file riêng, chỉ tải khi cần xem.
let commentaryCache: Promise<Map<number, HexagramCommentary>> | null = null;

export function loadCommentary(): Promise<Map<number, HexagramCommentary>> {
  commentaryCache ??= fetchJson('commentary.json', z.array(hexagramCommentarySchema).length(64)).then(
    (list) => new Map(list.map((c) => [c.kingWenNumber, c])),
  );
  commentaryCache.catch(() => {
    commentaryCache = null;
  });
  return commentaryCache;
}

/** Kinh & Truyện của một quẻ; null khi đang tải hoặc tải lỗi. */
export function useCommentary(n: number): HexagramCommentary | null {
  const [state, setState] = useState<HexagramCommentary | null>(null);
  useEffect(() => {
    let alive = true;
    loadCommentary().then(
      (m) => alive && setState(m.get(n) ?? null),
      () => alive && setState(null),
    );
    return () => {
      alive = false;
    };
  }, [n]);
  return state;
}
