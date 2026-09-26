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
- Các quy tắc sách có mà engine **chưa làm**: lục thần (ý nghĩa Thanh Long, Bạch Hổ…), lục hại (BPCT 「六害屡试无验，故不录」), và “đa chiêm” (TSBD khuyên gieo lại khi gặp tuần không hay phục thần; engine chỉ nhắc trong `TIMING_DISCLAIMER`). Lục hợp, tam hợp, tam hình, mộ, phản/phục ngâm, ứng kỳ: xem mục 10–15.
- **Các khối mới không cộng điểm.** Lý do từ mục 10–15 nằm trong `he.reasons`, `hexagram.reasons`, `sanHe[].reasons`, `xing[].reasons` và `useGod.relationReasons`, có `effect` để giao diện tô màu, nhưng **không** cộng vào `strength.score` hay `useGod.verdict.score`. Lý do: giữ tương thích với kết quả cũ, và sách không cho trọng số.

## 10. Lục hợp

API: `branchesCombine(a, b)`; mỗi hào có `LineAssessment.he` (`day`, `month`, `moving`, `change`, `state`, `changeKind`, `staticPairs`, `patterns`, `reasons`).

| Quy tắc | Nguyên văn (≤ 25 chữ) | Nguồn |
|---|---|---|
| Sáu cặp hợp | 子與丑合、寅與亥合、卯與戌合 | TSBD 六合章第十九 ([/19](https://zh.wikisource.org/wiki/增刪卜易/19)) |
| Tĩnh gặp hợp: hợp khởi (`heQi`) | 靜而逢合，謂之合起 · 卽使爻值休囚亦有旺相之意 | như trên |
| Động gặp nhật/nguyệt hợp: hợp bán (`heBan`) | 動而逢合，合謂之合絆 · 動值合而絆住，靜得沖而暗興 | TSBD 六合章; HKS 總斷千金賦 ([黃金策](https://zh.wikisource.org/wiki/黃金策)) |
| Hào động hợp hào động: hợp hảo (`heHao`); hóa hợp: hóa phù (`huaFu`) | 爻與爻合謂之合好，爻動化合謂之化扶 · 爻動與動爻相合，乃得他來合我，與我和好 | TSBD 六合章 |
| Hai hào tĩnh hợp nhau không tính (`staticPairs`, không ra lý do) | 古之不動﹐宜爲之合﹐非也﹐兩爻皆動﹐始爲合 | TSBD 增刪黃金策千金賦章第三十四 (trang chính [增刪卜易](https://zh.wikisource.org/wiki/增刪卜易), quyển 2) |
| Hợp trú chờ xung khai (ứng kỳ) | 如逢合住，須沖破以成功 · 正所謂如逢合住﹐沖破成功 · 且如爻中寅與亥合﹐事若在申巳之日月方成其事 | HKS; TSBD 千金賦章 |
| Động bị hợp: đến ngày xung khai thì cát hung đều thành | 予得驗者﹐後逢沖開之日月﹐吉凶俱成 | TSBD 千金賦章 |
| Nhật thần xung hào đang bị hợp thì tan | 逢合住遇日建以沖開，謂之沖合則散 | TSBD 日辰章第十七 ([/17](https://zh.wikisource.org/wiki/增刪卜易/17)) |
| Hợp trung đới khắc (`heWithKe`): Tý hóa Sửu, Tuất hóa Mão | 此子与丑合、卯与戌合，合中带克 | BPCT 合中帶克論第十四 ([30章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi30.html)) |
| Thân hóa Tỵ không luận khắc (`heChangSheng`); tháng/ngày Dần thì thành tam hình | 惟申金化巳火者，即无日月与动爻相生不作克论 · 倘寅月日占之是三刑会聚 | như trên |
| Hợp xứ phùng xung: ba dạng | 凡得六合变六冲一也，日月冲爻二也，动爻变冲三也 | BPCT 合處逢沖沖中逢合論第十五 (30章) |
| Xung trung phùng hợp: ba dạng | 凡得六冲变六合一也，日月合爻二也，动爻变合三也 | như trên |
| Ý nghĩa | 合处逢冲谋虽成而终散，冲中逢合事已散而复成 | như trên |
| Ví dụ: hào hóa hồi đầu xung, ngày hợp | 幸辰日合之，沖中逢合 · 世上酉金化卯木相冲，正谓反吟卦也 | TSBD 六沖章第二十 ([/20](https://zh.wikisource.org/wiki/增刪卜易/20)); BPCT 十八問答第十一問 ([47章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi47.html)) |
| Nguyệt phá gặp hợp thì hết phá | 實破之日則不破﹐合之日則不破 · 月破最喜逢合填实 | TSBD 月破章第二十七 (trang chính); BPCT 月破論第九 ([28章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi28.html)) |
| Hợp chỉ cát khi dụng thần có khí | 然必用神有气相宜，用若失陷無益 | TSBD 六合章 |

Cách engine đọc (**quy ước, chưa tìm được nguyên văn**):
- **Thứ tự để gọi tên** “hợp xứ phùng xung” hay “xung trung phùng hợp” ở cấp hào: hào động < hào biến < nguyệt < nhật. Quan hệ đến sau (hợp hay xung) quyết định tên gọi. Thứ tự này khớp ví dụ 恆之豫 của cả hai sách (hồi đầu xung rồi nhật hợp → xung trung phùng hợp), nhưng sách không phát biểu thành quy tắc.
- **Hào ám động** được tính như hào động khi xét hợp với hào khác. TSBD chỉ nói điều này cho tam hợp (「一爻明動一爻暗動亦作兩爻動」).
- **Hợp trung đới khắc**: “vượng” là vượng/tướng theo tháng, hoặc được nhật thần hay hào động sinh phù; “bị khắc” là nhật thần hoặc hào động khắc. Suy mà không bị khắc thì ghi “sách không nói rõ” (effect 0).

**Mâu thuẫn trong TSBD**: cùng chương 六合章 vừa viết 「爻動或與日月動爻合者謂之動逢合而絆住」 (hào động bị hào động hợp cũng là bán), vừa viết 「爻動與動爻相合…與我和好」 (hợp hảo). Engine theo câu thứ hai cho trường hợp động hợp động (`heHao`), và chỉ gọi `heBan` khi nhật/nguyệt hợp hào động.

## 11. Quẻ lục hợp / lục xung, phản ngâm / phục ngâm

API: `hexagramPattern(n)`, `FAN_YIN_TRIGRAM`; `assessment.hexagram` (`primary`, `transformed`, `transition`, `patterns`, `inner`, `outer`, `fanYin`, `fuYin`, `reasons`); mỗi hào động có `change.fanYin` / `change.fuYin`.

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Quẻ lục hợp: sáu hào tự hợp nhau | 卦逢六合者卽如天地否卦內外六爻自相和合是也 | TSBD 六合章 |
| Lục xung biến lục hợp: tan rồi tụ; không cần xét dụng thần | 因得屢驗六沖變合，散而復聚 · 獨此六沖卦變六合得不看用神，竟以吉斷 | như trên |
| Lục hợp biến lục xung: trước hợp sau ly | 合而變沖，不久之兆 · 凡得六合變六沖者，諸占先合後離 | TSBD 六沖章 |
| Quẻ lục xung gặp nhật hợp / hóa hợp; quẻ lục hợp gặp nhật xung / hóa xung | 凡六冲卦有日辰相合．变爻相合，谓之冲中逄合 · 凡六合卦有日辰相冲．变爻相冲，谓之合处逄冲 | BPCT 十八問答第十三問 ([49章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi49.html)) |
| Quái phản ngâm (`fanYin: 'trigram'`): Càn–Tốn, Khảm–Ly, Cấn–Khôn, Chấn–Đoài đổi chỗ | 卦有反吟，卦变相冲也．爻之反吟，爻变相冲也 · 故乾为天卦变巽为风卦 | BPCT 反吟卦定例第十一 ([29章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi29.html)) |
| Hào phản ngâm cấp quái (`fanYin: 'branch'`): chỉ Khôn ↔ Tốn | 壹卦中惟有坤变巽，巽变坤 | như trên |
| Phản ngâm từng hào (`change.fanYin`) | 亦以此变出相冲，乃爻之反吟也 | như trên |
| Phục ngâm (`fuYin`): chỉ Càn ↔ Chấn, chi y như cũ | 此子寅辰复化子寅辰，午申戌复化午申戌 · 伏吟惟乾变震、震变乾 | BPCT 伏吟卦定例第十二 (29章) |
| Phục ngâm từng hào (`change.fuYin`) | 午火帝旺于午为伏吟 | BPCT 四生逐位論第八 (28章) |
| Nội / ngoại phản ngâm | 內卦反伏，內則不安。外卦反伏，外則不寧 | TSBD 反伏章第二十五 ([/25](https://zh.wikisource.org/wiki/增刪卜易/25)) |
| Phản ngâm mà dụng thần không hóa xung khắc thì vẫn thành | 用神不变冲克者，事虽主反复，亦主事就 · 反伏卦用神旺相不變沖克者𨿽則反復，事之必成 | BPCT 十八問答第五問 ([41章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi41.html)); TSBD 反伏章 |
| Dụng thần hóa xung khắc: đại hung | 第嫌用神化冲克者，凡谋大凶 | BPCT 第五問 |
| Phục ngâm: ưu uất; vượng thì chờ năm tháng xung khai | 伏吟者，忧郁呻吟之象 · 伏吟之卦，用神旺相，沖開之年月，其志則伸 | BPCT 十八問答第六問 ([42章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi42.html)); TSBD 反伏章 |

**Chỗ hai sách khác nhau (phản ngâm cấp quẻ).** BPCT định nghĩa quái phản ngâm bằng bốn cặp quái đối xung, kèm ví dụ (姤↔小畜, 既濟↔未濟, 剝↔謙, 歸妹↔隨). TSBD ghi 「卦變者內外動而反伏者同一卦也。如乾卦變坤卦」 (反伏章), và ở 尋地章第一百十九 (ngay sau 塋葬章 / 墓葬章第一百十八) ghi 「如巽變乾﹐坤變震之類﹐名爲化絕化克」. Càn → Khôn và Khôn → Chấn **không** thuộc bốn cặp của BPCT. Các ví dụ TSBD thật sự luận giải (比之井, 臨之中孚, 升之觀, 巽之升, 恆之豫) đều là Khôn ↔ Tốn, tức “hào phản ngâm” theo BPCT. Engine làm theo BPCT (có danh sách rõ ràng) và **không** gắn cờ Càn → Khôn là phản ngâm. Bản Wikisource của TSBD chỉ đạt chất lượng 25–50%, nên câu 「如乾卦變坤卦」 có thể bị chép sai.

Phản ngâm với dụng thần (`relationReasons`: `fan-yin-use-god-hit` / `fan-yin-use-god-ok`): engine xét phản ngâm ở **cả quẻ**, không chỉ ở quái chứa dụng thần. Lý do là ví dụ 臨之中孚 của TSBD: ngoại quái phản ngâm, dụng thần ở nội quái, sách vẫn luận “đi rồi lại về”.

## 12. Tam hợp cục

API: `SAN_HE_GROUPS`; `assessment.sanHe[]` (`element`, `status`, `members`, `missing`, `half`, `includesShi`, `shiRelation`, `useGodRole`, `waits`, `reasons`).

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Bốn cục | 申子辰合成水局、巳酉丑合成金局 · 申子辰会成水局 | TSBD 六合章; BPCT 三合會局歌 ([09章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi09.html)) |
| Hai hào động, một hào tĩnh cũng thành cục | 若兩爻動一爻不動亦成合局者二也 | TSBD 六合章 |
| Hào 1 và 3 (hoặc 4 và 6) động, hào biến góp chi thứ ba | 有內卦初爻、三爻、動而變出爻成三合者三也 | như trên |
| Ám động tính như động | 一爻明動一爻暗動亦作兩爻動 | như trên |
| Không động không thành cục | 不动不成局 | BPCT 十八問答第四問 ([40章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi40.html)) |
| Nhật nguyệt góp chi | 日月合成官局旺相當時 · 借寅月建补成三合 | TSBD 隨鬼入墓章第三十 (trang chính); BPCT 第四問 |
| Thiếu một chi: hư nhất đãi dụng (`virtual`) | 殊不知虛一待用﹐待後時之月日可以塡之 · 謂之虛三待用 | TSBD 千金賦章; 六合章 |
| Chi thứ ba chỉ là hào tĩnh: chờ ngày trị (`staticMember`) | 如一爻静二爻发者，待一爻静者值日应事 · 内少寅字发动，须寅日递呈可也 | BPCT 第四問 |
| Thành viên không / phá / mộ | 三合局中若有一空破者，待塡滿之日月成之 · 有一爻入墓者待沖開之日成之 | TSBD 六合章 |
| Cục với Thế | 必要世爻在局者爲美 · 局生世爻爲吉，局克世爻爲凶 | như trên |
| Cục với dụng thần (`useGodRole`) | 原用二神局则吉，忌仇二神局则凶 | BPCT 第四問 |
| Phân nội ngoại (`half`) | 外卦爲人村，巳酉丑合金局來克木 | TSBD 六合章 (ví dụ 離之坤) |

Cách engine đọc:
- Hào biến chỉ được góp chi khi **chính hào động sinh ra nó** cũng ở trong cục. Đây là cách khái quát dạng 3 và dạng 4 của TSBD, đồng thời giữ quy tắc “hào biến chỉ tác động hào động của nó” (mục 6). **Quy ước**.
- `staticMember` và `virtual` chỉ được xét khi hai chi còn lại đều do hào động, hào ám động hoặc hào biến góp (nhật nguyệt không tính vào hai chi này). **Quy ước**.
- Khi một chi có nhiều nguồn, engine chọn theo thứ tự: hào động, ám động, hào biến, nhật, nguyệt, hào tĩnh.

**Mâu thuẫn**:
- TSBD ghi dạng 1 là 「一卦之內有一爻動而合局者一也」: **một** hào động mà thành cục, câu này vô lý. Có thể bản chép sai từ “三爻”. Engine không làm theo nghĩa đen.
- TSBD dạng 2 nói hai động một tĩnh **thành cục**, nhưng ví dụ 萃之否 của chính TSBD (Mão là hào tĩnh) lại nói 「因少卯字﹐明年卯月必升﹐此乃虛一待用」. BPCT cũng coi Dần tĩnh là “虛一待用” (乾之需). Engine gọi trường hợp này là `staticMember`: chưa tính là thành, nhưng chờ ngày chi tĩnh đó. (Bản TSBD ở ví dụ này viết 「巳日沖動亥月」, có lẽ phải là 亥爻.)
- HKS 「刑非刑，合非合，為少支神」 (thiếu một chi thì không thành). TSBD bác: 「殊不知虛一待用」. Engine theo TSBD.

## 13. Tam hình, tự hình

API: `XING_GROUPS`, `SELF_XING_BRANCHES`; `assessment.xing[]` (`kind`, `status`, `members`, `missing`, `active`, `positions`, `involvesUseGod`, `weight`, `reasons`).

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Các nhóm hình | 寅刑巳，巳刑申，丑戌相刑未并臻 · 子刑卯，卯刑子，辰午酉亥自相刑 | BPCT 三刑六害歌 ([10章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi10.html)) |
| Tam hình phải đủ ba chi (Tý Mão đủ hai) | 寅申巳三全为刑，子卯两遇为刑 | BPCT 十八問答第十四問 ([50章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi50.html)) |
| Tự hình | 辰午酉亥謂之自刑 | TSBD 三刑章第二十一 ([/21](https://zh.wikisource.org/wiki/增刪卜易/21)) |
| **TSBD hoài nghi**: tự mình phạm hình ít khi nghiệm | 而獨犯三刑得驗者少，占過數十年只驗得一卦 · 或因用神休囚又兼他爻犯之，刑者則見凶 | TSBD 三刑章 |
| BPCT cũng vậy: đủ mà không động, dụng thần không thương thì không nghiệm | 用神休囚，有他爻之克，内有兼犯三刑者，主见凶灾 · 三刑俱全不动，用神不伤损有生扶，从无有验 | BPCT 第十四問 |
| Chủ sự hào cùng nhật nguyệt, hào động thành tam hình | 主事爻與日月動爻作三刑者﹐占事不成 | TSBD 千金賦章 |
| Thiếu một chi vẫn chờ ngày bổ (`virtual`) | 三刑少申字﹐防申日之危﹐果卒於申日 | như trên (ví dụ 困之兌) |
| (HKS ngược lại) | 刑非刑，合非合，為少支神 · 但少一字﹐不成三刑 | HKS; TSBD 千金賦章 dẫn “cựu chú” rồi bác |

Engine: mọi lý do tam hình có `effect` 0. Riêng `relationReasons` của dụng thần có `xing-use-god-weak` (−1), và chỉ khi tam hình đủ, có hào động, dụng thần suy **và** bị khắc. Đó đúng là điều kiện của cả hai sách. Trong ví dụ duy nhất TSBD thấy nghiệm (家人之離), dụng thần lại **vượng**, nên engine chỉ ghi chú, đúng như sách tự nhận là ngoại lệ. Ví dụ 困之節 (六合章) đủ Dần Tỵ Thân, nhưng sách vẫn đoán 「六合萬載安然」.

- **Chưa tìm được nguyên văn**: điều kiện để thành tự hình. Engine coi là tự hình khi chi Thìn/Ngọ/Dậu/Hợi của một hào gặp lại chính chi đó ở nhật, nguyệt, hào động hoặc hào biến (hai hào tĩnh cùng chi thì không tính). Ví dụ 离之颐 của BPCT (「午日，午酉酉自刑俱全」) không đủ rõ để suy ra quy tắc.
- **Bản TSBD trên Wikisource** chép 「子刑卯、卯刑午…未辰相刑」, khác BPCT (「卯刑子」, 「丑戌相刑未并臻」). Có lẽ là lỗi chép (Mão với Ngọ, Mùi với Thìn không thuộc nhóm hình nào trong các sách khác). Engine theo BPCT.

## 14. Mộ, nhập mộ

API: `LineAssessment.tomb` (`branch`, `kinds`, `movingPositions`, `withGhost`, `genuine`, `reasons`, `openBranch`, `label`, `source`); ghi chú `ji-in-tomb` trong `useGod.notes`; lý do `tomb-genuine` / `tomb-not-genuine` trong `relationReasons`. `change.tomb` cũ vẫn giữ nguyên.

| Quy tắc | Nguyên văn | Nguồn |
|---|---|---|
| Bảng mộ (Thủy Thổ chung mộ Thìn) | 土水長生在申，旺在子，墓在辰，絕在巳 | TSBD 生旺墓絕章第又二十六 ([/26又1](https://zh.wikisource.org/wiki/增刪卜易/26又1)); BPCT 四生逐位論 (mục 6) |
| Ba mộ: nhật mộ, động mộ, hóa mộ | 古有日墓﹑動墓﹑化墓之三墓 · 三墓：卽用爻入日墓、入動墓、動而化墓 | TSBD 隨鬼入墓章第三十 (trang chính); 各門類題頭總注章第又二十六 ([/26又2](https://zh.wikisource.org/wiki/增刪卜易/26又2)) |
| Nguyệt mộ (ví dụ) | 又入月德之墓 | TSBD 隨鬼入墓章 (戌月甲寅日) |
| Chỉ là mộ thật khi hưu tù bị khắc (`genuine`) | 惟世爻休囚被克﹐而又入墓者﹐是也 | như trên |
| Mộ bị xung phá thì không thật | 墓神破﹐日月動爻沖破﹐亦非眞也 · 墓破如破网﹐容易而出矣 | như trên |
| Ý nghĩa của mộ | 古法以墓爲沈滯昏迷之象﹐此說近理 | như trên |
| Chờ xung khai (`openBranch`) | 墓中人，不沖不發 · 沖開丑墓之日而出也 · 入三墓俱喜沖開 | HKS; TSBD 隨鬼入墓章; 各門類應期總注章 |
| Kỵ thần nhập mộ khó khắc | 入墓難剋，帶旺匪空 · 忌神入墓不克用神 | HKS; TSBD 千金賦章 (cựu chú) |
| … nhưng TSBD thêm: ngày xung khai mộ vẫn khắc | 屢見後逢沖開墓庫日﹐依然木被金傷 | TSBD 千金賦章 |
| (BPCT) mộ tuyệt có ba nơi; dụng thần có cứu thì không hung | 四生墓绝有三：生墓绝于日辰一也 · 用神墓绝有救无凶 | BPCT 十八問答第十二問 ([48章](https://www.quanxue.cn/qt_mingxiang/boshi/boshi48.html)) |

Cách engine đọc:
- `withGhost` (tùy quỷ nhập mộ): hào Thế mang Quan Quỷ mà nhập mộ, như cả bốn ví dụ trong chương. TSBD bỏ các loại mộ “thân”, “mệnh” của cổ pháp, và engine cũng không làm.
- `genuine = !vượng tướng && !được nhật/hào động sinh phù && bị khắc (nhật, hào động, hồi đầu khắc) && mộ không bị nguyệt/nhật/hào động xung`. TSBD viết 「旺相者非眞」 và 「若旺而有扶亦有求解」; việc gộp “sinh phù” vào điều kiện “không thật” là **cách đọc của engine**.
- Hào đứng ngay trên chi mộ (ví dụ hào Thìn Thổ gặp ngày Thìn) thì coi là *lâm*, không tính nhập mộ. **Quy ước, chưa tìm được nguyên văn.**
- Động mộ chỉ tính hào động thật (明動), không tính hào ám động.

## 15. Ứng kỳ

API: `assessment.timing` (`target`, `hints[]` gồm `key`/`label`/`branches`/`branchLabels`/`source`, `disclaimer`); hằng `TIMING_DISCLAIMER`. Ứng kỳ luôn tính cho hào dụng thần chính (`useGod.primary`). Nếu dụng thần vắng thì tính cho phục thần; nếu có nhật/nguyệt thay thế thì chỉ trả lời chung.

| `key` | Quy tắc | Nguyên văn | Nguồn |
|---|---|---|---|
| `static-value-clash` | Tĩnh: ngày trị hoặc ngày xung | 靜而逢值逢沖 | TSBD 各門類應期總注章 ([/26又3](https://zh.wikisource.org/wiki/增刪卜易/26又3)) |
| `moving-he-value` | Động: ngày hợp hoặc ngày trị | 動而逢合逢值 | như trên |
| `too-strong` | Quá vượng: ngày mộ, ngày xung | 太旺者逢墓逢沖 | như trên |
| `weak-sheng-wang` | Suy: ngày tháng sinh, vượng | 衰絕者，遇生遇旺 · 若遇休囚，必生旺而成事 | như trên; HKS |
| `tomb-open` | Nhập mộ: ngày xung khai | 入三墓俱喜沖開 | như trên |
| `he-open` | Gặp hợp: ngày xung | 遇六合亦宜相擊 | như trên |
| `break-fill` | Nguyệt phá: thực phá, gặp hợp, ra khỏi tháng | 月破喜塡 · 目下𨿽破﹐出月則不破 · 應卯日得信者﹐破而逢合之日也 · 定於實破之年 | như trên; TSBD 月破章 |
| `void-fill` | Tuần không: xuất tuần, điền thực, xung | 旬空最愛塡沖 · 不过待其出旬、值日、有合空、冲起、冲实、填补之法 · 戌日沖空塡實，本日辰得財 | như trên; BPCT 旬空論; TSBD 六沖章 |
| `good-but-attacked` | Đại tượng cát mà bị khắc: chờ khắc thần bị khắc | 大象吉而受克，須待克神受克 | TSBD 應期總注章 |
| `bad-and-attacked` | Đại tượng hung bị khắc: phòng ngày khắc thần được sinh | 大象凶而受克，須防克者逢生 | như trên |
| `advance` / `retreat` | Hóa tiến: trị, hợp; hóa thoái: kỵ trị, xung của hào biến | 化進神、逢值逢合 · 化退神、忌值忌沖 | như trên |
| `change-value` | Hào động và hào biến đều có thể ứng | 有戌日應者，有酉日應者 | như trên |
| `void-yuan-moving` / `weak-yuan-still` | Dụng không, nguyên động: ngày nguyên thần trị; dụng suy, nguyên tĩnh: ngày xung nguyên thần | 世空元動，須待元神逢值 · 世衰元靜，必然是元气逢沖 | như trên |
| `sanhe-*` | Chờ chi thiếu / chi tĩnh / chi không, phá, mộ của cục | (mục 12) | TSBD 六合章, 千金賦章; BPCT 第四問 |
| `fu-yin-open` | Phục ngâm: năm tháng xung khai | 伏吟之卦，用神旺相，沖開之年月，其志則伸 | TSBD 反伏章 |
| `hidden-flying-open` | Phục thần: nhật nguyệt xung khai phi thần | 伏無提拔終徒爾，飛不推開亦枉然 | HKS; TSBD 千金賦章 |
| `far-near` | Việc xa theo năm tháng, việc gần theo ngày giờ | 遠事定之以年月，近事應之於日時 | TSBD 應期總注章 |

`disclaimer` luôn có. Nó nói rõ đây là gợi ý truyền thống, không phải dự đoán, và nhắc lời sách 「倘遇卦之不明，再占是一法」.

Cách engine đọc (**chưa tìm được nguyên văn phát biểu thành quy tắc**):
- “Quá vượng” = vượng hoặc lâm nguyệt kiến, **và** được nhật thần cùng hành hoặc sinh. Sách chỉ nêu ví dụ 「臨午火，又遇巳火午月日占卦，或卦中巳午爻太多」; engine chưa xét vế “nhiều hào cùng hành”.
- “Suy” = kết luận vượng suy của engine là `weak`.
- “Đại tượng cát/hung” = `useGod.verdict` là `strong` / `weak`. “Khắc thần” = nhật thần hoặc các hào trong `movingAttack`.
- Các câu 「世空元動」, 「世衰元靜」 nói về hào Thế; engine áp dụng cho dụng thần.

Ví dụ trong test: 月破章 乾之夬 (Mão = ngày phá mà gặp hợp, Mùi = ngày hào biến ra khỏi không), 月破章 兌之訟 (năm thực phá Tỵ), 六沖章 益 (ngày Tuất xung hào không, ứng ngay trong ngày), 隨鬼入墓章 恆 (ngày Mùi xung khai mộ Sửu), 反伏章 姤之恆 (năm Thìn xung khai).

## Kiểm lại trích dẫn

Các bước đã làm:
1. Lấy mã nguồn wiki qua `https://zh.wikisource.org/w/index.php?title=<tên>&action=raw`: 增刪卜易 (trang chính và các trang con `/7`…`/26`), 黃金策, 火珠林.
2. Lấy HTML các trang `boshiNN.html` trên quanxue.cn (01–54) rồi bỏ thẻ HTML.
3. Kiểm từng câu trong các bảng trên bằng so khớp chuỗi con, và đếm số chữ Hán (≤ 25). Kết quả: 80/80 khớp.
4. Đợt bổ sung mục 10–15 (cùng ngày): lấy thêm raw các trang `/19`, `/20`, `/21`, `/25`, `/26又1`, `/26又2`, `/26又3` và trang chính (月破章, 隨鬼入墓章, 增刪黃金策千金賦章, 尋地章 nằm ở quyển 2–4 trên trang chính). Với BPCT lấy thêm các trang `boshi09`, `10`, `28`–`30`, `39`–`50`. Khi so khớp đã bỏ `<br>` và xuống dòng. Kết quả: 133/133 câu khớp, câu dài nhất 22 chữ. Chữ 𨿽 (ngoài BMP) và dấu ﹐ (U+FE50) được giữ nguyên như bản điện tử.

Test (`tests/liuyao.test.ts`) dùng lại nguyên các ví dụ của TSBD (月破章, 進神退神章, 暗動章, 元神忌神衰旺章, 旬空章, 動散章, 飛伏神章, 六合章, 六沖章, 三刑章, 反伏章, 隨鬼入墓章, 增刪黃金策千金賦章) và của BPCT (十八問答第四、五、六、十一、十三、十四問) làm ca kiểm tra.

## Ghi chú thêm sau lượt soát độc lập (26/09/2026)
- Soát lại độc lập: 191/191 trích dẫn trong bảng và 35/36 trích dẫn trong phần văn đúng nguyên văn, đúng sách, đúng chương; 1 chỗ ghi nhầm chương đã sửa (塋葬章 → 尋地章第一百十九).
- Tăng San Bốc Dịch tự mâu thuẫn về hào vượng gặp tuần không: 旬空章 nói 「旺不爲空」, còn 月將章 nói 「予試不然，在旬內者畢竟爲空」. Engine theo 旬空章 (vượng thì không coi là không); người luận nên biết có ý kiến ngược lại ngay trong cùng sách.
