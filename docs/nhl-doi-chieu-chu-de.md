# Đối chiếu chủ đề: sách Nguyễn Hiến Lê và app Định Vị

*Ghi ngày 26/09/2026. Tài liệu nghiên cứu, chưa sửa app.*

Sách *Kinh Dịch – Đạo của người quân tử* (Nguyễn Hiến Lê, 1979) còn bản quyền tới hết năm 2034. Ở đây chỉ dùng mục lục và tên các đề mục của sách để biết sách bàn **những chủ đề nào**. Không chép câu chữ, cách sắp xếp hay nhận định riêng của sách. Mỗi chủ đề app còn thiếu được lần về **nguồn gốc công cộng** (kinh truyện, chú giải cổ, văn bản Tây phương đã hết bản quyền), và mọi nội dung thêm vào sẽ viết lại từ các nguồn đó.

Cách đọc bảng:

- **Đủ**: app đã có nội dung tương đương, có nguồn.
- **Một phần**: có nhắc hoặc có một mặt của chủ đề, nhưng chưa thành bài, bảng hay hình riêng.
- **Chưa**: không có.

Chỗ trong app:

- `intro/<id>`: bài trong `public/data/intro.json`.
- `commentary`: `public/data/commentary.json`.
- `hexagrams`: `public/data/hexagrams.json`.
- `Học`: `src/pages/StudyPage.tsx` và `src/lib/study.ts`.
- `Lục Hào`: `src/lib/liuyao.ts`.
- `Mai Hoa`: `src/lib/meihua.ts`.

## 1. Bảng đối chiếu

### Phần mở đầu và Phần I (chương 1–7)

