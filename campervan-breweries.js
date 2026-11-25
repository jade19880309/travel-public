// 酒藏巡禮資料：[中文名, 日文名, 區域, 種類, 官網, 中文簡介, 日文簡介]。顯示在「RV Park・酒藏」分頁的第二個區塊。
const BREW=[
["YO-HO 精釀啤酒廠","ヤッホーブルーイング佐久醸造所","佐久","啤酒","","「よなよなエール」的釀造廠，日本精釀啤酒代表品牌之一。工廠見學場次少、需預約。","「よなよなエール」の醸造所。日本のクラフトビールを代表するブランド。見学は要予約・開催日要確認。"],
["千曲錦酒造","千曲錦酒造","佐久","清酒","","佐久老字號酒藏，招牌酒「千曲錦」與限定品牌「帰山」。","佐久の老舗酒蔵。「千曲錦」と限定ブランド「帰山」で知られる。"],
["橘倉酒造","橘倉酒造 酒楽","佐久","清酒","https://kitsukura.co.jp/","江戶時代創業的臼田老酒藏，代表酒「菊秀」；直營店「酒楽」可購物。","江戸時代創業の臼田の老舗。代表銘柄「菊秀」。直売所「酒楽」あり。"],
["佐久之花酒造","佐久の花酒造","佐久","清酒","","佐久穗町的小酒藏，「佐久乃花」純米吟釀在日本酒迷間人氣很高。","佐久穂町の小さな蔵。「佐久乃花」の純米吟醸は日本酒好きに人気。"],
["黑澤酒造","黒澤酒造 佐久穂","佐久","清酒","","以傳統生酛釀造聞名的佐久穗酒藏，代表酒「黒澤」「井筒長」。","生酛造りで知られる佐久穂の蔵。代表銘柄「黒澤」「井筒長」。"],
["真澄宮坂釀造","宮坂醸造 セラ真澄","諏訪","清酒","","名酒「真澄」的酒藏，日本「協會 7 號酵母」的發源地；直營店「セラ真澄」可試飲、購物。","銘酒「真澄」の蔵元で、協会7号酵母発祥の蔵。直営店「セラ真澄」で試飲・買い物。"],
["三得利白州蒸餾所","サントリー白州蒸溜所","北杜","威士忌","https://www.suntory.co.jp/factory/hakushu/","南阿爾卑斯山森林中的蒸餾所，「白州」威士忌產地；導覽與博物館需事先預約。","南アルプスの森の蒸溜所で「白州」の故郷。見学ツアー・ミュージアムは要予約。"],
["七賢山梨銘釀","七賢 山梨銘醸","北杜","清酒","https://www.sake-shichiken.co.jp/visit","台原宿的老酒藏，以「七賢」聞名；有直營店與餐廳，見學需預約。","台ヶ原宿の老舗蔵で「七賢」で有名。直売所・レストランあり、見学は要予約。"],
["曼斯勝沼葡萄酒莊","マンズワイン勝沼ワイナリー","勝沼","葡萄酒","","勝沼代表酒莊之一，可參觀釀酒設施與試飲甲州葡萄酒。","勝沼を代表するワイナリーのひとつ。醸造施設見学と甲州ワインの試飲。"],
["城堡勝沼葡萄酒莊","シャトー勝沼","勝沼","葡萄酒","","勝沼老牌酒莊，商店可試飲並購買甲州葡萄酒。","勝沼の老舗ワイナリー。ショップで甲州ワインの試飲・購入ができる。"],
["笹一酒造","笹一酒造 酒遊館","大月","清酒","https://www.sasaichi.co.jp/","中央道沿線、國道 20 號旁的酒藏，直營「酒遊館」可試飲、買伴手禮。","中央道沿い・国道20号沿いの蔵。直営「酒遊館」で試飲とおみやげ。"],
["井出釀造店","井出醸造店 富士北麓蒸留所","河口湖","威士忌／清酒","","河口湖畔的老酒藏，用富士山伏流水釀「甲斐の開運」，近年也開始蒸餾威士忌。","河口湖の老舗蔵。富士山の伏流水で「甲斐の開運」を醸し、近年はウイスキー蒸留も。"],
["麒麟富士御殿場蒸餾所","キリン富士御殿場蒸溜所","御殿場","威士忌","https://www.kirin.co.jp/experience/factory/gotemba/","富士山麓的威士忌蒸餾所（DAY 3 選項），免預約可逛大廳與展望台，工廠導覽需預約。","富士山麓のウイスキー蒸溜所（DAY 3 オプション）。ロビー・展望台は予約不要、工場見学は要予約。"]];
const BTYPE={'威士忌':'ウイスキー','清酒':'日本酒','威士忌／清酒':'ウイスキー・日本酒','啤酒':'ビール','葡萄酒':'ワイン'};
function breweries(){const z=lang==='zh';
return '<div class="ph" id="brew" style="--ic:url(images/tokyo-2027/ic-forest.svg)"><span class="tag">BREWERY GUIDE</span><h2>'+(z?'酒藏巡禮':'酒蔵めぐり')+'</h2></div>'
+'<div class="note">'+(z?'彈性備選景點；2027 年營業、預約、兒童入場與露營車停車均需確認。駕駛禁止飲酒。':'立ち寄り候補。営業・予約・子供の入場・駐車は要確認。運転者は飲酒禁止。')+'</div>'
+brewMap(z)
+'<div class="lk">'+['全部','佐久','諏訪','北杜','勝沼','大月','河口湖','御殿場'].map((g,i)=>'<a href="#" data-bregion="'+(i?g:'')+'" onclick="event.preventDefault();document.querySelectorAll(\'[data-barea]\').forEach(e=>e.hidden=!!this.dataset.bregion&&e.dataset.barea!==this.dataset.bregion)">'+(i?g:z?'全部':'すべて')+'</a>').join('')+'</div>'
+'<div class="spec-grid">'+BREW.map((b,i)=>'<article data-barea="'+b[2]+'"><small>'+String(i+1).padStart(2,'0')+' / '+b[2]+' / '+(z?b[3]:BTYPE[b[3]])+'</small><h4>'+b[z?0:1]+'</h4>'+(z?'<p style="font-size:12.5px;color:var(--sub)">'+b[1]+'</p>':'')+'<p>'+b[z?5:6]+'</p><div class="lk"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b[1])+'">'+(z?'導航':'地図')+'</a>'+(b[4]?'<a target="_blank" rel="noopener" href="'+b[4]+'">'+(z?'官網':'公式')+'</a>':'')+'<a target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q='+encodeURIComponent(b[1])+'">'+(z?'照片':'写真')+'</a></div></article>').join('')+'</div>';}
function brewMap(z){const M=[['brew-map-1-saku.jpg','01–05 佐久・佐久穗','01–05 佐久・佐久穂'],['brew-map-2-suwa-hokuto.jpg','05–08 諏訪・北杜','05–08 諏訪・北杜'],['brew-map-3-katsunuma-fuji.jpg','09–13 勝沼・富士・御殿場','09–13 勝沼・富士・御殿場']];
return '<h3>'+(z?'酒廠分布地圖':'酒蔵分布マップ')+'</h3><div class="card mapcard" style="padding:10px"><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+M.map(m=>'<figure style="margin:0;min-width:0"><img class="map" loading="lazy" src="images/tokyo-2027/'+m[0]+'" alt="'+m[z?1:2]+'" style="margin:0;border-radius:10px;box-shadow:none;border-width:1.5px"><figcaption style="font-size:12px;line-height:1.4;margin-top:4px;text-align:center">'+m[z?1:2]+'</figcaption></figure>').join('')+'</div><p class="hint">'+(z?'由北到南三段，編號同下方卡片；點圖開啟，可雙指放大縮小、拖曳。':'北から南へ3枚。番号は下のカードと同じ。タップで開き、ピンチで拡大・縮小。')+'</p></div>';}
