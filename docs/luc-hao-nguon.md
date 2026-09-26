# Nguồn cổ thư cho engine Lục Hào (`src/lib/liuyao.ts`)

*Tra cứu ngày 26/09/2026. Mọi trích dẫn dưới đây đã được so khớp nguyên văn (chuỗi con) với bản điện tử lấy về cùng ngày. Không có câu nào chép từ trí nhớ.*

## Bản dùng để tra

| Viết tắt | Sách | Bản điện tử | Ghi chú về độ tin cậy |
|---|---|---|---|
| **TSBD** | 增刪卜易 *Tăng San Bốc Dịch*, 野鶴老人 soạn, 李文輝 (覺子) tăng san, 李我平 giám định | Wikisource: [增刪卜易](https://zh.wikisource.org/wiki/增刪卜易) (quyển 2–4 nằm ngay trên trang chính; quyển 1 ở trang con, ví dụ [增刪卜易/8](https://zh.wikisource.org/wiki/增刪卜易/8)) | Wikisource đánh dấu chất lượng 25–50%. Người nhập nói họ chép từ một bản 地攤 (sách chợ) “錯謬百出”. Dùng được để dẫn ý, nhưng từng chữ cần đối chiếu bản khắc. |
| **BPCT** | 卜筮正宗 *Bốc Phệ Chính Tông*, 王洪緒 | [quanxue.cn](https://www.quanxue.cn/qt_mingxiang/boshiindex.html): bản chép giản thể, **không ghi bản gốc**. Wikisource chỉ có lời tựa ([卜筮正宗（河潞武子龄校本）](https://zh.wikisource.org/wiki/卜筮正宗（河潞武子龄校本）)). ctext.org có sách này ([res 801184](https://ctext.org/wiki.pl?if=gb&res=801184)) nhưng đòi qua kiểm tra chống bot, nên **chưa đối chiếu được**. | Số “chương” trên quanxue (13章, 26章…) là cách chia của trang web. Tài liệu này ghi tên tiết gốc (ví dụ 旬空論第十). |
| **HKS** | 黃金策 *Hoàng Kim Sách* (đề Lưu Cơ), bản in kèm 卜筮正宗 | Wikisource: [黃金策](https://zh.wikisource.org/wiki/黃金策), mục 總斷千金賦 | |
| **HCL** | 火珠林 *Hỏa Châu Lâm* (đề 麻衣道者) | Wikisource: [火珠林](https://zh.wikisource.org/wiki/火珠林), mục 財官輔助 | Chất lượng 50%, giản thể. |

Kanripo: danh mục KR3f là 天文算法 (thiên văn, toán), còn 術數 nằm ở KR3g. Trong KR3g **không có** 增刪卜易, 卜筮正宗 hay 黃金策, vì đây là sách đời Thanh, không vào Tứ khố.

Trong code, mỗi lý do (`Reason.source`) ghi nguồn theo dạng `增刪卜易·<chương>` / `卜筮正宗·<tiết>`.

## 1. Chọn dụng thần

| Quy tắc | Nguyên văn (≤ 25 chữ) | Nguồn |
|---|---|---|
| Hỏi cha mẹ, bề trên, văn thư, nhà cửa, xe thuyền: Phụ Mẫu | 占父母卽以卦中之父母爻爲神 · 章奏文章、馆室，俱以父母爻为用神 | TSBD 用神章第八 ([/8](https://zh.wikisource.org/wiki/增刪卜易/8)); BPCT 用神分類定例第一 ([26章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi26.html)) |
| Công danh, quan phủ, chồng (vợ hỏi), bệnh tật: Quan Quỷ | 妻占夫皆以官鬼爻爲用神 · 病症、尸首、逆风，俱以官鬼爻为用神 | như trên |
| Vợ, người làm, tiền của: Thê Tài | 占妻妾、婢、僕、役 · 占貨財、珠寶、倉庫一切使用之財物 | TSBD 用神章第八 |
| Cầu tài (việc công hay tư): Thê Tài | 公私占卜皆以財爲用神 | TSBD 求財章第六十八 |
| Con cháu, thuốc men, thầy thuốc: Tử Tôn | 占忠臣、良將、醫藥、僧、道、兵卒 | TSBD 用神章第八 |
| Anh chị em: Huynh Đệ | 占兄弟、姐妹、族中兄弟 | TSBD 用神章第八 |
| Tự hỏi bệnh, tuổi thọ, đi xa: hào Thế | 凡占自己疾病，或问寿数，或问出行吉凶 | BPCT 世應論用神第二 |
| (xác nhận) Tự hỏi bệnh lấy Thế | 自占病﹐世爲用神 | TSBD 疾病章第九十九 |
| (xác nhận) Hỏi xuất hành xem Thế trước | 占卜應以世爻爲先 | TSBD 出行章第九十一 |
| Dụng thần hiện nhiều lần: lấy hào vượng | 當擇其旺者而用之 | TSBD 用神元神忌神仇神章第九 ([/9](https://zh.wikisource.org/wiki/增刪卜易/9)) |

### Đối chiếu `suggestUseGod`

| Chủ đề | Code | Nguồn | Kết quả |
|---|---|---|---|
| `work` | Quan Quỷ | 用神章: 占功名、官府 → 官鬼 | Khớp |
| `money` | Thê Tài | 求財章 | Khớp. **Thêm ghi chú**: Tử Tôn là nguyên thần của Tài, Huynh Đệ là kiếp tài (求財章: 「子孫者乃生助財爻之元神也」, 「兄弟乃劫財之神」) |
| `love` nam / nữ | Thê Tài / Quan Quỷ | 用神章: 占妻妾 → 財; 妻占夫 → 官鬼 | Khớp |
| `love` chưa rõ giới | tạm lấy Thê Tài | — | **Chưa tìm được nguyên văn**. Đây là quy ước của app, đã ghi rõ trong lời giải thích. |
| `health` | hào Thế; ghi chú Quỷ = bệnh, Tử Tôn = thuốc | 世應論用神; 用神分類 (病症 → 官鬼, 药材 → 子孫) | Khớp |
| `travel` | hào Thế; ghi chú Phụ Mẫu = xe cộ, giấy tờ, hành lý | 世應論用神; 出行章 「父克世爻﹐風雨舟車行李」 | Khớp |
| `study` | Phụ Mẫu | 用神章 (章奏、文書); 學業章 「父母世爻同旺」 | Khớp. **Thêm ghi chú**: thi cử xem thêm Quan Quỷ (童試章 「父旺官興﹐堪期首選」) |

Không đổi dụng thần chính của chủ đề nào. Đã thêm trường `source` (trích dẫn) vào kết quả `suggestUseGod` và `UseGod`.

## 2. Nguyên thần, kỵ thần, cừu thần

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Nguyên thần: hào sinh dụng thần | 元神，生用神之神卽爲元神 · 生用神之爻即是原神也 | TSBD 用神元神忌神仇神章第九; BPCT 原忌仇神論第四 ([27章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi27.html)) |
| Kỵ thần: hào khắc dụng thần | 忌神克用神之爻也 · 克用神之爻即是忌神也 | như trên |
| Cừu thần: khắc nguyên thần, sinh kỵ thần | 仇神者克元神而生忌神也 · 先看制克原神生扶忌神者，即是仇神也 | như trên |
| Kỵ và nguyên cùng động: tham sinh vong khắc | 是名贪生忘克 · 元神與忌神同動 | BPCT 原忌仇神論第四; TSBD 元神忌神衰旺章第十 ([/10](https://zh.wikisource.org/wiki/增刪卜易/10)) |
| Kỵ thần động, nguyên thần **ám động** cũng tính | 忌神明動於卦中，得元神暗動而生用神 | TSBD 暗動章第二十二 ([/22](https://zh.wikisource.org/wiki/增刪卜易/22)) |

## 3. Vượng tướng hưu tù tử theo nguyệt lệnh

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Bảng năm bậc theo mùa (xuân: Mộc vượng, Hỏa tướng, Thủy hưu, Kim tù, Thổ tử; hạ, thu, đông tương tự) | 春，寅卯木旺，巳午火相，亥子水休，申酉金囚，辰戌丑未土死 | HCL 財官輔助 |
| Tháng Thìn Tuất Sửu Mùi: Thổ vượng, Kim tướng | 四季之月土旺金相 | BPCT 旺相休囚論第十三 ([30章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi30.html)) |
| (xác nhận) Tháng Giêng, Hai: Mộc vượng, Hỏa tướng | 正二月木爲旺、火爲相 | TSBD 四時旺相章第又十五 ([/15又](https://zh.wikisource.org/wiki/增刪卜易/15又)) |

Code dùng công thức: cùng hành = vượng, tháng sinh hào = tướng, hào sinh tháng = hưu, hào khắc tháng = tù, tháng khắc hào = tử. Với tháng Dần Mão / Tỵ Ngọ / Thân Dậu / Hợi Tý, công thức cho đúng bảng của HCL (test kiểm mùa xuân và mùa đông).

- **Chưa tìm được nguyên văn**: phân biệt *hưu / tù / tử* trong tháng Thổ (Thìn Tuất Sửu Mùi). BPCT chỉ có 「土旺金相」, TSBD chỉ nói 「其餘俱作休囚」. Bậc hưu (Hỏa), tù (Mộc), tử (Thủy) trong tháng Thổ là suy từ công thức.
- Mùa của HCL xếp Thìn Tuất Sửu Mùi vào nhóm Thổ chung (xuân: 「辰戌丑未土死」), còn BPCT và TSBD coi tháng Thìn là tháng Thổ vượng. Code theo BPCT/TSBD: dùng **hành của chi tháng**, không dùng mùa.

## 4. Nguyệt phá

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Hào bị chi tháng xung là nguyệt phá | 凡月建所冲之爻名为月破 · 月建沖之爲月破 | BPCT 月破定例 ([17章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi17.html)); TSBD 月破章第二十七 |
| Chân phá: tĩnh, lại tuần không/suy, bị khắc | 如破而安静再值旬空衰弱 · 此等月破谓之真破 | BPCT 月破論第九 ([28章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi28.html)) |
| Hào động bị phá vẫn tác động được | 動則能傷於爻﹐變則能傷於動 | TSBD 月破章第二十七 |
| Hào lâm nhật thần thì phá mà không phá | 爻臨卯木謂之逢破不破 (ví dụ 酉月卯日) | TSBD 日辰章第十七 ([/17](https://zh.wikisource.org/wiki/增刪卜易/17)) |
| Lục xung (Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi) | 子午相沖、丑未相沖、寅申相沖 | TSBD 六沖章第二十 ([/20](https://zh.wikisource.org/wiki/增刪卜易/20)) |

Cách code đọc “chân phá” (`trueBroken`): hào tĩnh, không được nhật thần hay hào động nào sinh phù, và gặp một trong ba điều: tuần không, bị nhật thần khắc, bị hào động khắc. Câu của BPCT gộp nhiều điều kiện trong một câu. Việc chỉ cần **một trong ba** là cách đọc của engine.

## 5. Nhật thần: sinh, khắc, phù; ám động, nhật phá, xung tán

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Nhật thần cùng hành là phù (tỷ) | 比之者，爻與日月同也 | TSBD 日辰章第十七, 總注 |
| Tĩnh, vượng tướng, bị ngày xung: ám động | 沖旺相之靜爻，旣爲暗動 · 靜爻旺相日辰沖之爲暗動 | TSBD 日辰章第十七; 暗動章第二十二 |
| (xác nhận) | 動值合而絆住，靜得沖而暗興 | HKS 總斷千金賦 |
| Tĩnh, suy, bị ngày xung: nhật phá | 沖衰弱之靜爻爲日破 · 休囚而遇日沖謂之日破 | TSBD 日辰章第十七; 六沖章第二十 |
| Hào động bị ngày xung: vượng thì không tán | 旺相者沖之不散 | TSBD 動散章第二十三 ([/23](https://zh.wikisource.org/wiki/增刪卜易/23)) |
| Hào ám động có thể sinh hào khác | 得未日沖動丑土，土動生金 | TSBD 暗動章第二十二 (ví dụ 寅月己未日) |
| Hào động khắc được hào tĩnh, dù hưu tù | 動而能克旺相之卯木 | TSBD 動靜生克章第十四 ([/14](https://zh.wikisource.org/wiki/增刪卜易/14)) |
| Hào phát động thì dù hưu tù cũng không hung | 用爻发动在宫中，纵值休囚亦不凶 | BPCT 用神發動訣 ([15章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi15.html)) |

“Có khí” để thành ám động: vượng/tướng theo nguyệt lệnh, **hoặc nhật thần cùng hành**. Vế sau suy từ ví dụ 寅月己未日 của 暗動章: sách gọi Sửu (hưu tù mùa xuân) bị ngày Mùi xung là 沖動 (ám động). **Chưa tìm được nguyên văn** phát biểu thành quy tắc tổng quát.

Hào động bị nhật xung: code chỉ ghi chú (effect 0). TSBD cho rằng hào vượng tướng thì không tán, hưu tù cũng hiếm khi tán, và nói các sách khác coi trọng “xung tán” (TSBD dẫn 易冒, sách mà ở đây chưa tra được). Code theo TSBD.

## 6. Hào động hóa biến

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Tiến thần: Hợi→Tý, Sửu→Thìn, Dần→Mão, Thìn→Mùi, Tỵ→Ngọ, Mùi→Tuất, Thân→Dậu, Tuất→Sửu | 凡卦中亥变子，丑变辰，寅变卯 … 未变戌，申变酉，戌变丑，乃进神也 | BPCT 變出進退神論第十七 ([31章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi31.html)) |
| Thoái thần: chiều ngược lại | 辰变丑，卯变寅，丑变戌，乃退神也 | như trên |
| (xác nhận, 7 cặp) | 亥化子﹐寅化卯﹐巳化午﹐申化酉﹐丑化辰﹐辰化未﹐未化戌 | TSBD 進神退神章第二十九 |
| Hào biến chỉ sinh khắc hào động của chính nó | 能生克沖合本位之動爻，不能生克他爻 | TSBD 動變生克沖合章第十五 ([/15](https://zh.wikisource.org/wiki/增刪卜易/15)) |
| Hồi đầu khắc | 變爻之巳火能回頭克本位之酉金 · 戒回頭之剋我 | TSBD 動變生克沖合章第十五; HKS 總斷千金賦 |
| Hồi đầu sinh | 又化子水回頭生 | TSBD 動散章第二十三 |
| Hóa hồi đầu xung | 動爻化回頭沖。如逢仇敵 | TSBD 六沖章第二十 |
| Hóa không: động mà hóa không thì chưa phải không | 動而化空、伏而旺相皆不爲空 · 动爻变空 (thuộc nhóm “có dụng”) | TSBD 旬空章第二十六; BPCT 旬空論第十 |
| Hóa phá, hóa tuyệt làm nguyên/kỵ thần mất lực | 化絕、化克、化破、化散 | TSBD 元神忌神衰旺章第十 |
| Hóa mộ | 化絕、化墓、化克，又怕他爻增制克 | TSBD 月將章第十六 ([/16](https://zh.wikisource.org/wiki/增刪卜易/16)) |
| Mộ, tuyệt của ngũ hành | 火库于戌，绝于亥。金库于丑，绝于寅 · 水土库于辰，绝于巳。木库于未，绝于申 | BPCT 四生逐位論第八 |
| Thổ hóa Tỵ gọi là hồi đầu sinh, không gọi hóa tuyệt | 如土化出巳，有日月帮比不云化绝，乃云回头生也 | BPCT 絕處逢生克處逢生論第十六 |

Chỗ các nguồn khác nhau:
- Bản TSBD trên Wikisource **thiếu cặp Tuất→Sửu** (tiến) và Sửu→Tuất (thoái). Có thể do người nhập bỏ sót. Code theo BPCT (8 cặp).
- **Hóa không**: HKS viết 「自空化空，必成凶咎」, còn TSBD và BPCT cho rằng động hóa không thì chưa phải không. Code theo TSBD/BPCT: chỉ ghi chú “chờ ngày xuất không” (effect 0).
- **Hóa mộ khi cùng hành** (ví dụ Sửu hóa Thìn, vừa tiến thần vừa là mộ của Thổ): **chưa tìm được nguyên văn** phân xử. Code gắn cờ `tomb` nhưng không trừ điểm.
- **Hóa thoái khi vượng**: TSBD 「動變皆屬秋金﹐當相得令﹐占近事豈可曰退」, tức hào vượng thì việc gần chưa coi là thoái. Code vẫn trừ 1 điểm cho hóa thoái và ghi lý do; phần “việc gần hay xa” engine không biết.

## 7. Tuần không: chân không, giả không

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Các trường hợp không tính là không | 旺不爲空，動不爲空 · 有日建動爻生扶者不爲空 | TSBD 旬空章第二十六 ([/26](https://zh.wikisource.org/wiki/增刪卜易/26)) |
| Nguyệt phá thì là không | 月破爲空 | như trên |
| Chân không theo mùa | 眞空卽春土、夏金、秋木、三冬逢火是眞空 · 春土夏金秋树木，三冬逢火是真空 | TSBD 旬空章; BPCT 用神空亡訣 |
| Có dụng (giả không) / chân không | 此等旬空到底有用 · 静逢月破值此旬空者，谓之真空到底空矣 | BPCT 旬空論第十 ([29章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi29.html)) |
| Động mà gặp xung không gọi là không; tĩnh mà bị khắc mới là không | 发动逢冲不谓空，静空遇克却为空 | BPCT 用神空亡訣 |
| Nhật thần xung hào không thì hào khởi lên | 沖空卽起 | TSBD 日辰章第十七 |
| Hào vượng mà tuần không thì trong tuần vẫn là không | 在旬內者畢竟爲空 | TSBD 月將章第十六 |
| (ví dụ) Tháng Thìn, Sửu có khí thì không phải không | 古法有气不爲空 | TSBD 旬空章 (ví dụ 辰月乙卯日) |

Cách code phân loại (`VoidKind`):
1. Tĩnh mà gặp nguyệt phá (và không lâm nhật) → **chân không**.
2. Vượng/tướng, hoặc phát động, hoặc được nhật thần sinh/phù, hoặc được hào động / ám động sinh → **giả không** (có dụng, chờ xuất tuần hoặc ngày xung thực).
3. Còn lại (hưu tù, an tĩnh, không được sinh phù) → **chân không**. Code ghi thêm lý do nếu hào bị nhật hoặc hào động khắc.

Chân không theo mùa (春土夏金秋木冬火) trùng với bậc *tử* nên đã nằm trong bước 3. Chữ “giả không” chỉ xuất hiện trong danh sách thuật ngữ của TSBD (「有眞空、假空…」). **Chưa tìm được nguyên văn định nghĩa trực tiếp** chữ này. Code dùng nó cho nhóm “到底有用” của BPCT. Trường hợp hào vượng mà bị nhật thần khắc: BPCT liệt kê 「日辰克」 trong nhóm chân không, còn TSBD nói 「旺不爲空」. Code cho vượng thắng (giả không), và đây là **cách đọc của engine**.

## 8. Phục thần

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Dụng thần không hiện: tìm trong quẻ thuần đầu cung | 則本宮首卦尋之 · 即以首卦为伏 | TSBD 飛伏神章第二十八; BPCT 神正傳第六 |
| Dụng thần không hiện mà nhật/nguyệt là lục thân đó: lấy nhật/nguyệt | 若用神不現﹐卽以日月爲用神 · 卦無用神卽以月建爲用神 | TSBD 飛伏神章; 月將章第十六 |
| Phi thần sinh phục thần | 謂之飛來生伏得長生 | TSBD 飛伏神章 |
| Phi thần khắc phục thần | 伏神遭克害﹐名爲伏神受制 | TSBD 飛伏神章 |
| Sáu điều kiện hữu dụng | 伏神有用者有六 (nhật nguyệt sinh; vượng tướng; phi thần sinh; hào động sinh; nhật nguyệt hoặc hào động xung khắc phi thần; phi thần không, phá, hưu tù, mộ tuyệt) | TSBD 飛伏神章 |
| Năm điều kiện vô dụng | 伏神終不得出者有五 (hưu tù vô khí; bị nhật nguyệt xung khắc; bị phi thần vượng khắc; mộ tuyệt ở nhật nguyệt hoặc phi thần; hưu tù lại không hoặc phá) | TSBD 飛伏神章 |

`hiddenSpirits` hiện có (lấy lục thân vắng từ quẻ thuần của cung, cùng vị trí hào) khớp cả TSBD lẫn BPCT. Cách kết luận (`usable` nếu không vướng điều kiện vô dụng nào, `unusable` nếu không có điều kiện hữu dụng nào, còn lại `mixed`) là **quy ước của engine**. Sách liệt kê điều kiện nhưng không nói cách cân khi hai bên cùng có.

## 9. Không có nguyên văn: cách engine ra kết luận

- **Chấm điểm vượng/suy** (`StrengthVerdict`): mỗi lý do +1, −1 hoặc 0, cộng lại: dương là vượng, âm là suy, bằng 0 là cân bằng. Các sách chỉ liệt kê yếu tố, không có trọng số. Đây là **quy ước của engine**, và `notes` của khối dụng thần có ghi rõ điều này.
- Chọn hào dụng thần “vượng nhất” khi hiện nhiều lần: có nguồn (當擇其旺者而用之). Riêng việc đo “vượng” bằng điểm trên là quy ước.
- Dụng thần vắng, phục thần hữu dụng → kết luận “vượng”, trộn → “cân bằng”, vô dụng → “suy”: quy ước.
- Các quy tắc sách có mà engine **chưa làm**: tam hợp, lục hợp (hợp trú, xung khai), tam hình, tùy quỷ nhập mộ, phản ngâm/phục ngâm, lục thần, ứng kỳ, và “đa chiêm” (TSBD khuyên gieo lại khi gặp tuần không hay phục thần).

## Kiểm lại trích dẫn

Các bước đã làm:
1. Lấy mã nguồn wiki qua `https://zh.wikisource.org/w/index.php?title=<tên>&action=raw`: 增刪卜易 (trang chính và các trang con `/7`…`/26`), 黃金策, 火珠林.
2. Lấy HTML các trang `boshiNN.html` trên quanxue.cn (01–54) rồi bỏ thẻ HTML.
3. Kiểm từng câu trong các bảng trên bằng so khớp chuỗi con, và đếm số chữ Hán (≤ 25). Kết quả: 80/80 khớp.

Test (`tests/liuyao.test.ts`) dùng lại nguyên các ví dụ của TSBD (月破章, 進神退神章, 暗動章, 元神忌神衰旺章, 旬空章, 動散章, 飛伏神章) làm ca kiểm tra.