| # | Chủ đề trong sách | App | Ở đâu / ghi chú |
|---|---|---|---|
| 0a | Lời nói đầu: nên đọc sách theo thứ tự nào | Một phần | Trang Nhập môn có 8 bài xếp theo thứ tự, nhưng chưa có "lộ trình học" gợi ý (đọc bài nào trước, rồi mỗi ngày vài quẻ) |
| 0b | Cách tra một quẻ: theo tên, hoặc bảng 8×8 quái trên × quái dưới | Đủ | Thư viện: ô tìm theo tên, lọc theo quái trên / quái dưới. Chưa có dạng bảng 8×8 nhìn một lần (xem đề xuất 9) |
| 1.1 | Từ sách bói thành sách triết | Đủ | `intro/nguon-goc` (mục "Từ sách bói đến kinh điển") |
| 1.2 | Truyền thuyết Phục Hy vạch quẻ | Đủ | `intro/nguon-goc` |
| 1.3 | Hà đồ, Lạc thư: con số, hình, ma phương 15 | Một phần | `intro/cac-phai` chỉ nhắc tên và nói Hệ từ không tả hình. **Chưa có hình, chưa có bảng số, chưa có phép "thiên nhất địa nhị"** |
| 1.4 | Ý kiến học giả hiện đại (giáp cốt, bát quái ra đời lúc nào, vạch là con số) | Đủ | `intro/nguon-goc` (mục "Cách nhìn của học giới hiện đại", Mã Vương Đôi, vạch là con số cỏ thi) |
| 1.5 | Tám quái: tên, tượng, đức; bài ca nhớ hình tám quái | Đủ | `intro/quy-tac` (bảng tượng tám quái theo Thuyết quái), `trigrams.json`, Học: deck `trigram` và bài *Bát quái thủ tượng ca* |
| 1.6 | Tiên thiên và Hậu thiên bát quái (vị trí trên vòng tròn) | Một phần | Mai Hoa dùng số Tiên thiên (Càn 1 … Khôn 8). `intro/cac-phai` nhắc "đồ tiên thiên". **Chưa có hình hai vòng bát quái, chưa giải thích vì sao sắp như vậy** (Thuyết quái ch. 3 và ch. 5) |
| 1.7 | Trùng quái: ai chồng quẻ (bốn thuyết); cách chồng ra 64 quẻ | Đủ | `intro/nguon-goc` (bốn thuyết theo Khổng Dĩnh Đạt) |
| 1.8 | Nội quái, ngoại quái | Đủ | `intro/thuat-ngu`; luồng tự ghép hai quái (trong / ngoài) |
| 1.9 | Ba loại Dịch: Liên Sơn, Quy Tàng, Chu Dịch | Đủ | `intro/nguon-goc` |
| 1.10 | Văn Vương, Chu Công và lời kinh | Đủ | `intro/nguon-goc` (bảng "Người – công việc – nguồn cổ") |
| 1.11 | Nghĩa chữ "Dịch", nghĩa chữ "Chu Dịch" | Đủ | `intro/nguon-goc` và `intro/dao-troi` (ba nghĩa của chữ Dịch) |
| 2.1 | Ai viết Thập Dực | Đủ | `intro/kinh-truyen` |
| 2.2 | Nội dung từng thiên Thập Dực: Thoán, Tượng, Hệ từ, Văn ngôn, Thuyết quái, Tự quái, Tạp quái | Một phần | `intro/kinh-truyen` có bảng tóm tắt mười thiên. Thoán, Tượng, Văn ngôn đã có đầy đủ theo từng quẻ trong `commentary`. **Hệ từ, Thuyết quái, Tự quái, Tạp quái chưa có bản đọc trọn**: chỉ có câu trích rải rác. Tự quái chỉ có lời diễn hiện đại (`hexagrams.sequenceNote`), không kèm nguyên văn. Tạp quái không có theo từng quẻ |
| 2.3 | Cách trình bày kinh xưa và nay (Kinh, Truyện tách riêng hay xen vào nhau) | Đủ | `intro/kinh-truyen`, `intro/cac-phai` (Vương Bật xen Truyện vào Kinh, Chu Hy tách ra lại) |
| 3.1 | Các phái Hán: Phí Trực, Trịnh Huyền, Tuân Sảng, Tiêu Diên Thọ, Kinh Phòng (tượng số) | Đủ | `intro/cac-phai` |
| 3.2 | Tam Quốc đến Ngũ Đại: Ngu Phiên (tiêu tức), Vương Bật, Khổng Dĩnh Đạt, Lý Đỉnh Tộ, Trần Đoàn | Đủ | `intro/cac-phai` |
| 3.3 | Tống, Minh: Chu Đôn Di (Thái cực đồ), Thiệu Ung, Trình Di, Trương Tái, Chu Hy | Một phần | Có Thiệu Ung, Trình Di, Chu Hy. **Chưa nhắc Chu Đôn Di và *Thái cực đồ thuyết*, chưa nhắc Trương Tái** |
| 3.4 | Thanh, hiện đại, Việt Nam | Đủ | `intro/cac-phai` |
| 3.5 | Dịch học phương Tây (Legge, Wilhelm, Jung, Blofeld…) | Đủ | `intro/cac-phai` (mục Phương Tây) |
| 3.6 | Tám quái và khai triển nhị thức (A+B)³ | Chưa | Một chuyện lạ trong sách, ít giá trị: không đề xuất |
| 3.7 | Leibniz và hệ nhị phân | Một phần | `intro/cac-phai` có một dòng. **Chưa có hình minh hoạ số nhị phân ↔ quẻ** |
| 3.8 | Phương vị 64 quẻ của Phục Hy (vòng tròn ngoài, hình vuông trong) | Chưa | App đã có trường `binary` cho mỗi quẻ nên vẽ được ngay |
| 4.1 | Thuật ngữ: lưỡng nghi, tứ tượng, bát quái, đơn / trùng / thuần / hỗ quái, hào cửu / lục, sơ / thượng | Đủ | `intro/thuat-ngu`, `intro/dao-troi` |
| 4.2 | Dụng cửu, dụng lục | Đủ | `hexagrams.allMoving`, `commentary.allMoving` |
| 4.3 | Nguyên, hanh, lợi, trinh; cát, hung, hối, lận | Đủ | `intro/thuat-ngu`, Văn ngôn quẻ Càn trong `commentary` |
| 4.4 | Quy tắc: tương quan nội / ngoại quái; sáu hào như thân thể, như tam tài | Một phần | `intro/quy-tac` có sáu vị và tam tài (bảng Hệ từ hạ ch. 9). Cách ví sáu hào như thân thể (Hàm, Cấn) chỉ có trong từng quẻ. Thuyết "nhân – quả" là của một tác giả hiện đại: không đề xuất |
| 4.5 | Ý nghĩa các hào: trung, chính, thời | Một phần | `intro/quy-tac` có trung và chính; cấu trúc hào tính tự động (`src/lib/structure.ts`). **"Thời" chưa thành mục riêng** (xem 7.3) |
| 4.6 | Tương quan giữa các hào: ứng, tỉ, hào chủ ("ít làm chủ nhiều"), so sánh hào 2/4 và 3/5 | Đủ | `intro/quy-tac`, `intro/thuat-ngu` |
| 4.7 | Động và biến; quẻ biến | Đủ | `intro/thuat-ngu`, `src/lib/cast.ts`, `intro/quy-tac` (quy tắc Chu Hy chọn lời khi có hào động) |
| 4.8 | Phép đoán quẻ: cách người xưa (ví dụ của Jung) và cách ngày nay (Thế Ứng, lục thân, ngũ hành) | Đủ | Lục Hào (đầy đủ, có nguồn), `intro/quy-tac`. Ví dụ của Jung còn bản quyền: không dùng |
| 4.9 | Bói cỏ thi (phép đại diễn 50 cọng) | Một phần | `intro/kinh-truyen` và `intro/cac-phai` chỉ nhắc tên. **Chưa có bài giải thích phép đại diễn, chưa có cách lập quẻ bằng cỏ thi, chưa nói xác suất 6/7/8/9 của cỏ thi khác ba đồng xu** |
| 4.10 | Môn đoán số bằng 64 quẻ (Bát tự Hà Lạc, gán cho Trần Đoàn) | Chưa | `intro/cac-phai` nhắc Trần Đoàn. Nguồn gốc mơ hồ và ngoài mục đích tự soi: không đề xuất (xem mục 3) |
| 4.11 | Cách giải thích tên quẻ | Đủ | `intro/quy-tac` (mục "Cách giải tên quẻ") |
| 5.1 | Nguồn gốc vũ trụ: Thái cực → lưỡng nghi → tứ tượng → bát quái; so với Đạo của Lão Tử | Một phần | `intro/dao-troi` có chuỗi sinh thành. **Chưa so với Đạo Đức kinh, chưa có hình "sinh đôi" nhị phân** (Chu Hy gọi là "gia nhất bội pháp") |
| 5.2 | Dịch là giao dịch: âm dương tương giao; hình Thái cực | Một phần | `intro/dao-troi` (mục "Giao dịch và biến dịch theo Chu Hy"). Chưa có hình |
| 5.3 | Mười hai quẻ tiêu tức ứng mười hai tháng | Một phần | `intro/cac-phai` có một câu về quái khí. **Chưa có bảng 12 quẻ – 12 tháng, chưa nối với âm lịch và tiết khí mà app đã tính** |
| 5.4 | Dịch là biến dịch: cùng thì biến; biến có trật tự và chừng mực (Tiết, Hằng) | Đủ | `intro/dao-troi` (mục "Cùng thì biến") |
| 5.5 | Dịch là bất dịch: đầy thì vơi, khiêm thì được thêm; luật phản phục, tuần hoàn (Thái hào 3, Phục) | Một phần | Lời từng quẻ có trong `commentary` (Khiêm, Phục, Thái, Phong). Chưa có mục tổng hợp "những luật không đổi" |
| 5.6 | Định mệnh | Đủ | `intro/dinh-menh` |
| 6.1 | Thiên đạo và nhân đạo là một (tam tài) | Đủ | `intro/quy-tac` (sáu vị, ba tầng), `intro/tu-than` |
| 6.2 | Hình ảnh xã hội trong 64 quẻ: việc hằng ngày, gia đình (Gia Nhân, Cổ), kiện tụng (Tụng)… | Một phần | Có theo từng quẻ trong `commentary` và `contexts.json` (5 ngữ cảnh). Chưa có bài tổng hợp theo chủ đề đời sống |
| 6.3 | Việc trị dân (Sư, Tỉ, Lâm, Quan, Giải…) | Một phần | Có trong lời từng quẻ. Chưa có ngữ cảnh "lãnh đạo / quản lý" trong 5 ngữ cảnh |
| 7.1 | Chín đức tu thân (tam trần cửu quái, Hệ từ hạ ch. 7) | Đủ | `intro/tu-than` (bảng chín quẻ) |
| 7.2 | Thêm vài đức: tự cường, khiêm, cương – nhu, tiết chế, chính, trung | Một phần | `intro/tu-than` có bảng Đại tượng "quân tử dĩ…" (một số quẻ). **Chưa đủ 64 câu Đại tượng thành một bộ để tra hoặc học** (nguyên văn có trong `commentary.judgment.imageHan`) |
| 7.3 | Thời: mỗi quẻ là một thời, mỗi hào là một lúc trong thời ấy; "tùy thời", "thời trung" | Một phần | Khái niệm này chính là nền của app ("định vị" = biết mình ở thời nào, lúc nào), nhưng **chưa có bài hay mục nào nói thẳng ra**. Chỉ có vài câu rải rác |
| 7.4 | Kết: đạo Dịch là đạo của người quân tử (thực tiễn, lạc quan) | Đủ | `intro/tu-than` (mục "Nối tới cách dùng quẻ trong app") |

