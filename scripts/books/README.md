# Sách hay — dựng dữ liệu từ bản gõ

Hoàng Đế Nội Kinh Tố Vấn (Nguyễn Tử Siêu dịch, Mã Nguyên Đài chú), từ PDF bản gõ 2009.

```bash
pip install pymupdf
python scripts/books/tovan_parse.py   # PDF → scripts/books/out/tovan2.json (đường dẫn PDF ở đầu file)
python scripts/books/tovan_check.py   # đối chiếu từng từ PDF ↔ dữ liệu (chỉ được thiếu nhãn "án")
python scripts/books/tovan_build.py   # → public/data/books.json, public/data/books/to-van/*.json
npm run check:data
```

Bộ tách dựa trên hình học dòng: cỡ chữ (kinh văn 10, chú giải 9), lề thụt, dòng ngắn, ghép dòng cùng cao độ,
bảng hai cột theo toạ độ. Chỗ bản gõ lệch giữa dấu chú và chú giải ghi ở `WHY` trong `tovan_build.py`
(đã đối chiếu tay) và hiện trong app ở mục "Nguồn và cách trình bày".
