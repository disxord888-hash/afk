document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const inputIntensity = document.getElementById('input-intensity');
    const inputMagnitude = document.getElementById('input-magnitude');
    const inputDepth = document.getElementById('input-depth');
    const inputEpicenter = document.getElementById('input-epicenter');
    const inputTime = document.getElementById('input-time');
    const historySelect = document.getElementById('history-select');
    
    const playScript = document.getElementById('play-script');
    const btnCustomPlay = document.getElementById('btn-custom-play');
    const btnJsonExport = document.getElementById('btn-json-export');
    let playTimeouts = [];

    const dispValInt = document.getElementById('disp-val-int');
    const dispValMag = document.getElementById('disp-val-mag');
    const dispValDep = document.getElementById('disp-val-dep');
    const dispValEpi = document.getElementById('disp-val-epi');
    const dispValTime = document.getElementById('disp-val-time');
    
    // Emoji Elements
    const titleEmojiInt = document.getElementById('title-emoji-int');
    const titleEmojiMag = document.getElementById('title-emoji-mag');
    const titleEmojiDep = document.getElementById('title-emoji-dep');

    const cardInt = document.getElementById('display-intensity-card').querySelector('.intensity-value-wrap');
    const cardMag = document.getElementById('display-magnitude-card');
    const cardDep = document.getElementById('display-depth-card');
    
    const magValText = cardMag.querySelector('.value');
    const depValText = cardDep.querySelector('.value');

    // 履歴保持用
    let historyData = [];

    // 色マッピング関数
    function getIntensityColor(val) {
        switch(val) {
            case '1': return { bg: 'var(--color-black)', glow: '#1e293b', textDark: false, emoji: '⬛️' };
            case '2': return { bg: 'var(--color-blue)', glow: '#3b82f6', textDark: false, emoji: '🟦' };
            case '3': return { bg: 'var(--color-green)', glow: '#22c55e', textDark: false, emoji: '🟩' };
            case '4': return { bg: 'var(--color-yellow)', glow: '#eab308', textDark: true, emoji: '🟨' };
            case '5-': 
            case '5+':
            case '5': return { bg: 'var(--color-orange)', glow: '#f97316', textDark: false, emoji: '🟧' };
            case '6-': 
            case '6+':
            case '6': return { bg: 'var(--color-red)', glow: '#ef4444', textDark: false, emoji: '🟥' };
            case '7': return { bg: 'var(--color-purple)', glow: '#a855f7', textDark: false, emoji: '🟪' };
            default: return { bg: 'var(--color-black)', glow: '#1e293b', textDark: false, emoji: '⬜' };
        }
    }

    function getMagnitudeColor(v) {
        const val = parseFloat(v);
        if (isNaN(val)) return { color: 'var(--color-white-bg)', emoji: '⬜' };
        if (val <= 2.4) return { color: 'var(--color-white)', emoji: '⬜' };
        if (val <= 3.5) return { color: 'var(--color-black)', emoji: '⬛' };
        if (val <= 4.5) return { color: 'var(--color-blue)', emoji: '🟦' };
        if (val <= 5.5) return { color: 'var(--color-green)', emoji: '🟩' };
        if (val <= 6.0) return { color: 'var(--color-yellow)', emoji: '🟨' };
        if (val <= 6.5) return { color: 'var(--color-orange)', emoji: '🟧' };
        if (val <= 7.0) return { color: 'var(--color-red)', emoji: '🟥' };
        if (val <= 7.5) return { color: 'var(--color-purple)', emoji: '🟪' };
        if (val <= 8.0) return { color: 'var(--color-alert)', emoji: '⚠' };
        return { color: 'var(--color-max)', emoji: '🗾' };
    }

    function getDepthColor(v) {
        const val = parseFloat(v);
        if (isNaN(val)) return { color: 'var(--color-white-bg)', emoji: '⬜' };
        if (val <= 10) return { color: 'var(--color-white)', emoji: '⬜' };
        if (val <= 20) return { color: 'var(--color-black)', emoji: '⬛' };
        if (val <= 30) return { color: 'var(--color-blue)', emoji: '🟦' };
        if (val <= 50) return { color: 'var(--color-green)', emoji: '🟩' };
        if (val <= 100) return { color: 'var(--color-yellow)', emoji: '🟨' };
        if (val <= 200) return { color: 'var(--color-orange)', emoji: '🟧' };
        if (val <= 400) return { color: 'var(--color-red)', emoji: '🟥' };
        return { color: 'var(--color-purple)', emoji: '🟪' };
    }

    // 更新処理
    function updateDisplay() {
        const intVal = inputIntensity.value;
        const magVal = inputMagnitude.value;
        const depVal = inputDepth.value;
        const epiVal = inputEpicenter.value;
        const timeVal = inputTime.value;

        // 0. 震源地
        dispValEpi.textContent = epiVal || '不明';

        // 0.5. 発生時刻
        dispValTime.textContent = timeVal || '--';

        // 1. 震度
        dispValInt.textContent = intVal;
        const intInfo = getIntensityColor(intVal);
        titleEmojiInt.textContent = intInfo.emoji;
        cardInt.style.background = intInfo.bg;
        cardInt.style.boxShadow = `0 0 50px ${intInfo.glow}, inset 0 0 25px rgba(255,255,255,0.4)`;
        if(intInfo.textDark) {
            dispValInt.classList.add('text-dark');
        } else {
            dispValInt.classList.remove('text-dark');
        }

        // 2. マグニチュード
        const magParsed = parseFloat(magVal);
        dispValMag.textContent = isNaN(magParsed) ? '--' : magParsed.toFixed(1);
        const magInfo = getMagnitudeColor(magVal);
        titleEmojiMag.textContent = magInfo.emoji;
        cardMag.style.borderLeftColor = magInfo.color;
        
        if (magParsed > 2.4 && magParsed <= 3.5) {
             magValText.style.color = '#f8fafc';
        } else {
             magValText.style.color = magInfo.color;
        }

        // 3. 深さ
        dispValDep.textContent = (depVal === '' || depVal < 0) ? '0' : depVal;
        const depParsed = parseFloat(depVal);
        const depInfo = getDepthColor(depVal);
        titleEmojiDep.textContent = depInfo.emoji;
        cardDep.style.borderRightColor = depInfo.color;
        
        if (depParsed > 10 && depParsed <= 20) {
            depValText.style.color = '#f8fafc';
        } else {
            depValText.style.color = depInfo.color;
        }
    }

    // P2PQuake API から履歴一覧を取得
    async function fetchEarthquakeHistory() {
        try {
            const res = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=100');
            const data = await res.json();
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            historyData = data.filter(d => {
                if (!d.earthquake || !d.earthquake.hypocenter) return false;
                const eq = d.earthquake;
                
                const name = eq.hypocenter.name;
                if (!name || name === '' || name === '不明') return false;
                if (eq.maxScale === undefined || eq.maxScale === null || eq.maxScale === -1) return false;
                if (eq.maxScale < 30) return false;
                
                const eqDate = new Date(eq.time);
                if (eqDate < oneYearAgo) return false;
                
                return true;
            });
            
            if (historyData.length === 0) {
                historySelect.innerHTML = '<option value="">条件に合うデータがありません</option>';
                return;
            }

            historySelect.innerHTML = `<option value="">▼ 過去の地震から選択（震度3以上: ${historyData.length}件）</option>`;
            
            historyData.forEach((d, index) => {
                const eq = d.earthquake;
                const hypo = eq.hypocenter;
                const timeStr = eq.time; 
                const name = hypo.name || '不明';
                const mag = hypo.magnitude === -1 ? '不明' : hypo.magnitude;
                
                let scaleStr = "?";
                const sm = { 10:'1', 20:'2', 30:'3', 40:'4', 45:'5-', 50:'5+', 55:'6-', 60:'6+', 70:'7'};
                if (sm[eq.maxScale]) scaleStr = sm[eq.maxScale];
                
                const option = document.createElement('option');
                option.value = index;
                let shortTime = timeStr;
                const match = timeStr.match(/^\d{4}\/((\d{2}\/\d{2} \d{2}:\d{2}))/);
                if(match) shortTime = match[1];

                option.textContent = `[${shortTime}] 震源: ${name.substring(0, 8)} (震度${scaleStr}/M${mag})`;
                historySelect.appendChild(option);
            });
        } catch(error) {
            console.error(error);
            historySelect.innerHTML = '<option value="">❌ 履歴データの取得エラー</option>';
        }
    }

    // 履歴セレクト変更時のイベント
    historySelect.addEventListener('change', (e) => {
        const index = e.target.value;
        if (index === "") return;
        
        const d = historyData[index];
        const eq = d.earthquake;
        const hypo = eq.hypocenter;

        inputEpicenter.value = hypo.name || '不明';
        inputDepth.value = (hypo.depth === -1) ? 0 : hypo.depth;
        inputMagnitude.value = (hypo.magnitude === -1) ? 1.0 : hypo.magnitude;
        inputTime.value = eq.time || '';

        const scaleMap = {
            10: '1', 20: '2', 30: '3', 40: '4',
            45: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7'
        };
        if (scaleMap[eq.maxScale]) {
            inputIntensity.value = scaleMap[eq.maxScale];
        }
        
        updateDisplay();
    });

    // イベントリスナー登録
    inputEpicenter.addEventListener('input', updateDisplay);
    inputIntensity.addEventListener('change', updateDisplay);
    inputMagnitude.addEventListener('input', updateDisplay);
    inputDepth.addEventListener('input', updateDisplay);
    inputTime.addEventListener('input', updateDisplay);

    // ========== カスタムプレイ機能 ==========
    // フォーマット: 秒数: 震度, M, 深さ, 時刻, 地点名
    // 例: 0: 1, 4.5, 30, 13:00:00, 千葉県北西部
    // M・深さ・時刻・地点はすべて省略可（空欄可）

    function parsePlayScript(text) {
        const lines = text.split('\n');
        let sequence = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            // 最初の":"で時間部分と値部分を分ける
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            
            const time = parseFloat(line.substring(0, colonIdx));
            if (isNaN(time)) continue;
            
            const rest = line.substring(colonIdx + 1);
            // カンマ区切りで分割
            const parts = rest.split(',').map(p => p.trim());
            
            const step = { time: time };
            // parts[0] = 震度
            if (parts[0] && parts[0] !== '') step.intensity = parts[0];
            // parts[1] = マグニチュード
            if (parts.length > 1 && parts[1] !== '') step.magnitude = parts[1];
            // parts[2] = 深さ
            if (parts.length > 2 && parts[2] !== '') step.depth = parts[2];
            // parts[3] = 時刻
            if (parts.length > 3 && parts[3] !== '') step.time_str = parts[3];
            // parts[4] = 地点名
            if (parts.length > 4 && parts[4] !== '') step.epicenter = parts[4];
            
            sequence.push(step);
        }
        
        return sequence;
    }

    btnCustomPlay.addEventListener('click', () => {
        // 再生中なら停止する
        if (btnCustomPlay.textContent.includes('停止')) {
            playTimeouts.forEach(t => clearTimeout(t));
            playTimeouts = [];
            btnCustomPlay.innerHTML = '▶️ 再生';
            btnCustomPlay.style.background = 'linear-gradient(135deg, #10b981, #047857)';
            return;
        }

        const sequence = parsePlayScript(playScript.value);
        
        if (sequence.length === 0) {
            alert('正しいフォーマットで入力してください。\n例: 3: 4, 5.0, 40, 13:00:00, 千葉県北西部');
            return;
        }

        // 時間順にソートする
        sequence.sort((a,b) => a.time - b.time);

        // 再生中のUI表示
        btnCustomPlay.innerHTML = '⏹️ 停止';
        btnCustomPlay.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';

        const maxTime = sequence[sequence.length - 1].time;

        // 各状態のタイマーセット
        sequence.forEach((step) => {
            const t = setTimeout(() => {
                if (step.intensity) inputIntensity.value = step.intensity;
                if (step.magnitude) inputMagnitude.value = step.magnitude;
                if (step.depth) inputDepth.value = step.depth;
                if (step.time_str) inputTime.value = step.time_str;
                if (step.epicenter) inputEpicenter.value = step.epicenter;
                updateDisplay();
            }, step.time * 1000);
            playTimeouts.push(t);
        });

        // 最後にボタンを元に戻す
        const endT = setTimeout(() => {
            btnCustomPlay.innerHTML = '▶️ 再生';
            btnCustomPlay.style.background = 'linear-gradient(135deg, #10b981, #047857)';
            playTimeouts = [];
        }, (maxTime * 1000) + 100);
        playTimeouts.push(endT);
    });

    // ========== JSON出力機能 ==========
    btnJsonExport.addEventListener('click', () => {
        const jsonData = {
            earthquake: {
                epicenter: inputEpicenter.value,
                time: inputTime.value,
                intensity: inputIntensity.value,
                magnitude: parseFloat(inputMagnitude.value),
                depth_km: parseInt(inputDepth.value, 10),
            },
            emoji: {
                intensity: getIntensityColor(inputIntensity.value).emoji,
                magnitude: getMagnitudeColor(inputMagnitude.value).emoji,
                depth: getDepthColor(inputDepth.value).emoji,
            },
            generated_at: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(jsonData, null, 2);
        
        // ダウンロード用Blob
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `earthquake_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 初期化ロード用
    updateDisplay();
    fetchEarthquakeHistory();
});