### Phần II và phụ lục

| # | Chủ đề trong sách | App | Ở đâu / ghi chú |
|---|---|---|---|
| II.0 | Lời nói đầu Phần II: dịch dựa trên Chu Hy, Trình Di, Phan Bội Châu… | Đủ | `commentary.views` (Trình Di, Chu Hy, NHL tóm ý, Phan Bội Châu) |
| II.1 | 64 quẻ: dịch, giảng lời quẻ, Thoán, Tượng, hào | Đủ | `hexagrams`, `commentary`, `contexts` |
| II.2 | Phụ lục trong quẻ Càn: so sánh cách các học giả gần đây giảng hào 1 quẻ Càn | Một phần | Có cách giảng của Trình Di, Chu Hy, Phan Bội Châu. Các tác giả Trung Hoa thế kỷ 20 mà sách dẫn còn bản quyền: không đề xuất |
| II.3 | Văn ngôn quẻ Càn, Khôn | Đủ | `commentary.wenyan` |
| II.4 | **Hệ từ truyện, thượng và hạ, 24 chương, dịch và chú thích** | Chưa (chỉ có trích) | Nhiều bài Nhập môn trích Hệ từ, nhưng không có chỗ đọc liền 24 chương. Đây là khoảng trống lớn nhất so với sách |
| II.5 | Lời cuối: "Nhìn lại quãng đường đã qua" (tự truyện của tác giả) | Không áp dụng | `intro/cac-phai` có một dòng giới thiệu NHL; không cần thêm |
| — | Thuyết quái, Tự quái, Tạp quái (sách không dịch trọn, chỉ tóm ở chương 2) | Một phần | Như dòng 2.2 |

