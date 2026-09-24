# Đối chiếu lời quẻ, lời hào với Kanripo KR1a0001

*Chạy ngày 24/09/2026.*

## Cách làm

`scripts/verify-originals.ts` so từng âm tiết trong trường `original` (và phần trích lời quẻ trong `judgment`) với từng chữ Hán của kinh văn [Kanripo KR1a0001](https://github.com/kanripo/KR1a0001) (周易 正文, bản nền TLS):

1. Tách lời quẻ và 6 lời hào của mỗi quẻ từ Kanripo (bỏ Thoán, Tượng, Văn ngôn).
2. Căn chỉnh chuỗi âm tiết ↔ chuỗi chữ (quy hoạch động), nên bắt được cả **thừa/thiếu chữ** lẫn **sai âm**.
3. Một âm tiết được coi là khớp nếu nằm trong các âm Việt của chữ đó theo Unihan `kVietnamese`, hoặc trong bảng bổ sung `scripts/hanviet-extra.ts`. So khớp không phân biệt chỗ đặt dấu (hoà/hòa) và i/y cuối (Tỷ/Tỉ).

Unihan thiếu nhiều âm Hán Việt thông dụng (无 vô, 咎 cữu, 孚 phu…). Bảng bổ sung gồm 340 chữ: **mỗi cặp chữ–âm do Claude xét** khi đối chiếu, **chưa có người duyệt**. Cặp nào còn nghi vấn thì không đưa vào bảng, để script tiếp tục báo.

Chạy lại:

```bash
git clone --depth 1 https://github.com/kanripo/KR1a0001.git /tmp/KR1a0001
curl -LO https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip && unzip Unihan.zip Unihan_Readings.txt
npx tsx scripts/verify-originals.ts /tmp/KR1a0001 Unihan_Readings.txt
```

## Kết quả

448 đoạn (64 lời quẻ + 384 lời hào).

- **Không còn đoạn nào thừa hay thiếu chữ** so với Kanripo.
- **Đã sửa 2 chỗ:**
  - Lời quẻ Mông (4): thiếu chữ 來 → “đồng mông **lai** cầu ngã”.
  - 9.3 輻: “bức” → “phúc”.
- **Còn 9 chỗ âm khác bảng**. Tất cả là dị âm hoặc dị bản có căn cứ, nên giữ nguyên:

| Đoạn | Chữ | Đang ghi | Ghi chú |
|---|---|---|---|
| 10.3, 54.2 | 眇 | diểu | cũng đọc “miểu”; hai hào đã thống nhất một cách |
| 11.3 | 陂 | bí | Chu Hy đọc 彼寄反 (bí); cũng có “bi”, “pha” |
| 21.4 | 胏 | tỉ | nhiều bản Việt ghi “chỉ” |
| 26.1 | 己 | dĩ | Kanripo in 己; bản thông hành là 已 (dĩ = dừng) |
| 26.3 | 曰 | nhật | kinh văn là 曰 (viết); Chu Hy đọc 日 (nhật) |
| 43.3 | 頄 | quỳ | cũng đọc “cầu” |
| 49 lời quẻ, 49.2 | 巳 | dĩ | Kanripo in 巳; Chu Hy đọc 已日 (dĩ nhật), có bản đọc 己日 (kỷ nhật) |

## Giới hạn

- Script chỉ kiểm được **chữ nào ứng với âm nào**. Nó không phán được âm nào đúng hơn khi một chữ có nhiều cách đọc, và không kiểm ngắt câu.
- Bảng bổ sung do máy lập, chưa có người duyệt. Người duyệt nên đọc lướt `scripts/hanviet-extra.ts`, vì một âm sai lọt vào bảng sẽ làm mọi lời hào dùng âm đó trông như khớp.
- Kanripo là **một** bản. Chỗ dị bản (như 26.1 己/已) được ghi trong bảng trên.
