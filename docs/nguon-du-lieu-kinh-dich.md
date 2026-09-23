# Nguồn dữ liệu cho dự án "Tự định vị theo Kinh Dịch"

*Thu thập ngày 23/09/2026. Mọi link đã được kiểm tra tồn tại; nội dung và tình trạng bản quyền ghi theo những gì trang hiển thị hoặc theo luật hiện hành, bạn nên tự xác nhận lại trước khi dùng cho mục đích phân phối.*

Cách đọc tài liệu này: mỗi nguồn có bốn dòng đánh giá — **Dùng cho** (trường nào trong schema), **Định dạng**, **Bản quyền**, **Lưu ý**. Cuối tài liệu có kế hoạch nạp dữ liệu đề xuất và danh sách việc bạn cần tự quyết.

---

## Tầng 0 — Dữ liệu cấu trúc (kiểm chứng máy móc)

### Wikipedia: List of hexagrams / King Wen sequence
- Dùng cho: `kingWenNumber`, `binary`, `upperTrigram`, `lowerTrigram`, Unicode ䷀–䷿ (U+4DC0–U+4DFF), tên Hán, đối chiếu tên Anh.
- Định dạng: bảng HTML, dễ chép thành JSON.
- Bản quyền: CC BY-SA.
- Lưu ý: dùng làm bộ test toàn vẹn cho `hexagrams.json`; mô hình nhớ phần này rất chuẩn nhưng vẫn nên có nguồn độc lập để test.
- https://en.wikipedia.org/wiki/List_of_hexagrams_of_the_I_Ching
- https://en.wikipedia.org/wiki/King_Wen_sequence

### adamblvck/iching-wilhelm-dataset (GitHub)
- Dùng cho: tham khảo cấu trúc JSON (64 quẻ, 6 hào mỗi quẻ, judgment/image/lines), làm mẫu schema.
- Định dạng: JSON + CSV, license MIT cho repo.
- Bản quyền: **Cẩn trọng.** Repo tuyên bố bản Wilhelm–Baynes "public domain từ 2020". Điều này đúng với bản gốc tiếng Đức của Richard Wilhelm (mất 1930, hết hạn ở EU năm 2001), nhưng bản dịch tiếng Anh của Cary Baynes (1950, Princeton/Bollingen) nhiều khả năng còn được bảo hộ ở Mỹ đến khoảng 2045. Chỉ dùng để học cấu trúc, **không** đưa văn bản Baynes vào app.
- https://github.com/adamblvck/iching-wilhelm-dataset

---

## Tầng 1 — Văn bản gốc chữ Hán (ground truth cho trường `original`)

### Kanripo 漢籍リポジトリ — KR1a0001 周易(正文) ⭐ nguồn chính đề xuất
- Dùng cho: `original` của 64 lời quẻ + 384 lời hào, và 5 tệp Thập Dực (Hệ từ thượng/hạ, Thuyết quái, Tự quái, Tạp quái).
- Định dạng: **69 tệp .txt thuần**, một tệp mỗi quẻ (`KR1a0001_001.txt` = Càn … `_064.txt` = Vị Tế), trên GitHub → `git clone` được, Claude Code nạp trực tiếp không cần mạng lúc chạy.
- Bản quyền: văn bản cổ, công cộng. Kanripo là dự án học thuật (Christian Wittern, Kyoto), dữ liệu mở.
- Lưu ý: đây là lựa chọn tốt nhất cho pipeline vì là plain text có cấu trúc, không bị chặn scraper như ctext. Kiểm tra `Readme.org` để biết bản in gốc được số hóa.
- https://github.com/kanripo/KR1a0001
- Đọc trực tuyến: https://www.kanripo.org/text/KR1a0001/009
- Tổ chức Kanripo: https://github.com/kanripo · Blog giới thiệu: http://blog.kanripo.org/en2.html

### Wikisource tiếng Trung — 周易
- Dùng cho: đối chiếu chéo `original` với Kanripo (hai nguồn độc lập → test đối chiếu); Thập Dực nằm ở mục 易傳.
- Định dạng: HTML từng quẻ một trang (ví dụ 周易/乾, 周易/咸), có thể tải qua API MediaWiki.
- Bản quyền: công cộng, trang có ghi rõ.
- Lưu ý: trang tổng 周易 chỉ là mục lục và bảng tra 64 quẻ; văn bản nằm ở các trang con.
- Mục lục: https://zh.wikisource.org/wiki/周易
- Ví dụ quẻ: https://zh.wikisource.org/zh-hant/周易/乾 · https://zh.wikisource.org/wiki/周易/咸
- Hệ từ thượng: https://zh.wikisource.org/zh-hant/易傳/繫辭上

