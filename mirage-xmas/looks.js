window.ALL_LOOKS=[
  {id:'look_santa',pc:{"idle":{"src":"assets/pc_santa_idle.png","w":112,"h":169,"n":4},"front":{"src":"assets/pc_santa_front.png","w":106,"h":169,"n":4},"side":{"src":"assets/pc_santa_side.png","w":114,"h":169,"n":4},"back":{"src":"assets/pc_santa_back.png","w":98,"h":169,"n":4},"enter":{"src":"assets/pc_santa_enter.png","w":116,"h":169,"n":4}},name:'紅色聖誕洋裝',tag:'經典可愛',react:[
    ['botan','經典款最難穿，妳穿起來剛剛好。今晚第一杯我請。'],
    ['ren','……帽子歪了。'],
    ['mao','哇是聖誕老人！那我的禮物呢？該不會就是妳吧？'],
  ]},
  {id:'look_reindeer',pc:{"idle":{"src":"assets/pc_reindeer_idle.png","w":94,"h":169,"n":4},"front":{"src":"assets/pc_reindeer_front.png","w":100,"h":170,"n":4},"side":{"src":"assets/pc_reindeer_side.png","w":92,"h":171,"n":4},"back":{"src":"assets/pc_reindeer_back.png","w":104,"h":171,"n":4}},name:'麋鹿睡衣',tag:'搞笑路線',react:[
    ['botan','麋鹿？妳是來幫我拉雪橇的嗎。可愛到有點想直接把妳帶回家。'],
    ['ren','……噗。……沒事。'],
    ['mao','鼻子紅紅的好可愛！我可以捏一下嗎，一下下就好嘛！'],
  ]},
  {id:'look_gift',name:'聖誕禮物盒',tag:'大膽包裝',react:[
    ['botan','把自己包成禮物送來，是要我現在拆，還是等打烊？'],
    ['ren','……緞帶綁太緊了。會勒。'],
    ['mao','欸欸這套超大膽的耶！牡丹，不准一直盯著看啦！'],
  ]},
  {id:'look_snow',pc:{"idle":{"src":"assets/pc_snow_idle.png","w":106,"h":169,"n":4},"front":{"src":"assets/pc_snow_front.png","w":110,"h":169,"n":4},"side":{"src":"assets/pc_snow_side.png","w":116,"h":171,"n":4},"back":{"src":"assets/pc_snow_back.png","w":106,"h":169,"n":4},"enter":{"src":"assets/pc_snow_enter.png","w":126,"h":170,"n":4}},name:'白色雪精靈',tag:'清純系',react:[
    ['botan','一身白走進這種店，膽子不小。弄髒了可別怪我。'],
    ['ren','……很好看。'],
    ['mao','好像雪娃娃喔！我們要拍合照，現在、立刻！'],
  ]},
  {id:'look_y2k_sweet',name:'Y2K 冬日甜心',tag:'粉紅甜心',react:[
    ['botan','愛心墨鏡推在頭上，是怕我把妳的眼睛看得太清楚嗎。'],
    ['ren','……顏色很吵。……但還行。'],
    ['mao','粉紅色！我們今天撞色了耶，好開心喔！'],
  ]},
  {id:'look_y2k_hot',pc:{"idle":{"src":"assets/pc_y2k_idle.png","w":104,"h":169,"n":4},"front":{"src":"assets/pc_y2k_front.png","w":108,"h":169,"n":4},"side":{"src":"assets/pc_y2k_side.png","w":110,"h":171,"n":4},"back":{"src":"assets/pc_y2k_back.png","w":96,"h":170,"n":4},"enter":{"src":"assets/pc_y2k_enter.png","w":110,"h":169,"n":4}},name:'Y2K 聖誕辣妹',tag:'辣妹路線',react:[
    ['botan','這套我喜歡。等等跟我去包廂坐，讓別桌的客人羨慕一下。'],
    ['ren','……肚子會著涼。外套借妳。'],
    ['mao','好辣喔！妳今天是來跟我搶牡丹的嗎？'],
  ]},
  {id:'look_jirai',name:'地雷系聖誕裝',tag:'跟真央姊妹裝',react:[
    ['botan','跟真央穿成一對？妳們兩個站一起，我今晚的業績穩了。'],
    ['ren','……兩個一樣。……妳的比較好看。'],
    ['mao','姊妹裝！！我們是雙子星！今晚妳不准離開我身邊喔！'],
  ]},
  {id:'look_noir',name:'黑色晚禮服',tag:'成熟性感',react:[
    ['botan','……這套犯規了。今晚其他桌的客人，我一個都不想顧。'],
    ['ren','……開衩太高了。……不過，很適合。'],
    ['mao','好像女明星喔，好成熟……我也想變成這樣嘛。'],
  ]},
];

// 目前開放的造型
window.LOOKS=ALL_LOOKS.filter(l=>['look_santa','look_reindeer','look_snow','look_y2k_hot'].includes(l.id));