## 2. Đề xuất bổ sung, xếp theo ưu tiên

Công sức: **S** = dưới một ngày; **M** = vài ngày; **L** = trên một tuần (tính cả dịch và soát). Mọi phần tiếng Việt vẫn tự dịch từ chữ Hán như quy trình trong `docs/quy-trinh-noi-dung.md`.

### Ưu tiên 1

**1. Bài "Thời và vị: mỗi quẻ là một thời, mỗi hào là một lúc"**

- **Lý do**: nói thẳng ra cái nền của việc "định vị". Sách của NHL coi chữ Thời là điểm gom lại của trung và chính.
- **Nguồn** (đều là công cộng, chắc chắn):
  - Vương Bật, *Chu Dịch lược lệ*, thiên *Minh quái thích biến thông hào*. Câu mở đầu "夫卦者，時也；爻者，適時之變者也" đã đối chiếu có trong văn bản: https://zh.wikisource.org/wiki/周易略例/明卦適變通爻
  - Thoán truyện của 12 quẻ có câu khen "thời" lớn lắm (Dự, Tùy, Di, Đại quá, Khảm, Độn, Khuê, Kiển, Giải, Cấu, Cách, Lữ). Nguyên văn có sẵn trong `commentary.judgment.tuanHan`; bản gốc KR1a0001: https://github.com/kanripo/KR1a0001
  - Hệ từ hạ ch. 1, câu "變通者，趣時者也": https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_066.txt
  - *Trung Dung* ch. 2, câu "君子而時中" (đã đối chiếu): https://zh.wikisource.org/wiki/禮記/中庸
  - *Mạnh Tử*, Vạn Chương hạ, câu "孔子，聖之時者也" (đã đối chiếu): https://zh.wikisource.org/wiki/孟子/萬章下
- **Hữu ích**: cao. Nối triết lý với cách dùng app (bước chọn hào, "nhìn lại").
- **Chỗ trong app**: bài Nhập môn thứ 9 (`intro/thoi-vi`), đặt sau `quy-tac`. Thêm liên kết từ bước chọn hào trong luồng định vị.
- **Công sức**: S–M.

**2. Mười hai quẻ tiêu tức ứng mười hai tháng, nối với lịch của app**

- **Lý do**: app ghi chép theo kỳ tháng / quý và đã tính âm lịch, tiết khí, tháng can chi (tháng Tý … tháng Hợi, đổi theo tiết). Có thể hiện "quẻ của tháng này":
  - tháng Tý: Phục;
  - tháng Sửu: Lâm;
  - tháng Dần: Thái;
  - …
  - tháng Hợi: Khôn.
