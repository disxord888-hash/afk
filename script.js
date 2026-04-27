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

    // マグニチュード色マッピング（⚠🤕🗾の条件更新）
    function getMagnitudeColor(v, intVal) {
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
        if (val <= 8.5) return { color: '#f59e0b', emoji: '🤕' };
        return { color: 'var(--color-max)', emoji: '🗾' };
    }

    // マグニチュード+震度の複合絵文字判定
    function getCombinedMagEmoji(magVal, intVal) {
        const m = parseFloat(magVal);
        const intNum = parseIntensityToNum(intVal);
        if (isNaN(m)) return getMagnitudeColor(magVal).emoji;
        // 複合条件
        if (m >= 8.0 && intNum >= 7) return '🗾';
        if (m >= 7.5 && intNum >= 6) return '🤕';
        if (m >= 7.0 && intNum >= 5) return '⚠';
        // 震度関係なしのマグニチュード単独
        if (m > 8.5) return '🗾';
        if (m > 8.0) return '🤕';
        return getMagnitudeColor(magVal).emoji;
    }

    // 震度文字列を数値に変換
    function parseIntensityToNum(val) {
        const map = { '1': 1, '2': 2, '3': 3, '4': 4, '5-': 5, '5+': 5, '5': 5, '6-': 6, '6+': 6, '6': 6, '7': 7 };
        return map[val] || 0;
    }

    // 深さ色マッピング（逆方向: 浅い=🟪, 深い=⬜）
    function getDepthColor(v) {
        const val = parseFloat(v);
        if (isNaN(val)) return { color: 'var(--color-white-bg)', emoji: '⬜' };
        if (val <= 10) return { color: 'var(--color-purple)', emoji: '🟪' };
        if (val <= 20) return { color: 'var(--color-red)', emoji: '🟥' };
        if (val <= 30) return { color: 'var(--color-orange)', emoji: '🟧' };
        if (val <= 50) return { color: 'var(--color-yellow)', emoji: '🟨' };
        if (val <= 100) return { color: 'var(--color-green)', emoji: '🟩' };
        if (val <= 200) return { color: 'var(--color-blue)', emoji: '🟦' };
        if (val <= 400) return { color: 'var(--color-black)', emoji: '⬛' };
        return { color: 'var(--color-white)', emoji: '⬜' };
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
        const magInfo = getMagnitudeColor(magVal, intVal);
        // 複合絵文字判定
        titleEmojiMag.textContent = getCombinedMagEmoji(magVal, intVal);
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
        
        if (depParsed <= 10) {
            depValText.style.color = depInfo.color;
        } else if (depParsed <= 20) {
            depValText.style.color = '#f8fafc';
        } else {
            depValText.style.color = depInfo.color;
        }
    }

    // P2PQuake API から履歴一覧を取得（ナビゲーション用）
    let currentEqIndex = 0;
    const eqNavPrev = document.getElementById('eq-nav-prev');
    const eqNavNext = document.getElementById('eq-nav-next');
    const eqNavIndex = document.getElementById('eq-nav-index');

    function updateNavButtons() {
        eqNavPrev.disabled = (currentEqIndex >= historyData.length - 1);
        eqNavNext.disabled = (currentEqIndex <= 0);
        if (historyData.length > 0) {
            eqNavIndex.textContent = `${currentEqIndex + 1} / ${historyData.length}`;
        } else {
            eqNavIndex.textContent = 'データなし';
        }
    }

    function showEarthquakeAt(index) {
        if (index < 0 || index >= historyData.length) return;
        currentEqIndex = index;
        const d = historyData[index];
        const eq = d.earthquake;
        const hypo = eq.hypocenter;

        inputEpicenter.value = (hypo && hypo.name) ? hypo.name : '不明';
        inputDepth.value = (hypo && hypo.depth !== -1) ? hypo.depth : 0;
        inputMagnitude.value = (hypo && hypo.magnitude !== -1) ? hypo.magnitude : 1.0;
        inputTime.value = eq.time || '';

        const scaleMap = {
            10: '1', 20: '2', 30: '3', 40: '4',
            45: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7'
        };
        if (scaleMap[eq.maxScale]) {
            inputIntensity.value = scaleMap[eq.maxScale];
        }

        updateDisplay();
        updateNavButtons();
    }

    async function fetchEarthquakeHistory() {
        try {
            const res = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=100');
            const data = await res.json();

            historyData = data.filter(d => {
                if (!d.earthquake || !d.earthquake.hypocenter) return false;
                const eq = d.earthquake;
                const name = eq.hypocenter.name;
                if (!name || name === '' || name === '不明') return false;
                if (eq.maxScale === undefined || eq.maxScale === null || eq.maxScale === -1) return false;
                return true;
            });

            if (historyData.length > 0) {
                currentEqIndex = 0;
                showEarthquakeAt(0);
            }
            updateNavButtons();
        } catch(error) {
            console.error(error);
            eqNavIndex.textContent = '取得エラー';
        }
    }

    // ＜ボタン（前＝古い地震へ）
    eqNavPrev.addEventListener('click', () => {
        if (currentEqIndex < historyData.length - 1) {
            showEarthquakeAt(currentEqIndex + 1);
        }
    });

    // ＞ボタン（次＝新しい地震へ）
    eqNavNext.addEventListener('click', () => {
        if (currentEqIndex > 0) {
            showEarthquakeAt(currentEqIndex - 1);
        }
    });

    // イベントリスナー登録（hiddenからの手動変更用に残す）
    inputEpicenter.addEventListener('input', updateDisplay);
    inputIntensity.addEventListener('change', updateDisplay);
    inputMagnitude.addEventListener('input', updateDisplay);
    inputDepth.addEventListener('input', updateDisplay);
    inputTime.addEventListener('input', updateDisplay);

    // ========== カスタムプレイ機能 ==========
    function parsePlayScript(text) {
        const lines = text.split('\n');
        let sequence = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            
            const time = parseFloat(line.substring(0, colonIdx));
            if (isNaN(time)) continue;
            
            const rest = line.substring(colonIdx + 1);
            const parts = rest.split(',').map(p => p.trim());
            
            const step = { time: time };
            if (parts[0] && parts[0] !== '') step.intensity = parts[0];
            if (parts.length > 1 && parts[1] !== '') step.magnitude = parts[1];
            if (parts.length > 2 && parts[2] !== '') step.depth = parts[2];
            if (parts.length > 3 && parts[3] !== '') step.time_str = parts[3];
            if (parts.length > 4 && parts[4] !== '') step.epicenter = parts[4];
            
            sequence.push(step);
        }
        
        return sequence;
    }

    btnCustomPlay.addEventListener('click', () => {
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

        sequence.sort((a,b) => a.time - b.time);

        btnCustomPlay.innerHTML = '⏹️ 停止';
        btnCustomPlay.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';

        const maxTime = sequence[sequence.length - 1].time;

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
                magnitude: getCombinedMagEmoji(inputMagnitude.value, inputIntensity.value),
                depth: getDepthColor(inputDepth.value).emoji,
            },
            generated_at: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(jsonData, null, 2);
        
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

    // ========================================
    // 強震モニタ風：現在地付近の震度表示
    // ========================================
    const kyoshinCard = document.getElementById('kyoshin-card');
    const kyoshinPrefSelect = document.getElementById('kyoshin-pref-select');
    const kyoshinIntensityValue = document.getElementById('kyoshin-intensity-value');
    const kyoshinIntensityCircle = document.getElementById('kyoshin-intensity-circle');
    const kyoshinStatus = document.getElementById('kyoshin-status');
    const kyoshinTime = document.getElementById('kyoshin-time');
    const kyoshinLiveDot = document.getElementById('kyoshin-live-dot');
    const kyoshinGal = document.getElementById('kyoshin-gal');

    // 全国最大震度用要素
    const japanMaxCard = document.getElementById('japan-max-card');
    const japanMaxCircle = document.getElementById('japan-max-circle');
    const japanMaxValue = document.getElementById('japan-max-value');
    const japanMaxLocation = document.getElementById('japan-max-location');
    const japanMaxGal = document.getElementById('japan-max-gal');
    const japanMaxTime = document.getElementById('japan-max-time');

    // モード切替ボタン
    const japanMaxModeToggle = document.getElementById('japan-max-mode-toggle');
    const kyoshinModeToggle = document.getElementById('kyoshin-mode-toggle');

    // リアルタイムボタン
    const realtimeBtn = document.getElementById('realtime-btn');
    const realtimeBtnLabel = document.getElementById('realtime-btn-label');

    // 表示モード: 'shindo' (震度) or 'keisoku' (計測震度)
    let japanMaxMode = 'shindo';
    let kyoshinMode = 'shindo';

    // リアルタイム接続状態
    let isRealtimeActive = false;

    // 都道府県の代表的な緯度経度
    const prefectureCoords = {
        '北海道': { lat: 43.06, lng: 141.35 },
        '青森県': { lat: 40.82, lng: 140.74 },
        '岩手県': { lat: 39.70, lng: 141.15 },
        '宮城県': { lat: 38.27, lng: 140.87 },
        '秋田県': { lat: 39.72, lng: 140.10 },
        '山形県': { lat: 38.24, lng: 140.34 },
        '福島県': { lat: 37.75, lng: 140.47 },
        '茨城県': { lat: 36.34, lng: 140.45 },
        '栃木県': { lat: 36.57, lng: 139.88 },
        '群馬県': { lat: 36.39, lng: 139.06 },
        '埼玉県': { lat: 35.86, lng: 139.65 },
        '千葉県': { lat: 35.61, lng: 140.12 },
        '東京都': { lat: 35.68, lng: 139.69 },
        '神奈川県': { lat: 35.45, lng: 139.64 },
        '新潟県': { lat: 37.90, lng: 139.02 },
        '富山県': { lat: 36.70, lng: 137.21 },
        '石川県': { lat: 36.59, lng: 136.63 },
        '福井県': { lat: 36.07, lng: 136.22 },
        '山梨県': { lat: 35.66, lng: 138.57 },
        '長野県': { lat: 36.23, lng: 138.18 },
        '岐阜県': { lat: 35.39, lng: 136.72 },
        '静岡県': { lat: 34.98, lng: 138.38 },
        '愛知県': { lat: 35.18, lng: 136.91 },
        '三重県': { lat: 34.73, lng: 136.51 },
        '滋賀県': { lat: 35.00, lng: 135.87 },
        '京都府': { lat: 35.02, lng: 135.76 },
        '大阪府': { lat: 34.69, lng: 135.52 },
        '兵庫県': { lat: 34.69, lng: 135.18 },
        '奈良県': { lat: 34.69, lng: 135.83 },
        '和歌山県': { lat: 34.23, lng: 135.17 },
        '鳥取県': { lat: 35.50, lng: 134.24 },
        '島根県': { lat: 35.47, lng: 133.05 },
        '岡山県': { lat: 34.66, lng: 133.93 },
        '広島県': { lat: 34.40, lng: 132.46 },
        '山口県': { lat: 34.19, lng: 131.47 },
        '徳島県': { lat: 34.07, lng: 134.56 },
        '香川県': { lat: 34.34, lng: 134.04 },
        '愛媛県': { lat: 33.84, lng: 132.77 },
        '高知県': { lat: 33.56, lng: 133.53 },
        '福岡県': { lat: 33.59, lng: 130.40 },
        '佐賀県': { lat: 33.25, lng: 130.30 },
        '長崎県': { lat: 32.74, lng: 129.87 },
        '熊本県': { lat: 32.79, lng: 130.74 },
        '大分県': { lat: 33.24, lng: 131.61 },
        '宮崎県': { lat: 31.91, lng: 131.42 },
        '鹿児島県': { lat: 31.56, lng: 130.56 },
        '沖縄県': { lat: 26.34, lng: 127.80 }
    };

    let nearestPref = null;
    let kyoshinInterval = null;

    // 距離計算（Haversine）
    function calcDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 最寄り都道府県を検索
    function findNearestPrefecture(lat, lng) {
        let minDist = Infinity;
        let nearest = null;
        for (const [pref, coord] of Object.entries(prefectureCoords)) {
            const dist = calcDistance(lat, lng, coord.lat, coord.lng);
            if (dist < minDist) {
                minDist = dist;
                nearest = pref;
            }
        }
        return nearest;
    }

    // P2PQuakeの震度スケール → 表示文字列(震度表記)
    function p2pScaleToDisplay(scale) {
        const map = {
            10: '1', 20: '2', 30: '3', 40: '4',
            45: '5弱', 46: '5弱', 50: '5強', 55: '6弱', 60: '6強', 70: '7'
        };
        return map[scale] || String(scale);
    }

    // P2PQuakeの震度スケール → 計測震度(小数点)
    function p2pScaleToKeisoku(scale) {
        const map = {
            10: 0.5, 20: 1.5, 30: 2.5, 40: 3.5,
            45: 4.5, 46: 4.5, 50: 5.0, 55: 5.5, 60: 6.0, 70: 6.5
        };
        const val = map[scale];
        if (val === undefined) return '-';
        return val.toFixed(1);
    }

    // P2PQuakeの震度スケール → 内部値（色取得用・ジェネレーター用）
    function p2pScaleToInternal(scale) {
        const map = {
            10: '1', 20: '2', 30: '3', 40: '4',
            45: '5-', 46: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7'
        };
        return map[scale] || '1';
    }

    // 地点情報を簡略化（"東京都新宿区" -> "新宿区"）
    function simplifyAddress(addr) {
        if (!addr) return "不明";
        const prefs = Object.keys(prefectureCoords);
        let simplified = addr;
        for (const pref of prefs) {
            if (simplified.startsWith(pref)) {
                simplified = simplified.replace(pref, "");
                break;
            }
        }
        return simplified || addr;
    }

    // 震度(JMA計測震度相当) → 推定PGA(gal)
    function scaleToGal(p2pScale) {
        const scaleToJma = {
            10: 0.5, 20: 1.5, 30: 2.5, 40: 3.5,
            45: 4.5, 46: 4.5, 50: 5.0, 55: 5.5, 60: 6.0, 70: 6.5
        };
        const jma = scaleToJma[p2pScale];
        if (jma === undefined) return 0;
        return Math.round(Math.pow(10, (jma - 0.94) / 2));
    }

    // 震度に応じた色を円に適用
    function applyKyoshinColor(scaleStr) {
        const info = getIntensityColor(scaleStr);
        kyoshinIntensityCircle.style.background = info.bg;
        kyoshinIntensityCircle.style.borderColor = info.glow;
        kyoshinIntensityCircle.style.boxShadow = `0 0 20px ${info.glow}, inset 0 0 10px rgba(255,255,255,0.3)`;
        kyoshinIntensityValue.style.color = info.textDark ? '#111827' : '#ffffff';
        kyoshinCard.classList.add('intensity-active');
    }

    // 無震状態のリセット
    function resetKyoshinColor() {
        kyoshinIntensityCircle.style.background = 'rgba(30, 41, 59, 0.9)';
        kyoshinIntensityCircle.style.borderColor = 'rgba(100, 180, 255, 0.3)';
        kyoshinIntensityCircle.style.boxShadow = '0 0 16px rgba(59, 130, 246, 0.15), inset 0 0 12px rgba(0, 0, 0, 0.4)';
        kyoshinIntensityValue.style.color = 'rgba(200, 220, 255, 0.8)';
        kyoshinCard.classList.remove('intensity-active');
    }

    // 全国最大震度のリセット
    function resetJapanMaxColor() {
        japanMaxCircle.style.background = 'rgba(30, 41, 59, 0.9)';
        japanMaxCircle.style.borderColor = 'rgba(168, 85, 247, 0.3)';
        japanMaxCircle.style.boxShadow = '0 0 16px rgba(168, 85, 247, 0.15), inset 0 0 10px rgba(0, 0, 0, 0.4)';
        japanMaxValue.style.color = 'rgba(200, 220, 255, 0.8)';
        japanMaxCard.classList.remove('intensity-active');
    }

    // 地震検知時にメインジェネレーターへ反映
    function applyToGenerator(eqItem) {
        if (!eqItem || !eqItem.earthquake) return;
        const eq = eqItem.earthquake;
        const hypo = eq.hypocenter;

        if (hypo && hypo.name && hypo.name !== '不明' && hypo.name !== '') {
            inputEpicenter.value = hypo.name;
        }
        if (eq.time) {
            inputTime.value = eq.time;
        }
        if (hypo && hypo.depth !== undefined && hypo.depth !== -1) {
            inputDepth.value = hypo.depth;
        }
        if (hypo && hypo.magnitude !== undefined && hypo.magnitude !== -1) {
            inputMagnitude.value = hypo.magnitude;
        }
        if (eq.maxScale) {
            const scaleMap = {
                10: '1', 20: '2', 30: '3', 40: '4',
                45: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7'
            };
            if (scaleMap[eq.maxScale]) {
                inputIntensity.value = scaleMap[eq.maxScale];
            }
        }
        updateDisplay();
    }

    // ========================================
    // モード切替ボタンのハンドリング
    // ========================================
    
    // 最新データを保持
    let lastJapanMaxScale = null;
    let lastKyoshinScale = null;

    japanMaxModeToggle.addEventListener('click', () => {
        japanMaxMode = japanMaxMode === 'shindo' ? 'keisoku' : 'shindo';
        japanMaxModeToggle.textContent = japanMaxMode === 'shindo' ? '震度' : '計測';
        japanMaxModeToggle.classList.toggle('active', japanMaxMode === 'keisoku');
        // 表示を更新
        if (lastJapanMaxScale !== null) {
            if (japanMaxMode === 'keisoku') {
                japanMaxValue.textContent = p2pScaleToKeisoku(lastJapanMaxScale);
            } else {
                japanMaxValue.textContent = p2pScaleToDisplay(lastJapanMaxScale);
            }
        }
    });

    kyoshinModeToggle.addEventListener('click', () => {
        kyoshinMode = kyoshinMode === 'shindo' ? 'keisoku' : 'shindo';
        kyoshinModeToggle.textContent = kyoshinMode === 'shindo' ? '震度' : '計測';
        kyoshinModeToggle.classList.toggle('active', kyoshinMode === 'keisoku');
        // 表示を更新
        if (lastKyoshinScale !== null) {
            if (kyoshinMode === 'keisoku') {
                kyoshinIntensityValue.textContent = p2pScaleToKeisoku(lastKyoshinScale);
            } else {
                kyoshinIntensityValue.textContent = p2pScaleToDisplay(lastKyoshinScale);
            }
        }
    });

    // ========================================
    // リアルタイムデータ取得
    // ========================================

    async function fetchKyoshinData() {
        try {
            const res = await fetch('https://api.p2pquake.net/v2/history?codes=551&limit=10');
            const data = await res.json();

            const now = new Date();
            kyoshinTime.textContent = now.toTimeString().split(' ')[0];

            if (!data || data.length === 0) return;

            // 1. 全国最大震度の更新 (最新の地震: data[0])
            const latestEqGlobal = data[0];
            if (latestEqGlobal.earthquake && latestEqGlobal.earthquake.maxScale !== undefined) {
                const maxScale = latestEqGlobal.earthquake.maxScale;
                lastJapanMaxScale = maxScale;
                const maxInternalVal = p2pScaleToInternal(maxScale);
                const maxGalValue = scaleToGal(maxScale);
                
                // モードに応じた表示
                if (japanMaxMode === 'keisoku') {
                    japanMaxValue.textContent = p2pScaleToKeisoku(maxScale);
                } else {
                    japanMaxValue.textContent = p2pScaleToDisplay(maxScale);
                }
                
                // 代表地点の取得
                let maxLoc = "不明";
                if (latestEqGlobal.points && latestEqGlobal.points.length > 0) {
                    const topPoint = latestEqGlobal.points.find(p => p.scale === maxScale) || latestEqGlobal.points[0];
                    maxLoc = simplifyAddress(topPoint.addr);
                } else if (latestEqGlobal.earthquake.hypocenter) {
                    maxLoc = latestEqGlobal.earthquake.hypocenter.name;
                }

                japanMaxLocation.textContent = maxLoc;
                japanMaxGal.textContent = `${maxGalValue} gal`;
                
                const rawTime = latestEqGlobal.earthquake.time;
                japanMaxTime.textContent = (rawTime.includes(' ') ? rawTime.split(' ')[1] : rawTime).substring(0, 5);
                
                // 色とアニメーションの適用
                if (maxScale >= 10) {
                    const colorInfo = getIntensityColor(maxInternalVal);
                    japanMaxCircle.style.background = colorInfo.bg;
                    japanMaxCircle.style.borderColor = colorInfo.glow;
                    japanMaxCircle.style.boxShadow = `0 0 20px ${colorInfo.glow}, inset 0 0 10px rgba(255,255,255,0.3)`;
                    japanMaxValue.style.color = colorInfo.textDark ? '#111827' : '#ffffff';
                    japanMaxCard.classList.add('intensity-active');
                } else {
                    resetJapanMaxColor();
                }

                // メインジェネレーターの更新 (最新の地震を反映)
                if (currentEqIndex === 0) {
                    applyToGenerator(latestEqGlobal);
                }
            }

            // 2. 選択地点（現在地付近）の震度を探す
            if (nearestPref) {
                let foundIntensity = null;
                let foundTime = null;

                for (const item of data) {
                    if (!item.earthquake || !item.points) continue;

                    for (const point of item.points) {
                        if (point.pref === nearestPref || point.addr.startsWith(nearestPref)) {
                            if (foundIntensity === null || point.scale > foundIntensity) {
                                foundIntensity = point.scale;
                                foundTime = item.earthquake.time;
                            }
                        }
                    }
                    if (foundIntensity !== null) break;
                }

                if (foundIntensity !== null) {
                    lastKyoshinScale = foundIntensity;
                    const internalVal = p2pScaleToInternal(foundIntensity);
                    const galValue = scaleToGal(foundIntensity);

                    // モードに応じた表示
                    if (kyoshinMode === 'keisoku') {
                        kyoshinIntensityValue.textContent = p2pScaleToKeisoku(foundIntensity);
                    } else {
                        kyoshinIntensityValue.textContent = p2pScaleToDisplay(foundIntensity);
                    }
                    applyKyoshinColor(internalVal);
                    kyoshinGal.textContent = `≈ ${galValue} gal`;
                    kyoshinGal.style.color = 'rgba(100, 220, 180, 0.9)';
                    const timePart = foundTime.includes(' ') ? foundTime.split(' ')[1] : foundTime;
                    kyoshinStatus.textContent = `最新: ${timePart.substring(0, 5)}`;
                    kyoshinStatus.style.color = 'rgba(239, 68, 68, 0.9)';
                } else {
                    lastKyoshinScale = null;
                    kyoshinIntensityValue.textContent = '-';
                    resetKyoshinColor();
                    kyoshinGal.textContent = '0 gal';
                    kyoshinGal.style.color = 'rgba(148, 163, 184, 0.6)';
                    kyoshinStatus.textContent = `${nearestPref}: 観測なし`;
                    kyoshinStatus.style.color = 'rgba(148, 163, 184, 0.7)';
                }
            }

            kyoshinLiveDot.className = 'kyoshin-live-dot';

        } catch (err) {
            console.error('地震データ更新エラー:', err);
            kyoshinStatus.textContent = 'データ更新エラー';
            kyoshinLiveDot.className = 'kyoshin-live-dot error';
        }
    }

    // 都道府県セレクト変更時
    kyoshinPrefSelect.addEventListener('change', () => {
        const val = kyoshinPrefSelect.value;
        if (val) {
            nearestPref = val;
            if (isRealtimeActive) fetchKyoshinData();
        }
    });

    // ========================================
    // リアルタイム接続ボタン
    // ========================================
    realtimeBtn.addEventListener('click', () => {
        if (isRealtimeActive) {
            // 停止
            isRealtimeActive = false;
            if (kyoshinInterval) {
                clearInterval(kyoshinInterval);
                kyoshinInterval = null;
            }
            realtimeBtn.classList.remove('active');
            realtimeBtnLabel.textContent = '接続開始';
            kyoshinStatus.textContent = '待機中';
            kyoshinStatus.style.color = 'rgba(148, 163, 184, 0.7)';
            kyoshinLiveDot.className = 'kyoshin-live-dot error';
        } else {
            // 開始
            isRealtimeActive = true;
            realtimeBtn.classList.add('active');
            realtimeBtnLabel.textContent = '接続中...';
            kyoshinLiveDot.className = 'kyoshin-live-dot searching';

            // デフォルト都道府県の設定
            if (!nearestPref) {
                nearestPref = '東京都';
                kyoshinPrefSelect.value = '東京都';
            }

            // 即座にデータ取得
            fetchKyoshinData();

            // Geolocationで自動検出を試みる
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const detected = findNearestPrefecture(pos.coords.latitude, pos.coords.longitude);
                        if (kyoshinPrefSelect.value === '東京都' || !kyoshinPrefSelect.value) {
                            nearestPref = detected;
                            kyoshinPrefSelect.value = detected;
                            fetchKyoshinData();
                        }
                        kyoshinLiveDot.className = 'kyoshin-live-dot';
                    },
                    () => {
                        kyoshinLiveDot.className = 'kyoshin-live-dot';
                    },
                    { timeout: 10000, maximumAge: 300000 }
                );
            }

            // 15秒ごとにポーリング
            kyoshinInterval = setInterval(fetchKyoshinData, 15000);
            realtimeBtnLabel.textContent = '切断';
        }
    });
});
