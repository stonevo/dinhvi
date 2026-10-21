import io, json, os, re, collections, unicodedata
src = io.open(os.path.join(os.path.dirname(__file__), "tovan_parse.py"), encoding="utf8").read().split("NUMWORD = ")[0]
g = {"__file__": os.path.join(os.path.dirname(__file__), "tovan_parse.py")}; exec(src, g)
L = g["L"]
def words(t):
    return re.findall(r"[0-9a-zà-ỹđ]+", unicodedata.normalize("NFC", t).lower())
raw = collections.Counter()
for l in L:
    t = l["t"]
    if g["END"].match(t) or re.fullmatch(r"\s*_{5,}\s*", t): continue
    raw.update(words(re.sub(r"KINH VĂN|CHÚ GIẢI|PHỤ LỤC|LỜI DỊCH GIẢ", " ", t)))
d = json.load(io.open(os.path.join(os.path.dirname(__file__), "out", "tovan2.json"), encoding="utf8"))
out = collections.Counter()
add = lambda t: out.update(words(re.sub(r"\[\^(\d+)\]", r" \1 ", t)))
for p in d["preface"]: add(p)
for c in d["chapters"]:
    add(f"chương {c['n']} {c.get('headNote','')} {c['title']} {c.get('titleNote','')}")
    for p in c.get("intro", []) + c.get("outro", []): add(p)
    for b in c["blocks"]:
        for t in b["text"]: add(t)
        for n in b["notes"]:
            add(str(n["n"]) + (" " + str(n["to"]) if "to" in n else ""))
            for p in n["paras"]: add(p)
        for a in b.get("an", []):
            for p in a["paras"]: add(p)
    for a in c.get("appendices", []):
        for p in a["paras"]: add(p.lstrip("# "))
miss = raw - out; extra = out - raw
print("raw", sum(raw.values()), "out", sum(out.values()))
print("missing", sum(miss.values()), miss.most_common(20))
print("extra", sum(extra.values()), extra.most_common(20))
