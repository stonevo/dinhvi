# Quy trình viết và đối chiếu nội dung Kinh Dịch

Tài liệu này ghi cách phần Kinh & Truyện (`public/data/commentary.json`) và phần diễn giải hiện đại (`public/data/hexagrams.json`) được dựng, đối chiếu và sửa, để lần sau sửa nội dung theo cùng quy tắc.

## Nguyên tắc

1. **Chữ Hán không bao giờ gõ tay hay để AI chép lại.** Lời quẻ, lời hào, Thoán truyện, Đại tượng, Tiểu tượng đều trích bằng script từ Kanripo KR1a0001 (`scripts/kanripo.ts`).
2. **Mọi câu chuyện, điển tích, nhân vật, "cách hiểu khác" phải có nguồn thật và ghi rõ ai nói.** Nguồn hợp lệ là nguyên văn Kinh/Thập Dực, Trình Di, Chu Hy, và sách của Nguyễn Hiến Lê (cùng những người ông dẫn, ví dụ Phan Bội Châu, ghi rõ là ông dẫn). Không tìm thấy trong nguồn thì bỏ. Không viết theo trí nhớ.
3. **Phần tiếng Việt là lời tự dịch và tự giảng từ chữ Hán.** Không chép hay mô phỏng câu chữ của bản dịch hiện đại còn bản quyền. Sách *Kinh Dịch – Đạo của người quân tử* của Nguyễn Hiến Lê (mất 1984) còn được bảo hộ đến hết năm 2034, nên chỉ dùng để đối chiếu nghĩa. Mục "Nguyễn Hiến Lê" trong `views` là tóm ý bằng lời riêng.
4. **Khác trường phái không phải là sai.** Chỗ Trình Di, Chu Hy, Nguyễn Hiến Lê hiểu khác nhau thì giữ bản diễn giải đang có và ghi các cách hiểu vào `views`. Chỉ sửa khi app hiểu sai hẳn: đảo chủ thể, đảo phán từ, nhầm chữ then chốt.
5. **Cấu trúc hào không viết tay.** Đắc chính, đắc trung, ứng, âm cưỡi hay đỡ dương đều tính từ hình quẻ (`src/lib/structure.ts`).

## Nguồn

| Nguồn | Kho | Dùng cho |
|---|---|---|
| Chu Dịch (kinh văn + Thập Dực) | [kanripo/KR1a0001](https://github.com/kanripo/KR1a0001) | chữ Hán: lời quẻ, lời hào, Thoán, Tượng |
| Trình Di, *Y Xuyên Dịch truyện* | [kanripo/KR1a0016](https://github.com/kanripo/KR1a0016) | tóm ý Trình Di trong `views` |
| Chu Hy, *Chu Dịch bản nghĩa* (bản gốc) | [kanripo/KR1a0031](https://github.com/kanripo/KR1a0031) | tóm ý Chu Hy trong `views` |
| Nguyễn Hiến Lê, *Kinh Dịch – Đạo của người quân tử* | bản của người dùng (PDF) | đối chiếu nghĩa; tóm ý riêng của ông |
| Unihan (kVietnamese) | unicode.org | kiểm âm Hán Việt (`verify-originals`) |

## Dựng lại dữ liệu

```bash
git clone --depth 1 https://github.com/kanripo/KR1a0001.git <tmp>/KR1a0001
# Chữ Hán + giữ phần tiếng Việt đang có; truyền thêm thư mục dịch để nhập vi-NN.json
npx tsx scripts/import-commentary.ts <tmp>/KR1a0001 [thư mục dịch]
npx tsx scripts/verify-originals.ts <tmp>/KR1a0001 <Unihan_Readings.txt>
npm run check:data
```

`check:data` (và test `data-integrity`) chặn commentary thiếu quẻ, thiếu hào, hoặc có trường dịch, Tượng, giảng bị trống.

## Tách nguồn theo quẻ (để giao việc cho từng đợt)

- **KR1a0001:** mỗi quẻ một file sẵn.
- **KR1a0016 / KR1a0031:** mỗi quyển gồm nhiều quẻ. Tách theo tiêu đề `(X下/Y上)` rồi tra số quẻ từ hai quái, **không tách theo ký hiệu ䷀–䷿**, vì bản số hóa gõ sai ký hiệu ở nhiều quẻ (ví dụ quẻ Tỉnh, Ký Tế, Kiển).
  - Tên quái có dị thể: 兌/兑/兊, 巽/㢲.
  - Bản Chu Hy có một tiêu đề sai: Tiểu Súc ghi `(乾下/坤上)`, phải sửa thành `(乾下/巽上)` trước khi tách.
- **Sách Nguyễn Hiến Lê:** trích văn bản bằng `pypdf`, tách theo tiêu đề "N. QUẺ …" ở phần II. Quẻ 31 và 48 có tiêu đề dạng khác. Cắt phần Hệ từ truyện dính sau quẻ 64.

## Quy trình một đợt sửa nội dung

1. **Viết hoặc dịch:** giao từng nhóm quẻ, cấp chữ Hán (`han-NN.json`) cùng nguyên văn Trình Di, Chu Hy. **Không cấp sách Nguyễn Hiến Lê ở bước này**, để lời văn chắc chắn là lời riêng.
2. **Đối chiếu nghĩa với Nguyễn Hiến Lê:** báo chỗ sai và chỗ khác trường phái riêng. Chỉ sửa chỗ sai; chỗ ông hiểu khác thì thêm vào `views`.
3. **Soát nguồn:** mọi view Trình Di, Chu Hy phải khớp nguyên văn. Mọi điển tích phải tìm được bằng chữ Hán trong nguồn và ghi ai kể. "Cách hiểu khác" phải nêu tên nguồn.
4. **Soát nhất quán:** khi sửa nghĩa một hào, xem lại cả `behavioralSignals`, `reflectionQuestions`, `commonFailure`, `whatTendsToFollow`, và câu "thường đến sau" của hào ngay dưới.
5. `npm run check:data`, `npm test`, `npm run build`.

## Đã biết, cố ý giữ nguyên

- 9 dị bản âm đọc, ghi trong [doi-chieu-kanripo.md](doi-chieu-kanripo.md).
- Tiểu tượng 26 hào 1: Kanripo ghi 利己, bản thông hành ghi 利已. App giữ theo nguồn.
- Sách Nguyễn Hiến Lê ghi 47 hào 1 ứng với hào 3; đúng ra là hào 4, app giữ hào 4.
- Bản Chu Hy ghi 34 hào 4 là 四前三隂; view ghi "hai hào âm", theo đúng hình quẻ.
- Nhiều chỗ phần diễn giải hiện đại đi theo Trình Di hoặc Chu Hy mà Nguyễn Hiến Lê hiểu khác. Các chỗ này được giữ nguyên, cách hiểu của ông nằm trong `views`.
