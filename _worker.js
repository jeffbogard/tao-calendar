export default {
  async fetch(request, env, ctx) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>道家日历-壹贰新知公众号设计</title>
    <script src="https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js"></script>
    <style>
        :root {
            --primary-color: #8B4513;
            --bg-color: #f4f4f7;
            --highlight-color: #d9534f;
            --wu-color: #f0ad4e;
            --trad-color: #c2185b;
            --jieqi-color: #2e7d32;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        html, body {
            height: 100%; margin: 0; padding: 0;
            background-color: var(--bg-color);
            font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
            overflow: hidden;
        }

        .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            height: 100dvh;
            max-width: 1200px;
            margin: 0 auto;
            background: #fff;
        }

        /* 日历区 */
        .calendar-section {
            flex-shrink: 0;
            background: #fff;
            border-bottom: 1px solid #eee;
            z-index: 10;
        }

        .header {
            background-color: var(--primary-color); color: white;
            padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;
        }
        .header button {
            background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4);
            color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer;
            white-space: nowrap;
        }
        
        /* 新增：日期选择器样式 */
        .date-picker {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.4);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: bold;
            font-family: inherit;
            text-align: center;
            cursor: pointer;
            outline: none;
            /* 修正iOS默认样式 */
            -webkit-appearance: none; 
            appearance: none;
        }
        /* 针对不同浏览器的Input图标颜色适配 */
        .date-picker::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
        }

        .week-header {
            display: grid; grid-template-columns: repeat(7, 1fr);
            text-align: center; padding: 8px 0; font-size: 0.75rem; font-weight: bold;
            border-bottom: 1px solid #eee; background: #fafafa;
        }

        .calendar-grid {
            display: grid; grid-template-columns: repeat(7, 1fr);
            background-color: #fff;
        }
        .day-cell {
            border-bottom: 1px solid #f5f5f5; border-right: 1px solid #f5f5f5;
            height: 68px;
            padding: 2px; display: flex; flex-direction: column; align-items: center; cursor: pointer;
        }
        .day-cell.other-month { opacity: 0.2; }
        .day-cell.selected { background-color: #fffde7 !important; outline: 2px solid var(--primary-color); z-index: 5; }
        .day-cell.today { background-color: #e3f2fd; }
        
        .solar-text { font-size: 1rem; font-weight: bold; }
        .lunar-text { font-size: 0.65rem; color: #777; transform: scale(0.9); }
        
        .badge-container { display: flex; flex-wrap: wrap; justify-content: center; width: 100%; height: 16px; margin-top: 2px; overflow: hidden; }
        .badge {
            font-size: 9px; padding: 0 2px; border-radius: 2px; color: white;
            margin: 0 1px; transform: scale(0.85); white-space: nowrap; line-height: 1.3;
        }
        .badge.ming-wu { background-color: var(--highlight-color); }
        .badge.an-wu { background-color: var(--wu-color); }
        .badge.festival { background-color: #17a2b8; }
        .badge.trad { background-color: var(--trad-color); }
        .badge.jieqi { background-color: var(--jieqi-color); }

        .detail-section {
            flex-grow: 1; overflow-y: auto; background-color: #fff; padding: 15px;
            -webkit-overflow-scrolling: touch;
        }

        .detail-date-title {
            font-size: 1.2rem; font-weight: bold; color: var(--primary-color);
            border-left: 5px solid var(--primary-color); padding-left: 12px; margin-bottom: 15px;
        }

        .detail-info-row { margin-bottom: 6px; font-size: 0.95rem; color: #333; line-height: 1.5; }
        .detail-label { font-weight: bold; color: #555; }

        .yi-ji-box { display: flex; gap: 10px; margin: 15px 0; }
        .yi-box, .ji-box { flex: 1; padding: 12px; border-radius: 8px; font-size: 0.9rem; }
        .yi-box { background-color: #f1f8e9; color: #2e7d32; border: 1px solid #dcedc8; }
        .ji-box { background-color: #fff1f1; color: #c62828; border: 1px solid #ffdadb; }

        .sc-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #f0f0f0; }
        .sc-table th { background: #f8f8f8; padding: 10px; text-align: left; font-size: 0.85rem; border-bottom: 2px solid #eee; }
        .sc-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.85rem; }
        .current-shichen { background-color: #fff9c4 !important; font-weight: bold; border-left: 4px solid var(--wu-color); }

        @media (min-width: 1024px) {
            .app-container {
                flex-direction: row; height: 90vh; margin: 5vh auto;
                border-radius: 12px; overflow: hidden; box-shadow: 0 15px 50px rgba(0,0,0,0.1);
            }
            .calendar-section { width: 450px; border-right: 1px solid #eee; border-bottom: none; }
            .day-cell { height: 80px; }
            .detail-section { padding: 30px; }
        }
        .safe-area { height: 40px; }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="calendar-section">
            <div class="header">
                <button onclick="changeMonth(-1)">上月</button>
                <input type="month" id="datePicker" class="date-picker">
                <button onclick="changeMonth(1)">下月</button>
            </div>
            <div class="week-header">
                <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
        </div>
        <div class="detail-section" id="detailPanel">
            <div id="detailTitle" class="detail-date-title">道历详情加载中...</div>
            <div id="detailContent">正在计算数据，请稍候...</div>
            <div class="safe-area"></div>
        </div>
    </div>

    <script>
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth() + 1;
        let selectedDate = new Date();

        window.onload = function() {
            try {
                if (typeof Solar === 'undefined') {
                    document.getElementById('detailContent').innerHTML = "<b>日历核心库加载失败</b>，请检查网络或刷新页面。";
                    return;
                }
                
                // 初始化监听日期选择器
                const picker = document.getElementById('datePicker');
                picker.addEventListener('change', function(e) {
                    if(this.value) {
                        const parts = this.value.split('-');
                        currentYear = parseInt(parts[0]);
                        currentMonth = parseInt(parts[1]);
                        renderCalendar(currentYear, currentMonth);
                    }
                });

                renderCalendar(currentYear, currentMonth);
                showDetails(selectedDate);
                
                setInterval(() => {
                    if(selectedDate.toDateString() === new Date().toDateString()) showDetails(selectedDate);
                }, 30000);
            } catch (err) {
                document.getElementById('detailContent').innerHTML = "运行出错: " + err.message;
            }
        };

        function changeMonth(offset) {
            let date = new Date(currentYear, currentMonth - 1 + offset, 1);
            currentYear = date.getFullYear();
            currentMonth = date.getMonth() + 1;
            renderCalendar(currentYear, currentMonth);
        }

        function renderCalendar(year, month) {
            // 同步更新选择器显示
            const mStr = month < 10 ? '0' + month : month;
            document.getElementById('datePicker').value = year + '-' + mStr;

            const grid = document.getElementById('calendarGrid');
            grid.innerHTML = '';
            const firstDay = new Date(year, month - 1, 1);
            let startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());

            for (let i = 0; i < 42; i++) {
                let d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const solar = Solar.fromDate(d);
                const lunar = solar.getLunar();
                const tao = Tao.fromLunar(lunar);
                
                const cell = document.createElement('div');
                cell.className = 'day-cell' + (d.getMonth() + 1 !== month ? ' other-month' : '');
                if (d.toDateString() === new Date().toDateString()) cell.classList.add('today');
                if (d.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');

                const tradFestivals = lunar.getFestivals();
                const jieQi = lunar.getJieQi();
                const taoFestivals = tao.getFestivals();

                let html = '<span class="solar-text">' + d.getDate() + '</span>';
                
                let bottomText = lunar.getDayInChinese();
                if(jieQi) bottomText = jieQi;
                html += '<span class="lunar-text" style="' + (jieQi ? 'color:var(--jieqi-color);font-weight:bold' : '') + '">' + bottomText + '</span>';
                
                html += '<div class="badge-container">';
                
                tradFestivals.forEach(f => {
                     html += '<div class="badge trad">' + f.substring(0,3) + '</div>';
                });

                if (tao.isDayMingWu()) html += '<div class="badge ming-wu">明戊</div>';
                if (tao.isDayAnWu()) html += '<div class="badge an-wu">暗戊</div>';
                
                if (taoFestivals.length > 0) {
                     html += '<div class="badge festival">' + taoFestivals[0].getName().substring(0,3) + '</div>';
                }
                
                html += '</div>';

                cell.innerHTML = html;
                cell.onclick = function() {
                    selectedDate = new Date(d);
                    renderCalendar(currentYear, currentMonth);
                    showDetails(d);
                };
                grid.appendChild(cell);
            }
        }

        function getShichenTimeRange(zhiIndex) {
            let start = (zhiIndex * 2 + 23) % 24;
            let end = (start + 2) % 24;
            return (start < 10 ? '0' + start : start) + ':00 - ' + (end < 10 ? '0' + end : end) + ':00';
        }

        function showDetails(date) {
            try {
                const solar = Solar.fromDate(date);
                const lunar = solar.getLunar();
                const tao = Tao.fromLunar(lunar);
                const now = new Date();

                const isM = tao.isDayMingWu();
                const isA = tao.isDayAnWu();
                let wuStatus = isM || isA ? "<b style='color:var(--highlight-color)'>⚠️ " + (isM && isA ? "双戊重合" : (isM ? "明戊" : "暗戊")) + "日 (忌诵经)</b>" : "<span style='color:green'>非戊日 (可诵经)</span>";

                let festivalHtml = '';
                const tradFest = lunar.getFestivals();
                if(tradFest.length > 0) festivalHtml += '<span style="color:var(--trad-color); font-weight:bold; margin-right:8px;">' + tradFest.join(' ') + '</span>';
                const jieQi = lunar.getJieQi();
                if(jieQi) festivalHtml += '<span style="color:var(--jieqi-color); font-weight:bold; margin-right:8px;">' + jieQi + '</span>';
                const taoFest = tao.getFestivals().map(f => f.getName()).join(' ');
                if(taoFest) festivalHtml += '<span style="color:#17a2b8;">' + taoFest + '</span>';
                if(festivalHtml === '') festivalHtml = '无特殊节日';

                let html = '<div class="detail-info-row"><span class="detail-label">干支：</span>' + lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInGanZhi() + '月 ' + lunar.getDayInGanZhi() + '日</div>';
                html += '<div class="detail-info-row"><span class="detail-label">农历：</span>' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese() + '</div>';
                html += '<div class="detail-info-row"><span class="detail-label">道历：</span>' + tao.getYearInChinese() + '年 ' + tao.getMonthInChinese() + '月 ' + tao.getDayInChinese() + '</div>';
                
                html += '<div class="detail-info-row" style="margin-top:8px; padding:8px 0; border-top:1px dashed #eee; border-bottom:1px dashed #eee;"><span class="detail-label">节日：</span>' + festivalHtml + '</div>';
                html += '<div style="margin:10px 0; background:#fff9c4; padding:10px; border-radius:6px; border:1px solid #f0e68c;"><b>禁忌：</b>' + wuStatus + '</div>';

                html += '<div class="yi-ji-box">';
                html += '<div class="yi-box"><b>宜</b><br>' + (lunar.getDayYi().slice(0,8).join(' ') || '诸事不宜') + '</div>';
                html += '<div class="ji-box"><b>忌</b><br>' + (lunar.getDayJi().slice(0,8).join(' ') || '诸事大吉') + '</div>';
                html += '</div>';

                html += '<div style="font-weight:bold; margin-top:20px; font-size:1.1rem; color:var(--primary-color);">⏱ 时辰吉凶</div>';
                html += '<table class="sc-table"><thead><tr><th>时辰</th><th>吉凶</th><th>宜忌</th></tr></thead><tbody>';
                
                const times = lunar.getTimes();
                const currentHour = now.getHours();
                
                times.forEach((t, index) => {
                    const type = t.getTianShenType();
                    const zhiIndex = index;
                    const timeRange = getShichenTimeRange(zhiIndex);
                    
                    let isNow = false;
                    if (date.toDateString() === now.toDateString()) {
                        let startHour = (zhiIndex * 2 + 23) % 24;
                        if (startHour === 23) {
                            if (currentHour >= 23 || currentHour < 1) isNow = true;
                        } else if (currentHour >= startHour && currentHour < startHour + 2) {
                            isNow = true;
                        }
                    }

                    html += '<tr class="' + (isNow ? 'current-shichen' : '') + '">';
                    html += '<td><b>' + t.getGanZhi() + '时</b><br><small style="color:#888">' + timeRange + '</small></td>';
                    html += '<td style="color:' + (type === '吉' ? '#2e7d32' : '#c62828') + '"><b>' + type + '</b><br><small>' + t.getTianShen() + '</small></td>';
                    html += '<td><span style="color:#2e7d32">宜:</span> ' + (t.getYi().slice(0,2).join(',') || '-') + '<br><span style="color:#c62828">忌:</span> ' + (t.getJi().slice(0,2).join(',') || '-') + '</td>';
                    html += '</tr>';
                });
                html += '</tbody></table>';

                document.getElementById('detailTitle').textContent = solar.toYmd() + ' ' + solar.getWeekInChinese();
                document.getElementById('detailContent').innerHTML = html;
            } catch (err) {
                document.getElementById('detailContent').innerHTML = "<div style='color:red; padding:20px;'><b>详情加载失败：</b>" + err.message + "</div>";
            }
        }
    </script>
</body>
</html>
    `;
    return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
  }
};