- **Nguồn**:
  - *Tân Đường thư*, Lịch chí, thiên *Quái nghị* của nhà sư Nhất Hạnh. Có câu "十二月卦出於孟氏章句" (đã đối chiếu), tức mười hai quẻ tháng ra từ sách của Mạnh Hỷ: https://zh.wikisource.org/wiki/新唐書/卷027上
  - *Kinh thị Dịch truyện* (Kinh Phòng; bản trên wikisource có đủ tám cung, phi phục): https://zh.wikisource.org/wiki/京氏易傳
  - Nguỵ Bá Dương, *Chu Dịch tham đồng khế* (có bảng 12 quẻ tiêu tức; nguồn Đạo gia nên cần ghi rõ): https://zh.wikisource.org/wiki/周易參同契 và Kanripo KR5d0018 (bản Chu Hy chú): https://github.com/kanripo/KR5d0018
  - Lời kinh làm chứng ngay trong 64 quẻ: Lâm "至于八月有凶", Phục "七日來復", Thoán truyện Bác và Phong nói "消息盈虛" (KR1a0001; đã có trong `commentary`).
  - Học phái: `intro/cac-phai` đã có Mạnh Hỷ và Kinh Phòng.
- **Độ chắc**: văn bản cổ thì chắc. Việc ghép quẻ với tháng là quy ước của phái tượng số, không phải lời kinh, nên cần ghi rõ như vậy.
- **Hữu ích**: cao. Đây là chỗ app có lợi thế riêng: engine lịch đã sẵn.
- **Chỗ trong app**:
  - hình vòng 12 quẻ (dương lớn dần rồi âm lớn dần);
  - thẻ nhỏ ở trang chủ hoặc trang Ghi nhanh: "tháng này theo tiết khí là tháng …, quẻ tiêu tức …";
  - một đoạn trong bài `dao-troi`.
- **Công sức**: M.

**3. Đọc trọn Hệ từ, Thuyết quái, Tự quái, Tạp quái (bốn thiên Thập Dực còn thiếu)**

- **Lý do**: sách NHL dịch trọn Hệ từ. App đã trích Hệ từ rất nhiều mà người đọc không có chỗ đọc liền mạch.
- **Nguồn**: Kanripo KR1a0001. Đã kiểm file nào chứa thiên nào:
  - Hệ từ thượng: https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_065.txt
  - Hệ từ hạ: https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_066.txt
  - Thuyết quái: https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_067.txt
  - Tự quái: https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_068.txt
  - Tạp quái: https://github.com/kanripo/KR1a0001/blob/master/KR1a0001_069.txt
- **Chú giải kèm**: Chu Hy, *Chu Dịch bản nghĩa* (KR1a0031 / KR1a0032, app đã dùng).
- **Bản đối chiếu có chia chương**:
  - https://zh.wikisource.org/wiki/易傳/繫辭上
  - https://zh.wikisource.org/wiki/易傳/說卦
  - https://ctext.org/book-of-changes/xi-ci-shang
- **Bản Anh công cộng**: Legge 1882, *SBE* quyển 16, phần phụ lục III (Hệ từ) đến VII (Tạp quái): https://en.wikisource.org/wiki/Sacred_Books_of_the_East/Volume_16
- **Độ chắc**: rất chắc; đều là công cộng.
- **Hữu ích**: cao.
- **Chỗ trong app**: mục mới "Kinh & Truyện → Thập Dực" trong menu Thư viện, dạng chương có neo để các bài Nhập môn liên kết tới. Thêm hai trường vào mỗi quẻ: `commentary.xuGuaHan` / `xuGua` (Tự quái nguyên văn và dịch sát) và `zaGuaHan` / `zaGua` (Tạp quái). Bước 3 "Tự quái" của luồng định vị sẽ hiện được câu gốc bên cạnh `sequenceNote`.
- **Công sức**:
  - Tự quái và Tạp quái: S–M. Chỉ khoảng 64 cặp câu ngắn, trích tự động được như `scripts/import-han`.
  - Thuyết quái: S.
  - Hệ từ, 24 chương: L.

**4. Hình Tiên thiên – Hậu thiên bát quái, và 64 quẻ Phục Hy (vòng tròn, hình vuông, số nhị phân)**

