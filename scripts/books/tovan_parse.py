# Tách Tố Vấn (Nguyễn Tử Siêu dịch) theo hình học từng dòng của PDF:
# - cỡ chữ: kinh văn 10, chú giải / lời bàn 9, tiêu đề chương >= 14;
# - đoạn mới: dòng thụt vào so với lề, dòng trước ngắn hẳn, gạch đầu dòng, số chú đầu dòng;
# - dòng cùng cao độ trên một trang được ghép lại theo x (số chú in nhỏ hay tách thành dòng riêng);
# - bảng hai cột (trang 21–22): hết cột trái rồi tới cột phải.
import io, json, os, re
import pymupdf

PDF = r"C:\Users\TRUONG.VO\Downloads\HOÀNG ĐẾ NỘI KINH (toàn tập) - Bản đẹp.pdf"
OUT = os.path.join(os.path.dirname(__file__), "out")  # thư mục tạm, không commit
os.makedirs(OUT, exist_ok=True)
fix = lambda s: s.replace("ð", "Đ").replace("ñ", "đ").replace("\u00a0", " ")
doc = pymupdf.open(PDF)
ITEM = re.compile(r"^\s*\d+\.\s")

def page_lines(pg):
    raw = []
    for b in doc[pg].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans: continue
            t = fix("".join(s["text"] for s in l["spans"]))
            x0, y0, x1, y1 = l["bbox"]
            raw.append({"pg": pg + 1, "x0": x0, "x1": x1, "y": y1, "sz": max(s["size"] for s in spans),
                        "b": any("Bold" in s["font"] for s in spans), "t": t})
    raw.sort(key=lambda l: (round(l["y"]), l["x0"]))
    # gom dòng cùng cao độ
    rows = []
    for l in raw:
        if rows and abs(rows[-1][0]["y"] - l["y"]) < 3: rows[-1].append(l)
        else: rows.append([l])
    out, left, right = [], [], []
    def flush():
        out.extend(left); out.extend(right); left.clear(); right.clear()
    for r in rows:
        r.sort(key=lambda l: l["x0"])
        # hàng bảng hai cột: hai mục "n." ở hai cột
        if len(r) >= 2 and ITEM.match(r[0]["t"]) and any(ITEM.match(x["t"]) and x["x0"] > 200 for x in r[1:]):
            c = next(i for i, x in enumerate(r[1:], 1) if ITEM.match(x["t"]) and x["x0"] > 200)
            left.append(merge(r[:c])); right.append(merge(r[c:])); continue
        if (left or right) and ITEM.match(r[0]["t"]):
            (right if r[0]["x0"] > 200 else left).append(merge(r)); continue
        flush()
        out.append(merge(r))
    flush()
    return out

def merge(r):
    m = dict(r[0])
    m["t"] = " ".join(x["t"].strip() for x in r)
    m["x1"] = max(x["x1"] for x in r)
    m["sz"] = max(x["sz"] for x in r if not re.fullmatch(r"\s*\(\d+\)\s*\.?\s*", x["t"])) if any(not re.fullmatch(r"\s*\(\d+\)\s*\.?\s*", x["t"]) for x in r) else m["sz"]
    m["b"] = any(x["b"] for x in r)
    return m

L = []
for pg in range(doc.page_count):
    L.extend(page_lines(pg))

# Bảng danh sách vị thuốc: một loạt dòng "n. …" liền nhau (bỏ qua số trang, có thể sang trang)
# được đọc theo cột; sắp lại theo số thứ tự để cột phải và mục tràn sang trang về đúng chỗ.
def _is_pagenum(l): return re.fullmatch(r"\s*\d{1,3}\s*", l["t"]) and (l["y"] > 770 or l["y"] < 40)
i = 0
while i < len(L):
    if not ITEM.match(L[i]["t"]): i += 1; continue
    j, idx = i, []
    while j < len(L) and (ITEM.match(L[j]["t"]) or _is_pagenum(L[j])):
        if ITEM.match(L[j]["t"]): idx.append(j)
        j += 1
    if len(idx) >= 4:
        items = sorted((L[k] for k in idx), key=lambda l: int(re.match(r"\s*(\d+)", l["t"]).group(1)))
        for k, it in zip(idx, items): L[k] = it
    i = j

