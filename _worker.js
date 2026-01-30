// 道教日历 Cloudflare Workers 代码
// 将此代码部署到 Cloudflare Workers 即可

export default {
    async fetch(request) {
      const url = new URL(request.url);
  
      // 处理 CORS
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      };
  
      // 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // 读取 HTML 文件内容
      const htmlContent = `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>道教日历 - 完整功能版</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/solar-javascript@1.6.12/solar.min.js"></script>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          :root {
              --primary: #8B4513; --secondary: #8B0000; --accent: #D2691E;
              --dark: #2F4F4F; --light: #F5F5DC; --warning: #FF8C00;
              --danger: #8B0000; --success: #228B22; --text-dark: #333;
              --bg-gradient: linear-gradient(135deg, #2F4F4F 0%, #4A766E 50%, #8B4513 100%);
          }
          body { font-family: 'Noto Serif SC', serif; background: var(--bg-gradient); color: #fff; min-height: 100vh; padding: 10px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.98); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; color: var(--text-dark); }
          
          /* 头部 - 严格单行展示 */
          header { background: linear-gradient(to right, #8B4513, #8B0000); padding: 15px; text-align: center; color: #FFD700; }
          .header-inline { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: nowrap; overflow: hidden; }
          .header-inline i { font-size: 1.2rem; }
          .header-inline h1 { font-size: 1.2rem; margin: 0; white-space: nowrap; }
          .header-inline .slogan { font-size: 0.8rem; opacity: 0.9; white-space: nowrap; }
          
          /* 控制区 */
          .calendar-controls { display: flex; justify-content: center; align-items: center; padding: 15px; gap: 10px; background: #fdfaf0; border-bottom: 1px solid #eee; flex-wrap: wrap; }
          .nav-btn { background: var(--primary); color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; }
          .date-select-group { display: flex; gap: 5px; align-items: center; }
          .year-select, .month-select { padding: 5px 10px; border-radius: 20px; border: 1px solid var(--primary); font-family: inherit; cursor: pointer; }
  
          /* 日历网格 */
          .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #eee; padding: 1px; }
          .day-header { background: #f8f8f8; padding: 10px; text-align: center; font-weight: bold; font-size: 0.8rem; color: #666; }
          .calendar-day { height: 75px; background: white; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
          .calendar-day.today { background: #fff9e6; outline: 2px solid var(--warning); z-index: 1; }
          .calendar-day.selected { background: #e8f5e9; outline: 2px solid var(--success); z-index: 2; }
          .solar-date { font-size: 1.1rem; font-weight: bold; }
          .lunar-date { font-size: 0.7rem; color: #888; }
          
          /* 标识 */
          .holiday-badge { position: absolute; top: 2px; right: 2px; font-size: 0.6rem; padding: 1px 3px; border-radius: 3px; color: white; }
          .holiday-badge.xiu { background: #e54d42; }
          .holiday-badge.ban { background: #666; }
          .wu-marker { position: absolute; bottom: 2px; left: 2px; font-size: 0.65rem; font-weight: bold; border-radius: 2px; padding: 0 2px; }
          .wu-marker.ming { color: var(--warning); background: rgba(255,140,0,0.1); }
          .wu-marker.an { color: var(--danger); background: rgba(139,0,0,0.1); }
          .solar-term-tag { position: absolute; bottom: 2px; right: 2px; font-size: 0.6rem; color: var(--success); }
          .tao-badge { position: absolute; top: 2px; left: 2px; font-size: 0.55rem; padding: 2px 4px; border-radius: 3px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #8B4513; font-weight: bold; border: 1px solid #DAA520; }
  
          /* 详情面板 */
          .info-panel { padding: 20px; background: #fffdf5; }
          .panel-section { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); }
          .section-title { display: flex; align-items: center; gap: 8px; font-weight: bold; color: var(--primary); margin-bottom: 15px; }
          
          .big-lunar { font-size: 2.2rem; font-weight: bold; color: var(--secondary); margin-right: 15px; }
          .holiday-info-line { display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; }
          .holiday-info-line.hidden { display: none; }
          .warning-box { background: #fef0f0; border: 1px solid #fde2e2; color: #f56c6c; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.85rem; }
  
          /* 宜忌 */
          .luck-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .luck-box { padding: 12px; border-radius: 8px; }
          .luck-box.yi { background: rgba(34, 139, 34, 0.08); border-left: 4px solid var(--success); }
          .luck-box.ji { background: rgba(139, 0, 0, 0.05); border-left: 4px solid var(--danger); }
          .luck-label { font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; }
  
          /* 时辰 */
          .time-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
          .time-item { background: #fff; border: 1px solid #eee; padding: 10px 2px; text-align: center; border-radius: 8px; cursor: pointer; transition: 0.3s; }
          .time-item:hover { border-color: var(--primary); background: #fdfaf0; }
          .time-item.active { background: var(--primary); color: #fff; border-color: var(--primary); }
          .time-status { font-size: 0.7rem; font-weight: bold; margin-top: 4px; }
          .status-ji { color: var(--success); }
          .status-xiong { color: var(--danger); }
          .active .status-ji, .active .status-xiong { color: #FFD700; }
  
          /* 测算工具卡片 */
          .tools-card { background: linear-gradient(135deg, #8B4513, #A0522D); border: 2px solid #FFD700; border-radius: 15px; padding: 20px; text-align: center; color: #FFF8DC; text-decoration: none; display: block; margin: 20px 0; transition: 0.3s; }
          .tools-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(139,69,19,0.4); }
  
          .donate-section { text-align: center; padding: 20px; background: #fafafa; border-radius: 15px; margin-top: 10px; }
          .qr-box { width: 120px; text-align: center; font-size: 0.8rem; color: #666; margin: 0 auto; }
          .qr-box img { width: 100%; border-radius: 10px; border: 1px solid #ddd; margin-bottom: 5px; }
  
          .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: none; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
          .modal-content { background: #ffffff; padding: 25px; border-radius: 15px; max-width: 400px; width: 100%; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3); color: #333; }
          .close-modal { position: absolute; top: 10px; right: 15px; font-size: 1.5rem; cursor: pointer; color: #666; }
          .close-modal:hover { color: #333; }
  
          footer { text-align: center; padding: 25px; font-size: 0.8rem; color: #ccc; }
  
          /* 道教节日样式 */
          .tao-holiday-section {
              background: linear-gradient(135deg, #FFF8DC, #FFDAB9);
              border: 2px solid #DAA520;
              border-radius: 12px;
              padding: 15px;
              margin-top: 15px;
              box-shadow: 0 3px 10px rgba(218, 165, 32, 0.2);
          }
          .tao-holiday-item {
              background: white;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 10px;
              border-left: 4px solid var(--primary);
              cursor: pointer;
              transition: all 0.3s ease;
          }
          .tao-holiday-item:hover {
              transform: translateX(5px);
              box-shadow: 0 3px 8px rgba(139, 69, 19, 0.2);
          }
          .tao-holiday-name {
              font-weight: bold;
              color: var(--primary);
              font-size: 1rem;
              margin-bottom: 5px;
              display: flex;
              align-items: center;
              gap: 8px;
          }
          .tao-holiday-type {
              display: inline-block;
              background: var(--primary);
              color: white;
              font-size: 0.7rem;
              padding: 2px 8px;
              border-radius: 10px;
          }
          .tao-holiday-desc {
              font-size: 0.85rem;
              color: #666;
              line-height: 1.5;
          }
          .no-tao-holiday {
              background: #f9f9f9;
              padding: 12px;
              border-radius: 8px;
              color: #999;
              font-size: 0.9rem;
              text-align: center;
          }
  
          @media (max-width: 500px) {
              .time-grid { grid-template-columns: repeat(3, 1fr); }
              .calendar-day { height: 60px; }
              .header-inline h1 { font-size: 1.1rem; }
              .header-inline .slogan { font-size: 0.7rem; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <header>
              <div class="header-inline">
                  <i class="fas fa-yin-yang"></i>
                  <h1>道教日历</h1>
                  <span class="slogan">· 道法自然 · 共修大道</span>
              </div>
          </header>
  
          <div class="calendar-controls">
              <button class="nav-btn" id="prev-month"><i class="fas fa-chevron-left"></i></button>
              <div class="date-select-group" id="date-selector-container"></div>
              <button class="nav-btn" id="next-month"><i class="fas fa-chevron-right"></i></button>
              <button id="back-to-today" style="margin-left: 10px; padding: 5px 12px; cursor: pointer; border-radius: 15px; border: 1px solid #ccc; background: #fff;">今天</button>
          </div>
  
          <div class="calendar-grid" id="calendar-grid"></div>
  
          <div class="info-panel">
              <div id="wu-warning-area"></div>
  
              <div id="tao-holiday-area"></div>
  
              <div class="panel-section">
                  <div style="display:flex; align-items:center;">
                      <div id="panel-lunar-date" class="big-lunar"></div>
                      <div>
                          <div id="panel-solar-date" style="font-weight:bold;"></div>
                          <div id="panel-ganzhi" style="color:#666; font-size:0.85rem;"></div>
                          <div id="panel-daoli" style="color:var(--primary); font-size:0.85rem; font-weight:bold; margin-top:2px;"></div>
                          <div id="holiday-info-line" class="holiday-info-line hidden"></div>
                      </div>
                  </div>
                  <div id="solar-term-area" style="margin-top:10px;"></div>
              </div>
  
              <div class="panel-section">
                  <div class="section-title"><i class="fas fa-scroll"></i> 黄历宜忌</div>
                  <div class="luck-container">
                      <div class="luck-box yi">
                          <div class="luck-label" style="color:var(--success)">【宜】</div>
                          <div id="luck-yi" style="font-size:0.85rem; color:#444;"></div>
                      </div>
                      <div class="luck-box ji">
                          <div class="luck-label" style="color:var(--danger)">【忌】</div>
                          <div id="luck-ji" style="font-size:0.85rem; color:#444;"></div>
                      </div>
                  </div>
              </div>
  
              <div class="panel-section">
                  <div class="section-title"><i class="fas fa-clock"></i> 时辰吉凶 (点击查看详情)</div>
                  <div class="time-grid" id="time-grid"></div>
              </div>
  
              <a href="tools.html" class="tools-card">
                  <h3 style="margin-bottom:5px;"><i class="fas fa-magic"></i> 在线简单测算工具</h3>
                  <p style="font-size:0.85rem; opacity:0.9;">点击进入：掷筊请示、扔硬币决策工具</p>
              </a>
  
              <div class="donate-section">
                  <div style="font-weight:bold; color:var(--primary); font-size:0.9rem;"><i class="fas fa-heart"></i> 联系我们</div>
                  <div class="qr-box" style="margin-top:10px;">
                      <div style="font-size:0.7rem;">请关注壹贰新知公众号</div>
                  </div>
              </div>
          </div>
      </div>
  
      <footer>
          <p>道教日历 &copy; 壹贰新知微信公众号</p>
      </footer>
  
      <div class="modal-overlay" id="modal-overlay">
          <div class="modal-content">
              <span class="close-modal" id="close-modal">&times;</span>
              <h3 id="modal-title" style="color:var(--primary); margin-bottom:15px; border-bottom:2px solid #fdfaf0; padding-bottom:10px;"></h3>
              <div id="modal-body" style="font-size:0.95rem; line-height:1.8;"></div>
          </div>
      </div>
  
      <script>
          let currentDate = new Date();
          let selectedDate = new Date();
          let holidaysData = {};
          const anWuRules = { 1:"未", 2:"戌", 3:"辰", 4:"寅", 5:"午", 6:"子", 7:"酉", 8:"申", 9:"巳", 10:"亥", 11:"卯", 12:"丑" };
          
          // 节气详情数据（包含参考时间，每年会有1-2天波动）
          const jieqiDetails = {
              "立春": {
                  desc: "立春是二十四节气之首，标志着春天的开始。",
                  meaning: "春回大地，万物复苏。",
                  custom: "吃春卷、咬春、踏春",
                  time: "02-04 04:51"
              },
              "雨水": {
                  desc: "降雨开始，雨量渐增。",
                  meaning: "草木萌动，春雨润物。",
                  custom: "回娘屋、拉保保",
                  time: "02-19 00:43"
              },
              "惊蛰": {
                  desc: "春雷乍动，惊醒蛰伏的昆虫。",
                  meaning: "春雷响，万物长。",
                  custom: "打小人、吃梨",
                  time: "03-06 05:10"
              },
              "春分": {
                  desc: "昼夜平分，阴阳平衡。",
                  meaning: "春色正中分，人间万物生。",
                  custom: "放风筝、送春牛、竖蛋",
                  time: "03-21 00:29"
              },
              "清明": {
                  desc: "气清景明，万物皆显。",
                  meaning: "清明时节雨纷纷，路上行人欲断魂。",
                  custom: "扫墓祭祖、踏青、插柳",
                  time: "04-04 15:30"
              },
              "谷雨": {
                  desc: "雨水增多，谷物生长。",
                  meaning: "谷雨断霜，种瓜点豆。",
                  custom: "赏牡丹、喝谷雨茶、摘谷雨茶",
                  time: "04-20 10:24"
              },
              "立夏": {
                  desc: "夏季的开始，万物生长旺盛。",
                  meaning: "立夏小满，江河渐满。",
                  custom: "尝三鲜、吃立夏蛋、斗蛋",
                  time: "05-05 20:26"
              },
              "小满": {
                  desc: "麦类等夏熟作物籽粒开始灌浆饱满。",
                  meaning: "小满不满，干断田坎。",
                  custom: "祭车神、抢水、食苦菜",
                  time: "05-21 08:59"
              },
              "芒种": {
                  desc: "麦类等有芒作物成熟，夏种开始。",
                  meaning: "芒种芒种，连收带种。",
                  custom: "送花神、煮梅、安苗",
                  time: "06-06 02:25"
              },
              "夏至": {
                  desc: "白昼最长，阳气最盛。",
                  meaning: "夏至一阴生，日长夜短。",
                  custom: "吃面条、祭神祀祖、称人",
                  time: "06-21 21:08"
              },
              "小暑": {
                  desc: "天气开始炎热，但未到最热。",
                  meaning: "小暑大暑，有米也懒煮。",
                  custom: "食新、吃藕、晒书画",
                  time: "07-07 10:38"
              },
              "大暑": {
                  desc: "一年中最热的时期。",
                  meaning: "大暑热难当，稻田水汪汪。",
                  custom: "喝伏茶、晒伏姜、烧伏香",
                  time: "07-23 15:44"
              },
              "立秋": {
                  desc: "秋季的开始，天气逐渐转凉。",
                  meaning: "立秋凉风至，白露降寒生。",
                  custom: "贴秋膘、啃秋、晒秋",
                  time: "08-07 20:29"
              },
              "处暑": {
                  desc: "炎热的暑天即将结束。",
                  meaning: "处暑天还暑，好似秋老虎。",
                  custom: "吃鸭子、放河灯、开渔节",
                  time: "08-23 12:34"
              },
              "白露": {
                  desc: "天气转凉，露水凝结。",
                  meaning: "白露秋风夜，一夜凉一夜。",
                  custom: "喝白露茶、吃龙眼、酿白露酒",
                  time: "09-08 06:17"
              },
              "秋分": {
                  desc: "昼夜再次平分，阴阳平衡。",
                  meaning: "秋分日平分，昼夜等长短。",
                  custom: "吃秋菜、送秋牛、粘雀子嘴",
                  time: "09-23 12:04"
              },
              "寒露": {
                  desc: "露水更凉，即将凝结。",
                  meaning: "寒露脚不露，寒露寒露，遍地冷露。",
                  custom: "赏枫叶、吃螃蟹、饮菊花酒",
                  time: "10-08 15:22"
              },
              "霜降": {
                  desc: "天气渐冷，开始降霜。",
                  meaning: "霜降杀百草，霜前冷，霜后暖。",
                  custom: "吃柿子、赏菊、登高远眺",
                  time: "10-23 23:45"
              },
              "立冬": {
                  desc: "冬季的开始，万物收藏。",
                  meaning: "立冬补冬，补嘴空。",
                  custom: "吃饺子、补冬、养精蓄锐",
                  time: "11-07 18:28"
              },
              "小雪": {
                  desc: "开始降雪，但雪量较小。",
                  meaning: "小雪雪满天，来年必丰年。",
                  custom: "腌腊肉、吃糍粑、晒鱼干",
                  time: "11-22 22:03"
              },
              "大雪": {
                  desc: "降雪的可能性增大，雪量大。",
                  meaning: "大雪河封住，冬至不行船。",
                  custom: "观赏封河、进补、腌雪菜",
                  time: "12-07 17:33"
              },
              "冬至": {
                  desc: "白昼最短，阴气最盛。",
                  meaning: "冬至大如年，阳气始生。",
                  custom: "吃饺子、吃汤圆、数九",
                  time: "12-22 00:09"
              },
              "小寒": {
                  desc: "天气寒冷，但未到最冷。",
                  meaning: "小寒大寒，冻成一团。",
                  custom: "吃腊八粥、做腊八蒜、探梅",
                  time: "01-05 23:39"
              },
              "大寒": {
                  desc: "一年中最冷的时期。",
                  meaning: "大寒到顶点，日后天渐暖。",
                  custom: "吃糯米饭、尾牙祭、制腊味",
                  time: "01-20 16:30"
              }
          };
  
          // 道教节日数据
          const taoistHolidays = {
              // 固定日期节日（农历月-日）
              "1-1": [
                  { name: "天腊节", type: "五腊", desc: "道教五腊之一，道教认为该日是天地交泰之日，应当斋戒、祭祀。" },
                  { name: "元始天尊圣诞", type: "神灵圣诞", desc: "道教最高神元始天尊的诞辰日。" }
              ],
              "1-3": [
                  { name: "郝祖圣诞", type: "祖师圣诞", desc: "郝大通真人的圣诞日。" }
              ],
              "1-5": [
                  { name: "孙祖清静元君圣诞", type: "祖师圣诞", desc: "孙不二真人的圣诞日。" }
              ],
              "1-9": [
                  { name: "玉皇大帝圣诞", type: "神灵圣诞", desc: "玉皇大帝（玉帝）的诞辰日，道教最重要的节日之一。" },
                  { name: "北七真成道日", type: "成道日", desc: "北七真祖师成道的日子。" }
              ],
              "1-15": [
                  { name: "上元节", type: "三元节", desc: "道教三元节之首，天官赐福之日，宜祈福、许愿。" },
                  { name: "老祖天师圣诞", type: "祖师圣诞", desc: "张道陵天师的圣诞日。" }
              ],
              "1-19": [
                  { name: "长春邱真人圣诞", type: "祖师圣诞", desc: "丘处机真人的圣诞日。" }
              ],
              "2-1": [
                  { name: "勾陈天皇大帝圣诞", type: "神灵圣诞", desc: "四御之一勾陈大帝的圣诞。" }
              ],
              "2-2": [
                  { name: "土地神诞", type: "自然神圣诞", desc: "土地公生日，俗神诞辰。" }
              ],
              "2-6": [
                  { name: "东华帝君圣诞", type: "祖师圣诞", desc: "东华帝君的圣诞日。" }
              ],
              "2-8": [
                  { name: "昌福真君圣诞", type: "祖师圣诞", desc: "昌福真人的圣诞日。" }
              ],
              "2-15": [
                  { name: "太上老君圣诞", type: "三清圣诞", desc: "道教最高神之一太上老君（老子）的圣诞。" },
                  { name: "老子诞辰", type: "祖师圣诞", desc: "道教始祖老子的诞辰。" }
              ],
              "2-19": [
                  { name: "慈航真君圣诞", type: "神灵圣诞", desc: "慈航真君的圣诞日。" }
              ],
              "3-1": [
                  { name: "谭祖长真真人圣诞", type: "祖师圣诞", desc: "谭处端真人的圣诞日。" }
              ],
              "3-3": [
                  { name: "玄天上帝圣诞", type: "神灵圣诞", desc: "真武大帝（玄武）的圣诞，道教重要节日。" },
                  { name: "真武大帝诞辰", type: "神灵圣诞", desc: "真武大帝的诞辰日。" }
              ],
              "3-15": [
                  { name: "赵元帅圣诞", type: "财神圣诞", desc: "赵公明元帅的圣诞日。" },
                  { name: "张伯端真人圣诞", type: "祖师圣诞", desc: "张伯端真人的圣诞日。" }
              ],
              "3-18": [
                  { name: "中岳大帝圣诞", type: "神灵圣诞", desc: "中岳嵩山神的圣诞。" }
              ],
              "3-20": [
                  { name: "子孙娘娘圣诞", type: "女神圣诞", desc: "送子娘娘的圣诞。" }
              ],
              "3-23": [
                  { name: "妈祖诞辰", type: "女神圣诞", desc: "妈祖（林默娘）的诞辰，海神重要节日。" }
              ],
              "3-26": [
                  { name: "鬼谷子圣诞", type: "祖师圣诞", desc: "鬼谷子的圣诞日。" }
              ],
              "3-28": [
                  { name: "东岳大帝圣诞", type: "神灵圣诞", desc: "东岳泰山神的圣诞，重要道教节日。" }
              ],
              "4-1": [
                  { name: "灵通真君圣诞", type: "祖师圣诞", desc: "灵通真人的圣诞日。" }
              ],
              "4-8": [
                  { name: "文殊菩萨诞辰", type: "佛教融合", desc: "文殊菩萨的诞辰。" }
              ],
              "4-14": [
                  { name: "吕祖纯阳祖师圣诞", type: "祖师圣诞", desc: "吕洞宾祖师的圣诞日，全真道重要节日。" }
              ],
              "4-15": [
                  { name: "钟离祖师圣诞", type: "祖师圣诞", desc: "钟离权祖师的圣诞日。" }
              ],
              "4-17": [
                  { name: "十殿阎王圣诞", type: "神灵圣诞", desc: "十殿阎罗王的圣诞。" }
              ],
              "4-18": [
                  { name: "紫薇大帝圣诞", type: "神灵圣诞", desc: "紫薇大帝的圣诞日。" },
                  { name: "华佗神医诞辰", type: "神医圣诞", desc: "神医华佗的诞辰。" }
              ],
              "5-1": [
                  { name: "南极长生大帝圣诞", type: "四御圣诞", desc: "四御之一南极大帝的圣诞。" }
              ],
              "5-5": [
                  { name: "地腊节", type: "五腊", desc: "道教五腊之一，应当祭祀祖先、超度亡灵。" },
                  { name: "雷祖圣诞", type: "神灵圣诞", desc: "雷祖的圣诞日。" }
              ],
              "5-11": [
                  { name: "都城隍圣诞", type: "俗神圣诞", desc: "都城隍的圣诞日。" }
              ],
              "5-12": [
                  { name: "灵宝天师圣诞", type: "祖师圣诞", desc: "灵宝天师的圣诞日。" }
              ],
              "5-13": [
                  { name: "关圣帝君圣诞", type: "俗神圣诞", desc: "关羽的圣诞日。" }
              ],
              "5-18": [
                  { name: "张天师圣诞", type: "祖师圣诞", desc: "张道陵天师的圣诞日。" }
              ],
              "5-20": [
                  { name: "马丹阳祖师圣诞", type: "祖师圣诞", desc: "马丹阳真人的圣诞日。" }
              ],
              "5-28": [
                  { name: "城隍爷圣诞", type: "俗神圣诞", desc: "城隍神的圣诞日。" }
              ],
              "6-1": [
                  { name: "南斗星君圣诞", type: "星宿神圣诞", desc: "南斗六星的圣诞。" }
              ],
              "6-10": [
                  { name: "刘海蟾祖师圣诞", type: "祖师圣诞", desc: "刘海蟾真人的圣诞日。" }
              ],
              "6-15": [
                  { name: "王灵官圣诞", type: "护法神圣诞", desc: "王灵官护法神的圣诞日。" },
                  { name: "东斗下降", type: "神灵活动", desc: "东斗星君下降人间。" }
              ],
              "6-19": [
                  { name: "慈航观音成道", type: "女神成道", desc: "观音菩萨成道的日子。" }
              ],
              "6-23": [
                  { name: "火神圣诞", type: "自然神圣诞", desc: "火神祝融的圣诞日。" },
                  { name: "关帝圣诞", type: "俗神圣诞", desc: "关帝君的圣诞日。" }
              ],
              "6-24": [
                  { name: "雷祖圣诞", type: "神灵圣诞", desc: "雷祖的圣诞日。" },
                  { name: "关帝圣诞", type: "俗神圣诞", desc: "关羽的圣诞日。" },
                  { name: "二郎显圣真君圣诞", type: "俗神圣诞", desc: "二郎神的圣诞日。" }
              ],
              "6-26": [
                  { name: "二郎真君圣诞", type: "神灵圣诞", desc: "二郎神的圣诞日。" }
              ],
              "6-29": [
                  { name: "天枢左相莫君圣诞", type: "星宿神圣诞", desc: "天枢星的圣诞。" }
              ],
              "7-1": [
                  { name: "井泉龙王圣诞", type: "自然神圣诞", desc: "井泉龙王的圣诞日。" },
                  { name: "萧公圣诞", type: "俗神圣诞", desc: "萧公的圣诞日。" }
              ],
              "7-7": [
                  { name: "魁星圣诞", type: "文运神圣诞", desc: "魁星文运神的圣诞日，宜求学。" },
                  { name: "道德腊之辰", type: "五腊", desc: "道教五腊之一。" }
              ],
              "7-12": [
                  { name: "骊山老母圣诞", type: "女仙圣诞", desc: "骊山老母的圣诞日。" }
              ],
              "7-15": [
                  { name: "中元节", type: "三元节", desc: "道教三元节之中，地官赦罪之日，宜超度亡灵、祭祖。" },
                  { name: "地官赦罪", type: "三元节", desc: "地官赦罪的日子。" }
              ],
              "7-18": [
                  { name: "西王母圣诞", type: "女仙圣诞", desc: "王母娘娘的圣诞日，重要女神节日。" }
              ],
              "7-19": [
                  { name: "刘祖长生真人圣诞", type: "祖师圣诞", desc: "刘长生真人的圣诞日。" }
              ],
              "7-22": [
                  { name: "增福财神圣诞", type: "财神圣诞", desc: "增福财神的圣诞日。" }
              ],
              "7-23": [
                  { name: "诸葛武侯千秋", type: "俗神圣诞", desc: "诸葛亮的圣诞日。" }
              ],
              "7-26": [
                  { name: "张三丰祖师圣诞", type: "祖师圣诞", desc: "张三丰真人的圣诞日，武当派重要节日。" }
              ],
              "7-30": [
                  { name: "地藏王菩萨圣诞", type: "佛教融合", desc: "地藏王菩萨的圣诞。" }
              ],
              "8-1": [
                  { name: "许真君飞升", type: "升仙日", desc: "许逊真人的飞升日。" }
              ],
              "8-3": [
                  { name: "灶君圣诞", type: "家宅神圣诞", desc: "灶王爷的圣诞日，宜祭灶。" }
              ],
              "8-5": [
                  { name: "北方雷祖圣诞", type: "神灵圣诞", desc: "北方雷祖的圣诞日。" }
              ],
              "8-10": [
                  { name: "北岳大帝圣诞", type: "神灵圣诞", desc: "北岳恒山神的圣诞。" }
              ],
              "8-12": [
                  { name: "西方财神圣诞", type: "财神圣诞", desc: "西方财神的圣诞日。" }
              ],
              "8-14": [
                  { name: "吕祖圣诞", type: "祖师圣诞", desc: "吕洞宾祖师的圣诞日。" }
              ],
              "8-15": [
                  { name: "太阴星君圣诞", type: "星宿神圣诞", desc: "太阴星君（月神）的圣诞日。" },
                  { name: "曹国舅祖师圣诞", type: "祖师圣诞", desc: "曹国舅真人的圣诞日。" }
              ],
              "8-23": [
                  { name: "黄老祖圣诞", type: "始祖圣诞", desc: "黄帝的圣诞日。" }
              ],
              "9-1": [
                  { name: "北斗九星降世", type: "星宿神降世", desc: "北斗九星下降人间的日子。" },
                  { name: "南斗星君圣诞", type: "星宿神圣诞", desc: "南斗六星的圣诞。" }
              ],
              "9-3": [
                  { name: "五瘟神圣诞", type: "神灵圣诞", desc: "五瘟神的圣诞日。" }
              ],
              "9-9": [
                  { name: "重阳节", type: "古代节日", desc: "道教重要节日，宜登高、敬老、祈福。" },
                  { name: "酆都大帝圣诞", type: "神灵圣诞", desc: "酆都大帝的圣诞日。" },
                  { name: "斗母元君圣诞", type: "女神圣诞", desc: "斗母娘娘的圣诞日。" }
              ],
              "9-17": [
                  { name: "财神圣诞", type: "财神圣诞", desc: "财神的圣诞日。" }
              ],
              "9-19": [
                  { name: "观音出家日", type: "女神节日", desc: "观音菩萨出家的日子。" }
              ],
              "9-23": [
                  { name: "萨翁真君圣诞", type: "祖师圣诞", desc: "萨守坚真人的圣诞日。" }
              ],
              "9-28": [
                  { name: "孔圣诞辰", type: "儒家融合", desc: "孔子的圣诞日。" }
              ],
              "10-1": [
                  { name: "民岁腊", type: "五腊", desc: "道教五腊之一，应当祭祀祖先。" },
                  { name: "东皇大帝圣诞", type: "神灵圣诞", desc: "东皇大帝的圣诞日。" }
              ],
              "10-3": [
                  { name: "三茅真君圣诞", type: "祖师圣诞", desc: "三茅真人的圣诞日。" }
              ],
              "10-6": [
                  { name: "天曹诸司圣诞", type: "神灵圣诞", desc: "天曹诸神的圣诞日。" }
              ],
              "10-15": [
                  { name: "下元节", type: "三元节", desc: "道教三元节之末，水官解厄之日，宜消灾解厄、祈福。" },
                  { name: "水官解厄", type: "三元节", desc: "水官解厄的日子。" }
              ],
              "10-18": [
                  { name: "地母娘娘圣诞", type: "女神圣诞", desc: "后土娘娘的圣诞日。" }
              ],
              "10-25": [
                  { name: "三茅真君圣诞", type: "祖师圣诞", desc: "三茅真人的圣诞日。" }
              ],
              "11-6": [
                  { name: "玉皇大帝出巡", type: "神灵活动", desc: "玉皇大帝巡视人间。" }
              ],
              "11-11": [
                  { name: "太乙救苦天尊圣诞", type: "神灵圣诞", desc: "太乙救苦天尊的圣诞，救苦救难之神。" }
              ],
              "11-17": [
                  { name: "阿弥陀佛圣诞", type: "佛教融合", desc: "阿弥陀佛的圣诞。" }
              ],
              "11-19": [
                  { name: "太阳星君圣诞", type: "星宿神圣诞", desc: "太阳星君的圣诞日。" }
              ],
              "12-1": [
                  { name: "群仙会蓬莱", type: "道教盛会", desc: "群仙在蓬莱岛相会的日子。" }
              ],
              "12-6": [
                  { name: "普庵祖师圣诞", type: "祖师圣诞", desc: "普庵真人的圣诞日。" }
              ],
              "12-8": [
                  { name: "王重阳祖师成道", type: "成道日", desc: "王重阳祖师成道的日子，全真道重要节日。" }
              ],
              "12-12": [
                  { name: "周仓圣诞", type: "俗神圣诞", desc: "周仓将军的圣诞日。" }
              ],
              "12-16": [
                  { name: "南岳大帝圣诞", type: "神灵圣诞", desc: "南岳衡山神的圣诞。" }
              ],
              "12-21": [
                  { name: "天猷副元帅圣诞", type: "神灵圣诞", desc: "天猷元帅的圣诞日。" }
              ],
              "12-24": [
                  { name: "灶君上天", type: "家宅神活动", desc: "灶王爷上天向玉帝汇报人间善恶。" }
              ],
              "12-25": [
                  { name: "玉帝出巡", type: "神灵活动", desc: "玉皇大帝巡视人间。" },
                  { name: "天神下降", type: "神灵活动", desc: "天神下降人间的日子。" }
              ],
              "12-29": [
                  { name: "清静孙真君成道", type: "成道日", desc: "孙不二真人成道的日子。" }
              ],
              "12-30": [
                  { name: "诸神下降", type: "神灵活动", desc: "诸神下降察访人间善恶。" },
                  { name: "紫姑厕神诞", type: "俗神圣诞", desc: "紫姑神的圣诞日。" }
              ]
          };
          
          const shichenDetails = {
              "子": { range: "23:00-01:00", ji: true, yi: "祭祀、祈福、求嗣", ji_action: "上梁、入殓" },
              "丑": { range: "01:00-03:00", ji: false, yi: "酬神、求财", ji_action: "修造、安葬" },
              "寅": { range: "03:00-05:00", ji: true, yi: "嫁娶、出行", ji_action: "祭祀、祈福" },
              "卯": { range: "05:00-07:00", ji: true, yi: "入宅、安葬", ji_action: "诸事不宜" },
              "辰": { range: "07:00-09:00", ji: false, yi: "祭祀、嫁娶", ji_action: "赴任、出行" },
              "巳": { range: "09:00-11:00", ji: false, yi: "求财、开市", ji_action: "赴任、出行" },
              "午": { range: "11:00-13:00", ji: true, yi: "祈福、入宅", ji_action: "词讼" },
              "未": { range: "13:00-15:00", ji: true, yi: "修造、安葬", ji_action: "祭祀、祈福" },
              "申": { range: "15:00-17:00", ji: false, yi: "求嗣、嫁娶", ji_action: "祭祀、祈福" },
              "酉": { range: "17:00-19:00", ji: false, yi: "求财、入宅", ji_action: "赴任、修造" },
              "戌": { range: "19:00-21:00", ji: true, yi: "祈福、嫁娶", ji_action: "赴任、出行" },
              "亥": { range: "21:00-23:00", ji: false, yi: "嫁娶、造庙", ji_action: "赴任、出行" }
          };
  
          async function initHolidays(year) {
              try {
                  const response = await fetch(\`https://timor.tech/api/holiday/year/\${year}\`);
                  const data = await response.json();
                  if (data.holiday) holidaysData[year] = data.holiday;
                  renderCalendar(); updateInfoPanel();
              } catch (e) { renderCalendar(); updateInfoPanel(); }
          }
  
          function renderCalendar() {
              const grid = document.getElementById('calendar-grid');
              grid.innerHTML = '';
              ['日','一','二','三','四','五','六'].forEach(w => grid.innerHTML += \`<div class="day-header">\${w}</div>\`);
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
              const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
              for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div class="calendar-day empty"></div>';
              for (let d = 1; d <= daysInMonth; d++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                  const solar = Solar.fromDate(date);
                  const lunar = solar.getLunar();
                  const holiday = holidaysData[date.getFullYear()]?.[\`\${String(date.getMonth()+1).padStart(2,'0')}-\${String(d).padStart(2,'0')}\`];
                  const taoHoliday = taoistHolidays[\`\${lunar.getMonth()}-\${lunar.getDay()}\`];
                  const dayDiv = document.createElement('div');
                  dayDiv.className = \`calendar-day \${date.toDateString()===new Date().toDateString()?'today':''} \${date.toDateString()===selectedDate.toDateString()?'selected':''}\`;
                  const isMing = lunar.getDayGan() === '戊';
                  const isAn = lunar.getDayZhi() === anWuRules[lunar.getMonth()];
                  const jq = lunar.getJieQi();
                  dayDiv.innerHTML = \`
                      \${taoHoliday ? '<div class="tao-badge">道</div>' : ''}
                      \${holiday ? \`<div class="holiday-badge \${holiday.holiday?'xiu':'ban'}">\${holiday.holiday?'休':'班'}</div>\` : ''}
                      <div class="solar-date">\${d}</div>
                      <div class="lunar-date">\${lunar.getDayInChinese()}</div>
                      \${isMing ? '<div class="wu-marker ming">明</div>' : (isAn ? '<div class="wu-marker an">暗</div>' : '')}
                      \${jq ? \`<div class="solar-term-tag">\${jq}</div>\` : ''}
                  \`;
                  dayDiv.onclick = () => { selectedDate = new Date(date); renderCalendar(); updateInfoPanel(); };
                  grid.appendChild(dayDiv);
              }
          }
  
          function updateInfoPanel() {
              const solar = Solar.fromDate(selectedDate);
              const lunar = solar.getLunar();
              
              // 基础日期
              document.getElementById('panel-lunar-date').textContent = lunar.getDayInChinese();
              document.getElementById('panel-solar-date').textContent = \`\${selectedDate.getFullYear()}年\${selectedDate.getMonth()+1}月\${selectedDate.getDate()}日 星期\${"日一二三四五六"[selectedDate.getDay()]}\`;
              
              // 获取干支生效时间（时辰换算）
              const hour = selectedDate.getHours();
              const shichenIdx = (hour >= 23 || hour < 1) ? 0 : Math.floor((hour + 1) / 2);
              const shichen = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"][shichenIdx];
              const shichenTime = ["23:00-01:00","01:00-03:00","03:00-05:00","05:00-07:00","07:00-09:00","09:00-11:00","11:00-13:00","13:00-15:00","15:00-17:00","17:00-19:00","19:00-21:00","21:00-23:00"][shichenIdx];
              
              document.getElementById('panel-ganzhi').textContent = \`\${lunar.getYearInGanZhi()}年 · \${lunar.getMonthInGanZhi()}月 · \${lunar.getDayInGanZhi()}日 · \${shichen}时 (\${shichenTime})\`;
              
              // 关键修复：正确调用道历
              try {
                  const tao = Tao.fromLunar(lunar);
                  document.getElementById('panel-daoli').textContent = \`道历\${tao.getYear()}年 · \${tao.getMonthInChinese()}月 · \${tao.getDayInChinese()}\`;
              } catch(e) { console.error("道历转换错误", e); }
  
              // 假期
              const hLine = document.getElementById('holiday-info-line');
              const hInfo = holidaysData[selectedDate.getFullYear()]?.[\`\${String(selectedDate.getMonth()+1).padStart(2,'0')}-\${String(selectedDate.getDate()).padStart(2,'0')}\`];
              hLine.classList.add('hidden');
              if (hInfo) {
                  hLine.innerHTML = \`<i class="fas fa-flag"></i> \${hInfo.name}\`;
                  hLine.classList.remove('hidden');
              }
  
              // 节气
              const jq = lunar.getJieQi();
              if (jq) {
                  // 使用预定义的节气时间数据
                  const jqData = jieqiDetails[jq];
                  let jqTime = '';
                  if (jqData && jqData.time) {
                      jqTime = jqData.time.split(' ')[1]; // 只取时间部分，如 "15:30"
                  }
                  
                  let timeHtml = jqTime ?
                      \`<div style="font-size:0.8rem; color:#666; margin-top:4px;">
                          <i class="fas fa-clock"></i> 参考时间：\${jqTime}
                      </div>\` :
                      \`<div style="font-size:0.75rem; color:#999; margin-top:4px;">暂无时间数据</div>\`;
  
                  document.getElementById('solar-term-area').innerHTML =
                      \`<div style="background:#f0f9eb; padding:10px; border-radius:8px; border-left:4px solid var(--success); font-size:0.85rem; cursor:pointer; transition:0.3s;" onclick="showJieqiModal('\${jq}')">
                          <div style="font-weight:bold; color:var(--success); font-size:0.95rem;">
                              <i class="fas fa-leaf"></i> 今日节气：\${jq}
                          </div>
                          \${timeHtml}
                          <div style="font-size:0.75rem; color:#999; margin-top:2px;">(点击查看详情)</div>
                      </div>\`;
              } else {
                  document.getElementById('solar-term-area').innerHTML = '';
              }
  
              // 戊日
              const isMing = lunar.getDayGan() === '戊';
              const isAn = lunar.getDayZhi() === anWuRules[lunar.getMonth()];
              document.getElementById('wu-warning-area').innerHTML = (isMing || isAn) ?
                  \`<div class="warning-box">⚠️ 本日为<b>\${isMing?'明戊':'暗戊'}日</b>，禁忌朝真焚香。</div>\` : '';
  
              // 道教节日
              const taoHoliday = taoistHolidays[\`\${lunar.getMonth()}-\${lunar.getDay()}\`];
              const taoHolidayArea = document.getElementById('tao-holiday-area');
              if (taoHoliday && taoHoliday.length > 0) {
                  let html = '<div class="panel-section"><div class="section-title"><i class="fas fa-star"></i> 道教节日</div>';
                  taoHoliday.forEach((holiday, index) => {
                      html += \`<div class="tao-holiday-item" onclick="showTaoHolidayModal('\${encodeURIComponent(JSON.stringify(holiday))}')">
                          <div class="tao-holiday-name">
                              <span class="tao-holiday-type">\${holiday.type}</span>
                              \${holiday.name}
                          </div>
                          <div class="tao-holiday-desc">\${holiday.desc}</div>
                      </div>\`;
                  });
                  html += '</div>';
                  taoHolidayArea.innerHTML = html;
              } else {
                  taoHolidayArea.innerHTML = '';
              }
  
              // 宜忌
              document.getElementById('luck-yi').textContent = lunar.getDayYi().slice(0,8).join(' · ') || '诸事不宜';
              document.getElementById('luck-ji').textContent = lunar.getDayJi().slice(0,8).join(' · ') || '诸事皆宜';
  
              updateTimeGrid(lunar);
          }
  
          function updateTimeGrid(lunar) {
              const grid = document.getElementById('time-grid');
              grid.innerHTML = '';
              const shichens = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
              const currH = new Date().getHours();
              const currIdx = (currH >= 23 || currH < 1) ? 0 : Math.floor((currH + 1) / 2);
  
              shichens.forEach((name, i) => {
                  const info = shichenDetails[name];
                  const active = (i === currIdx && selectedDate.toDateString() === new Date().toDateString());
                  const item = document.createElement('div');
                  item.className = \`time-item \${active?'active':''}\`;
                  item.innerHTML = \`
                      <div style="font-weight:bold">\${name}时</div>
                      <div style="font-size:0.6rem; opacity:0.8">\${info.range}</div>
                      <div class="time-status \${info.ji?'status-ji':'status-xiong'}">\${info.ji?'【吉】':'【凶】'}</div>
                  \`;
                  item.onclick = () => showModal(name, info);
                  grid.appendChild(item);
              });
          }
  
          function showModal(name, info) {
              document.getElementById('modal-title').textContent = \`\${name}时 详情 (\${info.range})\`;
              document.getElementById('modal-body').innerHTML = \`
                  <p><b>吉凶：</b>\${info.ji?'黄道吉时':'黑道凶时'}</p>
                  <p><b>宜：</b>\${info.yi}</p>
                  <p><b>忌：</b>\${info.ji_action}</p>
              \`;
              document.getElementById('modal-overlay').style.display = 'flex';
          }
  
          // 显示节气详情模态框
          function showJieqiModal(jqName) {
              const jqData = jieqiDetails[jqName];
              if (jqData) {
                  document.getElementById('modal-title').innerHTML = \`<i class="fas fa-leaf" style="color:var(--success)"></i> \${jqName}详情\`;
                  document.getElementById('modal-body').innerHTML = \`
                      <div style="background:#f0f9eb; padding:12px; border-radius:8px; border-left:4px solid var(--success); margin-bottom:15px;">
                          <p style="margin:0; font-size:0.9rem; color:var(--dark);">\${jqData.meaning}</p>
                      </div>
                      <p style="margin-bottom:12px;"><b>节气含义：</b>\${jqData.desc}</p>
                      <p style="margin-bottom:12px;"><b>民俗习俗：</b>\${jqData.custom}</p>
                  \`;
                  document.getElementById('modal-overlay').style.display = 'flex';
              }
          }
  
          // 显示道教节日详情模态框
          function showTaoHolidayModal(holidayStr) {
              try {
                  const holiday = JSON.parse(decodeURIComponent(holidayStr));
                  document.getElementById('modal-title').innerHTML = \`<i class="fas fa-star" style="color:var(--warning)"></i> \${holiday.name}\`;
                  document.getElementById('modal-body').innerHTML = \`
                      <div style="background:#FFF8DC; padding:12px; border-radius:8px; border-left:4px solid var(--warning); margin-bottom:15px;">
                          <span class="tao-holiday-type">\${holiday.type}</span>
                      </div>
                      <p style="margin-bottom:12px;"><b>节日介绍：</b>\${holiday.desc}</p>
                  \`;
                  document.getElementById('modal-overlay').style.display = 'flex';
              } catch(e) {
                  console.error('解析节日数据错误', e);
              }
          }
  
          window.onload = () => {
              initHolidays(currentDate.getFullYear());
              
              // 创建年份和月份分开的选择器
              const container = document.getElementById('date-selector-container');
              
              // 年份选择器（前100年到后20年）
              const yearSelect = document.createElement('select');
              yearSelect.className = 'year-select';
              const currentYear = new Date().getFullYear();
              for (let y = currentYear - 100; y <= currentYear + 20; y++) {
                  const opt = document.createElement('option');
                  opt.value = y;
                  opt.textContent = \`\${y}年\`;
                  if (y === currentDate.getFullYear()) opt.selected = true;
                  yearSelect.appendChild(opt);
              }
              yearSelect.onchange = (e) => {
                  currentDate.setFullYear(parseInt(e.target.value));
                  renderCalendar();
              };
              
              // 月份选择器
              const monthSelect = document.createElement('select');
              monthSelect.className = 'month-select';
              for (let m = 0; m < 12; m++) {
                  const opt = document.createElement('option');
                  opt.value = m;
                  opt.textContent = \`\${m + 1}月\`;
                  if (m === currentDate.getMonth()) opt.selected = true;
                  monthSelect.appendChild(opt);
              }
              monthSelect.onchange = (e) => {
                  currentDate.setMonth(parseInt(e.target.value));
                  renderCalendar();
              };
              
              container.appendChild(yearSelect);
              container.appendChild(monthSelect);
              
              document.getElementById('prev-month').onclick = () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
              document.getElementById('next-month').onclick = () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };
              document.getElementById('back-to-today').onclick = () => { currentDate = new Date(); selectedDate = new Date(); renderCalendar(); updateInfoPanel(); };
              document.getElementById('close-modal').onclick = () => document.getElementById('modal-overlay').style.display = 'none';
          };
      </script>
  </body>
  </html>`;
  
      // 返回 HTML 响应
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders
        }
      });
    }
  };
  