### Chinese Text Project (ctext.org) — 周易
- Dùng cho: đọc và tra thủ công; có bản Legge tiếng Anh song song từng câu, tiện khi bạn duyệt dữ liệu.
- Định dạng: web; có API nhưng **cần đăng ký/trả phí** cho truy cập tự động; trang chặn fetch tự động (403).
- Bản quyền: văn bản công cộng; giao diện và metadata của ctext có điều khoản riêng.
- Lưu ý: không dùng làm nguồn nạp tự động. Dùng làm công cụ duyệt cho người.
- https://ctext.org/book-of-changes/yi-jing/zh · Văn Ngôn quẻ Càn: https://ctext.org/book-of-changes/gan1/zh
- API: https://ctext.org/tools/api · Python: https://pypi.org/project/ctext/

---

## Tầng 2 — Chú giải cổ chữ Hán (cho trường `commentaries`, chống "làm phẳng")

Tất cả đều công cộng và có trên Kanripo dạng text; có thể `git clone` từng repo `github.com/kanripo/<ID>`.

| ID Kanripo | Tác phẩm | Tác giả / thời | Giá trị cho dự án |
|---|---|---|---|
| KR1a0007 | 周易註疏 (Chu Dịch chú sớ) | Vương Bật (Ngụy) chú, Khổng Dĩnh Đạt (Đường) sớ | Cách đọc nghĩa lý sớm nhất còn nguyên vẹn; nền của mọi chú giải sau |
| KR1a0008 | 周易集解 (Chu Dịch tập giải) | Lý Đỉnh Tộ (Đường) | Gom chú giải **thời Hán** (Ngu Phiên, Kinh Phòng, Tuân Sảng…) — góc tượng số, khác hẳn nghĩa lý |
| KR1a0016 | 伊川易傳 (Y Xuyên Dịch truyện) | Trình Di (Tống) | Đọc theo đạo đức–chính trị, hào = vị thế con người; **quan trọng nhất** cho cách dùng "đọc thẳng" của bạn |
| KR1a0031 / KR1a0032 | 原本周易本義 / 別本周易本義 | Chu Hy (Tống) | Ngắn gọn, thực dụng, coi Dịch là sách bói rồi rút nghĩa; thường khác Trình Di ở chỗ tinh tế |
| KR1a0100 | 周易集註 (Chu Dịch tập chú) | Lai Tri Đức (Minh) | Phân tích **thác/tổng** (quẻ đối, quẻ lật), rất hợp cho bước "đối nghịch" trong app |
| KR1a0117 | 御纂周易折中 (Ngự toản Chu Dịch chiết trung) | Lý Quang Địa chủ biên (Thanh, 1715) | **Tổng hợp chính thức**: mỗi hào gom nhiều chú giải Tống–Minh rồi "chiết trung". Nếu chỉ chọn một nguồn chú giải để nạp, chọn nguồn này |

- Đọc trực tuyến: https://www.kanripo.org/text/KR1a0007/003 · https://www.kanripo.org/text/KR1a0008/000 · https://www.kanripo.org/text/KR1a0016/000 · http://www.kanripo.org/text/KR1a0031/000 · https://www.kanripo.org/text/KR1a0032/004 · https://www.kanripo.org/text/KR1a0100/003 · https://www.kanripo.org/text/KR1a0117/
- Danh mục toàn bộ loại Dịch (KR1a): https://www.kanripo.org/catalog?coll=KR1

Nguồn bổ sung cho cùng các tác phẩm:
- ctext (đọc/tra tay): 伊川易傳 https://ctext.org/wiki.pl?if=gb&res=924459 · 周易本義 https://ctext.org/wiki.pl?if=en&res=73027 · 周易外傳 (Vương Phu Chi) https://ctext.org/wiki.pl?if=gb&res=604067
- Wikisource (bản Tứ khố toàn thư, OCR): 周易本義 (四庫全書本) https://zh.wikisource.org/zh-hans/周易本義_(四庫全書本)/卷2
- 殆知阁 Daizhige: 周易集注 (Lai Tri Đức) https://daizhige.org/易藏/易经/周易集注.html — trang tổng hợp không rõ nguồn/giấy phép, chỉ dùng đối chiếu.
- 書格 Shuge: bản scan 船山遺書 (Vương Phu Chi) https://www.shuge.org/view/chuanshan_yi_shu/ — scan, không có text.
- 易學網 (Đài Loan), bản 易程傳 có giải nghĩa hiện đại tiếng Trung: https://www.eee-learning.com/article/897 — nội dung hiện đại **có bản quyền**, chỉ để đọc hiểu.

