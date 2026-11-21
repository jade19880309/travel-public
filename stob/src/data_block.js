/* 分享版：沒有任何內建資料，全部從每個人自己的雲端資料讀取（見檔尾 cloud script） */
const RATES0={TWD:1,JPY:0.21,KRW:0.024,HKD:4.1,CNY:4.4,USD:32,EUR:35,THB:0.9,MOP:4};
let db={members:[],trips:[],fl:[],ht:[],tr:[],ot:[],imgs:[],rates:{...RATES0}};
const save=()=>{try{cloudSave()}catch(e){}};
const ORI={};