- **Nguồn**:
  - Thuyết quái ch. 3, câu "天地定位，山澤通氣…", là gốc của vòng Tiên thiên. Thuyết quái ch. 5, câu "帝出乎震…", là gốc của vòng Hậu thiên. Cả hai trong KR1a0001_067 (link ở đề xuất 3).
  - Chu Hy, *Chu Dịch bản nghĩa*, quyển đầu, phần *Đồ mục*. Đã kiểm trong KR1a0032_000 có đủ chín đồ:
    - 河圖, 洛書;
    - 伏羲八卦次序, 伏羲八卦方位;
    - 伏羲六十四卦次序, 伏羲六十四卦方位;
    - 文王八卦次序, 文王八卦方位;
    - 卦變圖.

    Bản đó cũng có 筮儀 và 卦歌: https://github.com/kanripo/KR1a0032/blob/master/KR1a0032_000.txt
  - Bản Tứ khố của *Nguyên bản Chu Dịch bản nghĩa* (trang đầu có lời giải Hà đồ, Lạc thư): https://zh.wikisource.org/wiki/原本周易本義_(四庫全書本)
  - Thiệu Ung, *Hoàng cực kinh thế thư*. Tứ khố đề yếu ghi gốc từ Trần Đoàn và gọi là "Dịch ngoại biệt truyện": https://zh.wikisource.org/wiki/皇極經世書_(四庫全書本)
  - Leibniz, *Explication de l'arithmétique binaire* (1703), in trong *Histoire de l'Académie royale des sciences*, năm 1703, *Mémoires* tr. 85–89, bản quét Gallica: https://gallica.bnf.fr/ark:/12148/bpt6k3483p
  - Bản vẽ công cộng để đối chiếu: Legge *SBE* 16, Plate I–III: https://en.wikisource.org/wiki/Sacred_Books_of_the_East/Volume_16/Plate_2
- **Độ chắc**: văn bản chắc. Nhưng phải ghi rõ các đồ này có từ đời Tống. Hoàng Tông Hy và Hồ Vị đời Thanh cho là gốc Đạo gia; `intro/cac-phai` đã nói điều này. Sách của Hồ Vị: *Dịch đồ minh biện*, Kanripo KR1a0138: https://github.com/kanripo/KR1a0138
- **Hữu ích**: cao cho trang Học. Hình này cũng giải thích vì sao Mai Hoa dùng số Tiên thiên Càn 1 … Khôn 8 (hiện chỉ ghi trong mã `src/lib/meihua.ts`).
- **Chỗ trong app**:
  - trang "Đồ" mới trong Thư viện, vẽ bằng SVG từ trường `binary` đã có;
  - deck Học mới: "vị trí trên vòng Tiên thiên / Hậu thiên" và "số nhị phân ↔ quẻ";
  - khung ⓘ trong kết quả Mai Hoa trỏ tới hình.
- **Công sức**: M.

### Ưu tiên 2

**5. Bói cỏ thi: phép đại diễn, và vì sao xác suất khác ba đồng xu**

- **Nguồn**:
  - Hệ từ thượng ch. 9, đoạn "大衍之數五十，其用四十有九…" (KR1a0001_065).
  - Chu Hy, *Chu Dịch bản nghĩa*, thiên *Phệ nghi* (筮儀: nghi thức từng bước; đã kiểm có trong KR1a0032_000).
  - Chu Hy, *Dịch học khải mông*, thiên *Minh thi sách*, qua bản *Dịch học khải mông thông thích* của Hồ Phương Bình (có chép lời tựa Khải mông của Chu Hy):
    - https://zh.wikisource.org/wiki/易學啟蒙通釋_(四庫全書本)
    - Kanripo KR1a0062: https://github.com/kanripo/KR1a0062
- **Toán**: tính lại được. Với ba đồng xu, xác suất ra 6 / 7 / 8 / 9 là 1/8, 3/8, 3/8, 1/8. Với cỏ thi là 1/16, 5/16, 7/16, 3/16: hào dương động nhiều gấp ba hào âm động.
- **Hữu ích**: trung bình đến cao.
  - Bài giải thích: cần cho nghi thức.
  - Tuỳ chọn "gieo theo xác suất cỏ thi" (bằng `crypto.getRandomValues`, hoặc nhập tay khi người dùng bói bằng que thật): hợp với tinh thần "Gieo có nghi thức".
- **Chỗ trong app**: bài Nhập môn (hoặc một mục trong `quy-tac`); thêm phương pháp thứ 6 trong menu "Gieo quẻ ▾"; ghi phương pháp vào nhật ký để thống kê riêng.
- **Công sức**: bài S; phương pháp gieo M.

**6. Hà đồ, Lạc thư: số trời đất và ma phương**