---

## Tầng 3 — Bản Việt ngữ

### Phan Bội Châu — *Quốc văn Chu Dịch diễn giải* (viết ~1930s)
- Dùng cho: hiểu cách đọc Dịch của một người Việt, giọng nghĩa lý gần Trình Di; có thể **trích nguyên văn** vì đã hết bản quyền.
- Định dạng: Internet Archive có PDF, EPUB, **full text OCR** (ABBYY), nhưng trang ghi rõ "sách bị thiếu một số chương, chưa tìm được đủ".
- Bản quyền: tác giả mất 1940 → công cộng tại Việt Nam.
- Lưu ý: OCR tiếng Việt chữ cũ có lỗi; bản in Nhà xuất bản Văn học/Khai Trí sau này có thể đủ chương hơn. Google Books có bản số hóa để tra.
- https://archive.org/details/QuocVanChuDichDiennGiaiPhanBoiiChau
- https://books.google.com/books/about/Quốc_Văn_Chu_Dịch_Diễn_Giải.html?id=rHP0BQAAQBAJ
- Đọc online (trang tổng hợp, không rõ nguồn gõ lại): https://daogiao.io.vn/doc-sach/quoc-van-chu-dich-dien-giai-phan-boi-chau

### Ngô Tất Tố — *Kinh Dịch trọn bộ* (1940s)
- Dùng cho: bản dịch lời quẻ/lời hào tiếng Việt sát nghĩa nhất, kèm dịch Trình truyện và Bản nghĩa → nguồn tốt cho `original` phiên âm Hán Việt và cho bản dịch nghĩa. **Trích được nguyên văn.**
- Định dạng: Internet Archive có PDF, EPUB, full text OCR, DAISY; bản in cũ chất lượng tốt.
- Bản quyền: tác giả mất 1954 → công cộng tại Việt Nam.
- Lưu ý: nhiều trang ebook Việt (dtv-ebook, sachhoc, khoahoctamlinh…) có bản prc/epub gõ lại, tiện hơn OCR nhưng không rõ độ chính xác; nên đối chiếu với bản scan archive.org.
- https://archive.org/details/KinhDichTronBoNgoTatTo
- https://dtv-ebook.com.vn/kinh-dich_13933.html · https://sachhoc.com/kinh-dich-tron-bo-ngo-tat-to

### Nhân Tử Nguyễn Văn Thọ & Huyền Linh Yến Lê — *Dịch Kinh Đại Toàn* (nhantu.net)
- Dùng cho: giảng giải hiện đại tiếng Việt cho **đủ 64 quẻ**, mỗi quẻ một trang HTML sạch, có Thượng Kinh (1–30) và Hạ Kinh (31–64); góc đọc thiên về tâm linh–đạo học.
- Định dạng: HTML tĩnh, dễ đọc bằng máy.
- Bản quyền: tác giả mất 2014; trang do gia đình duy trì, **không có tuyên bố giấy phép**. Coi như còn bản quyền: chỉ đọc để hiểu, không trích.
- https://nhantu.net/DichHoc/DichKinhDaiToan.htm
- Ví dụ: https://nhantu.net/DichHoc/THUONGKINH/1Can.htm · https://nhantu.net/DichHoc/HAKINH/64ViTe.htm

### Nguyễn Hiến Lê — *Kinh Dịch, đạo của người quân tử* (1979)
- Dùng cho: cách diễn giải hiện đại, tỉnh táo, gần với tinh thần "đọc thẳng" của dự án; là bản bạn nên đọc kỹ nhất khi duyệt 8 quẻ mẫu.
- Định dạng: sách in, tái bản liên tục (NXB Văn học/Nhã Nam; bản 2018, 2023).
- Bản quyền: tác giả mất 1984 → **còn bảo hộ** tại Việt Nam (50 năm sau khi mất, đến hết 2034). Các bản PDF trôi nổi trên mạng là không phép — mình không đưa link. **Không trích, chỉ diễn đạt lại.**
- Mua: https://www.fahasa.com/kinh-dich-dao-cua-nguoi-quan-tu-tb-2023.html