# lề từng trang
margins = {}
for pg in {l["pg"] for l in L}:
    full = [l for l in L if l["pg"] == pg and l["x1"] - l["x0"] > 250]
    if full:
        xs = sorted(l["x1"] for l in full)
        # lề phải: giá trị lớn nhất mà ít nhất 3 dòng cùng chạm tới (dòng canh đều nằm sát lề);
        # không dùng max (một dòng tràn lề) hay trung vị (trang có nhiều dòng danh sách ngắn)
        from collections import Counter
        cnt = Counter(round(x / 2) * 2 for x in xs)
        hits = [x for x, k in cnt.items() if k >= 3]
        margins[pg] = (min(l["x0"] for l in full), max(hits) if hits else xs[len(xs) // 2])
    else:
        margins[pg] = (28, 547)

PAGENUM = lambda l: re.fullmatch(r"\s*\d{1,3}\s*", l["t"]) and (l["y"] > 770 or l["y"] < 40)
END = re.compile(r"^\s*-*\s*[o0]{3}\s*-*\s*$|^\s*-+\s*o0+o\s*-+\s*$")
KV = re.compile(r"KINH VĂN\s*_{3,}|_{3,}\s*KINH VĂN")
CG = re.compile(r"^\s*CHÚ GIẢI\s*:?\s*_*\s*$")
APPX = re.compile(r"^\s*(PHỤ LỤC|LỜI DỊCH GIẢ)\s*_*\s*$")
SIGN = re.compile(r"^\s*\(Bản dịch\), xong ngày")
NOTE_RE = r"^\s*\(?(\d+)(?:-(\d+))?\)(?:_\.?|-\.|\.|-(?=\s))\s*"
NOTE = re.compile(NOTE_RE + r"(\S.*)$")
LONE = re.compile(r"^\s*\((\d+)\)\s*\.?\s*$")
BULLET = re.compile(r"^\s*(--\s*\.|-\s|¤\.|§\.|¥\.|•|\*|\d+\)\s*[-.]|Án\s*:|LẠI ÁN|CẨN ÁN)")

# chỉ tới hết chương 81 (bỏ 47 mục cuối)
start81 = next(i for i, l in enumerate(L) if re.match(r"\s*CHƯƠNG\s+81\b", l["t"]))
end81 = next(i for i in range(start81, len(L)) if END.match(L[i]["t"]))
appendix_from_page = L[end81 + 1]["pg"]
L = [l for l in L[:end81 + 1] if not PAGENUM(l)]

NUMWORD = {"một": 1, "hai": 2, "ba": 3, "bốn": 4, "năm": 5, "sáu": 6, "bảy": 7, "tám": 8, "chín": 9, "mười": 10}
def mark(m):
    word, n = m.group(1), int(m.group(2))
    w = word.lower().strip(".,;:")
    if NUMWORD.get(w) == n or (n > 10 and w in NUMWORD):
        return f"{word}[^{n}|so]"
    return f"{word}[^{n}]"
def norm(p, markers=True):
    p = re.sub(r"\s+", " ", p).strip()
    p = re.sub(r"^--\s*\.\s*", "— ", p)
    p = re.sub(r"^[¤§¥]\.\s*", "• ", p)
    p = re.sub(r"^•\s*", "• ", p)
    if markers: p = re.sub(r"(\S*)\s*\((\d{1,2})\)(?=[^\d)]|$)", mark, p)
    return p

class Para:
    """Gom dòng thành đoạn theo hình học."""
    def __init__(self, hanging=False):
        self.paras, self.prev, self.hanging = [], None, hanging
    def add(self, l, force_new=False, force_join=False):
        t = l["t"].strip()
        left, right = margins[l["pg"]]
        p = self.prev
        indent = l["x0"] > left + 8
        gap = margins[p["pg"]][1] - p["x1"] if p is not None else 0
        # dòng trước hụt hẳn (> 30) là hết đoạn; hụt vừa (15–30) chỉ tính khi dòng này mở bằng chữ hoa
        short_prev = p is not None and (gap > 30 or (gap > 15 and t[:1].isupper()))
        new = force_new or p is None or short_prev or BULLET.match(t) or NOTE.match(t)
        if self.hanging and indent and not short_prev and not NOTE.match(t) and not BULLET.match(t) and l["x0"] <= left + 25:
            new = False  # chú giải thụt treo: dòng tiếp của cùng chú (thụt sâu hơn = đầu đoạn mới trong chú)
        elif indent and not self.hanging:
            new = True
        if self.paras and re.fullmatch(r"[¤§¥*•]\s*\.?|--\s*\.?|—", self.paras[-1].strip()):
            new = False  # gạch đầu dòng đứng riêng một dòng
        if force_join and self.paras: new = False
        if new or not self.paras:
            self.paras.append(t)
        else:
            last = self.paras[-1]
            self.paras[-1] = last + t if (last.endswith("-") and not last.endswith(" -") and not last.endswith("--")) else last + " " + t
        self.prev = l

def unmark(p):
    return re.sub(r"\s*\[\^(\d+)(?:\|so)?\]", lambda m: f" ({m.group(1)})", p)

HEAD = re.compile(r"^\s*CHƯƠNG\s+(\d+)\b(.*)$")
chap_starts = [i for i, l in enumerate(L) if HEAD.match(l["t"]) and l["b"]]
front = L[:chap_starts[0]]
report, chapters = [], []
NUMFLAG = re.compile(r"\[\^(\d+)\|so\]")

def finish_block(text_p, notes_p, title_mark, bi, n, page):
    text = [norm(x) for x in text_p.paras]
    fixed = []
    for p in text:
        lm = re.fullmatch(r"\[\^(\d+)\]\.?", p)
        if lm and fixed: fixed[-1] += f"[^{lm.group(1)}]"
        else: fixed.append(p)
    text = fixed
    notes, an, cur, an_item = [], [], None, None
    for raw in notes_p.paras:
        p = norm(raw, markers=False)
        nm = re.match(NOTE_RE + r"(.*)$", p)
        num = int(nm.group(1)) if nm else None
        last_note = notes[-1].get("to", notes[-1]["n"]) if notes else 0
        if nm and nm.group(3) and an and an[-1]["after"] == last_note and (an_item is not None and num == an_item + 1 or num != last_note + 1):
            an[-1]["paras"].append(f"{num}) {nm.group(3)}"); an_item = num  # danh sách trong lời bàn
        elif nm and nm.group(3):
            cur = {"n": num, "paras": [nm.group(3)]}
            if nm.group(2): cur["to"] = int(nm.group(2))
            notes.append(cur); an_item = None
        elif re.match(r"^(Án|ÁN|LẠI ÁN|CẨN ÁN)\s*:", p) or cur is None:
            cur = None
            body = re.sub(r"^(Án|ÁN)\s*:\s*", "", p)
            if an and an[-1]["after"] == last_note and not re.match(r"^(Án|ÁN|LẠI ÁN|CẨN ÁN)\s*:", p):
                an[-1]["paras"].append(body)  # đoạn tiếp của lời bàn (giữ số thứ tự danh sách đang chạy)
            else:
                an.append({"after": last_note, "paras": [body]})
                an_item = None
        else:
            cur["paras"].append(p)
    note_nums = {v for x in notes for v in range(x["n"], x.get("to", x["n"]) + 1)}
    plain = {int(x) for t in text for x in re.findall(r"\[\^(\d+)\]", t)}
    text = [NUMFLAG.sub(lambda m: f"[^{m.group(1)}]" if (int(m.group(1)) in note_nums and int(m.group(1)) not in plain) else f" ({m.group(1)})", t) for t in text]
    b = {"text": text, "notes": notes}
    if an: b["an"] = an
    marks = sorted({int(x) for t in text for x in re.findall(r"\[\^(\d+)\]", t)} | ({title_mark} if (bi == 0 and title_mark) else set()))
    nums = sorted(v for x in notes for v in range(x["n"], x.get("to", x["n"]) + 1))
    if marks != nums or len(nums) != len(set(nums)):
        report.append({"chapter": n, "block": bi, "marks": marks, "notes": nums, "page": page})
    return b

def app_paras(lines):
    P = Para()
    for l in lines:
        t = l["t"].strip()
        # tiêu đề nhỏ trong phụ lục: chữ đậm, hoặc dòng in hoa ngắn đứng giữa
        if len(t) < 60 and len(re.findall(r"[^\W\d_]", t)) >= 3 and not ITEM.match(t) and not re.match(r"\d+\)", t) and t.upper() == t and (l["b"] or l["x0"] > margins[l["pg"]][0] + 60):
            P.paras.append("# " + t); P.prev = None; continue
        P.add(l, force_new=bool(ITEM.match(t)))
    return [p if p.startswith("# ") else unmark(norm(p)) for p in P.paras]

for ci, s in enumerate(chap_starts):
    e = chap_starts[ci + 1] if ci + 1 < len(chap_starts) else len(L)
    seg = L[s:e]
    m = HEAD.match(seg[0]["t"])
    n = int(m.group(1)); head_extra = m.group(2).strip()
    k = 1
    title_lines = []
    while k < len(seg) and seg[k]["sz"] >= 14:
        title_lines.append(seg[k]["t"].strip()); k += 1
    title = " ".join(title_lines)
    title_mark = None
    tm = re.search(r"\((\d+)\)\s*$", title)
    if tm: title_mark = int(tm.group(1)); title = title[:tm.start()].strip()
    intro, blocks, appendices, outro = Para(), [], [], []
    mode, tp, npar, appx, appx_title, page0 = "intro", None, None, None, None, None
    def close_block():
        if tp is not None: blocks.append(finish_block(tp, npar, title_mark, len(blocks), n, page0))
    def close_appx():
        if appx is not None: appendices.append({"title": appx_title, "paras": app_paras(appx)})
    for l in seg[k:]:
        t = l["t"]
        if END.match(t) or re.fullmatch(r"\s*_{5,}\s*", t) or t.strip() == "*": continue
        if SIGN.match(t):
            close_block(); tp = None; close_appx(); appx = None
            mode = "outro"; outro.append(t.strip()); continue
        if mode in ("outro", "appx") and KV.search(t):
            close_appx(); appx = None
            tp, npar, mode, page0 = Para(), Para(hanging=True), "text", l["pg"]; continue
        if mode == "outro" and not APPX.match(t):
            outro.append(t.strip()); continue
        mm = APPX.match(t)
        if mm:
            close_block(); tp = None; close_appx()
            appx, appx_title, mode = [], ("Lời dịch giả" if mm.group(1) == "LỜI DỊCH GIẢ" else "Phụ lục"), "appx"; continue
        if mode == "appx": appx.append(l); continue
        if KV.search(t):
            close_block()
            tp, npar, mode, page0 = Para(), Para(hanging=True), "text", l["pg"]; continue
        if CG.match(t):
            if tp is not None: mode = "notes"
            continue
        if mode == "intro": intro.add(l); continue
        # số chú đứng riêng một dòng (in nhỏ) trong kinh văn
        if mode == "text" and LONE.match(t) and tp.paras:
            tp.paras[-1] += " " + t.strip(); continue
        if mode == "text" and NOTE.match(t.strip()):
            mode = "notes"
        elif mode == "text" and l["sz"] < 9.6:
            pv = tp.prev
            # chữ nhỏ ngay sau một dòng kinh văn đầy (câu chưa hết) là lời chú chen trong câu, không phải phần chú giải
            if pv is None or pv["x1"] < margins[pv["pg"]][1] - 25:
                mode = "notes"
        (tp if mode == "text" else npar).add(l)
    close_block(); close_appx()
    ch = {"n": n, "title": title}
    if head_extra: ch["headNote"] = head_extra.strip("() ")
    if title_mark: ch["titleNote"] = title_mark
    if intro.paras: ch["intro"] = [unmark(norm(p)) for p in intro.paras]
    ch["blocks"] = blocks
    if appendices: ch["appendices"] = appendices
    if outro: ch["outro"] = [" ".join(outro)]
    ch["pages"] = [seg[0]["pg"], seg[-1]["pg"]]
    chapters.append(ch)

# phần đầu: trang bìa + Tiểu dẫn
FP = Para()
for l in front: FP.add(l, force_new=l["sz"] >= 12)
preface = [unmark(norm(p)) for p in FP.paras]
fp_pages = sorted({l["pg"] for l in front})

json.dump({"preface": preface, "prefacePages": [fp_pages[0], fp_pages[-1]], "chapters": chapters, "appendixFromPage": appendix_from_page},
          io.open(os.path.join(OUT, "tovan2.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
json.dump(report, io.open(os.path.join(OUT, "report2.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
nb = sum(len(c["blocks"]) for c in chapters); nn = sum(len(b["notes"]) for c in chapters for b in c["blocks"])
print("chapters", len(chapters), "blocks", nb, "notes", nn, "mismatch", len(report))
for r in report: print(r)