- **Nguồn**:
  - Hệ từ thượng ch. 9 ("天一地二…天數二十有五，地數三十…") và ch. 11 ("河出圖，洛出書，聖人則之"): KR1a0001_065.
  - Chu Hy, *Bản nghĩa* quyển đầu và *Khải mông*, thiên *Bản đồ thư*. Link như đề xuất 4 và 5.
  - Phản biện: Hồ Vị, *Dịch đồ minh biện*, KR1a0138.
- **Hữu ích**: trung bình. Người Việt hay gặp hai hình này (phong thuỷ, lịch), nên cần một chỗ nói rõ cái gì có trong kinh và cái gì thêm từ đời Tống.
- **Chỗ trong app**: cùng trang "Đồ" với đề xuất 4. Thêm một đoạn trong `intro/nguon-goc`.
- **Công sức**: S.

**7. Bộ 64 câu Đại tượng "quân tử dĩ…" thành deck Học và "câu tu thân của kỳ này"**

- **Nguồn**: có sẵn trong `commentary.judgment.imageHan` (KR1a0001). Không cần nguồn mới.
- **Hữu ích**: cao với một app nhật ký tự soi. Chi phí thấp vì dữ liệu đã có.
- **Chỗ trong app**:
  - deck `image` trong `src/lib/study.ts`: hỏi quẻ → câu Đại tượng, hoặc ngược lại;
  - trong bản ghi định vị, gợi ý "lời Đại tượng của quẻ này" làm câu tự nhắc cho kỳ sau.
- **Công sức**: S.

**8. Bài ca thứ ba của Chu Hy: *Thượng hạ kinh quái biến ca***

- **Nguồn**: KR1a0032_000, ngay sau hai bài ca app đã có (đã kiểm, dòng "上下經卦變歌"). Đi kèm *Quái biến đồ* trong cùng quyển.
- **Hữu ích**: thấp đến trung bình. Đây là phép "quái biến" Chu Hy dùng để giải Thoán truyện. Hợp với người học sâu.
- **Chỗ trong app**: `src/data/verses.ts` và trang Học, dưới hai bài ca hiện có.
- **Công sức**: S.

**9. Bảng 8×8 tra quẻ (quái trên × quái dưới)**

- **Nguồn**: không cần nguồn ngoài; tính từ `iching.ts`. Chu Hy có bảng tương tự trong đồ *Phục Hy 64 quẻ phương vị* (hình vuông).
- **Hữu ích**: trung bình (tra nhanh, học).
- **Chỗ trong app**: đầu trang Thư viện, bật / tắt giữa dạng lưới và danh sách.
- **Công sức**: S.

### Ưu tiên 3

**10. Chu Đôn Di, *Thái cực đồ thuyết*, và hình Thái cực**

- **Nguồn**:
  - https://zh.wikisource.org/wiki/太極圖說
  - *Thông thư*: https://zh.wikisource.org/wiki/通書
  - Chu Hy có chú (công cộng).
- **Hữu ích**: trung bình đến thấp. Bổ sung một tên còn thiếu trong `intro/cac-phai`, và làm nguồn cho biểu tượng Thái cực app đang dùng trong nghi thức.
- **Chỗ trong app**: một đoạn trong `intro/cac-phai` (đời Tống) và một đoạn trong `intro/dao-troi`.
- **Công sức**: S.

**11. "Những luật không đổi": đầy thì vơi, khiêm được thêm, đi rồi trở lại**

- **Nguồn**:
  - Thoán truyện Khiêm ("天道虧盈而益謙…"), Phong ("日中則昃，月盈則食"), Phục ("反復其道，七日來復"); hào 3 quẻ Thái ("无平不陂，无往不復"). Tất cả trong KR1a0001 và `commentary`.
  - *Đạo Đức kinh* ch. 40 "反者道之動", để so sánh: https://zh.wikisource.org/wiki/道德經
- **Hữu ích**: trung bình. Hợp với phần "nhìn lại" và quỹ đạo (vẽ ra thấy lên xuống).
- **Chỗ trong app**: mục mới trong `intro/dao-troi`; câu gợi ý trên trang Quỹ đạo khi thấy một chuỗi đi lên hoặc đi xuống.
- **Công sức**: S.

**12. Ngữ cảnh thứ 6 "lãnh đạo / tổ chức"**

- **Lý do**: ứng với chủ đề trị dân và xã hội trong 64 quẻ.
- **Nguồn**: lời kinh và Đại tượng có sẵn (Sư, Tỉ, Lâm, Quan, Giải, Tiết, Đỉnh…). Trình Di, *Y Xuyên Dịch truyện* (KR1a0016) giảng nhiều về việc trị nước: https://github.com/kanripo/KR1a0016
- **Hữu ích**: trung bình, tuỳ người dùng.
- **Chỗ trong app**: `contexts.json`.
- **Công sức**: L (64 lời quẻ + 384 hào; phải soát như 5 ngữ cảnh cũ).