---

## Tầng 4 — Bản Anh ngữ

### James Legge — *The Yî King* (1882, Sacred Books of the East vol. XVI)
- Dùng cho: bản dịch Anh công cộng duy nhất đủ độ tin, kèm chú của Legge; ctext dùng chính bản này song song chữ Hán.
- Định dạng: sacred-texts.com HTML từng chương; Internet Archive có scan + OCR.
- Bản quyền: công cộng toàn cầu.
- Lưu ý: ngôn ngữ Victorian, nhiều chỗ Legge chê Dịch; vẫn quý vì dịch sát và chú kỹ từng hào.
- https://sacred-texts.com/ich/index.htm · Mục lục: https://sacred-texts.com/ich/ictoc.htm
- https://archive.org/details/ichingbookofchan00legg · https://archive.org/details/iching00legg

### Richard Wilhelm (Đức 1924) / Cary Baynes (Anh 1950)
- Dùng cho: hiểu cách đọc hiện đại phương Tây có ảnh hưởng nhất; phần bình chú "The Image" và từng hào rất giàu tình huống.
- Bản quyền: bản Đức của Wilhelm công cộng (EU); bản Anh của Baynes **nhiều khả năng còn bảo hộ ở Mỹ** dù một số repo trên GitHub tuyên bố ngược lại. Chỉ đọc, không trích.
- Sách: https://press.princeton.edu/books/hardcover/9780691097503/the-i-ching-or-book-of-changes
- Bản gõ lại trôi nổi (không phép, chỉ để tham khảo cách cấu trúc): https://github.com/clovemedia/i_ching · http://www.pantherwebworks.com/I_Ching/

---

## Kế hoạch nạp dữ liệu đề xuất

1. `git clone` **KR1a0001** vào `/sources/kanripo/KR1a0001`. Viết script tách mỗi tệp thành lời quẻ + 6 lời hào + Tiểu Tượng → điền `original`. Đây là ground truth.
2. Tải văn bản 64 trang con từ **Wikisource** qua MediaWiki API → test đối chiếu với Kanripo (chuẩn hoá phồn/giản, bỏ dấu câu rồi so). Lệch chỗ nào thì người xem.
3. `git clone` **KR1a0016** (Trình Di), **KR1a0031** (Chu Hy), **KR1a0117** (Chiết trung). Viết script cắt theo quẻ/hào → điền `commentaries[]` với `{source, text}`. Với Chiết trung, một hào có thể có 5–10 đoạn của nhiều tác giả; giữ 2–4 đoạn khác nhau nhất.
4. Tải **Legge** từ sacred-texts → trường `legge` tham khảo (hiển thị thu gọn hoặc chỉ dùng nội bộ).
5. Tải OCR **Ngô Tất Tố** và **Phan Bội Châu** từ archive.org → không nạp tự động (OCR lỗi), để bạn tra khi duyệt; nếu muốn trích, gõ tay đoạn cần.
6. Các trường hiện đại (`situation`, `behavioralSignals`, `characteristicRisk`, `commonFailure`, `reflectionQuestions`) do Claude Code viết từ 1–4, đánh `reviewed: false` cho đến khi bạn duyệt từng quẻ, đối chiếu Nguyễn Hiến Lê và Nhân Tử bằng sách/trang, không chép.

## Việc bạn cần tự quyết khi xem xét

- Chọn **một** bản chú giải làm trục (đề xuất: Trình Di cho tinh thần "vị thế con người", hoặc Chiết trung cho độ bao phủ) và **một** bản đối trọng (đề xuất: Chu Hy hoặc Lý Đỉnh Tộ để có góc tượng số).
- Có hiển thị chữ Hán gốc trong app không, hay chỉ phiên âm Hán Việt + dịch nghĩa.
- Có muốn dùng bản Ngô Tất Tố làm bản dịch nghĩa chính thức trong app (được phép, nhưng cần gõ/sửa OCR khoảng 450 đoạn).
- Xác nhận lại tình trạng bản quyền Baynes và Nguyễn Hiến Lê nếu app có phân phối công khai; nếu chỉ dùng cá nhân thì ràng buộc nhẹ hơn nhiều.
