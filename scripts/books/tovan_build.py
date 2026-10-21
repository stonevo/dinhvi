# Ghi dữ liệu sách vào app: public/data/books.json + public/data/books/to-van/<id>.json
import io, json, os, re

HERE = os.path.dirname(__file__)
APP = os.path.join(HERE, "..", "..", "public", "data")
d = json.load(io.open(os.path.join(HERE, "out", "tovan2.json"), encoding="utf8"))
report = json.load(io.open(os.path.join(HERE, "out", "report2.json"), encoding="utf8"))
BOOK = "to-van"
os.makedirs(os.path.join(APP, "books", BOOK), exist_ok=True)

# Chỗ bản gõ lệch giữa dấu chú trong câu và chú giải (đã đối chiếu tay với PDF).
WHY = {
    (4, 11): "Thiếu một chú giải: dấu (8) “bộ phận ĐẦU” không có chú; chú đánh số (8) “Giác : …” thực ra giải cho dấu (9) “tiếng GIÁC”. Giữ nguyên như bản gõ.",
    (17, 7): "Câu kinh văn không có dấu (1) nhưng có chú giải (1).",
    (66, 8): "Có dấu (1), (2) nhưng bản gõ không có chú giải.",
    (67, 5): "Bản gõ thiếu dấu (2) trong câu, có chú giải (2).",
    (69, 19): "Câu kinh văn không có dấu (1) nhưng có chú giải (1).",
    (72, 29): "Câu “Phong hoá tám (8)” có lẽ là dấu (1) gõ nhầm; giữ nguyên, chú giải (1) để ở cuối khối.",
    (72, 46): "Có chú giải (3) nhưng câu kinh văn không có dấu (3).",
}
issues = []
for r in report:
    key = (r["chapter"], r["block"])
    assert key in WHY, f"lệch chưa giải thích: {r}"
    issues.append({"chapter": str(r["chapter"]), "block": r["block"], "page": r["page"], "note": WHY[key]})

pre = d["preface"]
i_td = pre.index("TIỂU DẪN")
front_tieudan = {"id": "tieu-dan", "kind": "front", "title": "Tiểu dẫn", "by": "Mã Nguyên Đài", "intro": pre[i_td + 1:], "blocks": [], "pages": [2, 2]}  # trang 1 là bìa

# Trang của "Lời dịch giả" trong bản gõ (đối chiếu tay: tr. 261–262).
LDG_PAGES = [261, 262]
chapters_out = []
loi_dich_gia = None
for c in d["chapters"]:
    appx = []
    for a in c.get("appendices", []):
        if a["title"] == "Lời dịch giả":
            loi_dich_gia = {"id": "loi-dich-gia", "kind": "front", "title": "Lời dịch giả", "by": "Nguyễn Tử Siêu", "intro": a["paras"], "blocks": [], "pages": LDG_PAGES}
        else:
            appx.append(a)
    ch = {"id": str(c["n"]), "kind": "chapter", "n": c["n"], "title": c["title"]}
    for k in ("headNote", "titleNote", "intro", "outro"):
        if k in c: ch[k] = c[k]
    ch["blocks"] = c["blocks"]
    if appx: ch["appendices"] = appx
    ch["pages"] = c["pages"]
    chapters_out.append(ch)
assert loi_dich_gia

all_ch = [front_tieudan, loi_dich_gia] + chapters_out
for ch in all_ch:
    json.dump(ch, io.open(os.path.join(APP, "books", BOOK, f"{ch['id']}.json"), "w", encoding="utf8", newline="\n"), ensure_ascii=False, separators=(",", ":"))

def title_case(t):
    return t  # giữ nguyên chữ hoa của sách

book = {
    "id": BOOK,
    "title": "Hoàng Đế Nội Kinh Tố Vấn",
    "titleHan": "黃帝內經·素問",
    "translator": "Nguyễn Tử Siêu (Liên Tâm Lão Nhân)",
    "commentator": "Mã Nguyên Đài",
    "translated": "Dịch xong ngày 22 tháng 5 năm Quý Tỵ (02/7/1953)",
    "epigraph": pre[2] + " " + pre[3],
    "summary": "Hoàng Đế hỏi, Kỳ Bá cùng các bầy tôi đáp về âm dương, bốn mùa, tạng phủ, kinh mạch, mạch chẩn, bệnh và phép chữa. Bản dịch Nguyễn Tử Siêu kèm chú giải của Mã Nguyên Đài.",
    "source": "Bản gõ lại năm 2009 (người gõ ký tên THIEN LANG) từ bản dịch của Nguyễn Tử Siêu. App chỉ sửa lỗi phông chữ (ð → Đ, ñ → đ), ghép dòng thành đoạn và dựng lại bảng hai cột ở chương 5; không sửa lời dịch, kể cả chính tả cũ như “bịnh”.",
    "notes": [
        "Sách đánh số 79 chương: số chương nhảy từ 70 sang 72, và sách ghi “Chương 73 không có”.",
        "Từ chương 75 tới 81, dịch giả cho biết chỉ trích dịch những điểm chính (xem lời dẫn chương 75).",
        "Phần 47 mục về người học Đạo ở cuối bản gõ không thuộc Tố Vấn nên không đưa vào.",
    ],
    "chapters": [{"id": ch["id"], "kind": ch["kind"], **({"n": ch["n"]} if "n" in ch else {}), "title": ch["title"]} for ch in all_ch],
    "sourceIssues": issues,
}
books = [book]
json.dump(books, io.open(os.path.join(APP, "books.json"), "w", encoding="utf8", newline="\n"), ensure_ascii=False, indent=1)
size = sum(os.path.getsize(os.path.join(APP, "books", BOOK, f)) for f in os.listdir(os.path.join(APP, "books", BOOK)))
print("files", len(all_ch), "bytes", size, "issues", len(issues))