**13. Lộ trình học cho người mới**

- **Lý do**: ứng với Lời nói đầu của sách, nhưng viết theo ý app.
- **Nguồn**: không cần.
- **Nội dung**: đọc 4 bài nền (nguồn gốc → kinh truyện → thuật ngữ → quy tắc), rồi mỗi ngày 2–3 quẻ trong Thư viện, kèm deck Học tương ứng.
- **Hữu ích**: trung bình.
- **Chỗ trong app**: đầu trang Nhập môn; có thể nối với tiến độ Học.
- **Công sức**: S.

## 3. Chủ đề không đề xuất

| Chủ đề | Lý do |
|---|---|
| Bát tự Hà Lạc (đoán số mệnh từ can chi ngày sinh, gán cho Trần Đoàn) | Không có văn bản cổ công cộng đáng tin về người soạn. Đi ngược tinh thần "quẻ để tự soi, không phải số mệnh" của `intro/dinh-menh`. Nếu cần, chỉ nên thêm một câu vào `intro/cac-phai` |
| Tám quái và khai triển (A+B)³ | Chuyện lạ của một tác giả thế kỷ 20, không có trong truyền thống |
| Thuyết sáu hào là "nhân – quả", cách chia thực thể / biểu thể / đặc tính | Của tác giả hiện đại (còn bản quyền), không có gốc cổ |
| Cách giảng hào 1 quẻ Càn của các học giả Trung Hoa gần đây (phụ lục quẻ Càn) | Còn bản quyền; app đã có đủ cách giảng cổ |
| Lời tựa của Jung và ví dụ Jung bói quẻ Khảm → Tỉnh | Jung mất năm 1961, lời tựa còn bản quyền ở nhiều nước. `intro/cac-phai` chỉ nhắc tên là đủ |
| Tiêu Diên Thọ, *Dịch lâm* (64 × 64 = 4096 lời) | Có nguồn công cộng (https://zh.wikisource.org/wiki/焦氏易林) nhưng quá lớn và xa mục đích app. Ghi lại để khi nào cần |
| Tự truyện "Nhìn lại quãng đường đã qua" | Không liên quan tới nội dung Dịch |

## 4. Ghi chú về nguồn

- **Chắc nhất, dùng được ngay**:
  - Kanripo, lấy thẳng từ GitHub, bản Tứ khố:
    - KR1a0001 (kinh truyện; file 065–069 là bốn thiên còn thiếu);
    - KR1a0032 (quyển đầu: chín đồ, quái ca, phệ nghi);
    - KR1a0016 (Trình Di);
    - KR1a0062 (Khải mông thông thích);
    - KR1a0138 (Dịch đồ minh biện).
  - Wikisource tiếng Trung. Đã kiểm qua API trang có tồn tại, và dò chữ trong văn bản cho các câu được dẫn ở trên:
    - 易傳/繫辭上…雜卦, 周易略例/明卦適變通爻, 禮記/中庸, 孟子/萬章下;
    - 新唐書/卷027上, 京氏易傳, 皇極經世書 (四庫全書本);
    - 太極圖說, 通書, 周易參同契, 原本周易本義 (四庫全書本), 易學啟蒙通釋 (四庫全書本).
  - Tất cả là văn bản cổ, công cộng.
- **Chu Hy, *Dịch học khải mông***: wikisource không có trang riêng (trang 易學啟蒙 không tồn tại). Dùng bản *Thông thích* của Hồ Phương Bình vì có chép lời Chu Hy, hoặc phần Khải mông trong *Ngự toản Chu Dịch chiết trung* mà app đã dẫn.
- **Hình các đồ**: trong Kanripo chỉ có tên đồ và lời giải, không có hình. Hình phải tự vẽ từ quy tắc (nhị phân, Thuyết quái ch. 3 và ch. 5). Legge *SBE* 16, Plate I–III, là bản vẽ công cộng để đối chiếu.
- **Legge 1882** (*SBE* 16, Wikisource tiếng Anh) và **Leibniz 1703** (Gallica): công cộng. Bản Wilhelm / Baynes và lời tựa Jung: còn bản quyền.
- Trang wikisource giới hạn tần suất truy cập (lỗi 429). Nếu viết script trích tự động thì nên lấy từ Kanripo.
