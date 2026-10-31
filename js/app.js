'use strict'; const KEY = 'limonada-cozinha-quest-v2'; const ADMIN_USER = 'es5@calabria.com.br'; const ADMIN_PASS = 'limonada2026'; const ADMIN_AUTH_KEY = 'lq_admin_session'; const ADMIN_TABS = ['dashboard', 'prizes', 'sessions', 'history', 'settings']; function isAdminAuthenticated() { return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true' } function updateAdminUI() { let authed = isAdminAuthenticated(); document.body.classList.toggle('is-admin', authed) } let pendingAdminTab = 'dashboard'; function openAdminLogin(targetTab) { pendingAdminTab = targetTab || 'dashboard'; let em = $('adminEmailInput'), pw = $('adminPasswordInput'), err = $('adminLoginError'); if (em) em.value = ''; if (pw) pw.value = ''; if (err) err.style.display = 'none'; $('adminLoginModal').classList.remove('hidden'); setTimeout(() => { if (em) em.focus() }, 120) } function closeAdminLogin() { $('adminLoginModal').classList.add('hidden'); if ($('adminLoginError')) $('adminLoginError').style.display = 'none' } function handleAdminLogin() { let u = ($('adminEmailInput')?.value || '').trim(); let p = ($('adminPasswordInput')?.value || '').trim(); if (u === ADMIN_USER && p === ADMIN_PASS) { sessionStorage.setItem(ADMIN_AUTH_KEY, 'true'); updateAdminUI(); closeAdminLogin(); showTab(pendingAdminTab || 'dashboard') } else { let err = $('adminLoginError'); if (err) { err.textContent = 'Credenciais incorretas. Verifique o usuário e a senha.'; err.style.display = 'block' } let pInput = $('adminPasswordInput'); if (pInput) { pInput.value = ''; pInput.focus() } } } function handleAdminLogout() { if (confirm('Encerrar sessão de monitor e bloquear a Área Administrativa?')) { sessionStorage.removeItem(ADMIN_AUTH_KEY); updateAdminUI(); showTab('play') } } const RECIPES = [{ id: 'cookie', name: 'Cookies de chocolate', emoji: '🍪', desc: 'Misture, modele e asse a massa na sequência certa.', steps: [['Manteiga', 'Misturar', 'Misture a manteiga para começar a massa.'], ['Açúcar', 'Misturar', 'Incorpore o açúcar à manteiga.'], ['Ovo', 'Bater', 'Bata o ovo na mistura.'], ['Farinha', 'Peneirar', 'Peneire a farinha antes de adicionar.'], ['Chocolate', 'Picar', 'Pique o chocolate em pequenos pedaços.'], ['Massa', 'Modelar', 'Modele os cookies.'], ['Cookies', 'Assar', 'Asse a 180°C por 12 segundos na assadeira (minutos em segundos no arcade).']], oven: { temp: 180, time: 12 } }, { id: 'lemonade', name: 'Limonada especial', emoji: '🍋', desc: 'Higienize, corte, esprema e misture uma limonada.', steps: [['Limão', 'Lavar', 'Higienize os limões.'], ['Limão', 'Cortar', 'Corte os limões ao meio.'], ['Limão', 'Espremer', 'Extraia o suco.'], ['Água', 'Adicionar', 'Acrescente água filtrada.'], ['Açúcar', 'Misturar', 'Misture o açúcar.'], ['Gelo', 'Adicionar', 'Finalize com gelo.']] }, { id: 'focaccia', name: 'Mini focaccia', emoji: '🥖', desc: 'Prepare a massa e finalize com ervas.', steps: [['Farinha', 'Peneirar', 'Peneire a farinha.'], ['Fermento', 'Misturar', 'Incorpore o fermento.'], ['Água', 'Adicionar', 'Acrescente água.'], ['Massa', 'Sovar', 'Sove até obter uma massa uniforme.'], ['Azeite', 'Adicionar', 'Espalhe o azeite.'], ['Alecrim', 'Picar', 'Prepare o alecrim.'], ['Focaccia', 'Assar', 'Asse a 200°C por 20 segundos na assadeira (minutos em segundos no arcade).']], oven: { temp: 200, time: 20 } }]; const INGREDIENTS = ['Manteiga', 'Açúcar', 'Ovo', 'Farinha', 'Chocolate', 'Cookies', 'Limão', 'Água', 'Gelo', 'Fermento', 'Azeite', 'Alecrim', 'Focaccia', 'Leite', 'Sal', 'Morango']; const ACTIONS = ['Misturar', 'Bater', 'Peneirar', 'Picar', 'Modelar', 'Assar', 'Lavar', 'Cortar', 'Espremer', 'Adicionar', 'Sovar', 'Aquecer']; const PRIZES = [{ id: 'ticket', name: 'Golden Ticket — Cafeteria', qty: 0, perDay: 10, weight: 1 }, { id: 'sweet', name: 'Mini doce', qty: 40, perDay: 10, weight: 3 }, { id: 'drink', name: 'Degustação de bebida', qty: 40, perDay: 10, weight: 3 }, { id: 'gift', name: 'Brinde simbólico', qty: 20, perDay: 5, weight: 2 }]; function fresh() { return { day: 1, settings: { seconds: 100, dailyCap: 15, wheelScore: 500 }, prizes: structuredClone(PRIZES), sessions: [], games: [], audit: [], nextId: 1 } } function load() { try { let s = JSON.parse(localStorage.getItem(KEY)); if (!(s && s.games && s.prizes && s.sessions)) return fresh(); if (!('wheelScore' in s.settings)) s.settings.wheelScore = 500; return s } catch { return fresh() } } let db = load(); function save() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) { alert('Não foi possível salvar. Exporte um backup e verifique o armazenamento do navegador.') } } const $ = id => document.getElementById(id), fmt = n => String(n).padStart(2, '0'); function audit(type, detail) { db.audit.push({ time: new Date().toISOString(), type, detail }) } function usedToday(id) { return db.games.filter(g => g.day === db.day && g.prize === id && g.status !== 'cancelado').length } function dailyPhysical() { return db.games.filter(g => g.day === db.day && g.prize && g.status !== 'cancelado').length } function available(p) { return Math.max(0, Math.min(p.qty - db.games.filter(g => g.prize === p.id && g.status !== 'cancelado').length, p.perDay - usedToday(p.id))) } function freeSessions() { return db.sessions.filter(s => s.day === db.day && s.capacity > db.games.filter(g => g.sessionId === s.id && g.status !== 'cancelado').length).sort((a, b) => a.time.localeCompare(b.time)) } function availablePrizes() { return db.prizes.filter(p => available(p) > 0 && (p.id !== 'ticket' || freeSessions().length > 0)) } function showTab(tab) { if (ADMIN_TABS.includes(tab) && !isAdminAuthenticated()) { openAdminLogin(tab); return } if (current && tab !== 'play' && !current.finished) { if (!confirm('Uma partida está em andamento. Encerrar a tentativa?')) return; finish(false) } document.querySelectorAll('.tab[data-tab]').forEach(e => e.classList.toggle('active', e.dataset.tab === tab)); document.querySelectorAll('.view').forEach(e => e.classList.toggle('active', e.id === tab)); renderAll() } document.querySelectorAll('.tab[data-tab]').forEach(e => e.onclick = () => showTab(e.dataset.tab)); let current = null, timerId = null, three = null, visual = {}, sceneHooks = null;
    function renderRecipes() { $('recipeList').innerHTML = RECIPES.map(r => `<button class="recipe" data-recipe="${r.id}"><span class="emoji">${r.emoji}</span><b>${r.name}</b><p class="muted">${r.desc}</p><span class="badge">${r.steps.length} etapas</span></button>`).join(''); document.querySelectorAll('[data-recipe]').forEach(e => e.onclick = () => startGame(e.dataset.recipe)) } function startGame(id) { let r = RECIPES.find(x => x.id === id); current = { recipe: r, step: 0, score: 0, wrong: 0, ingredient: null, action: null, remaining: db.settings.seconds, finished: false, gameId: null }; $('intro').classList.add('hidden'); $('end').classList.add('hidden'); $('wheelArea').classList.add('hidden'); $('game').classList.remove('hidden'); $('recipeName').textContent = r.emoji + ' ' + r.name; updateStep(); updateScene('start'); clearInterval(timerId); timerId = setInterval(() => { if (!current || current.finished) return; current.remaining--; renderTimer(); if (current.remaining <= 0) finish(false) }, 1000); renderTimer() } function renderTimer() { if (!current) return; $('timer').textContent = `${fmt(Math.floor(current.remaining / 60))}:${fmt(current.remaining % 60)}`; $('timer').style.color = current.remaining <= 20 ? '#ff8a7e' : '#ffc95e' } function updateStep() {
      if (!current) return; let r = current.recipe, step = r.steps[current.step]; $('stepTitle').textContent = `Etapa ${current.step + 1}: ${step[0]}`; $('stepHint').textContent = step[2]; $('stepCount').textContent = `${current.step + 1} de ${r.steps.length}`; $('progressBar').style.width = `${current.step / r.steps.length * 100}%`; $('score').textContent = `${current.score} pontos`; $('feedback').textContent = three ? 'Arraste o ingrediente correto até a tigela.' : 'Selecione o ingrediente e o preparo correspondente.'; if (three) {
        let dest = step[1] === 'Lavar' ? 'pia' : step[1] === 'Assar' ? 'assadeira' : (step[1] === 'Cortar' || step[1] === 'Picar') ? 'tábua' : (step[1] === 'Modelar' || step[1] === 'Sovar') ? 'massa na tigela' : 'tigela';
        let meta = step[1] === 'Assar' && r.oven ? ` • meta ${r.oven.temp}°C / ${r.oven.time} seg` : '';
        $('sceneHint').textContent = (step[1] === 'Lavar' ? '🧼 ' : step[1] === 'Assar' ? '🔥 ' : (step[1] === 'Modelar' || step[1] === 'Sovar') ? '🤲 ' : '🎯 ') + step[0] + ' → ' + dest + meta
      } current.ingredient = null; current.action = null; current.ingredientOk = false; current.actionOk = false; let decoys = []; let pool = INGREDIENTS.filter(x => x !== step[0]); while (decoys.length < 5) { let p = pool[Math.floor(Math.random() * pool.length)]; if (!decoys.includes(p)) decoys.push(p) } $('stepList').innerHTML = r.steps.map((s, i) => `<div class="step ${i < current.step ? 'done' : i === current.step ? 'current' : ''}">${i + 1}. ${s[0]} — ${s[1]}</div>`).join(''); $('manual').classList.toggle('hidden', !!three); $('dragHint').classList.toggle('hidden', !three); closeOvenModal(); let ing = [step[0], ...INGREDIENTS.filter(x => x !== step[0]).sort(() => Math.random() - .5).slice(0, 5)].sort(() => Math.random() - .5); let acts = [step[1], ...ACTIONS.filter(x => x !== step[1]).sort(() => Math.random() - .5).slice(0, 3)].sort(() => Math.random() - .5); $('ingredientChoices').innerHTML = ing.map(x => `<button class="choice" data-ing="${x}">${x}</button>`).join(''); $('actionChoices').innerHTML = acts.map(x => `<button class="choice" data-act="${x}">${x}</button>`).join(''); document.querySelectorAll('[data-ing]').forEach(e => e.onclick = () => { current.ingredient = e.dataset.ing; document.querySelectorAll('[data-ing]').forEach(b => b.classList.toggle('selected', b === e)); updateScene('ingredient') }); document.querySelectorAll('[data-act]').forEach(e => e.onclick = () => { current.action = e.dataset.act; document.querySelectorAll('[data-act]').forEach(b => b.classList.toggle('selected', b === e)); updateScene('action') }); if (three && three.spawnStep) three.spawnStep(step[0], decoys, current.step * 2, step[1] === 'Lavar' ? 'sink' : step[1] === 'Assar' ? 'form' : (step[1] === 'Cortar' || step[1] === 'Picar') ? 'board' : 'bowl', step[1]); sceneHooks = { onFood(name, zone) { if (!current || current.finished) return 'none'; let st = current.recipe.steps[current.step]; if (current.ingredientOk || current.actionOk) return 'none'; let allowed = st[1] === 'Lavar' ? 'sink' : st[1] === 'Assar' ? 'form' : (st[1] === 'Cortar' || st[1] === 'Picar') ? 'board' : 'bowl'; if (zone !== allowed) { $('feedback').textContent = allowed === 'sink' ? 'Higienização é na pia!' : allowed === 'board' ? 'Corte é na tábua de corte!' : allowed === 'form' ? 'Assar é na assadeira!' : 'Este ingrediente vai na tigela!'; return 'hint' } if (name !== st[0]) { current.wrong++; current.score = Math.max(0, current.score - 35); current.remaining = Math.max(0, current.remaining - 7); $('feedback').textContent = `Ingrediente errado! Você perdeu 7 segundos. (${current.wrong} erro(s))`; $('score').textContent = `${current.score} pontos`; updateScene('wrong'); if (current.remaining === 0) finish(false); return 'wrong' } current.ingredientOk = true; current.ingredient = name; $('score').textContent = `${current.score} pontos`; let needsTool = st[1] !== 'Adicionar' && st[1] !== 'Lavar'; if (needsTool) { let tn = toolFor(st[1]); $('feedback').textContent = st[1] === 'Assar' ? `${st[0]} inserido na assadeira! Abra o forno e insira a forma.` : `Agora use ${tn === 'spoon' ? 'a colher' : tn === 'sieve' ? 'a peneira' : tn === 'knife' ? 'a faca' : tn === 'form' ? 'a assadeira' : tn === 'dough' ? 'as mãos' : 'a panela'} para ${st[1].toLowerCase()}!`; $('sceneHint').textContent = st[1] === 'Assar' ? '🔥 Abra o forno e insira a assadeira com a receita' : tn === 'dough' ? '🤲 Clique na massa na tigela para ' + st[1].toLowerCase() : (tn === 'knife' ? '🔪 Use a faca' : tn === 'spoon' ? '🥄 Use a colher' : tn === 'sieve' ? '🌾 Use a peneira' : tn === 'pan' ? '🍳 Use a panela' : tn === 'form' ? '🍽️ Use a assadeira' : '🎯') + ' → ' + (tn === 'knife' ? 'tábua' : tn === 'form' ? 'forno' : tn === 'pan' ? 'fogão' : 'tigela'); if (three && three.awaitTool) three.awaitTool(toolFor(st[1])); return allowed === 'board' ? 'on-board' : allowed === 'form' ? 'on-form' : 'in-bowl' } if (zone === 'sink') { $('feedback').textContent = 'Higienizando com água corrente... 🧼'; updateScene('correct'); setTimeout(() => { if (current && !current.finished) completeStep(); }, 750); return 'wash' } $('feedback').textContent = 'Derramando na tigela...'; updateScene('correct'); return 'pour' }, onTool(kind) { if (!current || current.finished) return 'none'; let st = current.recipe.steps[current.step]; if (!current.ingredientOk) { $('feedback').textContent = st[1] === 'Assar' ? 'Primeiro coloque os ingredientes na assadeira!' : 'Primeiro coloque o ingrediente no local de preparo!'; return 'hint' } if (current.actionOk) return 'none'; if (kind !== toolFor(st[1])) { current.wrong++; current.score = Math.max(0, current.score - 15); $('feedback').textContent = `Ferramenta errada para ${st[1].toLowerCase()}! (-15 pontos)`; $('score').textContent = `${current.score} pontos`; return 'wrong' } current.actionOk = true; current.action = st[1]; $('feedback').textContent = st[1] === 'Assar' ? 'Forma no forno! Clique no display digital na porta para configurar temperatura e tempo.' : (st[1] === 'Cortar' || st[1] === 'Picar') ? 'Cortando na tábua...' : (st[1] === 'Modelar' || st[1] === 'Sovar') ? 'Modelando a massa com as mãos 🤲' : 'Preparando...'; return 'ok' }, onToolDone() { completeStep() }, onOvenHint(msg) { $('feedback').textContent = msg }, onOvenReady() { showOvenPanel() } }
    }
    function toolFor(action) { return (action === 'Modelar' || action === 'Sovar') ? 'dough' : action === 'Peneirar' ? 'sieve' : (action === 'Cortar' || action === 'Picar') ? 'knife' : action === 'Assar' ? 'form' : action === 'Aquecer' ? 'pan' : 'spoon' }
    function completeStep() { if (!current || current.finished) return; let r = current.recipe; current.score += Math.round(1000 / r.steps.length); $('score').textContent = `${current.score} pontos`; $('feedback').textContent = 'Etapa concluída!'; updateScene('correct'); current.step++; if (current.step >= r.steps.length) { current.score = Math.min(1000, current.score + Math.round(current.remaining * 1.5)); finish(true) } else updateStep() } function addStep() { if (!current || current.finished) return; let [ing, act] = current.recipe.steps[current.step]; if (!current.ingredient || !current.action) { $('feedback').textContent = 'Escolha o ingrediente e a ação antes de adicionar.'; return } if (current.ingredient === ing && current.action === act) { current.score += Math.round(1000 / current.recipe.steps.length); $('feedback').textContent = 'Etapa concluída!'; updateScene('correct'); current.step++; if (current.step >= current.recipe.steps.length) { current.score = Math.min(1000, current.score + Math.round(current.remaining * 1.5)); finish(true) } else updateStep() } else { current.wrong++; current.score = Math.max(0, current.score - 35); current.remaining = Math.max(0, current.remaining - 7); $('feedback').textContent = `Ops! Confira a receita: você perdeu 7 segundos. (${current.wrong} erro(s))`; $('score').textContent = `${current.score} pontos`; updateScene('wrong'); if (current.remaining === 0) finish(false) } } $('addBtn').onclick = addStep; $('quitBtn').onclick = () => { if (confirm('Encerrar esta tentativa?')) finish(false) };
    let currentOvenTemp = 180, currentOvenTime = 12;
    function set7SegDigit(svgEl, char) { const M = { '0': [1, 1, 1, 1, 1, 1, 0], '1': [0, 1, 1, 0, 0, 0, 0], '2': [1, 1, 0, 1, 1, 0, 1], '3': [1, 1, 1, 1, 0, 0, 1], '4': [0, 1, 1, 0, 0, 1, 1], '5': [1, 0, 1, 1, 0, 1, 1], '6': [1, 0, 1, 1, 1, 1, 1], '7': [1, 1, 1, 0, 0, 0, 0], '8': [1, 1, 1, 1, 1, 1, 1], '9': [1, 1, 1, 1, 0, 1, 1], '-': [0, 0, 0, 0, 0, 0, 1], ' ': [0, 0, 0, 0, 0, 0, 0], 'E': [1, 0, 0, 1, 1, 1, 1], 'r': [0, 0, 0, 0, 1, 0, 1], 'C': [1, 0, 0, 1, 1, 1, 0] }; let s = M[char] || [0, 0, 0, 0, 0, 0, 0];['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach((l, i) => { let p = svgEl.querySelector('.' + l); if (p) p.classList.toggle('on', !!s[i]) }) }
    function updateOvenModalLEDs(temp, timeSec) { currentOvenTemp = temp; currentOvenTime = timeSec; let tStr = String(Math.max(0, Math.min(999, temp))).padStart(3, '0'); let sh = $('segTempH'), st = $('segTempT'), su = $('segTempU'); if (sh && st && su) { set7SegDigit(sh, tStr[0]); set7SegDigit(st, tStr[1]); set7SegDigit(su, tStr[2]) } let m = Math.floor(timeSec / 60), s = timeSec % 60; let mStr = String(m).padStart(2, '0'), sStr = String(s).padStart(2, '0'); let m1 = $('segTimeM1'), m0 = $('segTimeM0'), s1 = $('segTimeS1'), s0 = $('segTimeS0'); if (m1 && m0 && s1 && s0) { set7SegDigit(m1, mStr[0]); set7SegDigit(m0, mStr[1]); set7SegDigit(s1, sStr[0]); set7SegDigit(s0, sStr[1]) } if ($('ovenTempVal')) $('ovenTempVal').textContent = temp + ' °C'; if ($('ovenTimeVal')) $('ovenTimeVal').textContent = timeSec + ' s'; if ($('ovenTemp') && $('ovenTemp').value != temp) $('ovenTemp').value = temp; if ($('ovenTime') && $('ovenTime').value != timeSec) $('ovenTime').value = timeSec; if (window.renderOvenDoorCanvas) window.renderOvenDoorCanvas('ready', temp, timeSec) }
    function showOvenPanel() { if (!current || current.finished) return; let stp = current.recipe.steps[current.step]; if (!stp || stp[1] !== 'Assar') { $('feedback').textContent = 'O painel do forno é usado na etapa de Assar.'; return } if (three && three.isBaking && three.isBaking()) { $('feedback').textContent = 'O forno está assando! Aguarde o término.'; return } let ov = current.recipe.oven || { temp: 180, time: 12 }; if ($('ovenTargetBadge')) $('ovenTargetBadge').textContent = `${ov.temp} °C • ${ov.time} segundos`; updateOvenModalLEDs(140, 5); $('ovenModal').classList.remove('hidden'); if ($('ledStatusBar')) { $('ledStatusBar').textContent = '● PAINEL DIGITAL PRONTO • AJUSTE AS CONFIGURAÇÕES E ACIONE'; $('ledStatusBar').style.color = '#ff8888' } $('feedback').textContent = 'Forma inserida! Defina a temperatura e o tempo no display digital e acione o forno.'; $('sceneHint').textContent = '🔥 Ajuste o painel digital: ' + ov.temp + '°C / ' + ov.time + ' seg' }
    function closeOvenModal() { $('ovenModal').classList.add('hidden') }
    function fireOven() { if (!current || current.finished) return; let st = current.recipe.steps[current.step]; if (st[1] !== 'Assar') { closeOvenModal(); return } if (three && !three.isFormPlaced()) { $('feedback').textContent = 'Coloque a assadeira com a receita no forno primeiro!'; if ($('ledStatusBar')) { $('ledStatusBar').textContent = '⚠️ COLOQUE A ASSADEIRA NO FORNO ANTES DE ACIONAR'; $('ledStatusBar').style.color = '#ffbb44' } return } let t = currentOvenTemp, m = currentOvenTime, ov = current.recipe.oven || { temp: 180, time: 12 }; if (Math.abs(t - ov.temp) <= 20 && Math.abs(m - ov.time) <= 4) { closeOvenModal(); $('feedback').textContent = `Forno acionado: ${t}°C por ${m} segundos!`; $('sceneHint').textContent = '🔥 Assando a ' + t + '°C...'; if (three && three.startBake) three.startBake(m); else setTimeout(completeStep, 2000) } else { current.score = Math.max(0, current.score - 15); $('score').textContent = `${current.score} pontos`; $('feedback').textContent = `Configuração errada! A receita pede ${ov.temp}°C por ${ov.time} segundos. (-15 pontos)`; if ($('ledStatusBar')) { $('ledStatusBar').textContent = `⚠️ ERRO: META É ${ov.temp}°C POR ${ov.time}s (-15 pts)`; $('ledStatusBar').style.color = '#ff4444' } } }
    $('ovenTemp').oninput = e => updateOvenModalLEDs(Number(e.target.value), currentOvenTime); $('ovenTime').oninput = e => updateOvenModalLEDs(currentOvenTemp, Number(e.target.value)); $('ovenFire').onclick = fireOven; $('ovenCancel').onclick = closeOvenModal; $('ovenModalClose').onclick = closeOvenModal;
    document.querySelectorAll('[data-temp-delta]').forEach(b => b.onclick = () => updateOvenModalLEDs(Math.max(100, Math.min(250, currentOvenTemp + Number(b.dataset.tempDelta))), currentOvenTime));
    document.querySelectorAll('[data-temp-set]').forEach(b => b.onclick = () => updateOvenModalLEDs(Number(b.dataset.tempSet), currentOvenTime));
    document.querySelectorAll('[data-time-delta]').forEach(b => b.onclick = () => updateOvenModalLEDs(currentOvenTemp, Math.max(5, Math.min(40, currentOvenTime + Number(b.dataset.timeDelta)))));
    document.querySelectorAll('[data-time-set]').forEach(b => b.onclick = () => updateOvenModalLEDs(currentOvenTemp, Number(b.dataset.timeSet)));
    const ROLET_SECTORS = [
      { id: 'drink', type: 'prize', name: 'Degustação de Bebida', label: 'DEGUSTAÇÃO', sub: '10% DE DESCONTO', emoji: '🙂', color: '#2a52b8', textCol: '#ffffff' },
      { id: 'miss_1', type: 'miss', name: 'Não foi dessa vez', label: 'NÃO FOI', sub: 'DESSA VEZ', emoji: '🙁', color: '#ba2737', textCol: '#ffffff' },
      { id: 'ticket', type: 'prize', name: 'Golden Ticket Cafeteria', label: '15% OFF', sub: 'GOLDEN TICKET', emoji: '🌟', color: '#166838', textCol: '#ffffff' },
      { id: 'miss_2', type: 'miss', name: 'Não foi dessa vez', label: 'NÃO FOI', sub: 'DESSA VEZ', emoji: '🙁', color: '#db6124', textCol: '#ffffff' },
      { id: 'sweet', type: 'prize', name: 'Mini Doce Artesanal', label: 'MINI DOCE', sub: '8% DE DESCONTO', emoji: '🙂', color: '#5f1969', textCol: '#ffffff' },
      { id: 'miss_3', type: 'miss', name: 'Não foi dessa vez', label: 'NÃO FOI', sub: 'DESSA VEZ', emoji: '🙁', color: '#ebb615', textCol: '#ffffff' },
      { id: 'gift', type: 'prize', name: 'Brinde da Cozinha', label: 'BRINDE', sub: '5% DE DESCONTO', emoji: '🙂', color: '#956ea7', textCol: '#ffffff' },
      { id: 'respin', type: 'respin', name: 'Gire novamente', label: 'Gire', sub: 'novamente', emoji: '🤩', color: '#86b51f', textCol: '#ffffff' }
    ];

    let roletaAngle = 0, isRoletaSpinning = false, audioCtx = null;

    /* Textos diferentes para cada setor de "não foi dessa vez": a roleta deixa de
       parecer travada no mesmo resultado quando o prêmio físico não sai. */
    const MISS_COPY = {
      miss_1: { title: '😅 Quase lá!', status: '😅 <b>QUASE!</b> A roleta parou no setor vizinho ao prêmio. Sua Insígnia Digital foi registrada.', detail: 'Faltou um setor para o prêmio físico. A Insígnia Digital de chef criativo é sua — cada receita libera um novo sorteio.' },
      miss_2: { title: '🎯 Na próxima!', status: '🎯 <b>NA PRÓXIMA!</b> A sorte ficou para a próxima rodada — Insígnia Digital garantida.', detail: 'A roleta parou no meio do caminho. Sua Insígnia Digital de chef criativo foi registrada. Volte depois da próxima receita!' },
      miss_3: { title: '🍋 Insígnia digital', status: '🍋 <b>HOJE NÃO!</b> Sem prêmio físico desta vez — mas a Insígnia Digital é sua!', detail: 'A roleta parou no último setor de descanso. Sua Insígnia Digital de chef criativo foi registrada.' }
    };

    function playPegTick(speed) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let now = audioCtx.currentTime;
        let osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
        osc.type = 'triangle';
        let freq = 460 + Math.min(540, (speed || 5) * 22);
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.024);
        filter.type = 'bandpass'; filter.frequency.setValueAtTime(1200, now); filter.Q.setValueAtTime(3.2, now);
        let vol = Math.min(0.24, 0.06 + (speed || 5) * 0.012);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
        osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + 0.03);
      } catch (e) { }
    }

    function playRoletaJingle(isWin) {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        let now = audioCtx.currentTime;
        let notes = isWin ? [523.25, 659.25, 783.99, 1046.50] : [392.00, 329.63, 261.63];
        notes.forEach((freq, idx) => {
          let osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0, now + idx * 0.09);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.09 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.32);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.09); osc.stop(now + idx * 0.09 + 0.35);
        });
      } catch (e) { }
    }

    /* O overlay da roleta é fixed: precisa ficar fora de ancestrais com backdrop-filter/transform */
    try { document.body.appendChild($('wheelArea')) } catch (e) { }
    function buildRoletaSvg() {
      let svg = $('roletaSvg'); if (!svg) return;
      let cx = 250, cy = 250, r = 232;
      let html = `<defs><filter id="hubShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.45)"/></filter></defs><circle cx="250" cy="250" r="246" fill="#101312"/><circle cx="250" cy="250" r="238" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="2"/>`;
      ROLET_SECTORS.forEach((sec, k) => {
        let a1 = (-112.5 + k * 45) * Math.PI / 180, a2 = (-112.5 + (k + 1) * 45) * Math.PI / 180;
        let x1 = (cx + r * Math.cos(a1)).toFixed(2), y1 = (cy + r * Math.sin(a1)).toFixed(2);
        let x2 = (cx + r * Math.cos(a2)).toFixed(2), y2 = (cy + r * Math.sin(a2)).toFixed(2);
        let path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
        html += `<path d="${path}" fill="${sec.color}" stroke="rgba(255,255,255,.82)" stroke-width="1.15"/>`;
        let midDeg = -90 + k * 45;
        html += `<g transform="rotate(${midDeg + 90}, ${cx}, ${cy})">
      <text x="${cx}" y="74" fill="#ffffff" font-size="20" font-weight="900" text-anchor="middle" font-family="'Outfit',system-ui,sans-serif" letter-spacing=".4">${sec.label}</text>
      <text x="${cx}" y="93" fill="rgba(255,255,255,.88)" font-size="11.5" font-weight="800" text-anchor="middle" font-family="'Outfit',system-ui,sans-serif" letter-spacing="1.1">${sec.sub}</text>
      <circle cx="${cx}" cy="152" r="16" fill="rgba(10,14,11,.18)"/>
      <text x="${cx}" y="158" font-size="18" text-anchor="middle">${sec.emoji}</text>
    </g>`;
      });
      ROLET_SECTORS.forEach((_, m) => {
        let pegAngle = (-112.5 + m * 45) * Math.PI / 180;
        let px1 = (cx + 226 * Math.cos(pegAngle)).toFixed(2), py1 = (cy + 226 * Math.sin(pegAngle)).toFixed(2);
        let px2 = (cx + 236 * Math.cos(pegAngle)).toFixed(2), py2 = (cy + 236 * Math.sin(pegAngle)).toFixed(2);
        html += `<line x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-linecap="round"/>`;
      });
      html += `<circle cx="${cx}" cy="${cy}" r="246" fill="none" stroke="rgba(255,207,107,.5)" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="55" fill="#f6f1e3" stroke="#11150f" stroke-width="2" filter="url(#hubShadow)"/>
    <circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="rgba(17,21,15,.16)" stroke-width="1"/>
    <text x="${cx}" y="246" fill="#141719" font-size="14.5" font-weight="900" text-anchor="middle" font-family="'Outfit',system-ui,sans-serif" letter-spacing="1.8">PRÊMIOS</text>
    <text x="${cx}" y="265" fill="#7c8672" font-size="9.5" font-weight="800" text-anchor="middle" font-family="'Outfit',system-ui,sans-serif" letter-spacing="2.2">LIMONADA</text>`;
      svg.innerHTML = html; setRoletaRotation(roletaAngle);
    }

    function setRoletaRotation(deg) {
      let w = $('roletaDiscWrap'), svg = $('roletaSvg');
      if (w) w.style.transform = `rotate(${deg}deg)`; else if (svg) svg.style.transform = `rotate(${deg}deg)`
    }
    function resetWheelAngle() { roletaAngle = 0; setRoletaRotation(0) }

    function spinWheelPhysics(targetIndex, onComplete) {
      if (isRoletaSpinning) return;
      isRoletaSpinning = true;
      let pArrow = $('wheelPointer');
      let jitter = (random() - .5) * 26;
      let targetAngleNorm = (((-targetIndex * 45 + jitter) % 360) + 360) % 360;
      let curNorm = ((roletaAngle % 360) + 360) % 360;
      let diff = targetAngleNorm - curNorm;
      if (diff < 0) diff += 360;
      let fullSpins = (6 + Math.floor(random() * 2)) * 360;
      let startAngle = roletaAngle;
      let totalSpinDelta = fullSpins + diff;
      let finalTargetAngle = startAngle + totalSpinDelta;
      let duration = 4.8;
      let startTime = performance.now();
      let lastPegSlot = Math.floor((startAngle - 22.5) / 45);
      let pointerDeflection = 0;
      let ua = 0.14, alpha = 3.6;
      let Atot = (ua / 3) + ((1 - ua) / (alpha + 1));
      function easePhysics(u) {
        if (u <= 0) return 0; if (u >= 1) return 1;
        if (u <= ua) return (Math.pow(u, 3) / (3 * ua * ua)) / Atot;
        let w = (1 - u) / (1 - ua);
        return ((ua / 3) + ((1 - ua) / (alpha + 1)) * (1 - Math.pow(w, alpha + 1))) / Atot;
      }
      function anim(now) {
        let elapsed = (now - startTime) / 1000;
        let u = Math.min(1, elapsed / duration);
        let progress = easePhysics(u);
        let curAngle = startAngle + totalSpinDelta * progress;
        if (u >= 1) {
          let bounceT = elapsed - duration;
          if (bounceT < 0.6) {
            let bounce = Math.sin(bounceT * 18) * Math.exp(-bounceT * 7.5) * 2.8;
            curAngle = finalTargetAngle + bounce;
          } else curAngle = finalTargetAngle;
        }
        setRoletaRotation(curAngle);
        let curPegSlot = Math.floor((curAngle - 22.5) / 45);
        if (curPegSlot !== lastPegSlot) {
          lastPegSlot = curPegSlot;
          let instantSpeed = (1 - u) * 25 + 2;
          playPegTick(instantSpeed);
          pointerDeflection = Math.min(22, 6 + instantSpeed * 0.7);
        }
        pointerDeflection *= 0.72;
        if (pArrow) pArrow.style.transform = `rotate(${pointerDeflection.toFixed(1)}deg)`;
        if (elapsed < duration + 0.65) {
          requestAnimationFrame(anim);
        } else {
          roletaAngle = finalTargetAngle;
          setRoletaRotation(roletaAngle);
          if (pArrow) pArrow.style.transform = 'rotate(0deg)';
          isRoletaSpinning = false;
          let frame = document.querySelector('.roleta-frame');
          if (frame) { frame.classList.remove('is-win'); void frame.offsetWidth; frame.classList.add('is-win'); setTimeout(() => frame.classList.remove('is-win'), 1300) }
          if (onComplete) onComplete(targetIndex);
        }
      }
      requestAnimationFrame(anim);
    }

    
/* ==================== SVGS & TEMPLATES DO CARD DE RESULTADO (ARCADE PREMIUM) ==================== */
const TROPHY_HERO_SVG = `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="140" cy="85" r="70" fill="url(#rcHeroGlow)" opacity="0.6"/>
  <defs>
    <radialGradient id="rcHeroGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 85) rotate(90) scale(70)">
      <stop stop-color="#ffd53d" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ffd53d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rcCupGrad" x1="105" y1="20" x2="175" y2="90" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff8b5"/>
      <stop offset="0.25" stop-color="#ffdd44"/>
      <stop offset="0.75" stop-color="#f5a300"/>
      <stop offset="1" stop-color="#cf7500"/>
    </linearGradient>
    <linearGradient id="rcRimGrad" x1="100" y1="18" x2="180" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffce1"/>
      <stop offset="0.5" stop-color="#ffe666"/>
      <stop offset="1" stop-color="#e09000"/>
    </linearGradient>
    <linearGradient id="rcHandleGrad" x1="90" y1="30" x2="105" y2="70" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffe97d"/>
      <stop offset="1" stop-color="#d67e00"/>
    </linearGradient>
    <linearGradient id="rcStarGrad" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#fffbe0"/>
      <stop offset="0.4" stop-color="#ffdc44"/>
      <stop offset="1" stop-color="#e88e00"/>
    </linearGradient>
    <linearGradient id="rcPedGrad" x1="120" y1="95" x2="160" y2="135" gradientUnits="userSpaceOnUse">
      <stop stop-color="#461633"/>
      <stop offset="0.6" stop-color="#2d0b21"/>
      <stop offset="1" stop-color="#190412"/>
    </linearGradient>
    <linearGradient id="rcPlaqueGrad" x1="125" y1="110" x2="155" y2="122" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffeaa0"/>
      <stop offset="1" stop-color="#cf8e18"/>
    </linearGradient>
  </defs>
  <path d="M48 65 Q42 50 56 42 Q70 34 62 20" stroke="#00e5ff" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M228 62 Q238 48 226 38 Q214 28 222 15" stroke="#ff3388" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M78 120 Q68 128 60 118" stroke="#ffcc00" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M210 116 Q220 124 228 114" stroke="#00e676" stroke-width="4" stroke-linecap="round" fill="none"/>
  <rect x="52" y="85" width="7" height="11" rx="2" fill="#ff3388" transform="rotate(28 52 85)"/>
  <rect x="85" y="32" width="6" height="10" rx="1.5" fill="#ffaa00" transform="rotate(-35 85 32)"/>
  <rect x="138" y="10" width="6" height="11" rx="1.5" fill="#00e5ff" transform="rotate(15 138 10)"/>
  <rect x="190" y="28" width="7" height="11" rx="2" fill="#ffdd00" transform="rotate(42 190 28)"/>
  <rect x="230" y="88" width="6" height="10" rx="1.5" fill="#00e5ff" transform="rotate(-22 230 88)"/>
  <rect x="36" y="105" width="8" height="6" rx="1.5" fill="#ffaa00" transform="rotate(20 36 105)"/>
  <rect x="242" y="102" width="7" height="7" rx="2" fill="#ff3388" transform="rotate(-15 242 102)"/>
  <g transform="translate(80, 58) rotate(-12) scale(1.15)">
    <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="url(#rcStarGrad)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))"/>
    <polygon points="0,-16 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="rgba(255,255,255,0.28)"/>
  </g>
  <g transform="translate(200, 62) rotate(14) scale(1.15)">
    <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="url(#rcStarGrad)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))"/>
    <polygon points="0,-16 0,7.2 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14" fill="rgba(255,255,255,0.3)"/>
  </g>
  <g transform="translate(62, 94) rotate(8) scale(0.68)">
    <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="url(#rcStarGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  </g>
  <g transform="translate(225, 45) rotate(-20) scale(0.62)">
    <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="url(#rcStarGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  </g>
  <path d="M110 134 C110 131 114 129 122 129 L158 129 C166 129 170 131 170 134 L173 145 C173 148 167 150 157 150 L123 150 C113 150 107 148 107 145 Z" fill="#1b0312" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.6))"/>
  <path d="M116 102 L164 102 C169 102 171 104 171 108 L169 132 C169 134 167 135 163 135 L117 135 C113 135 111 134 111 132 L109 108 C109 104 111 102 116 102 Z" fill="url(#rcPedGrad)"/>
  <path d="M117 103 L163 103 C166 103 168 104 168 106 L167 110 L113 110 L112 106 C112 104 114 103 117 103 Z" fill="rgba(255,255,255,0.18)"/>
  <rect x="124" y="113" width="32" height="12" rx="2.5" fill="url(#rcPlaqueGrad)" stroke="#683d03" stroke-width="0.8"/>
  <rect x="127" y="115" width="26" height="1.2" fill="rgba(255,255,255,0.7)"/>
  <ellipse cx="140" cy="100" rx="14" ry="4.5" fill="#cf7500"/>
  <path d="M134 85 L146 85 L144 100 L136 100 Z" fill="url(#rcCupGrad)"/>
  <ellipse cx="140" cy="85" rx="11" ry="3.5" fill="#f5a300"/>
  <path d="M109 38 C94 38 90 56 94 68 C98 78 108 81 117 80 L116 73 C109 74 103 72 101 65 C99 57 101 45 110 44 Z" fill="url(#rcHandleGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  <path d="M171 38 C186 38 190 56 186 68 C182 78 172 81 163 80 L164 73 C171 74 177 72 179 65 C181 57 179 45 170 44 Z" fill="url(#rcHandleGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  <path d="M108 26 C108 26 106 62 122 79 C128 85 133 87 140 87 C147 87 152 85 158 79 C174 62 172 26 172 26 Z" fill="url(#rcCupGrad)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"/>
  <ellipse cx="140" cy="26" rx="32" ry="7.5" fill="url(#rcRimGrad)"/>
  <ellipse cx="140" cy="26" rx="27" ry="5.2" fill="#b85f00"/>
  <path d="M112 32 C113 52 123 70 134 77 C130 72 122 55 120 32 Z" fill="rgba(255,255,255,0.42)"/>
  <g transform="translate(140, 52) scale(1.15)">
    <polygon points="0,-13 3.8,-3.8 13,-3.8 5.8,2.2 8.4,11.5 0,6 -8.4,11.5 -5.8,2.2 -13,-3.8 -3.8,-3.8" fill="#ffec70" filter="drop-shadow(0 2px 3px rgba(160, 80, 0, 0.6))"/>
    <polygon points="0,-13 0,6 -8.4,11.5 -5.8,2.2 -13,-3.8 -3.8,-3.8" fill="rgba(255,255,255,0.45)"/>
  </g>
</svg>`;

const CHEF_HERO_SVG = `<svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="140" cy="85" r="75" fill="url(#rcBadgeGlow)" opacity="0.55"/>
  <defs>
    <radialGradient id="rcBadgeGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(140 85) rotate(90) scale(75)">
      <stop stop-color="#4aff91" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#4aff91" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rcMedalRibbon" x1="120" y1="100" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00c853"/>
      <stop offset="1" stop-color="#006930"/>
    </linearGradient>
    <linearGradient id="rcBadgeRim" x1="90" y1="35" x2="190" y2="135" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffe885"/>
      <stop offset="0.4" stop-color="#f5b400"/>
      <stop offset="1" stop-color="#b86b00"/>
    </linearGradient>
    <linearGradient id="rcBadgeInner" x1="100" y1="45" x2="180" y2="125" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0c381c"/>
      <stop offset="1" stop-color="#051a0c"/>
    </linearGradient>
    <linearGradient id="rcHatGrad" x1="120" y1="45" x2="160" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff"/>
      <stop offset="0.8" stop-color="#e8f5e9"/>
      <stop offset="1" stop-color="#c8e6c9"/>
    </linearGradient>
  </defs>
  <path d="M124 100 L110 155 L130 145 L140 152 L132 100 Z" fill="url(#rcMedalRibbon)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
  <path d="M156 100 L170 155 L150 145 L140 152 L148 100 Z" fill="#005024" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
  <path d="M52 55 Q42 42 58 35" stroke="#ffdd00" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M225 50 Q235 40 220 30" stroke="#00e5ff" stroke-width="4" stroke-linecap="round" fill="none"/>
  <rect x="58" y="75" width="7" height="10" rx="1.5" fill="#00e676" transform="rotate(25 58 75)"/>
  <rect x="222" y="78" width="6" height="10" rx="1.5" fill="#ff4081" transform="rotate(-30 222 78)"/>
  <rect x="80" y="28" width="7" height="7" rx="1.5" fill="#ffd600" transform="rotate(15 80 28)"/>
  <rect x="198" y="24" width="7" height="7" rx="1.5" fill="#00e5ff" transform="rotate(-20 198 24)"/>
  <g transform="translate(82, 60) rotate(-15) scale(0.95)">
    <polygon points="0,-14 4,-4 14,-4 6,2.5 9,12 0,6 -9,12 -6,2.5 -14,-4 -4,-4" fill="#ffd438" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  </g>
  <g transform="translate(198, 62) rotate(15) scale(0.95)">
    <polygon points="0,-14 4,-4 14,-4 6,2.5 9,12 0,6 -9,12 -6,2.5 -14,-4 -4,-4" fill="#ffd438" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"/>
  </g>
  <circle cx="140" cy="85" r="48" fill="url(#rcBadgeRim)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.55))"/>
  <circle cx="140" cy="85" r="44" fill="#693b00"/>
  <circle cx="140" cy="85" r="41" fill="url(#rcBadgeInner)"/>
  <circle cx="140" cy="85" r="41" fill="none" stroke="rgba(255,215,0,0.4)" stroke-width="1.5" stroke-dasharray="4 2.5"/>
  <g transform="translate(140, 83) scale(0.85)">
    <ellipse cx="0" cy="-12" rx="15" ry="14" fill="url(#rcHatGrad)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
    <ellipse cx="-16" cy="-4" rx="12" ry="12" fill="url(#rcHatGrad)"/>
    <ellipse cx="16" cy="-4" rx="12" ry="12" fill="url(#rcHatGrad)"/>
    <rect x="-18" y="7" width="36" height="11" rx="3.5" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
    <rect x="-18" y="11" width="36" height="3" fill="#ffd600"/>
    <polygon points="0,0 2,4 6,4 3,7 4,11 0,8.5 -4,11 -3,7 -6,4 -2,4" fill="#ffd600"/>
  </g>
</svg>`;

const GIFT_ICON_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rcBoxFront" x1="24" y1="44" x2="68" y2="88" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff3355"/>
      <stop offset="1" stop-color="#b80028"/>
    </linearGradient>
    <linearGradient id="rcBoxSide" x1="60" y1="44" x2="88" y2="76" gradientUnits="userSpaceOnUse">
      <stop stop-color="#b80028"/>
      <stop offset="1" stop-color="#6e0016"/>
    </linearGradient>
    <linearGradient id="rcBoxLidTop" x1="20" y1="30" x2="80" y2="46" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff5577"/>
      <stop offset="1" stop-color="#d60a36"/>
    </linearGradient>
    <linearGradient id="rcRibbonY" x1="40" y1="20" x2="65" y2="80" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff07a"/>
      <stop offset="0.5" stop-color="#ffcc00"/>
      <stop offset="1" stop-color="#e08800"/>
    </linearGradient>
  </defs>
  <ellipse cx="18" cy="46" rx="4" ry="2" fill="#ff77a8" transform="rotate(-25 18 46)"/>
  <ellipse cx="28" cy="28" rx="3.5" ry="1.8" fill="#ffd43f" transform="rotate(35 28 28)"/>
  <ellipse cx="82" cy="44" rx="4.5" ry="2.2" fill="#ffd43f" transform="rotate(-30 82 44)"/>
  <ellipse cx="78" cy="30" rx="3.8" ry="1.8" fill="#ff77a8" transform="rotate(20 78 30)"/>
  <ellipse cx="88" cy="56" rx="3.5" ry="1.8" fill="#ff3b69" transform="rotate(45 88 56)"/>
  <ellipse cx="50" cy="88" rx="32" ry="8" fill="rgba(0,0,0,0.45)"/>
  <polygon points="22,50 50,64 50,86 22,72" fill="url(#rcBoxFront)"/>
  <polygon points="50,64 78,50 78,72 50,86" fill="url(#rcBoxSide)"/>
  <polygon points="33,55.5 39,58.5 39,80.5 33,77.5" fill="url(#rcRibbonY)"/>
  <polygon points="61,58.5 67,55.5 67,77.5 61,80.5" fill="#cca000"/>
  <polygon points="18,44 48,58 48,65 18,51" fill="#e6103c"/>
  <polygon points="48,58 78,44 78,51 48,65" fill="#990522"/>
  <polygon points="18,44 48,30 78,44 48,58" fill="url(#rcBoxLidTop)"/>
  <polygon points="31,38 37,35 65,49 59,52" fill="url(#rcRibbonY)"/>
  <polygon points="45,31 51,34 51,57 45,54" fill="url(#rcRibbonY)"/>
  <path d="M46 32 C34 22 28 30 38 36 C44 39 47 34 47 32 Z" fill="#ffd533" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
  <path d="M44 32 C36 26 33 30 40 34 Z" fill="#b38600"/>
  <path d="M50 32 C62 22 68 30 58 36 C52 39 49 34 49 32 Z" fill="#ffea55" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
  <path d="M52 32 C60 26 63 30 56 34 Z" fill="#cca000"/>
  <ellipse cx="48" cy="33" rx="5" ry="4" fill="#fff07a" stroke="#cca000" stroke-width="0.8"/>
  <path d="M46 35 Q40 42 38 48 Q42 46 45 40 Z" fill="#ffc800"/>
  <path d="M50 35 Q56 42 58 48 Q54 46 51 40 Z" fill="#e6a800"/>
</svg>`;

const TICKET_ICON_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rcTicketGold" x1="15" y1="20" x2="85" y2="80" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff4b0"/>
      <stop offset="0.3" stop-color="#ffd54f"/>
      <stop offset="0.7" stop-color="#ffb300"/>
      <stop offset="1" stop-color="#d47a00"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="86" rx="30" ry="7" fill="rgba(0,0,0,0.45)"/>
  <polygon points="85,32 87,27 92,28 88,31 89,36 85,33 81,35 83,30 79,28 84,28" fill="#ffe082"/>
  <polygon points="18,65 20,60 25,61 21,64 22,69 18,66 14,68 16,63 12,61 17,61" fill="#ffe082"/>
  <g transform="translate(50, 48) rotate(-12) translate(-50, -48)">
    <rect x="18" y="28" width="64" height="40" rx="6" fill="url(#rcTicketGold)" stroke="#663c00" stroke-width="1.2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))"/>
    <rect x="22" y="32" width="56" height="32" rx="4" fill="none" stroke="rgba(102,60,0,0.4)" stroke-width="1" stroke-dasharray="3 2"/>
    <circle cx="18" cy="48" r="4.5" fill="#091d11"/>
    <circle cx="82" cy="48" r="4.5" fill="#091d11"/>
    <path d="M42 41 L54 41 C55 41 56 42 56 44 L55 53 C55 55 53 56 51 56 L45 56 C43 56 41 55 41 53 L40 44 C40 42 41 41 42 41 Z" fill="#5c3800"/>
    <path d="M55 44 C58 44 59 46 59 48 C59 50 58 52 55 52" stroke="#5c3800" stroke-width="1.6" fill="none"/>
    <path d="M44 37 Q46 34 44 32" stroke="#8a5300" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <path d="M48 37 Q50 34 48 32" stroke="#8a5300" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    <path d="M38 58 L58 58" stroke="#5c3800" stroke-width="1.5" stroke-linecap="round"/>
    <text x="31" y="52" font-size="9" fill="#7a4b00" font-weight="900">★</text>
    <text x="63" y="52" font-size="9" fill="#7a4b00" font-weight="900">★</text>
  </g>
</svg>`;

const SWEET_ICON_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rcCreamGrad" x1="30" y1="20" x2="70" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff5f8"/>
      <stop offset="0.5" stop-color="#ffb6d0"/>
      <stop offset="1" stop-color="#f06292"/>
    </linearGradient>
    <linearGradient id="rcCupcakeGrad" x1="30" y1="55" x2="70" y2="85" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6d4c41"/>
      <stop offset="1" stop-color="#3e2723"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.45)"/>
  <circle cx="20" cy="38" r="2.5" fill="#ff4081"/>
  <circle cx="80" cy="35" r="2" fill="#ffd600"/>
  <circle cx="84" cy="55" r="2.5" fill="#00e5ff"/>
  <circle cx="16" cy="58" r="2" fill="#ffd600"/>
  <polygon points="30,58 70,58 63,85 37,85" fill="url(#rcCupcakeGrad)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"/>
  <line x1="38" y1="58" x2="42" y2="85" stroke="#2b1712" stroke-width="1.2"/>
  <line x1="46" y1="58" x2="48" y2="85" stroke="#2b1712" stroke-width="1.2"/>
  <line x1="54" y1="58" x2="52" y2="85" stroke="#2b1712" stroke-width="1.2"/>
  <line x1="62" y1="58" x2="58" y2="85" stroke="#2b1712" stroke-width="1.2"/>
  <path d="M26 60 C25 54 34 50 42 50 C48 50 56 46 56 42 C56 36 64 36 64 42 C64 48 72 50 74 56 C76 62 68 64 50 64 C32 64 27 64 26 60 Z" fill="url(#rcCreamGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
  <ellipse cx="50" cy="46" rx="18" ry="11" fill="#ff80ab"/>
  <ellipse cx="50" cy="38" rx="12" ry="8" fill="#ffb6d0"/>
  <circle cx="50" cy="30" rx="7" ry="6" fill="#fff0f5"/>
  <circle cx="50" cy="24" r="7.5" fill="#d50000" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"/>
  <circle cx="48" cy="22" r="2" fill="#ff8a80"/>
  <path d="M52 20 Q58 12 64 14" stroke="#4e342e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <rect x="36" y="52" width="4" height="2" rx="1" fill="#ffd600" transform="rotate(25 36 52)"/>
  <rect x="58" y="50" width="4" height="2" rx="1" fill="#00e5ff" transform="rotate(-30 58 50)"/>
  <rect x="46" y="44" width="4" height="2" rx="1" fill="#76ff03" transform="rotate(15 46 44)"/>
  <rect x="42" y="36" width="3.5" height="1.8" rx="0.9" fill="#ffd600" transform="rotate(-20 42 36)"/>
</svg>`;

const DRINK_ICON_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rcGlassLiquid" x1="30" y1="35" x2="70" y2="85" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff59d"/>
      <stop offset="0.5" stop-color="#ffee58"/>
      <stop offset="1" stop-color="#fdd835"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="88" rx="24" ry="6" fill="rgba(0,0,0,0.45)"/>
  <circle cx="22" cy="45" r="2" fill="#00e5ff"/>
  <circle cx="78" cy="40" r="2.5" fill="#fff59d"/>
  <circle cx="82" cy="62" r="1.8" fill="#00e5ff"/>
  <polygon points="32,32 68,32 63,84 37,84" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.7)" stroke-width="1.8" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))"/>
  <polygon points="34,42 66,42 62,82 38,82" fill="url(#rcGlassLiquid)"/>
  <rect x="40" y="48" width="12" height="12" rx="2.5" fill="rgba(255,255,255,0.65)" stroke="#fff" stroke-width="0.8" transform="rotate(12 40 48)"/>
  <rect x="48" y="60" width="11" height="11" rx="2.5" fill="rgba(255,255,255,0.55)" stroke="#fff" stroke-width="0.8" transform="rotate(-15 48 60)"/>
  <path d="M52 50 L64 16 L72 14" stroke="#ff4081" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M53 47 L63 18" stroke="#ffffff" stroke-width="1" stroke-linecap="round" fill="none"/>
  <g transform="translate(32, 32) scale(0.9)">
    <circle cx="0" cy="0" r="14" fill="#fbc02d" stroke="#f57f17" stroke-width="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    <circle cx="0" cy="0" r="11" fill="#fff9c4"/>
    <circle cx="0" cy="0" r="10" fill="#fff59d"/>
    <path d="M0 0 L-6 -8 A 10 10 0 0 1 6 -8 Z" fill="#ffee58"/>
    <path d="M0 0 L8 -6 A 10 10 0 0 1 8 6 Z" fill="#ffee58"/>
    <path d="M0 0 L-8 -6 A 10 10 0 0 0 -8 6 Z" fill="#ffee58"/>
    <path d="M0 0 L-6 8 A 10 10 0 0 0 6 8 Z" fill="#ffee58"/>
    <circle cx="0" cy="0" r="2.5" fill="#fff9c4"/>
  </g>
  <path d="M64 30 C72 26 76 18 76 18 C76 18 68 22 64 30 Z" fill="#4caf50"/>
</svg>`;

const DIGITAL_ICON_SVG = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rcBadgeGold" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffea78"/>
      <stop offset="0.5" stop-color="#ffb300"/>
      <stop offset="1" stop-color="#b86200"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,0.45)"/>
  <circle cx="20" cy="30" r="2.5" fill="#ffd600"/>
  <circle cx="80" cy="26" r="2" fill="#00e5ff"/>
  <circle cx="84" cy="54" r="2.5" fill="#00e676"/>
  <polygon points="40,55 30,88 45,80 50,84 45,55" fill="#00c853"/>
  <polygon points="60,55 70,88 55,80 50,84 55,55" fill="#007e33"/>
  <circle cx="50" cy="48" r="32" fill="url(#rcBadgeGold)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))"/>
  <circle cx="50" cy="48" r="27" fill="#0d3518"/>
  <circle cx="50" cy="48" r="27" fill="none" stroke="#ffd54f" stroke-width="1.2" stroke-dasharray="3 2"/>
  <g transform="translate(50, 46) scale(0.68)">
    <ellipse cx="0" cy="-8" rx="14" ry="13" fill="#ffffff" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
    <ellipse cx="-14" cy="-2" rx="10" ry="10" fill="#ffffff"/>
    <ellipse cx="14" cy="-2" rx="10" ry="10" fill="#ffffff"/>
    <rect x="-16" y="8" width="32" height="10" rx="3" fill="#f5f5f5"/>
    <rect x="-16" y="11" width="32" height="3" fill="#ffd600"/>
    <polygon points="0,0 2,4 6,4 3,7 4,11 0,8.5 -4,11 -3,7 -6,4 -2,4" fill="#ffd600"/>
  </g>
</svg>`;

function renderResultCard(data) {
  let heroEl = $('endHero');
  let titleEl = $('endTitle');
  let descEl = $('endDesc');
  let scoreEl = $('endScore');
  let awardBox = $('award');
  let iconEl = $('awardIcon');
  let awardTitle = $('awardTitle');
  let awardDetail = $('awardDetail');
  let awardCode = $('awardCode');

  if (scoreEl) scoreEl.textContent = `${data.score} pontos`;

  if (data.isWinner && data.prizeId) {
    if (heroEl) heroEl.innerHTML = TROPHY_HERO_SVG;
    if (titleEl) titleEl.textContent = 'Parabéns!';
    if (descEl) descEl.textContent = 'Você liberou a roleta de prêmios da bancada!';
    if (awardBox) awardBox.classList.remove('hidden');
    if (iconEl) {
      if (data.prizeId === 'gift') iconEl.innerHTML = GIFT_ICON_SVG;
      else if (data.prizeId === 'ticket') iconEl.innerHTML = TICKET_ICON_SVG;
      else if (data.prizeId === 'sweet') iconEl.innerHTML = SWEET_ICON_SVG;
      else if (data.prizeId === 'drink') iconEl.innerHTML = DRINK_ICON_SVG;
      else iconEl.innerHTML = GIFT_ICON_SVG;
    }
    if (awardTitle) awardTitle.textContent = data.prizeName || 'Prêmio Conquistado';
    if (awardDetail) awardDetail.textContent = data.detail || 'Peça ao monitor para confirmar a entrega do seu prêmio.';
    if (awardCode) awardCode.textContent = data.code || '';
  } else if (!data.isTimeout && data.prizeId === 'digital') {
    if (heroEl) heroEl.innerHTML = CHEF_HERO_SVG;
    let cleanTitle = data.missCopy?.title ? data.missCopy.title.replace(/^[^a-zA-ZÀ-ÿ0-9!]+/, '').trim() : 'Quase lá!';
    if (titleEl) titleEl.textContent = cleanTitle || 'Quase lá!';
    if (descEl) descEl.textContent = 'Você completou a receita e garantiu sua Insígnia Digital!';
    if (awardBox) awardBox.classList.remove('hidden');
    if (iconEl) iconEl.innerHTML = DIGITAL_ICON_SVG;
    if (awardTitle) awardTitle.textContent = 'Insígnia Digital de Chef';
    if (awardDetail) awardDetail.textContent = data.detail || 'A sorte ficou para a próxima rodada — sua Insígnia Digital está garantida.';
    if (awardCode) awardCode.textContent = data.code || `Código LQ-${fmt(db.day)}-${String(data.gameId).padStart(5, '0')}-DIGITAL`;
  } else if (data.isTimeout) {
    if (heroEl) heroEl.innerHTML = CHEF_HERO_SVG;
    if (titleEl) titleEl.textContent = data.won ? 'Receita Concluída!' : 'Tempo Esgotado!';
    if (descEl) descEl.textContent = data.won
      ? `Receita concluída, mas a roleta libera a partir de ${data.meta} pontos.`
      : `Você fez ${data.score} pontos. A roleta da bancada libera a partir de ${data.meta} pontos.`;
    if (awardBox) awardBox.classList.remove('hidden');
    if (iconEl) iconEl.innerHTML = DIGITAL_ICON_SVG;
    if (awardTitle) awardTitle.textContent = 'Passaporte de Aprendiz';
    if (awardDetail) awardDetail.textContent = 'Treine mais uma receita na bancada para tentar girar a roleta de prêmios!';
    if (awardCode) awardCode.textContent = `Código LQ-${fmt(db.day)}-${String(data.gameId).padStart(5, '0')}-TREINO`;
  } else {
    if (heroEl) heroEl.innerHTML = TROPHY_HERO_SVG;
    if (titleEl) titleEl.textContent = 'Parabéns!';
    if (descEl) descEl.textContent = 'Você liberou a roleta de prêmios da bancada!';
    if (awardBox) awardBox.classList.add('hidden');
  }
}

    function finish(won) {
      if (!current || current.finished) return;
      current.finished = true; clearInterval(timerId); sceneHooks = null;
      if (three && three.reset) three.reset();
      let id = db.nextId++,
        game = { id, day: db.day, time: new Date().toISOString(), recipe: current.recipe.name, score: current.score, seconds: db.settings.seconds - current.remaining, completed: won, prize: null, sessionId: null, status: won ? 'aguardando_roleta' : 'sem_premio' };
      db.games.push(game); current.gameId = id;
      let meta = Math.max(0, Number(db.settings.wheelScore) || 0), unlock = current.score >= meta;
      if (!unlock) game.status = 'sem_premio'; else game.status = 'aguardando_roleta';
      save();
      $('game').classList.add('hidden');
      $('end').classList.remove('hidden');
      $('award').classList.add('hidden');
      $('wheelArea').classList.toggle('hidden', !unlock);
      $('spinBtn').disabled = false;
      $('spinBtn').textContent = '🎰 GIRAR A ROLETA';
      if ($('wheelStatusMsg')) $('wheelStatusMsg').textContent = 'Pontuação suficiente! Gire a roleta de prêmios da bancada.';
      buildRoletaSvg();
      resetWheelAngle();
      $('endTitle').textContent = won ? 'Receita concluída!' : 'Tempo esgotado!';
      $('endDesc').textContent = !unlock ? (won ? `Receita concluída, mas a roleta libera a partir de ${meta} pontos (faltaram ${meta - current.score}).` : `Você fez ${current.score} pontos. A roleta libera a partir de ${meta} pontos.`) : (won ? 'Você liberou a roleta de prêmios da bancada!' : 'Sua pontuação liberou a roleta de prêmios!');
      $('endHero').textContent = won ? '🏆' : '🧑‍🍳';
      $('endScore').textContent = `${current.score} pontos`;
      renderAll();
    }

    function chance(score) { if (score < 250) return .08; if (score < 500) return .15; if (score < 750) return .25; if (score < 900) return .35; return .45 }
    function random() { let a = new Uint32Array(1); if (window.crypto && crypto.getRandomValues) { crypto.getRandomValues(a); return a[0] / 4294967296 } return Math.random() }
    function weighted(list) { let sum = list.reduce((s, p) => s + p.weight, 0), r = random() * sum; return list.find(p => (r -= p.weight) < 0) || list[list.length - 1] }

    /* Sorteio puro (sem tocar no DOM): decide prêmio, sessão, setor e respin.
       Fica separado da animação para poder ser testado e auditado. */
    function wheelPick() {
      let pool = availablePrizes();
      let physical = pool.length > 0 && dailyPhysical() < db.settings.dailyCap && random() < chance(current.score);
      let prize = physical ? weighted(pool) : null, session = null;
      if (prize?.id === 'ticket') { session = freeSessions()[0]; if (!session) prize = null }
      let targetIndex;
      if (prize) targetIndex = prize.id === 'ticket' ? 2 : prize.id === 'sweet' ? 4 : prize.id === 'drink' ? 0 : 6;
      else if (!current.hadRespin && random() < 0.22) targetIndex = 7;
      else targetIndex = [1, 3, 5][Math.floor(random() * 3)];
      return { prize, session, targetIndex, isRespin: targetIndex === 7, sector: ROLET_SECTORS[targetIndex].id };
    }

    function spin() {
      if (!current || !current.finished) return;
      let game = db.games.find(g => g.id === current.gameId);
      if (!game || game.status !== 'aguardando_roleta') return;
      if (isRoletaSpinning) return;
      $('spinBtn').disabled = true;
      let cap = db.settings.dailyCap, today = dailyPhysical();
      if ($('wheelStatusMsg')) $('wheelStatusMsg').textContent = today >= cap ? 'Limite diário de prêmios físicos atingido — hoje a roleta entrega a Insígnia Digital.' : availablePrizes().length ? 'Girando a roleta... boa sorte! 🍀' : 'Estoque de prêmios físicos esgotado — hoje a roleta entrega a Insígnia Digital.';
      let pick = wheelPick();
      let prize = pick.prize, session = pick.session, targetIndex = pick.targetIndex, isRespin = pick.isRespin;
      if (isRespin) current.hadRespin = true;
      let missCopy = prize ? null : (MISS_COPY[pick.sector] || MISS_COPY.miss_2);
      spinWheelPhysics(targetIndex, (idx) => {
        if (isRespin) {
          if ($('wheelStatusMsg')) $('wheelStatusMsg').innerHTML = '🤩 <b>GIRE NOVAMENTE!</b> Você ganhou um giro extra na roleta — o resultado será sorteado de novo!';
          $('spinBtn').disabled = false;
          $('spinBtn').textContent = '🎰 GIRAR NOVAMENTE!';
          playRoletaJingle(true);
          return;
        }
        if (prize) {
          game.prize = prize.id; game.sessionId = session?.id || null; game.status = 'reservado';
          audit('premio_reservado', `Partida ${game.id}: ${prize.name} (setor ${pick.sector})`);
          playRoletaJingle(true);
          if ($('wheelStatusMsg')) $('wheelStatusMsg').innerHTML = `🎉 <b>PARABÉNS!</b> Você conquistou: <b>${prize.name}</b>!`;
        } else {
          game.status = 'digital'; game.missSector = pick.sector;
          audit('roleta_digital', `Partida ${game.id}: setor ${pick.sector}`);
          playRoletaJingle(false);
          if ($('wheelStatusMsg')) $('wheelStatusMsg').innerHTML = missCopy.status;
        }
        save();
        setTimeout(() => {
          $('wheelArea').classList.add('hidden');
          let codeStr = prize 
            ? `Código LQ-${fmt(db.day)}-${String(game.id).padStart(5, '0')}-${prize.id.toUpperCase()}`
            : `Código LQ-${fmt(db.day)}-${String(game.id).padStart(5, '0')}-DIGITAL`;
          let detailStr = prize?.id === 'ticket'
            ? `Dia ${session.day}, às ${session.time}. Duração: ${session.duration} minutos. Apresente este código ao monitor.`
            : prize
            ? 'Peça ao monitor para confirmar a entrega do seu prêmio.'
            : (missCopy?.detail || 'A sorte ficou para a próxima rodada — sua Insígnia Digital está garantida.');
          renderResultCard({
            isWinner: !!prize,
            isTimeout: false,
            prizeId: prize ? prize.id : 'digital',
            prizeName: prize ? prize.name : 'Insígnia Digital de Chef',
            detail: detailStr,
            code: codeStr,
            score: current.score,
            meta: Number(db.settings.wheelScore) || 500,
            gameId: game.id,
            missSector: pick.sector,
            missCopy: missCopy
          });
          renderAll();
        }, 2400);
      });
    }
    $('spinBtn').onclick = spin; $('nextBtn').onclick = () => { if (current) { let g = db.games.find(x => x.id === current.gameId); if (g?.status === 'aguardando_roleta') { alert('Gire a roleta antes de iniciar outra partida.'); return } } current = null; $('end').classList.add('hidden'); $('intro').classList.remove('hidden'); renderAll() };
    function renderAll() { buildRoletaSvg(); $('currentDay').value = db.day; $('durationSetting').value = db.settings.seconds; $('dailyCap').value = db.settings.dailyCap; $('wheelScore').value = db.settings.wheelScore; let f = $('dayFilter'); if (f.options.length < 22) for (let i = 1; i <= 21; i++)f.add(new Option(`Dia ${i}`, String(i))); renderStats(); renderPrizes(); renderSessions(); renderHistory() } function renderStats() { let filter = $('dayFilter').value, items = db.games.filter(g => filter === 'all' || g.day === Number(filter)), physical = items.filter(g => g.prize), delivered = items.filter(g => g.status === 'entregue'); $('stats').innerHTML = [['Partidas', items.length], ['Receitas concluídas', items.filter(g => g.completed).length], ['Prêmios físicos', physical.length], ['Prêmios entregues', delivered.length]].map(([a, b]) => `<div class="stat"><b>${b}</b><span>${a}</span></div>`).join(''); $('stockSummary').innerHTML = db.prizes.map(p => `<p><b>${p.name}</b> — saldo total: ${Math.max(0, p.qty - db.games.filter(g => g.prize === p.id && g.status !== 'cancelado').length)} • disponível hoje: ${available(p)}</p>`).join(''); $('latest').innerHTML = tableGames(items.slice(-6).reverse()) } function tableGames(arr) { return `<table><thead><tr><th>Código</th><th>Dia</th><th>Receita</th><th>Pontos</th><th>Prêmio</th><th>Status</th><th>Ação</th></tr></thead><tbody>${arr.map(g => `<tr><td>LQ-${fmt(g.day)}-${String(g.id).padStart(5, '0')}</td><td>${g.day}</td><td>${g.recipe}</td><td>${g.score}</td><td>${db.prizes.find(p => p.id === g.prize)?.name || 'Digital / nenhum'}</td><td>${g.status}</td><td>${g.status === 'reservado' ? `<button class="btn" data-deliver="${g.id}">Entregar</button> <button class="btn" data-cancel="${g.id}">Cancelar</button>` : '—'}</td></tr>`).join('')}</tbody></table>` } function renderHistory() { $('historyTable').innerHTML = tableGames([...db.games].reverse()); document.querySelectorAll('[data-deliver]').forEach(e => e.onclick = () => { let g = db.games.find(x => x.id === Number(e.dataset.deliver)); if (g && g.status === 'reservado') { g.status = 'entregue'; audit('entrega', `Partida ${g.id}`); save(); renderAll() } }); document.querySelectorAll('[data-cancel]').forEach(e => e.onclick = () => { let g = db.games.find(x => x.id === Number(e.dataset.cancel)); if (g && g.status === 'reservado' && confirm('Cancelar reserva e devolver a disponibilidade ao estoque?')) { g.status = 'cancelado'; audit('cancelamento', `Partida ${g.id}`); save(); renderAll() } }) } function renderPrizes() { $('prizeTable').innerHTML = `<table><thead><tr><th>Prêmio</th><th>Estoque total</th><th>Limite/dia</th><th>Disponível hoje</th><th>Ajustar limite</th></tr></thead><tbody>${db.prizes.map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${p.perDay}</td><td>${available(p)}</td><td><input type="number" min="0" value="${p.perDay}" style="max-width:85px" data-limit="${p.id}"></td></tr>`).join('')}</tbody></table>`; $('prizeSelect').innerHTML = db.prizes.map(p => `<option value="${p.id}">${p.name}</option>`).join(''); document.querySelectorAll('[data-limit]').forEach(e => e.onchange = () => { let p = db.prizes.find(x => x.id === e.dataset.limit); p.perDay = Math.max(0, Number(e.value) || 0); audit('limite', `${p.id} = ${p.perDay}`); save(); renderAll() }) } function renderSessions() { $('sessionTable').innerHTML = `<table><thead><tr><th>Dia</th><th>Hora</th><th>Duração</th><th>Vagas</th><th>Ocupadas</th><th>Ação</th></tr></thead><tbody>${db.sessions.slice().sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)).map(s => { let used = db.games.filter(g => g.sessionId === s.id && g.status !== 'cancelado').length; return `<tr><td>${s.day}</td><td>${s.time}</td><td>${s.duration} min</td><td>${s.capacity}</td><td>${used}</td><td><button class="btn" data-remove-session="${s.id}" ${used ? 'disabled' : ''}>Excluir</button></td></tr>` }).join('')}</tbody></table>`; document.querySelectorAll('[data-remove-session]').forEach(e => e.onclick = () => { if (confirm('Excluir sessão sem reservas?')) { db.sessions = db.sessions.filter(s => s.id !== e.dataset.removeSession); save(); renderAll() } }) } $('restockBtn').onclick = () => { let p = db.prizes.find(x => x.id === $('prizeSelect').value), n = Number($('addStock').value); if (!Number.isInteger(n) || n <= 0) return alert('Informe uma quantidade positiva.'); p.qty += n; audit('reposicao', `${p.id} +${n}`); save(); renderAll() }; $('addSessionBtn').onclick = () => { let day = Number($('sessionDay').value), time = $('sessionTime').value, capacity = Number($('sessionSeats').value), duration = Number($('sessionDuration').value); if (!Number.isInteger(day) || day < 1 || day > 21 || !time || capacity < 1 || duration < 10) return alert('Verifique os dados da sessão.'); if (db.sessions.some(s => s.day === day && s.time === time)) return alert('Já existe uma sessão nesse dia e horário.'); db.sessions.push({ id: 'S' + Date.now() + '-' + Math.floor(random() * 100000), day, time, capacity, duration }); audit('sessao', `Dia ${day} ${time} ${capacity} vagas`); save(); renderAll() }; $('currentDay').onchange = e => { let d = Number(e.target.value); if (d >= 1 && d <= 21) { db.day = d; audit('dia', `Alterado para ${d}`); save(); renderAll() } }; $('dayFilter').onchange = renderStats; $('saveSettings').onclick = () => { let seconds = Number($('durationSetting').value), cap = Number($('dailyCap').value), meta = Number($('wheelScore').value); if (seconds < 30 || seconds > 600 || cap < 0 || meta < 0 || meta > 1000) return alert('Valores inválidos.'); db.settings = { seconds, dailyCap: cap, wheelScore: meta }; audit('configuracoes', JSON.stringify(db.settings)); save(); renderAll(); alert('Configurações salvas.') }; function download(name, content, type) { let a = document.createElement('a'), url = URL.createObjectURL(new Blob([content], { type })); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) } $('exportJson').onclick = () => download('limonada-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(db, null, 2), 'application/json'); $('exportCsv').onclick = () => { let rows = [['codigo', 'dia', 'data_hora', 'receita', 'pontos', 'concluida', 'premio', 'sessao', 'status'], ...db.games.map(g => [g.id, g.day, g.time, g.recipe, g.score, g.completed, g.prize || '', g.sessionId || '', g.status])]; download('limonada-partidas.csv', '\ufeff' + rows.map(r => r.map(x => '"' + String(x).replaceAll('"', '""') + '"').join(';')).join('\r\n'), 'text/csv;charset=utf-8') }; $('importBtn').onclick = () => $('importFile').click(); $('importFile').onchange = async e => { let file = e.target.files[0]; if (!file) return; try { let obj = JSON.parse(await file.text()); if (!obj.games || !obj.prizes || !obj.sessions || !obj.settings) throw Error('Formato inválido'); if (confirm('Substituir todos os dados locais pelo backup selecionado?')) { db = obj; save(); renderAll(); alert('Backup importado.') } } catch (err) { alert('Falha na importação: ' + err.message) } e.target.value = '' }; $('resetBtn').onclick = () => { if (prompt('Digite APAGAR para eliminar os dados:') === 'APAGAR') { db = fresh(); save(); renderAll() } };
    // Visualização: usa Three.js quando a biblioteca estiver acessível; a lógica do jogo é independente do 3D.
    // Cena aprimorada: materiais PBR, reflexos de ambiente, texturas procedurais, sombras suaves,
    // vapor sobre a tigela e objetos arrastáveis (ingredientes, faca e colher) via raycasting.
    function init3D() {
      if (typeof THREE === 'undefined') { fallback(); return }
      try {
        let root = $('threeRoot');
        const mobileQuality = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;

        /* ---------- Pré-validação silenciosa de WebGL para evitar spam de erros do Three.js ---------- */
        function probeWebGLContext() {
          if (typeof window === 'undefined' || !window.WebGLRenderingContext) return null;
          try {
            const canvas = document.createElement('canvas');
            const opts = { antialias: !mobileQuality, alpha: false, powerPreference: mobileQuality ? 'low-power' : 'default', failIfMajorPerformanceCaveat: false };
            const gl = canvas.getContext('webgl2', opts) ||
                       canvas.getContext('webgl', opts) ||
                       canvas.getContext('experimental-webgl', opts);
            if (!gl) return null;
            return { canvas, gl };
          } catch (e) {
            return null;
          }
        }

        const probe = probeWebGLContext();
        if (!probe) {
          fallback('webgl');
          return;
        }

        let renderer = null;
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: probe.canvas,
            context: probe.gl,
            antialias: !mobileQuality,
            alpha: false,
            powerPreference: 'default'
          });
        } catch (err) {
          try {
            renderer = new THREE.WebGLRenderer({ canvas: probe.canvas, context: probe.gl, antialias: false, alpha: false });
          } catch (e2) {
            renderer = null;
          }
        }

        if (!renderer || !renderer.getContext()) {
          fallback('webgl');
          return;
        }

        let glLost = false;
        renderer.domElement.addEventListener('webglcontextlost', e => {
          e.preventDefault();
          glLost = true;
          setTimeout(() => {
            if (glLost) {
              try {
                renderer.dispose();
                root.removeChild(renderer.domElement);
                renderer.setSize(root.clientWidth || 960, root.clientHeight || 560);
                root.appendChild(renderer.domElement);
                glLost = false;
              } catch (e) { fallback('lost') }
            }
          }, 2000)
        }, false);
        renderer.domElement.addEventListener('webglcontextrestored', () => {
          glLost = false;
          $('threeRoot').style.display = '';
          $('fallback').style.display = 'none';
          $('engine').textContent = 'Cozinha 3D • Three.js • arraste os itens';
          requestAnimationFrame(frame)
        }, false);
        renderer.setSize(root.clientWidth || 960, root.clientHeight || 560);
        renderer.setPixelRatio(Math.min(devicePixelRatio, mobileQuality ? 1 : 1.75));
        renderer.shadowMap.enabled = !mobileQuality;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.06;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.touchAction = 'none';
        root.appendChild(renderer.domElement);
        const navigation = $('sceneNavigation'), interactionButton = $('sceneInteraction');
        let mobileNavigation = false, interactionEnabled = false, portraitViewport = false;
        let previousRenderWidth = 0, previousRenderHeight = 0, sceneVisible = true, scrollingUntil = 0;
        function updateInteractionMode() {
          renderer.domElement.style.touchAction = mobileNavigation && !interactionEnabled ? 'pan-x pan-y pinch-zoom' : 'none';
          interactionButton.setAttribute('aria-pressed', String(interactionEnabled));
          interactionButton.textContent = interactionEnabled ? 'Explorar / rolar' : 'Mover ingredientes';
          $('sceneNavigationHint').textContent = interactionEnabled
            ? 'Arraste os ingredientes. Nas bordas, a cozinha acompanha o movimento. Use “Explorar / rolar” para navegar.'
            : 'Deslize para os lados para explorar a cozinha e para cima para rolar a página.';
        }
        interactionButton.addEventListener('click', () => { interactionEnabled = !interactionEnabled; updateInteractionMode() });
        // Native scrolling reuses the canvas image; avoid competing with the compositor.
        document.addEventListener('scroll', () => { scrollingUntil = performance.now() + 140 }, { passive: true, capture: true });
        if (window.IntersectionObserver) new IntersectionObserver(entries => { sceneVisible = entries[0].isIntersecting }).observe(root);

        let scene = new THREE.Scene();
        scene.background = new THREE.Color(0x233629);
        scene.fog = new THREE.Fog(0x233629, 18, 40);
        let camera = new THREE.PerspectiveCamera(36, (root.clientWidth || 960) / (root.clientHeight || 560), .1, 100);
        camera.position.set(0, 4.8, 10.6);
        camera.lookAt(0, .55, 0);

        /* ---------- Texturas procedurais ---------- */
        function canvasTex(paint, size = 512, rx = 1, ry = 1) {
          let cv = document.createElement('canvas'); cv.width = cv.height = size; paint(cv.getContext('2d'), size);
          let t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
          t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = mobileQuality ? 1 : 8; return t
        }
        function woodPaint(g, s, base = '#916134') {
          g.fillStyle = base; g.fillRect(0, 0, s, s);
          for (let i = 0; i < 64; i++) {
            g.strokeStyle = `rgba(58,36,16,${.06 + Math.random() * .14})`; g.lineWidth = 1 + Math.random() * 3.5;
            g.beginPath(); let y = Math.random() * s; g.moveTo(0, y);
            for (let x = 0; x <= s; x += 24)g.lineTo(x, y + Math.sin(x * .015 + i * 1.7) * 7); g.stroke()
          }
          for (let i = 0; i < 6; i++) {
            g.fillStyle = 'rgba(50,30,12,.10)'; g.beginPath();
            g.ellipse(Math.random() * s, Math.random() * s, 8 + Math.random() * 26, 4 + Math.random() * 9, Math.random() * 3, 0, 7); g.fill()
          }
        }
        let woodTex = canvasTex((g, s) => woodPaint(g, s), 512, 2, 1);
        let boardTex = canvasTex((g, s) => woodPaint(g, s, '#b08248'), 256, 1, 1);
        let tileTex = canvasTex((g, s) => {
          g.fillStyle = '#3c584a'; g.fillRect(0, 0, s, s); let n = 4, u = s / n;
          for (let y = 0; y < n; y++)for (let x = 0; x < n; x++) { g.fillStyle = `hsl(${148 + Math.random() * 18},26%,${32 + Math.random() * 9}%)`; g.fillRect(x * u + 3, y * u + 3, u - 6, u - 6) }
        }, 512, 5, 2);

        /* ---------- Ambiente iluminado para reflexos ---------- */
        let envTex = canvasTex((g, s) => {
          let gr = g.createLinearGradient(0, 0, 0, s);
          gr.addColorStop(0, '#e8f0e4'); gr.addColorStop(.45, '#8a9c88'); gr.addColorStop(1, '#232b22');
          g.fillStyle = gr; g.fillRect(0, 0, s, s)
        }, 256, 1, 1);
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        let pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromEquirectangular(envTex).texture;
        pmrem.dispose();

        /* ---------- Luzes ---------- */
        scene.add(new THREE.HemisphereLight(0xfff6e6, 0x42534b, .85));
        let key = new THREE.DirectionalLight(0xffeccc, 2.7);
        key.position.set(-5, 9, 6); key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -6;
        key.shadow.camera.near = 1; key.shadow.camera.far = 30; key.shadow.bias = -.0004; key.shadow.radius = 6;
        key.shadow.camera.updateProjectionMatrix();
        scene.add(key);
        let warm = new THREE.PointLight(0xffb56b, 18, 14, 2); warm.position.set(4.6, 2.8, -1.6); scene.add(warm);
        let fill = new THREE.DirectionalLight(0xbfd9ff, .45); fill.position.set(6, 4, -6); scene.add(fill);

        /* ---------- Materiais ---------- */
        const mat = o => new THREE.MeshStandardMaterial(o);
        const put = (geo, m) => { let x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x };

        /* ---------- Ambiente: bancada, parede e prateleira ---------- */
        let table = put(new THREE.BoxGeometry(13.6, .55, 8.8), mat({ map: woodTex, roughness: .5, metalness: .04 }));
        table.position.y = -.53; scene.add(table);
        let trim = put(new THREE.BoxGeometry(13.8, .18, 8.95), mat({ color: 0x5d3c22, roughness: .65 }));
        trim.position.y = -.9; scene.add(trim);
        let wall = put(new THREE.BoxGeometry(16.5, 8.5, .3), mat({ map: tileTex, roughness: .85 }));
        wall.position.set(0, 3.6, -4.05); wall.castShadow = false; scene.add(wall);
        let shelf = put(new THREE.BoxGeometry(6.6, .16, 1.05), mat({ color: 0x6d4926, roughness: .6 }));
        shelf.position.set(-1.1, 2.65, -3.35); scene.add(shelf);
        let glassMat = mat({ color: 0xcfe4dd, roughness: .08, metalness: .05, transparent: true, opacity: .32 });
        let jarFills = [0xf1e3b2, 0xd8e44a, 0x9c6b3f];
        [-3.5, -1.5, 1.3].forEach((x, i) => {
          let jar = new THREE.Group();
          let body = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .78, 24), glassMat); body.position.y = .46;
          let lid = put(new THREE.CylinderGeometry(.4, .4, .12, 24), mat({ color: 0x8a6a3a, roughness: .4 })); lid.position.y = .9;
          let content = put(new THREE.CylinderGeometry(.33, .33, .52, 20), mat({ color: jarFills[i], roughness: .9 })); content.position.y = .3;
          jar.add(body, lid, content); jar.position.set(x, 2.73, -3.4); scene.add(jar)
        });

        /* ---------- Fogão ---------- */
        let stove = put(new THREE.BoxGeometry(3, .22, 2.7), mat({ color: 0x1e2426, metalness: .75, roughness: .3 }));
        stove.position.set(4.7, -.32, -.1); scene.add(stove);
        [[3.9, -.75], [3.9, .65], [5.5, -.75], [5.5, .65]].forEach(([x, z]) => {
          let ring = put(new THREE.TorusGeometry(.44, .05, 10, 40), mat({ color: 0x0c0f10, metalness: .6, roughness: .5 }));
          ring.rotation.x = Math.PI / 2; ring.position.set(x, -.19, z); scene.add(ring);
          let knob = put(new THREE.CylinderGeometry(.09, .09, .1, 14), mat({ color: 0xd8d3c8, metalness: .4, roughness: .35 }));
          knob.rotation.x = Math.PI / 2; knob.position.set(x, -.24, 1.28); scene.add(knob)
        });

        /* ---------- Panela (arrastável, estacionada na boca traseira) ---------- */
        let panG = new THREE.Group();
        let pan = put(new THREE.CylinderGeometry(.75, .6, .24, 40), mat({ color: 0x2b3134, metalness: .85, roughness: .26 }));
        pan.position.y = .12;
        let panInner = put(new THREE.CylinderGeometry(.68, .68, .03, 40), mat({ color: 0x51585c, metalness: .9, roughness: .18 }));
        panInner.position.y = .25;
        let panHandle = put(new THREE.BoxGeometry(1.3, .09, .16), mat({ color: 0x15191a, metalness: .3, roughness: .5 }));
        panHandle.position.set(1.05, .14, 0);
        panG.add(pan, panInner, panHandle);
        panG.position.set(5.5, -.19, -.75); panG.rotation.y = -Math.PI / 2; scene.add(panG);

        /* ---------- Forno grande embutido na parede, à direita atrás do fogão ---------- */
        let ovenG = new THREE.Group(); ovenG.position.set(4.7, 1.2, -3.45); scene.add(ovenG);
        let ovenMat = mat({ color: 0x2a2e31, metalness: .6, roughness: .35 });
        let ovenBody = put(new THREE.BoxGeometry(2.9, 2.1, .08), ovenMat); ovenBody.position.set(0, -.05, -.435); ovenG.add(ovenBody);
        [[-1.41], [1.41]].forEach(([x]) => { let s = put(new THREE.BoxGeometry(.08, 2.1, .95), ovenMat); s.position.set(x, -.05, 0); ovenG.add(s) });
        let ovenTop = put(new THREE.BoxGeometry(2.9, .08, .95), ovenMat); ovenTop.position.set(0, 1.01, 0); ovenG.add(ovenTop);
        let ovenBot = put(new THREE.BoxGeometry(2.9, .08, .95), ovenMat); ovenBot.position.set(0, -1.11, 0); ovenG.add(ovenBot);
        let ovenInBack = put(new THREE.BoxGeometry(2.7, 1.95, .03), mat({ color: 0x0a0c0d, roughness: .95, side: THREE.DoubleSide })); ovenInBack.position.set(0, -.05, -.4); ovenG.add(ovenInBack);
        let ovenInFloor = put(new THREE.BoxGeometry(2.7, .03, .86), mat({ color: 0x0a0c0d, roughness: .95 })); ovenInFloor.position.set(0, -1.06, 0); ovenG.add(ovenInFloor);
        [[0, .78, .42, 3.05, .14], [0, -.88, .42, 3.05, .14], [-1.27, -.05, .42, .12, 1.68], [1.27, -.05, .42, .12, 1.68]].forEach(([x, y, z, w, h]) => {
          let f = put(new THREE.BoxGeometry(w, h, .1), mat({ color: 0x8f959a, metalness: .85, roughness: .28 })); f.position.set(x, y, z); ovenG.add(f)
        });
        let ovenRack = put(new THREE.BoxGeometry(2.3, .05, .85), mat({ color: 0x6b7176, metalness: .8, roughness: .4 })); ovenRack.position.set(0, -.6, .02); ovenG.add(ovenRack);
        let doorPivot = new THREE.Group(); doorPivot.position.set(0, -.75, .44); ovenG.add(doorPivot);
        let ovenDoor = new THREE.Group(); doorPivot.add(ovenDoor);
        let doorPanel = put(new THREE.BoxGeometry(2.5, 1.58, .1), mat({ color: 0x33383c, metalness: .55, roughness: .4 })); doorPanel.position.y = .79; ovenDoor.add(doorPanel);
        let doorGlass = put(new THREE.BoxGeometry(1.5, .62, .02), mat({ color: 0x1b2126, metalness: .2, roughness: .05, transparent: true, opacity: .85 })); doorGlass.position.set(0, .68, .07); ovenDoor.add(doorGlass);
        let doorHandle = put(new THREE.BoxGeometry(1.9, .08, .12), mat({ color: 0xc9ced2, metalness: .9, roughness: .2 })); doorHandle.position.set(0, 1.42, .12); ovenDoor.add(doorHandle);
        let dispBezel = put(new THREE.BoxGeometry(1.64, .3, .035), mat({ color: 0x14181a, metalness: .85, roughness: .3 })); dispBezel.position.set(0, 1.18, .055); ovenDoor.add(dispBezel);
        let dispCanvas = document.createElement('canvas'); dispCanvas.width = 512; dispCanvas.height = 128;
        let dispCtx = dispCanvas.getContext('2d');
        let dispTex = new THREE.CanvasTexture(dispCanvas); dispTex.colorSpace = THREE.SRGBColorSpace; dispTex.anisotropy = 4;
        let dispMat = new THREE.MeshStandardMaterial({ map: dispTex, emissiveMap: dispTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: .95, roughness: .2, metalness: .1 });
        let dispScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.56, .24), dispMat);
        dispScreen.position.set(0, 1.18, .075); dispScreen.userData.isOvenDisplay = true; dispBezel.userData.isOvenDisplay = true; ovenDoor.add(dispScreen);
        function draw7SegCanvas(ctx, x, y, w, h, char, onCol = '#ff2020', offCol = 'rgba(255,30,30,.08)') {
          const M = { '0': [1, 1, 1, 1, 1, 1, 0], '1': [0, 1, 1, 0, 0, 0, 0], '2': [1, 1, 0, 1, 1, 0, 1], '3': [1, 1, 1, 1, 0, 0, 1], '4': [0, 1, 1, 0, 0, 1, 1], '5': [1, 0, 1, 1, 0, 1, 1], '6': [1, 0, 1, 1, 1, 1, 1], '7': [1, 1, 1, 0, 0, 0, 0], '8': [1, 1, 1, 1, 1, 1, 1], '9': [1, 1, 1, 1, 0, 1, 1], '-': [0, 0, 0, 0, 0, 0, 1], ' ': [0, 0, 0, 0, 0, 0, 0], 'E': [1, 0, 0, 1, 1, 1, 1], 'r': [0, 0, 0, 0, 1, 0, 1], 'C': [1, 0, 0, 1, 1, 1, 0] };
          let segs = M[char] || [0, 0, 0, 0, 0, 0, 0], t = Math.max(2, Math.round(w * .16)), s = 1.5, midY = y + h / 2, rX = x + w, bY = y + h;
          function sg(poly, on) { ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++)ctx.lineTo(poly[i][0], poly[i][1]); ctx.closePath(); ctx.fillStyle = on ? onCol : offCol; if (on) { ctx.shadowColor = '#ff1111'; ctx.shadowBlur = 7 } else ctx.shadowBlur = 0; ctx.fill(); ctx.shadowBlur = 0 }
          sg([[x + t + s, y], [rX - t - s, y], [rX - t - s - t / 2, y + t], [x + t + s + t / 2, y + t]], segs[0]);
          sg([[rX, y + t + s], [rX, midY - s - t / 2], [rX - t, midY - s], [rX - t, y + t + s + t / 2]], segs[1]);
          sg([[rX, midY + s + t / 2], [rX, bY - t - s], [rX - t, bY - t - s - t / 2], [rX - t, midY + s]], segs[2]);
          sg([[x + t + s + t / 2, bY - t], [rX - t - s - t / 2, bY - t], [rX - t - s, bY], [x + t + s, bY]], segs[3]);
          sg([[x, midY + s + t / 2], [x + t, midY + s], [x + t, bY - t - s - t / 2], [x, bY - t - s]], segs[4]);
          sg([[x, y + t + s], [x + t, y + t + s + t / 2], [x + t, midY - s], [x, midY - s - t / 2]], segs[5]);
          sg([[x + t + s, midY], [x + t + s + t / 2, midY - t / 2], [rX - t - s - t / 2, midY - t / 2], [rX - t - s, midY], [rX - t - s - t / 2, midY + t / 2], [x + t + s + t / 2, midY + t / 2]], segs[6]);
        }
        let dispLast = '';
        function renderOvenDoorCanvas(state, temp, timeSec) {
          if (!dispCanvas || !dispCtx) return; let dk = state + '|' + temp + '|' + timeSec + '|' + Math.floor(Date.now() / 500); if (dk === dispLast) return; dispLast = dk; let ctx = dispCtx, w = dispCanvas.width, h = dispCanvas.height;
          ctx.fillStyle = '#070709'; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'rgba(255,255,255,.02)'; for (let y = 0; y < h; y += 4)ctx.fillRect(0, y, w, 1);
          ctx.strokeStyle = '#241416'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, w - 4, h - 4);
          ctx.font = 'bold 16px "Outfit",Segoe UI,sans-serif'; ctx.fillStyle = '#ff6666'; ctx.fillText('TEMP °C', 35, 26);
          let tStr = (state === 'standby' ? '---' : String(Math.max(0, Math.min(999, temp))).padStart(3, '0'));
          let tX = 25, tY = 36, dw = 28, dh = 50, dgap = 6;
          for (let i = 0; i < 3; i++)draw7SegCanvas(ctx, tX + i * (dw + dgap), tY, dw, dh, tStr[i]);
          ctx.font = 'bold 22px "Outfit",Segoe UI,sans-serif'; ctx.fillStyle = '#ff2222'; ctx.fillText('°C', tX + 3 * (dw + dgap) + 4, tY + dh - 10);
          ctx.strokeStyle = '#3a1818'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(215, 12); ctx.lineTo(215, h - 28); ctx.stroke();
          ctx.font = 'bold 16px "Outfit",Segoe UI,sans-serif'; ctx.fillStyle = '#ff6666'; ctx.fillText(state === 'baking' ? 'CONTAGEM (S)' : 'TEMPO (SEG)', 255, 26);
          let m = Math.floor(timeSec / 60), s = timeSec % 60;
          let timeStr = (state === 'standby' ? '--:--' : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
          let timeX = 250, timeY = 36;
          draw7SegCanvas(ctx, timeX, timeY, dw, dh, timeStr[0]); draw7SegCanvas(ctx, timeX + (dw + dgap), timeY, dw, dh, timeStr[1]);
          ctx.fillStyle = (state === 'standby' || Math.floor(Date.now() / 500) % 2 === 0) ? '#ff2222' : 'rgba(255,30,30,.15)';
          ctx.beginPath(); ctx.arc(timeX + 2 * (dw + dgap) + 8, timeY + 16, 4, 0, Math.PI * 2); ctx.arc(timeX + 2 * (dw + dgap) + 8, timeY + 34, 4, 0, Math.PI * 2); ctx.fill();
          draw7SegCanvas(ctx, timeX + 2 * (dw + dgap) + 16, timeY, dw, dh, timeStr[3]); draw7SegCanvas(ctx, timeX + 3 * (dw + dgap) + 16, timeY, dw, dh, timeStr[4]);
          ctx.font = 'bold 18px "Outfit",Segoe UI,sans-serif'; ctx.fillStyle = '#ff2222'; ctx.fillText('SEG', timeX + 4 * (dw + dgap) + 20, timeY + dh - 10);
          ctx.font = 'bold 12px "Outfit",monospace'; ctx.fillStyle = (state === 'baking' ? '#ffaa33' : state === 'done' ? '#66ff66' : '#ff8888');
          let statusMsg = (state === 'baking' ? `● ASSANDO: ${timeSec}s RESTANTES...` : state === 'done' ? '● CONCLUÍDO! RETIRE A FORMA' : state === 'ready' ? '● CLIQUE P/ AJUSTAR O FORNO' : '● STANDBY • CLIQUE P/ CONFIGURAR');
          ctx.fillText(statusMsg, 35, h - 10); dispTex.needsUpdate = true
        }
        window.renderOvenDoorCanvas = renderOvenDoorCanvas;
        renderOvenDoorCanvas('standby', 180, 12);
        let ovenLight = new THREE.PointLight(0xff8a3c, 0, 3.5, 2); ovenLight.position.set(0, -.1, .15); ovenG.add(ovenLight);
        let ovenSmoke = [];
        for (let i = 0; i < 7; i++) {
          let m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf5efe2, transparent: true, opacity: 0, depthWrite: false }));
          scene.add(m); ovenSmoke.push({ m, ph: Math.random(), x: (random() - .5) * 1 })
        }

        /* ---------- Assadeira (forma de forno, arrastável) ---------- */
        let formG = new THREE.Group();
        let formMat = mat({ color: 0x565d62, metalness: .85, roughness: .3 });
        let formBase = put(new THREE.BoxGeometry(1.5, .06, .8), formMat); formBase.position.y = .03; formG.add(formBase);
        [[0, .4, 1.54, .07], [0, -.4, 1.54, .07], [-.715, 0, .07, .8], [.715, 0, .07, .8]].forEach(([x, z, w, d]) => {
          let fw = put(new THREE.BoxGeometry(w, .16, d), formMat); fw.position.set(x, .11, z); formG.add(fw)
        });
        formG.position.set(2.2, -.25, -2.05); scene.add(formG);
        let formItems = [];

        /* ---------- Tigela (lathe) com borda ---------- */
        let bowlG = new THREE.Group(); bowlG.position.set(0, -.32, .05); scene.add(bowlG);
        let prof = []; for (let i = 0; i <= 30; i++) {
          let a = (i / 30) * Math.PI * .5;
          prof.push(new THREE.Vector2(.48 + .58 * Math.sin(a), .06 + (1 - Math.cos(a)) * .8))
        }
        let bowl = put(new THREE.LatheGeometry(prof, 56), mat({ color: 0xe9e6df, roughness: .16, metalness: .04, side: THREE.DoubleSide }));
        bowlG.add(bowl);
        let bowlBottom = put(new THREE.CircleGeometry(.62, 32), mat({ color: 0xe4e1d9, roughness: .2, metalness: .04, side: THREE.DoubleSide }));
        bowlBottom.rotation.x = -Math.PI / 2; bowlBottom.position.y = .16; bowlG.add(bowlBottom);
        let rim = put(new THREE.TorusGeometry(1.06, .06, 16, 72), mat({ color: 0xf2efe8, roughness: .18, metalness: .06 }));
        rim.rotation.x = Math.PI / 2; rim.position.y = .86; bowlG.add(rim);

        /* ---------- Tábua, faca e colher ---------- */
        let board = put(new THREE.BoxGeometry(2.7, .14, 1.8), mat({ map: boardTex, roughness: .5 }));
        board.position.set(-3.1, -.18, 1.5); scene.add(board);

        let knife = new THREE.Group();
        let blade = put(new THREE.BoxGeometry(1.6, .045, .3), mat({ color: 0xd8dde0, metalness: .92, roughness: .2 }));
        blade.position.x = .5;
        let spine = put(new THREE.BoxGeometry(1.6, .02, .06), mat({ color: 0x9aa1a6, metalness: .9, roughness: .3 }));
        spine.position.set(.5, .03, -.13);
        let hilt = put(new THREE.CylinderGeometry(.14, .14, .08, 16), mat({ color: 0x35413c, metalness: .6, roughness: .3 }));
        hilt.rotation.z = Math.PI / 2; hilt.position.x = -.34; hilt.position.y = .01;
        let handle = put(new THREE.CylinderGeometry(.1, .12, .8, 16), mat({ color: 0x2f2019, roughness: .5 }));
        handle.rotation.z = Math.PI / 2; handle.position.x = -.78; handle.position.y = .02;
        knife.add(blade, spine, hilt, handle);
        knife.position.set(-3.35, -.09, 1.3); knife.rotation.y = 2.65; scene.add(knife);

        const utensilWood = mat({ color: 0xcda571, map: boardTex, roughness: .70 });
        let spoon = new THREE.Group();
        const spoonBowl = new THREE.LatheGeometry([
          [0, -.055], [.08, -.05], [.17, -.005], [.23, .075],
          [.218, .085], [.16, .02], [.07, -.025], [0, -.03]
        ].map(p => new THREE.Vector2(...p)), 24);
        spoonBowl.scale(1, 1, 1.35); spoonBowl.translate(0, 0, .6);
        const spoonHandle = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, .025, -.67), new THREE.Vector3(0, .075, -.1), new THREE.Vector3(0, .04, .37)
        ), 12, .048, 8, false);
        const spoonEnd = new THREE.SphereGeometry(.048, 10, 6); spoonEnd.translate(0, .025, -.67);
        spoon.add(put(mergeSurfaces([spoonBowl, spoonHandle, spoonEnd]), utensilWood));
        spoon.userData.refinedUtensil = 'spoon';
        spoon.position.set(1.85, -.13, 1.2); spoon.rotation.y = -.6; scene.add(spoon);

        /* ---------- Pia grande (para Lavar) com água corrente ---------- */
        let sink = put(new THREE.BoxGeometry(3.4, .26, 2.4), mat({ color: 0x9aa4a8, metalness: .8, roughness: .28 }));
        sink.position.set(-5.2, -.39, -2.5); scene.add(sink);
        let basinMat = mat({ color: 0x7d8c93, metalness: .55, roughness: .35, side: THREE.DoubleSide });
        [[-5.2, -3.165, 2.6, .07], [-5.2, -1.535, 2.6, .07], [-6.465, -2.35, .07, 1.56], [-3.935, -2.35, .07, 1.56]].forEach(([x, z, w, d]) => {
          let bw = put(new THREE.BoxGeometry(w, .52, d), basinMat); bw.position.set(x, -.01, z); scene.add(bw)
        });
        let basinFloor = put(new THREE.BoxGeometry(2.46, .05, 1.56), basinMat); basinFloor.position.set(-5.2, -.232, -2.35); scene.add(basinFloor);
        let drain = put(new THREE.CylinderGeometry(.13, .13, .016, 18), mat({ color: 0x0c0f10, metalness: .4, roughness: .6 }));
        drain.position.set(-5.2, -.2, -2.35); scene.add(drain);
        let water = put(new THREE.BoxGeometry(2.4, .03, 1.5), mat({ color: 0x9fd4e8, roughness: .05, metalness: .1, transparent: true, opacity: 0 }));
        water.position.set(-5.2, -.185, -2.35); scene.add(water);
        let faucet = new THREE.Group();
        let fp1 = put(new THREE.CylinderGeometry(.06, .075, 1.15, 12), mat({ color: 0xd8dde0, metalness: .92, roughness: .18 }));
        fp1.position.y = .575;
        let fp2 = put(new THREE.CylinderGeometry(.05, .05, .84, 12), mat({ color: 0xd8dde0, metalness: .92, roughness: .18 }));
        fp2.rotation.x = Math.PI / 2; fp2.position.set(0, 1.12, .42);
        let fp3 = put(new THREE.CylinderGeometry(.055, .06, .3, 12), mat({ color: 0xd8dde0, metalness: .92, roughness: .18 }));
        fp3.position.set(0, 1.0, .84);
        let ftip = put(new THREE.SphereGeometry(.06, 10, 8), mat({ color: 0xbfc9cc, metalness: .9, roughness: .25 }));
        ftip.position.set(0, .82, .84);
        faucet.add(fp1, fp2, fp3, ftip); faucet.position.set(-5.2, -.25, -3.35); scene.add(faucet);
        let wStream = new THREE.Mesh(new THREE.CylinderGeometry(.05, .038, 1, 10), new THREE.MeshBasicMaterial({ color: 0xa8d8ee, transparent: true, opacity: 0, depthWrite: false }));
        wStream.visible = false; scene.add(wStream);
        let drops = [];
        for (let i = 0; i < 8; i++) {
          let m = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 5), new THREE.MeshBasicMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0, depthWrite: false }));
          scene.add(m); drops.push({ m, ph: Math.random(), vx: (random() - .5) * .5, vz: (random() - .5) * .3 })
        }

        /* ---------- Peneira ---------- */
        let sieve = new THREE.Group();
        const sievePlastic = mat({ color: 0x329d50, roughness: .56 });
        const sieveRing = new THREE.LatheGeometry([[.46, -.07], [.50, -.07], [.535, .13], [.52, .18], [.475, .18], [.46, -.07]].map(p => new THREE.Vector2(...p)), 32);
        const handleShape = new THREE.Shape();
        handleShape.moveTo(.46, -.14); handleShape.lineTo(1.52, -.10);
        handleShape.quadraticCurveTo(1.64, 0, 1.52, .10); handleShape.lineTo(.46, .14); handleShape.closePath();
        [.77, 1.02, 1.27, 1.49].forEach((x, i) => {
          const hole = new THREE.Path(); hole.absellipse(x, 0, i === 3 ? .035 : .082, .042, 0, Math.PI * 2, true);
          handleShape.holes.push(hole);
        });
        const sieveHandle = new THREE.ExtrudeGeometry(handleShape, { depth: .045, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, steps: 1, curveSegments: 8 });
        sieveHandle.rotateX(Math.PI / 2); sieveHandle.translate(0, .16, 0);
        const supports = [-1, 1].map(side => {
          const tab = softBox(.19, .05, .10); tab.rotateY(side * .32); tab.translate(-.48, .14, side * .23); return tab;
        });
        sieve.add(put(mergeSurfaces([sieveRing, sieveHandle, ...supports]), sievePlastic));
        // The reference's fine metal screen uses one cutout texture, not separate wires.
        const meshPattern = canvasTex((ctx, size) => {
          ctx.clearRect(0, 0, size, size); ctx.fillStyle = '#c7d2d7';
          ctx.fillRect(0, 0, 2, size); ctx.fillRect(0, 0, size, 2);
        }, 32, 18, 18);
        const meshMaterial = mat({ map: meshPattern, alphaTest: .45, side: THREE.DoubleSide, metalness: .50, roughness: .45 });
        const basket = new THREE.LatheGeometry([[0, -.09], [.32, -.08], [.43, -.04], [.475, .12]].map(p => new THREE.Vector2(...p)), 32);
        sieve.add(put(basket, meshMaterial));
        sieve.userData.refinedUtensil = 'sieve';
        sieve.position.set(2.5, -.3, 1.35); sieve.rotation.y = -.4; scene.add(sieve);

        /* ---------- Mão 3D contínua com esqueleto leve ---------- */
        let skinMat = mat({ color: 0xd9af8f, roughness: .80, metalness: 0, emissive: 0x000000, emissiveIntensity: 0 });
        let nailMat = mat({ color: 0xf0d9c4, roughness: .34, metalness: .03 });
        let sleeveMat = mat({ color: 0xb9cdb4, roughness: .9 });
        function addPart(parent, geo, m) { let x = new THREE.Mesh(geo, m); x.castShadow = false; x.receiveShadow = false; parent.add(x); return x }
        // Merge static surfaces once: smoother silhouettes without extra draw calls.
        function mergeSurfaces(parts, skinned = false) {
          const positions = [], normals = [], uvs = [], indices = [], joints = [], weights = [];
          let offset = 0;
          parts.forEach(geo => {
            const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
            positions.push(...p.array); normals.push(...n.array);
            if (uv) uvs.push(...uv.array); else for (let i = 0; i < p.count; i++) uvs.push(0, 0);
            if (skinned) {
              joints.push(...geo.attributes.skinIndex.array); weights.push(...geo.attributes.skinWeight.array);
            }
            if (geo.index) for (const index of geo.index.array) indices.push(index + offset);
            else for (let i = 0; i < p.count; i++) indices.push(i + offset);
            offset += p.count; geo.dispose();
          });
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
          geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
          geo.setIndex(indices);
          if (skinned) {
            geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(joints, 4));
            geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
          }
          return geo;
        }
        function buildHand(side) {
          side = side || 1;
          const g = new THREE.Group(), rig = { group: g, fingers: [], thumb: [], side };
          const base = new THREE.Bone(), bones = [base], surfaces = [];
          g.add(base);
          function skin(geo, joint = 0) {
            const ids = [], weights = [];
            for (let i = 0; i < geo.attributes.position.count; i++) { ids.push(joint, 0, 0, 0); weights.push(1, 0, 0, 0) }
            geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(ids, 4));
            geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
            surfaces.push(geo); return geo;
          }
          // One continuous palm, tapering into a shorter wrist and forearm.
          const palmPositions = [], palmUV = [], palmIndices = [];
          const profile = [[-.193, .055, .037], [-.14, .052, .033], [-.065, .048, .029],
            [0, .057, .031], [.045, .078, .034], [.095, .080, .031], [.135, .067, .024], [.158, .038, .012], [.165, 0, 0]];
          const palmSides = 24;
          profile.forEach(([z, width, depth], ring) => {
            for (let j = 0; j <= palmSides; j++) {
              const a = j / palmSides * Math.PI * 2;
              palmPositions.push(Math.cos(a) * width, Math.sin(a) * depth + .002, z);
              palmUV.push(j / palmSides, ring / (profile.length - 1));
              if (ring < profile.length - 1 && j < palmSides) {
                const a = ring * (palmSides + 1) + j, b = a + palmSides + 1;
                palmIndices.push(a, a + 1, b, a + 1, b + 1, b);
              }
            }
          });
          const palm = new THREE.BufferGeometry();
          palm.setAttribute('position', new THREE.Float32BufferAttribute(palmPositions, 3));
          palm.setAttribute('uv', new THREE.Float32BufferAttribute(palmUV, 2));
          palm.setIndex(palmIndices); palm.computeVertexNormals(); skin(palm);
          const cuff = addPart(g, new THREE.CylinderGeometry(.060, .064, .090, 24, 1), sleeveMat);
          cuff.rotation.x = Math.PI / 2; cuff.position.set(0, .002, -.215);
          const cuffRim = addPart(g, new THREE.TorusGeometry(.060, .006, 6, 20), sleeveMat);
          cuffRim.position.set(0, .002, -.170);
          // A finger is a closed continuous surface; skin weights blend through joints.
          function finger(x, z, length, radius, lengths, rotation, thumb = false) {
            const root = new THREE.Bone(); root.position.set(x, thumb ? -.010 : .004, z);
            if (rotation) root.rotation.set(...rotation);
            base.add(root);
            const chain = [root], ids = [bones.length]; bones.push(root);
            for (let j = 1; j < lengths.length; j++) {
              const bone = new THREE.Bone(); bone.position.z = lengths[j - 1];
              chain[j - 1].add(bone); chain.push(bone); ids.push(bones.length); bones.push(bone);
            }
            g.updateMatrixWorld(true);
            const vertices = [], uv = [], index = [], skinIds = [], skinWeights = [];
            const rings = 18, sides = 12;
            for (let j = 0; j <= rings; j++) {
              const t = j / rings, localZ = -.010 + t * (length + .010);
              const tip = Math.min(1, (1 - t) / .16), start = Math.min(1, t / .06);
              const r = radius * (1 - .23 * t) * Math.sqrt(Math.max(0, tip * (2 - tip))) * Math.sqrt(start);
              let bone = 0, at = localZ;
              while (bone < lengths.length - 1 && at > lengths[bone]) { at -= lengths[bone]; bone++ }
              const blend = bone < lengths.length - 1 ? THREE.MathUtils.smoothstep(at / lengths[bone], .55, 1) : 0;
              for (let k = 0; k <= sides; k++) {
                const angle = k / sides * Math.PI * 2;
                const v = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * .88, localZ).applyMatrix4(root.matrixWorld);
                vertices.push(v.x, v.y, v.z); uv.push(k / sides, t);
                skinIds.push(ids[bone], ids[Math.min(bone + 1, ids.length - 1)], 0, 0);
                skinWeights.push(1 - blend, blend, 0, 0);
                if (j < rings && k < sides) {
                  const a = j * (sides + 1) + k, b = a + sides + 1;
                  index.push(a, a + 1, b, a + 1, b + 1, b);
                }
              }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(index);
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
            geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIds, 4));
            geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4)); surfaces.push(geo);
            const nail = addPart(chain[chain.length - 1], new THREE.SphereGeometry(1, 10, 6), nailMat);
            nail.scale.set(radius * .54, .003, lengths[lengths.length - 1] * .32);
            nail.position.set(0, radius * .67, lengths[lengths.length - 1] * .55);
            return chain;
          }
          [[-.058, .129, .130, .020], [-.019, .140, .148, .021], [.020, .135, .138, .020], [.057, .120, .112, .018]].forEach(([x, z, len, r]) => {
            rig.fingers.push(finger(x * side, z, len, r, [len * .44, len * .32, len * .24]));
          });
          rig.thumb = finger(side * .060, .054, .105, .025, [.060, .045], [-.15, side * .85, -side * .22], true);
          const mesh = new THREE.SkinnedMesh(mergeSurfaces(surfaces, true), skinMat);
          g.add(mesh); g.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
          // The small hand moves beyond its rest bounds when kneading.
          mesh.frustumCulled = false; mesh.userData.continuousHand = true;
          return rig;
        }
        const HAND_POSES = {
          open: { f: [[.06, .10, .06], [.05, .12, .08], [.06, .14, .09], [.08, .16, .10]], spread: [-.10, -.03, .04, .11], t: [.25, .12] },
          grab: { f: [[1.15, 1.05, .55], [1.25, 1.10, .60], [1.20, 1.12, .62], [1.15, 1.05, .58]], spread: [-.14, -.04, .05, .15], t: [.80, 1.05] },
          pinch: { f: [[.55, .75, .45], [.50, .70, .40], [.55, .80, .50], [.70, .90, .55]], spread: [-.07, 0, .03, .08], t: [.90, 1.10] },
          press: { f: [[.35, .22, .14], [.32, .20, .12], [.35, .22, .14], [.40, .26, .16]], spread: [-.09, -.02, .03, .10], t: [.50, .35] },
          knead: { f: [[.86, .64, .42], [.86, .64, .42], [.86, .64, .42], [.90, .68, .44]], spread: [-.12, -.02, .02, .12], t: [.80, .70] }
        };
        function poseHand(rig, name, k) {
          let P = HAND_POSES[name] || HAND_POSES.open, a = Math.min(1, k);
          for (let i = 0; i < 4; i++) {
            let f = rig.fingers[i], t = P.f[i] || P.f[0];
            for (let j = 0; j < 3; j++)f[j].rotation.x += (t[j] - f[j].rotation.x) * a;
            f[0].rotation.y += (((P.spread ? P.spread[i] : 0) * rig.side) - f[0].rotation.y) * a
          }
          for (let j = 0; j < 2; j++)rig.thumb[j].rotation.x += (P.t[j] - rig.thumb[j].rotation.x) * a
        }
        let handRig = buildHand(1), cursorHand = handRig.group;
        cursorHand.visible = false; cursorHand.scale.setScalar(1.16); cursorHand.renderOrder = 999; scene.add(cursorHand);
        let handPose = 'open', handGlow = 0, cursorOn = false, cursorFade = 0, handHot = false;
        let cursorTip = new THREE.Vector3(), cursorFwd = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
        function updateCursorHand(dt, now) {
          let tv = cursorOn ? 1 : 0; cursorFade += (tv - cursorFade) * Math.min(1, dt * 11);
          cursorHand.visible = cursorFade > .02;
          if (!cursorHand.visible) return;
          ray.setFromCamera(ndc, camera);
          cursorTip.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 4.35);
          cursorHand.quaternion.copy(camera.quaternion);
          cursorHand.quaternion.multiply(tmpQ.setFromEuler(tmpE.set(handEuler[0], handEuler[1], handEuler[2], 'YXZ')));
          cursorFwd.set(0, 0, 1).applyQuaternion(cursorHand.quaternion);
          let sway = Math.sin(now * .006) * .012;
          cursorHand.position.copy(cursorTip).addScaledVector(cursorFwd, -.30 * cursorHand.scale.x);
          cursorHand.position.y += sway;
          let target = drag ? 'grab' : handHot ? 'pinch' : (phase === 'dough' ? 'press' : 'open');
          if (target !== handPose) handPose = target;
          poseHand(handRig, handPose, Math.min(1, dt * 14));
          cursorHand.scale.setScalar((.88 + .28 * cursorFade) * (1 + Math.sin(now * .012) * .006));
          let gt = phase === 'dough' ? (.35 + .65 * Math.abs(Math.sin(now * .0065))) : 0;
          handGlow += (gt - handGlow) * Math.min(1, dt * 9);
          skinMat.emissive.setHex(0xffc247);
          skinMat.emissiveIntensity = handGlow * .30;
        }
        let kneadBlob = put(new THREE.SphereGeometry(1, 22, 16), mat({ color: 0xe8cf9a, roughness: .85 }));
        kneadBlob.scale.set(.34, .22, .34); kneadBlob.visible = false; scene.add(kneadBlob);

        /* ---------- Anel de destaque de zona e luz de forno ---------- */
        let ring = put(new THREE.TorusGeometry(1, .05, 12, 48), new THREE.MeshBasicMaterial({ color: 0xc9f36c, transparent: true, opacity: .9 }));
        ring.rotation.x = Math.PI / 2; ring.visible = false; scene.add(ring);
        let ringBase = 1;
        let bakeLight = new THREE.PointLight(0xff8a3c, 0, 3.5, 2); bakeLight.position.set(3.9, .25, .65); scene.add(bakeLight);

        /* ---------- Modelos 3D reais (GLB otimizado, sem dependências) ---------- */
        const MODEL_FILES = { Chocolate: 'chocolate', Cookies: 'cookie', knife: 'faca', pan: 'panela' };
        let modelCache = {}, modelTexCache = {};
        function b64ToBuf(b64) {
          let bin = atob(b64), n = bin.length, u = new Uint8Array(n);
          for (let i = 0; i < n; i++)u[i] = bin.charCodeAt(i);
          return u.buffer
        }
        function parseGLB(buf) {
          let dv = new DataView(buf);
          if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('glb');
          let len = dv.getUint32(8, true), off = 12, json = null, bin = null;
          while (off < len) {
            let clen = dv.getUint32(off, true), ctype = dv.getUint32(off + 4, true), start = off + 8;
            if (ctype === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, start, clen)));
            else if (ctype === 0x004e4942) bin = buf.slice(start, start + clen);
            off = start + clen
          }
          if (!json || !bin) throw new Error('glb chunks');
          return { json, bin }
        }
        const GLB_CT = { 5120: [1, 'getInt8'], 5121: [1, 'getUint8'], 5122: [2, 'getInt16'], 5123: [2, 'getUint16'], 5125: [4, 'getUint32'], 5126: [4, 'getFloat32'] };
        function readAcc(G, ai) {
          let a = G.json.accessors[ai], bv = G.json.bufferViews[a.bufferView], ct = GLB_CT[a.componentType],
            n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
          let dv = new DataView(G.bin), base = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || ct[0] * n,
            out = new Float32Array(a.count * n);
          for (let i = 0; i < a.count; i++)for (let k = 0; k < n; k++)out[i * n + k] = dv[ct[1]](base + i * stride + k * ct[0], true);
          if (a.normalized && a.componentType !== 5126) {
            let mx = a.componentType === 5121 ? 255 : a.componentType === 5123 ? 65535 : 1;
            if (mx > 1) for (let i = 0; i < out.length; i++)out[i] /= mx
          }
          return { array: out, itemSize: n, count: a.count }
        }
        function readIdx(G, ai) {
          let acc = G.json.accessors[ai], f = readAcc(G, ai), max = 65535, Arr = Uint16Array;
          for (let i = 0; i < f.array.length; i++)if (f.array[i] > max) { Arr = Uint32Array; break }
          let out = new Arr(f.array.length);
          for (let i = 0; i < f.array.length; i++)out[i] = f.array[i];
          return out
        }
        function glbImage(G, ti, colorSpace) {
          // Texture indices are local to a GLB, never shared across models.
          let key = G.name + '|' + ti + '|' + colorSpace;
          if (modelTexCache[key]) return modelTexCache[key];
          let info = G.json.textures[ti], img = G.json.images[info.source], bv = G.json.bufferViews[img.bufferView];
          let bytes = new Uint8Array(G.bin, bv.byteOffset || 0, bv.byteLength), blob = new Blob([bytes], { type: img.mimeType || 'image/png' });
          function fromImage(b) {
            return new Promise((ok, err) => {
              let url = URL.createObjectURL(b), im = new Image();
              im.onload = () => ok({ src: im, url });
              im.onerror = () => { URL.revokeObjectURL(url); err(new Error('img')) };
              im.src = url
            })
          }
          let dec = fromImage(blob);
          let p = dec.then(o => {
            let t = new THREE.Texture(o.src);
            URL.revokeObjectURL(o.url);
            t.flipY = false; t.colorSpace = colorSpace; t.needsUpdate = true; t.anisotropy = mobileQuality ? 1 : 4;
            let smp = info.sampler != null ? G.json.samplers[info.sampler] : null;
            let wrap = v => v === 33071 ? THREE.ClampToEdgeWrapping : v === 33648 ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
            t.wrapS = smp ? wrap(smp.wrapS) : THREE.RepeatWrapping;
            t.wrapT = smp ? wrap(smp.wrapT) : THREE.RepeatWrapping;
            return t
          }).catch(() => null);
          modelTexCache[key] = p; return p
        }
        function buildGLB(name) {
          let G = parseGLB(b64ToBuf(window.COZINHA_MODELS.files[name]));
          G.name = name;
          let mats = [], defaultMat = new THREE.MeshStandardMaterial({ color: 0xcfc7b4, roughness: .7, metalness: .05 });
          function material(mi) {
            if (mats[mi]) return mats[mi];
            let d = (G.json.materials || [])[mi] || {}, p = d.pbrMetallicRoughness || {}, b = p.baseColorFactor || [1, 1, 1, 1];
            let m = new THREE.MeshStandardMaterial({
              color: new THREE.Color().setRGB(b[0], b[1], b[2], THREE.LinearSRGBColorSpace),
              metalness: p.metallicFactor !== undefined ? p.metallicFactor : 1,
              roughness: p.roughnessFactor !== undefined ? p.roughnessFactor : 1,
              transparent: d.alphaMode === 'BLEND' || b[3] < .99,
              opacity: b[3],
              side: d.doubleSided ? THREE.DoubleSide : THREE.FrontSide
            });
            if (d.alphaMode === 'MASK') { m.alphaTest = d.alphaCutoff !== undefined ? d.alphaCutoff : .5; m.transparent = false }
            mats[mi] = m;
            if (p.baseColorTexture) glbImage(G, p.baseColorTexture.index, THREE.SRGBColorSpace).then(t => { if (t) { m.map = t; m.needsUpdate = true } });
            if (d.normalTexture) glbImage(G, d.normalTexture.index, THREE.NoColorSpace).then(t => { if (t) { m.normalMap = t; let ns = d.normalTexture.scale !== undefined ? d.normalTexture.scale : 1; m.normalScale = new THREE.Vector2(ns, ns); m.needsUpdate = true } });
            if (p.metallicRoughnessTexture) glbImage(G, p.metallicRoughnessTexture.index, THREE.NoColorSpace).then(t => { if (t) { m.metalnessMap = t; m.roughnessMap = t; m.needsUpdate = true } });
            return m
          }
          function buildNode(ni, parent) {
            let n = G.json.nodes[ni], g = new THREE.Group();
            // The cookie's exported wrapper rotates it onto its edge. Its mesh
            // coordinates already lie flat on Y, suitable for the baking tray.
            if (name === 'cookie') { /* retain the mesh's original flat pose */ }
            else if (n.matrix) { g.matrix.fromArray(n.matrix); g.matrix.decompose(g.position, g.quaternion, g.scale) }
            else {
              if (n.translation) g.position.fromArray(n.translation);
              if (n.rotation) g.quaternion.fromArray(n.rotation);
              if (n.scale) g.scale.fromArray(n.scale)
            }
            if (n.mesh != null) {
              G.json.meshes[n.mesh].primitives.forEach(pr => {
                let geo = new THREE.BufferGeometry(), at = pr.attributes;
                let pa = readAcc(G, at.POSITION); geo.setAttribute('position', new THREE.BufferAttribute(pa.array, 3));
                if (at.NORMAL != null) { let na = readAcc(G, at.NORMAL); geo.setAttribute('normal', new THREE.BufferAttribute(na.array, 3)) }
                if (at.TEXCOORD_0 != null) { let ua = readAcc(G, at.TEXCOORD_0); geo.setAttribute('uv', new THREE.BufferAttribute(ua.array, 2)) }
                if (pr.indices != null) geo.setIndex(new THREE.BufferAttribute(readIdx(G, pr.indices), 1));
                if (at.NORMAL == null) geo.computeVertexNormals();
                geo.computeBoundingBox(); geo.computeBoundingSphere();
                let mesh = new THREE.Mesh(geo, pr.material != null ? material(pr.material) : defaultMat);
                mesh.castShadow = true; mesh.receiveShadow = true;
                mesh.userData.glb = true; g.add(mesh)
              })
            }
            (n.children || []).forEach(c => buildNode(c, g));
            parent.add(g)
          }
          let root = new THREE.Group();
          (G.json.scenes[G.json.scene || 0].nodes || []).forEach(ni => buildNode(ni, root));
          root.userData.glbModel = name;
          return root
        }
        function modelTemplate(name) {
          if (!name || !window.COZINHA_MODELS || !window.COZINHA_MODELS.files || !window.COZINHA_MODELS.files[name]) return null;
          if (modelCache[name]) return modelCache[name];
          try { let t = buildGLB(name); modelCache[name] = t; return t } catch (e) { modelCache[name] = null; return null }
        }
        function modelInstance(name, fit) {
          let tpl = modelTemplate(name); if (!tpl) return null;
          let root = tpl.clone(true), holder = new THREE.Group(); holder.add(root);
          if (fit.rot) holder.rotation.set(fit.rot[0] || 0, fit.rot[1] || 0, fit.rot[2] || 0);
          let wrap = new THREE.Group(); wrap.add(holder);
          wrap.updateMatrixWorld(true);
          let box = new THREE.Box3().setFromObject(wrap), size = new THREE.Vector3(); box.getSize(size);
          let s = Math.min(fit.w / size.x, fit.h / size.y, fit.d / size.z);
          if (!isFinite(s) || s <= 0) s = 1;
          holder.scale.setScalar(s);
          wrap.updateMatrixWorld(true);
          box.setFromObject(wrap);
          let c = new THREE.Vector3(); box.getCenter(c);
          let inner = new THREE.Group(); inner.add(holder);
          inner.position.set(-c.x, -box.min.y, -c.z);
          wrap.add(inner); wrap.updateMatrixWorld(true);
          wrap.userData.model = name;
          return wrap
        }
        const FOOD_MODEL = {
          Chocolate: { name: 'chocolate', fit: { w: .92, h: .4, d: .72, rot: [0, 0, 0] } },
          Cookies: { name: 'cookie', fit: { w: .62, h: .5, d: .62, rot: [0, 0, 0] } }
        };

        const ingredientMaterials = new Map(), ingredientGrains = new Map();
        const organicFoods = new Set(['Manteiga', 'Ovo', 'Massa', 'Limão', 'Focaccia', 'Morango']);
        function ingredientMaterial(name, options) {
          const key = name + JSON.stringify(options);
          if (ingredientMaterials.has(key)) return ingredientMaterials.get(key);
          const material = mat(options);
          if (!options.transparent && !options.metalness && options.roughness >= .35) {
            const grainKey = organicFoods.has(name) ? 'organic' : 'paper';
            let texture = ingredientGrains.get(grainKey);
            if (!texture) texture = canvasTex((ctx, size) => {
              ctx.fillStyle = '#f7f4ed'; ctx.fillRect(0, 0, size, size);
              let seed = 73;
              for (let i = 0; i < 1600; i++) {
                seed = (seed * 1664525 + 1013904223) >>> 0; const x = seed % size;
                seed = (seed * 1664525 + 1013904223) >>> 0; const y = seed % size;
                ctx.fillStyle = `rgba(75,52,24,${organicFoods.has(name) ? .08 : .035})`;
                ctx.fillRect(x, y, 1, 1);
              }
            }, 128);
            ingredientGrains.set(grainKey, texture);
            material.map = texture;
            if (organicFoods.has(name)) { material.bumpMap = texture; material.bumpScale = name === 'Limão' ? .012 : .004 }
          }
          ingredientMaterials.set(key, material); return material;
        }
        const ingredientLabels = new Map();
        function ingredientLabel(name, color) {
          if (ingredientLabels.has(name)) return ingredientLabels.get(name);
          const texture = canvasTex((ctx, size) => {
            ctx.fillStyle = color; ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#f7f3e5'; ctx.fillRect(0, size * .12, size, size * .045);
            ctx.fillRect(0, size * .82, size, size * .045);
            ctx.textAlign = 'center'; ctx.fillStyle = '#203326';
            ctx.font = 'bold 38px system-ui'; ctx.fillText(name.toUpperCase(), size / 2, size * .60, size * .90);
            ctx.font = '17px system-ui'; ctx.fillText('COZINHA QUEST', size / 2, size * .34);
          }, 256);
          const material = mat({ map: texture, roughness: .85 });
          ingredientLabels.set(name, material); return material;
        }
        function softBox(w, h, d) {
          const radius = Math.min(w, h, d) * .12;
          const geometry = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
          const p = geometry.attributes.position, n = geometry.attributes.normal;
          for (let i = 0; i < p.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(p, i);
            const center = new THREE.Vector3(
              THREE.MathUtils.clamp(v.x, -w / 2 + radius, w / 2 - radius),
              THREE.MathUtils.clamp(v.y, -h / 2 + radius, h / 2 - radius),
              THREE.MathUtils.clamp(v.z, -d / 2 + radius, d / 2 - radius));
            const normal = v.clone().sub(center).normalize();
            v.copy(center).addScaledVector(normal, radius); p.setXYZ(i, v.x, v.y, v.z); n.setXYZ(i, normal.x, normal.y, normal.z);
          }
          return geometry;
        }

        /* ---------- Fábrica de modelos fiéis dos ingredientes ---------- */
        let foodStates = {};
        function makeHalfLemon() {
          const half = new THREE.Group(); half.userData.preparation = 'half-lemon';
          const peel = new THREE.SphereGeometry(.34, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
          peel.scale(1.12, .9, 1.12); peel.translate(0, .306, 0);
          half.add(put(peel, ingredientMaterial('Limão', { color: 0xe9cb34, roughness: .55 })));
          const pith = new THREE.CylinderGeometry(.377, .377, .014, 32); pith.translate(0, .307, 0);
          half.add(put(pith, ingredientMaterial('Limão', { color: 0xfff4cf, roughness: .65 })));
          const flesh = [];
          for (let i = 0; i < 10; i++) {
            const wedge = new THREE.CircleGeometry(.337, 5, i * Math.PI / 5 + .025, Math.PI / 5 - .05);
            wedge.rotateX(-Math.PI / 2); wedge.translate(0, .316, 0); flesh.push(wedge);
          }
          half.add(put(mergeSurfaces(flesh), ingredientMaterial('Limão', { color: 0xf4d969, roughness: .34 })));
          const core = new THREE.CylinderGeometry(.045, .035, .008, 12); core.translate(0, .32, 0);
          half.add(put(core, ingredientMaterial('Limão', { color: 0xfff4cf, roughness: .65 })));
          return half;
        }
        function makeFood(name) {
          if (name === 'Limão' && foodStates[name] === 'cut') return makeHalfLemon();
          if (name === 'Cookies') {
            const batch = new THREE.Group();
            for (let i = 0; i < 6; i++) {
              const cookie = modelInstance('cookie', { w: .37, h: .16, d: .32 });
              if (!cookie) break;
              cookie.position.set((i % 3 - 1) * .45, 0, (Math.floor(i / 3) - .5) * .37);
              cookie.rotation.y = (i % 3 - 1) * .16;
              batch.add(cookie);
            }
            if (batch.children.length === 6) { batch.userData.cookieBatch = true; return batch }
          }
          let fm = name === 'Cookies' ? null : FOOD_MODEL[name];
          if (fm) { let mo = modelInstance(fm.name, fm.fit); if (mo) { mo.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }); return mo } }
          const g = new THREE.Group();
          const add = m => { g.add(m); return m };
          switch (name) {
            case 'Manteiga': {
              let b = add(put(softBox(.56, .3, .42), ingredientMaterial(name, { color: 0xf6d67e, roughness: .42 }))); b.position.y = .15;
              add(put(softBox(.66, .05, .52), ingredientMaterial(name, { color: 0xe8e0c8, roughness: .85 }))).position.y = .025;
              let t = add(put(softBox(.3, .04, .2), ingredientMaterial(name, { color: 0xffe9a8, roughness: .35 }))); t.position.set(.06, .32, .04); t.rotation.y = .3; break
            }
            case 'Açúcar': {
              let b = add(put(softBox(.5, .6, .3), ingredientMaterial(name, { color: 0xf5f2e8, roughness: .9 }))); b.position.y = .3;
              add(put(softBox(.54, .1, .34), ingredientMaterial(name, { color: 0xdcd7c6, roughness: .9 }))).position.y = .62;
              let l = add(put(softBox(.34, .2, .02), ingredientLabel(name, '#c3d499'))); l.position.set(0, .34, .16); break
            }
            case 'Ovo': {
              let e = add(put(new THREE.SphereGeometry(.24, 24, 18), ingredientMaterial(name, { color: 0xf7f1e3, roughness: .35 })));
              e.scale.set(.85, 1.15, .85); e.position.y = .26; break
            }
            case 'Farinha': {
              let b = add(put(new THREE.CylinderGeometry(.32, .36, .7, 14), ingredientMaterial(name, { color: 0xead9b8, roughness: .95 }))); b.position.y = .35;
              add(put(new THREE.CylinderGeometry(.36, .32, .14, 14), ingredientMaterial(name, { color: 0xdcc9a4, roughness: .95 }))).position.y = .72;
              let l = add(put(softBox(.4, .22, .02), ingredientLabel(name, '#d8a37c'))); l.position.set(0, .4, .33); break
            }
            case 'Chocolate': {
              for (let i = 0; i < 8; i++) {
                let c = add(put(softBox(.3, .08, .3), ingredientMaterial(name, { color: 0x452816, roughness: .32, metalness: .06 })));
                c.position.set((i % 4) * .32 - .48, .04, Math.floor(i / 4) * .32 - .16)
              } break
            }
            case 'Massa': {
              let d = add(put(new THREE.SphereGeometry(.4, 28, 20), ingredientMaterial(name, { color: 0xe8cf9a, roughness: .85 })));
              d.scale.y = .8; d.position.y = .3;
              for (let i = 0; i < 5; i++) {
                let f = add(put(new THREE.SphereGeometry(.05, 8, 6), ingredientMaterial(name, { color: 0xd9bd82, roughness: .9 })));
                f.position.set(Math.cos(i * 1.9) * .28, .55, Math.sin(i * 1.9) * .22)
              } break
            }
            case 'Cookies': {
              let cookieCoords = [[-.45, -.19], [0, -.19], [.45, -.19], [-.45, .19], [0, .19], [.45, .19]];
              cookieCoords.forEach(([cx, cz]) => {
                let c = add(put(new THREE.CylinderGeometry(.18, .16, .1, 20), ingredientMaterial(name, { color: 0xc89656, roughness: .72 })));
                c.position.set(cx, .05, cz);
                for (let i = 0; i < 5; i++) {
                  let chip = add(put(new THREE.SphereGeometry(.042, 6, 6), ingredientMaterial(name, { color: 0x361f12, roughness: .4 })));
                  let a = i * 1.25; chip.position.set(cx + Math.cos(a) * .11, .11, cz + Math.sin(a) * .11)
                }
              }); break
            }
            case 'Limão': {
              let l = add(put(new THREE.SphereGeometry(.34, 28, 20), ingredientMaterial(name, { color: 0xf0d64c, roughness: .45 })));
              l.scale.set(1.15, .92, 1.15); l.position.y = .3;
              let tip = add(put(new THREE.SphereGeometry(.07, 10, 8), ingredientMaterial(name, { color: 0xe3c63e, roughness: .5 }))); tip.position.set(0, .3, .42);
              let leaf = add(put(new THREE.SphereGeometry(.12, 10, 8), ingredientMaterial(name, { color: 0x5d8a3c, roughness: .6 })));
              leaf.scale.set(1.6, .25, .8); leaf.position.set(.1, .5, .1); leaf.rotation.y = .6; break
            }
            case 'Água': {
              let gl = new THREE.Mesh(new THREE.CylinderGeometry(.24, .2, .6, 20), ingredientMaterial(name, { color: 0xd7ecf2, roughness: .05, transparent: true, opacity: .3 }));
              gl.position.y = .3; g.add(gl);
              let w = add(put(new THREE.CylinderGeometry(.21, .18, .44, 20), ingredientMaterial(name, { color: 0x9fd4e8, roughness: .08, transparent: true, opacity: .55 })));
              w.position.y = .26; break
            }
            case 'Gelo': {
              for (let i = 0; i < 3; i++) {
                let c = add(put(softBox(.26, .26, .26), ingredientMaterial(name, { color: 0xcfeef7, roughness: .06, metalness: .1, transparent: true, opacity: .62 })));
                c.position.set((i % 2) * .3 - .15, .14, Math.floor(i / 2) * .3 - .15); c.rotation.y = i * .6
              } break
            }
            case 'Fermento': {
              let p = add(put(softBox(.42, .28, .06), ingredientLabel(name, '#e5b96d')));
              p.position.y = .14; p.rotation.y = -.4;
              let st = add(put(softBox(.44, .07, .065), ingredientMaterial(name, { color: 0x7a4b31, roughness: .7 })));
              st.position.set(0, .2, .002); st.rotation.y = -.4; break
            }
            case 'Azeite': {
              let b = add(put(new THREE.CylinderGeometry(.2, .22, .55, 18), ingredientMaterial(name, { color: 0x6f8f3d, roughness: .15, transparent: true, opacity: .85 })));
              b.position.y = .28;
              let n = add(put(new THREE.CylinderGeometry(.07, .09, .28, 14), ingredientMaterial(name, { color: 0x6f8f3d, roughness: .15, transparent: true, opacity: .85 })));
              n.position.y = .68;
              add(put(new THREE.CylinderGeometry(.085, .085, .12, 14), ingredientMaterial(name, { color: 0x8a6a3a, roughness: .4 }))).position.y = .86;
              add(put(new THREE.CylinderGeometry(.21, .21, .16, 18, 1, true), ingredientMaterial(name, { color: 0xf5f2e8, roughness: .7, side: THREE.DoubleSide }))).position.y = .3; break
            }
            case 'Alecrim': {
              for (let i = 0; i < 3; i++) {
                let spr = add(put(new THREE.CylinderGeometry(.02, .02, .7, 6), ingredientMaterial(name, { color: 0x4a6b2f, roughness: .7 })));
                spr.position.set((i - 1) * .16, .05, (i - 1) * .08); spr.rotation.z = (i - 1) * .35;
                for (let k = 0; k < 7; k++) {
                  let n = add(put(new THREE.CylinderGeometry(.008, .008, .1, 4), ingredientMaterial(name, { color: 0x5d8a3c, roughness: .6 })));
                  n.rotation.z = (i - 1) * .35 - .9; n.position.set((i - 1) * .16 + Math.sin((i - 1) * .35) * .03, .05 - .3 + k * .08, (i - 1) * .08)
                }
              } break
            }
            case 'Focaccia': {
              let f = add(put(new THREE.CylinderGeometry(.42, .38, .14, 30), ingredientMaterial(name, { color: 0xdcae6a, roughness: .8 }))); f.position.y = .07;
              for (let i = 0; i < 10; i++) {
                let a = i * .63, r = .22 + (i % 3) * .07;
                let dim = add(put(new THREE.SphereGeometry(.035, 8, 6), ingredientMaterial(name, { color: 0xb9894a, roughness: .9 })));
                dim.position.set(Math.cos(a) * r, .145, Math.sin(a) * r);
                if (i % 2 === 0) {
                  let ro = add(put(new THREE.CylinderGeometry(.012, .012, .14, 4), ingredientMaterial(name, { color: 0x4a6b2f, roughness: .7 })));
                  ro.rotation.x = Math.PI / 2; ro.position.set(Math.cos(a) * r, .15, Math.sin(a) * r)
                }
              } break
            }
            case 'Leite': {
              let b = add(put(softBox(.34, .62, .34), ingredientMaterial(name, { color: 0xf7f5ee, roughness: .55 }))); b.position.y = .31;
              add(put(softBox(.36, .12, .36), ingredientMaterial(name, { color: 0xeee9dc, roughness: .55 }))).position.y = .66;
              let sp = add(put(new THREE.CylinderGeometry(.05, .05, .14, 10), ingredientMaterial(name, { color: 0xdcd7c6, roughness: .5 }))); sp.position.set(.1, .68, 0);
              add(put(softBox(.35, .16, .35), ingredientLabel(name, '#c3d499'))).position.y = .3; break
            }
            case 'Sal': {
              let sh = add(put(new THREE.CylinderGeometry(.16, .2, .42, 16), ingredientMaterial(name, { color: 0xf7f5ee, roughness: .35 }))); sh.position.y = .21;
              add(put(new THREE.CylinderGeometry(.17, .17, .12, 16), ingredientMaterial(name, { color: 0xbfc9c9, roughness: .3, metalness: .5 }))).position.y = .48; break
            }
            case 'Morango': {
              let b = add(put(new THREE.SphereGeometry(.26, 20, 16), ingredientMaterial(name, { color: 0xd8443c, roughness: .4 })));
              b.scale.set(.9, 1.1, .9); b.position.y = .26;
              for (let i = 0; i < 8; i++) {
                let s = add(put(new THREE.SphereGeometry(.018, 6, 4), ingredientMaterial(name, { color: 0xf6e6a0, roughness: .5 })));
                let a = i * .8; s.position.set(Math.cos(a) * .18, .2 + (i % 4) * .08, Math.sin(a) * .18)
              }
              let cr = add(put(new THREE.ConeGeometry(.14, .12, 6), ingredientMaterial(name, { color: 0x5d8a3c, roughness: .6 })));
              cr.position.y = .48; cr.rotation.x = Math.PI; break
            }
            default: { let s = add(put(new THREE.SphereGeometry(.3, 20, 14), ingredientMaterial(name, { color: 0xd8d2c2, roughness: .5 }))); s.position.y = .3 }
          }
          // Collapse repeated seeds, leaves and crumbs into one surface per material.
          const surfaces = new Map();
          g.children.forEach(mesh => {
            mesh.updateMatrix(); mesh.geometry.applyMatrix4(mesh.matrix);
            if (!surfaces.has(mesh.material)) surfaces.set(mesh.material, []);
            surfaces.get(mesh.material).push(mesh.geometry);
          });
          g.clear();
          surfaces.forEach((parts, material) => g.add(put(mergeSurfaces(parts), material)));
          return g
        }

        /* ---------- Realce e hitbox dos ingredientes ---------- */
        function foodOutline(g) {
          let m = new THREE.MeshBasicMaterial({ color: 0x9dff62, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
          let list = [];
          g.traverse(o => { if (o.isMesh && o.geometry && !o.userData.outline && !o.userData.hitbox) list.push(o) });
          list.forEach(o => {
            let s = new THREE.Mesh(o.geometry, m);
            s.scale.setScalar(1.14); s.renderOrder = 9;
            s.castShadow = false; s.receiveShadow = false;
            s.userData.outline = true;
            o.add(s)
          });
          return { mat: m, parts: list }
        }
        function foodTints(g) {
          let out = [];
          g.traverse(o => {
            if (!o.isMesh || o.userData.outline || !o.material || !o.material.emissive) return;
            out.push({ m: o, hex: o.material.emissive.getHex(), ei: o.material.emissiveIntensity })
          });
          return out
        }
        function meshBox(g) {
          let b = new THREE.Box3(), any = false;
          try {
            g.updateMatrixWorld(true);
            let inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
            g.traverse(o => {
              if (!o.isMesh || o.userData.outline || o.userData.hitbox) return;
              if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
              if (!o.geometry.boundingBox) return;
              let m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
              b.union(o.geometry.boundingBox.clone().applyMatrix4(m)); any = true
            })
          } catch (e) { }
          return any ? b : null
        }
        function foodHit(g) {
          let sz = new THREE.Vector3(1, .8, 1), c = new THREE.Vector3(0, .35, 0);
          let b = meshBox(g);
          if (b) { b.getSize(sz); b.getCenter(c) }
          else { sz.set(1, .8, 1); c.set(0, .35, 0) }
          let hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.66, sz.x + .30), Math.max(.66, sz.y + .24), Math.max(.66, sz.z + .30)),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
          hit.position.copy(c); hit.userData.hitbox = true; hit.castShadow = false; hit.receiveShadow = false;
          return hit
        }
        function foodSize(g) {
          let w = .7, h = .8, d = .7;
          let b = meshBox(g);
          if (b) { let s = new THREE.Vector3(); b.getSize(s); if (isFinite(s.x) && s.x > .05) { w = s.x; h = s.y || h; d = s.z || d } }
          return { w, h, d }
        }

        /* ---------- Legendas (sprites de texto) ---------- */
        function labelSprite(text, dim) {
          let cv = document.createElement('canvas');
          let g = cv.getContext('2d');
          g.font = 'bold 34px Segoe UI,system-ui,sans-serif';
          let w = Math.ceil(Math.min(430, Math.max(120, g.measureText(text).width + 52)));
          cv.width = w; cv.height = 88;
          g = cv.getContext('2d');
          g.font = 'bold 34px Segoe UI,system-ui,sans-serif';
          g.fillStyle = dim ? 'rgba(238,244,234,.95)' : 'rgba(247,251,242,.96)';
          if (g.roundRect) { g.beginPath(); g.roundRect(0, 6, w, 76, 38); g.fill() }
          else g.fillRect(0, 6, w, 76);
          g.fillStyle = dim ? '#243b2c' : '#14261a';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(text, w / 2, 46);
          let t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
          let s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
          s.scale.set(w * .0041, .36, 1);
          s.material.opacity = 0; s.visible = false; return s
        }

        /* ---------- Candidatos da etapa (arrastáveis) ---------- */
        let cand = [], pantry = {}, bowlPos = new THREE.Vector3(0, .24, .05), sinkPos = new THREE.Vector3(-5.2, -.05, -2.35);
        let doughHit = new THREE.Mesh(new THREE.SphereGeometry(.66, 18, 12), new THREE.MeshBasicMaterial({ visible: false }));
        doughHit.position.set(bowlPos.x, .34, bowlPos.z); doughHit.visible = false; scene.add(doughHit);
        function tableRecipeNames(recipe) {
          let out = []; if (!recipe) return out;
          recipe.steps.forEach(s => { let n = s[0]; if (n === 'Massa') return; if (!out.includes(n)) out.push(n) });
          return out
        }
        function tableDoughDone() {
          if (!current || !current.recipe) return false;
          for (let i = 0; i < current.step && i < current.recipe.steps.length; i++) {
            let a = current.recipe.steps[i][1];
            if (a === 'Modelar' || a === 'Sovar') return true
          }
          return false
        }
        function tableHalfWidth() {
          try {
            let v = new THREE.Vector3(1, -.25, 3.12).project(camera);
            if (v && isFinite(v.x) && Math.abs(v.x) > .02) { let w = 1 / Math.abs(v.x); if (w > 1.4 && w < 14) return w }
          } catch (e) { }
          return 2.8
        }
        function buildTableLayout(names) {
          let n = names.length, hw = tableHalfWidth();
          let span = n <= 1 ? 0 : Math.min(7.4, 2 * hw * (n <= 4 ? .72 : .74), (n - 1) * 1.62);
          let step = n > 1 ? span / (n - 1) : 0;
          let scale = n > 1 ? Math.min(1, Math.max(.7, step / 1.05)) : 1;
          let slots = {};
          names.forEach((nm, i) => slots[nm] = { x: n <= 1 ? 0 : -span / 2 + step * i, z: 3.12 });
          return { key: names.join('|'), names: names.slice(), slots, scale, step }
        }
        let tableLayout = null;
        function tableSlot(names, nm) {
          if (!tableLayout || tableLayout.key !== names.join('|')) tableLayout = buildTableLayout(names);
          let s = tableLayout.slots[nm] || { x: 0, z: 3.12 };
          return { x: s.x, z: s.z, scale: tableLayout.scale, step: tableLayout.step || 0 }
        }
        function dropFood(c) { if (c.retire) return; c.retire = true; c.back = true; c.locked = false }
        function spawnStep(correct, decoys, content, zone, action) {
          kneadBlob.visible = false; doughHit.visible = false;
          let recipe = current && current.recipe;
          let all = recipe ? tableRecipeNames(recipe) : [correct, ...decoys];
          if (content === 0) { foodStates = {}; cand.forEach(c => scene.remove(c.o)); cand = []; pantry = {}; tableLayout = null; resize() }
          if (action === 'Modelar' || action === 'Sovar') {
            kneadBlob.visible = true; kneadBlob.position.set(bowlPos.x, .30, bowlPos.z); kneadBlob.scale.set(.34, .22, .34); kneadBlob.rotation.set(0, 0, 0);
            doughHit.visible = true; showZone([bowlPos.x, bowlPos.z, 1.05]);
            phase = 'dough'; required = 'dough';
            $('feedback').textContent = `A massa está na tigela. Clique nela com as mãos para ${action.toLowerCase()}.`;
            $('sceneHint').textContent = `🤲 Clique na massa na tigela para ${action.toLowerCase()}`;
            return
          }
          let doughDone = tableDoughDone();
          let bakingCookies = correct === 'Cookies' && doughDone;
          let unlocked = bakingCookies ? ['Cookies'] : all.filter(nm => nm !== 'Cookies' && nm !== 'Focaccia' || doughDone);
          if (bakingCookies) {
            $('feedback').textContent = 'Seis cookies modelados! Arraste o lote até a assadeira e depois leve-a ao forno.';
            $('sceneHint').textContent = '🍪 6 cookies → assadeira → forno';
          }
          let need = {}; unlocked.forEach(nm => need[nm] = 1);
          all.forEach(nm => {
            let d = pantry[nm];
            if (!need[nm]) {
              if (d) { if (!(d.absorb > 0 || d.retire)) dropFood(d); delete pantry[nm] }
              return
            }
            let alive = !!d && cand.includes(d) && !d.retire && !d.absorb && !d.locked;
            if (!alive) {
              let slot = tableSlot(unlocked, nm), o = makeFood(nm);
              o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true } });
              let fs = foodSize(o);
              o.add(foodHit(o));
              let ol = foodOutline(o), tints = foodTints(o);
              let scale = bakingCookies ? 1.6 : Math.min(slot.scale || 1, (slot.step || 1) * .94 / (fs.w || .6));
              o.position.set(slot.x, -.25, slot.z);
              o.scale.setScalar(scale);
              let lb = labelSprite(bakingCookies ? '6 cookies' : nm); lb.position.y = 1.02; o.add(lb);
              let dr = { o, home: new THREE.Vector3(slot.x, -.25, slot.z), restY: -.25, kind: 'food', name: nm, label: lb, pinT: 2.6, outMat: ol.mat, outs: ol.parts, tints, hlF: 0, baseScale: scale };
              o.userData.drag = dr;
              scene.add(o); cand.push(dr); pantry[nm] = dr;
            } else {
              let slot = tableSlot(unlocked, nm);
              d.home.set(slot.x, -.25, slot.z); d.restY = -.25;
              if (!d.back && !d.snap && !d.snapBoard && !d.snapForm && drag !== d && Math.abs(d.o.position.x - slot.x) > .02) d.back = true;
              d.pinT = Math.max(d.pinT, 0)
            }
          });
          showZone(zone === 'sink' ? [-5.2, -2.35, 1.45] : zone === 'form' ? [2.2, -2.05, 1.15] : [0, .05, 1.3]);
          phase = 'ingredient'; required = null
        }
        function showZone(z) {
          if (!z) { ring.visible = false; return }
          ringBase = z[2]; ring.position.set(z[0], -.22, z[1]); ring.scale.setScalar(z[2]); ring.visible = true
        }
        let boardPos = new THREE.Vector3(-3.05, -.11, 1.5);
        let formItemPos = new THREE.Vector3(2.2, -.19, -2.05);
        let ovenSlot = new THREE.Vector3(4.7, .625, -3.42);
        let pourTop = new THREE.Vector3(0, 1.3, .05);
        function awaitTool(kind) {
          if (kind === 'dough') return; phase = 'action'; required = kind;
          showZone({ spoon: [0, .05, 1.3], sieve: [0, .05, 1.3], knife: [-3.1, 1.5, 1.7], pan: [3.9, .65, 1], form: [4.7, -2.3, 1.35] }[kind]);
          let t = tools.find(x => x.kind === kind); if (t) { t.glow = 1.6; t.back = false }
        }
        const chopDuration = 2.2;
        let chopElapsed = 0;
        const chopStart = new THREE.Vector3(), chopStartRotation = new THREE.Quaternion(), chopTargetRotation = new THREE.Quaternion(), chopCorner = new THREE.Vector3(), chopTarget = new THREE.Vector3(), chopEuler = new THREE.Euler(); let chopBladeBox = null;
        let pieces = [], chopX = -3.1, chopZ = 1.5, chopName = null;
        function chopFromLocked() {
          chopElapsed = 0; chopStart.copy(knife.position); chopStartRotation.copy(knife.quaternion); chopBladeBox = meshBox(knife);
          let c = cand.find(x => x.locked && !x.absorb && !x.retire);
          if (c) { chopX = c.o.position.x; chopZ = c.o.position.z; chopName = c.name }
          else { chopX = -3.1; chopZ = 1.5; chopName = null }
        }
        function makePiece(name) {
          const g = new THREE.Group();
          if (name === 'Limão') return makeHalfLemon();
          else if (name === 'Chocolate') {
            for (let i = 0; i < 3; i++) {
              let b = put(new THREE.BoxGeometry(.2 + random() * .12, .09, .17 + random() * .1), mat({ color: 0x4a2c18, roughness: .35 }));
              b.position.set((i - 1) * .24, .045, (random() - .5) * .2); b.rotation.y = random() * 6; b.rotation.z = (random() - .5) * .4; g.add(b)
            }
          }
          else if (name === 'Alecrim') {
            for (let i = 0; i < 4; i++) {
              let t = put(new THREE.CylinderGeometry(.014, .02, .3, 6), mat({ color: 0x4a6b2f, roughness: .7 }));
              t.rotation.z = Math.PI / 2 + (random() - .5) * .6; t.rotation.y = random() * 6;
              t.position.set((i - 1.5) * .18, .025, (random() - .5) * .3); g.add(t)
            }
          }
          else {
            for (let i = 0; i < 3; i++) {
              let b = put(new THREE.SphereGeometry(.11, 10, 8), mat({ color: mixColors[name] || 0xd9c9a0, roughness: .7 }));
              b.scale.y = .6; b.position.set((i - 1) * .2, .06, (random() - .5) * .15); g.add(b)
            }
          }
          return g
        }
        function doSplit(name, x, z) {
          if (name === 'Limão') { foodStates[name] = 'cut'; return }
          let p = makePiece(name);
          p.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true } });
          p.position.set(x, -.11, z); p.rotation.y = (random() - .5) * .9;
          scene.add(p);
          pieces.push({ o: p, vy: 1.1, restY: -.11, absorb: 1.1, name })
        }
        function finishTool() { if (sceneHooks && sceneHooks.onToolDone) sceneHooks.onToolDone() }
        function startPour(d, stay) {
          d.locked = true; d.back = false;
          d.snap = false; d.snapBoard = false; d.snapForm = false;
          pour = { d, stay, t: 0 }; pulse = 1;
          stream.material.color.setHex(mixColors[d.name] || 0xd9c9a0)
        }
        function startKnead() {
          if (kneadT > 0 || phase !== 'dough') return;
          kneadFromPos.copy(cursorHand.position); kneadFromQuat.copy(cursorHand.quaternion); kneadFromScale = cursorHand.scale.x;
          kneadT = kneadDur; phase = 'kneading'; required = null; handPose = 'knead';
          kneadBlob.visible = true; kneadBlob.position.set(bowlPos.x, .30, bowlPos.z); kneadBlob.scale.set(.34, .22, .34); kneadBlob.rotation.set(0, 0, 0);
          doughHit.visible = false; pulse = 1;
          $('feedback').textContent = 'Modelando a massa com as mãos... 🤲'
        }
        function startBake(secs) { if (formPlaced) { ovenT = secs; bakeDuration = secs; bakeEl = 0; bakedTinted = false; renderOvenDoorCanvas('baking', currentOvenTemp, secs) } }
        function toggleOvenDoor() {
          doorTarget = doorTarget > .5 ? 0 : 1;
          let fm = toolMeta('form');
          if (doorTarget > .5) fm.noPick = false;
          else {
            fm.noPick = true;
            if (formPlaced && sceneHooks && sceneHooks.onOvenReady) sceneHooks.onOvenReady()
          }
        }
        function reset3D() {
          foodStates = {}; chopT = 0; chopElapsed = 0; chopName = null;
          cand.forEach(c => scene.remove(c.o)); cand = []; pantry = {}; tableLayout = null; pieces.forEach(p => scene.remove(p.o)); pieces = []; ring.visible = false; phase = 'idle'; required = null;
          formItems.forEach(o => { if (o.parent) o.parent.remove(o) }); formItems = []; ovenT = 0; bakeDuration = 0; doorTarget = 0; ovenDoorT = 0; bakedTinted = false; ovenLight.intensity = 0; ovenOutT = 0; slideT = 0; formPlaced = false; bakeEl = 0; pour = null; stream.visible = false;
          toolMeta('form').noPick = false; formG.position.set(2.2, -.25, -2.05);
          waterOn = false; waterT = 0; wStream.visible = false; drops.forEach(dp => dp.m.material.opacity = 0); ovenSmoke.forEach(s => s.m.material.opacity = 0);
          mixTgt = 0; mixCur = 0; mixN = 0; mixLiq = 0; mixCol.setHex(0xe8d9b0); mixMesh.material.color.copy(mixCol); mixMesh.material.roughness = .65; mixMesh.material.opacity = .96; mixMesh.visible = false;
          kneadT = 0; kneadBlob.visible = false; kneadBlob.scale.set(.34, .22, .34); kneadBlob.rotation.set(0, 0, 0);
          doughHit.visible = false; phase = 'idle'; required = null; handPose = 'open'; handGlow = 0; skinMat.emissiveIntensity = 0; cursorFade = 0; cursorHand.visible = false;
          tools.forEach(t => { t.glow = 0; t.back = true }); renderOvenDoorCanvas('standby', 180, 12)
        }

        /* ---------- Mistura preenchendo a tigela (líquido ou massa) ---------- */
        let mixMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), mat({ color: 0xe8d9b0, roughness: .65, metalness: .04, transparent: true, opacity: .96 }));
        mixMesh.visible = false; bowlG.add(mixMesh);
        let mixColors = { Manteiga: 0xf6d67e, 'Açúcar': 0xf9f5ea, Ovo: 0xffdf8d, Farinha: 0xe6d3a3, Chocolate: 0x5a3620, Massa: 0xe8cf9a, 'Limão': 0xeef2a8, 'Água': 0xbcd9e8, Gelo: 0xcfeef7, Fermento: 0xe9d9a0, Azeite: 0xd8d09a, Alecrim: 0x6d8f4e, Leite: 0xf5f0e1, Sal: 0xf2f2ee, Morango: 0xd84a5f, Salgada: 0xd9c9a0 };
        let mixCur = 0, mixTgt = 0, mixN = 0, mixLiq = 0, mixCol = new THREE.Color(0xe8d9b0);
        function addMix(name, amt) {
          amt = amt || .16; mixTgt = Math.min(.94, mixTgt + amt); mixN++;
          mixCol.lerp(new THREE.Color(mixColors[name] || 0xd9c9a0), Math.min(.85, 1.7 / mixN));
          mixLiq += ['Água', 'Leite', 'Azeite', 'Limão', 'Gelo'].includes(name) ? 1 : 0;
          mixMesh.material.roughness = Math.max(.14, .8 - mixLiq * .14);
          mixMesh.material.opacity = Math.min(.97, .85 + mixLiq * .03);
          mixMesh.material.color.copy(mixCol)
        }
        let stream = new THREE.Mesh(new THREE.CylinderGeometry(.045, .02, 1, 10), new THREE.MeshStandardMaterial({ color: 0xd9c9a0, transparent: true, opacity: .8, roughness: .15 }));
        stream.visible = false; scene.add(stream);

        /* ---------- Vapor ---------- */
        let steam = [];
        for (let i = 0; i < 10; i++) {
          let m = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
          scene.add(m); steam.push({ m, ph: Math.random(), x: (random() - .5) * .9, z: .05 + (random() - .5) * .7 })
        }

        /* ---------- Sistema de arrastar (raycasting) ---------- */
        let tools = [{ o: knife, kind: 'knife' }, { o: spoon, kind: 'spoon' }, { o: sieve, kind: 'sieve' }, { o: panG, kind: 'pan' }, { o: formG, kind: 'form' }];
        tools.forEach(t => { t.home = t.o.position.clone(); t.restY = t.home.y; t.o.userData.drag = t });
        [['knife', 'Faca'], ['spoon', 'Colher'], ['sieve', 'Peneira'], ['pan', 'Panela'], ['form', 'Assadeira']].forEach(([k, txt]) => {
          let t = tools.find(x => x.kind === k); let lb = labelSprite(txt, true);
          lb.position.y = (k === 'pan' || k === 'form') ? .9 : .95; lb.scale.multiplyScalar(.8); t.o.add(lb);
          t.label = lb; t.pinT = 4; t.labelA = 0
        });
        tools.forEach(t => { t.hl = 0; t.labelBase = t.label.scale.clone(); t.haloY = t.kind === 'pan' ? -.196 : -.244 });
        /* Troca os utensílios com modelo real e ativa o mesmo realce dos ingredientes */
        const TOOL_MODEL = {
          knife: { name: 'faca', fit: { w: 1.8, h: 1.8, d: 1.8, rot: [-Math.PI / 2, 0, 0] } },
          pan: { name: 'panela', fit: { w: 2.55, h: 1.45, d: 2.55, rot: [0, 0, 0] } }
        };
        tools.forEach(t => {
          let cfg = TOOL_MODEL[t.kind];
          if (cfg) {
            let mo = modelInstance(cfg.name, cfg.fit);
            if (mo) {
              t.o.children.filter(c => c.isMesh).forEach(c => t.o.remove(c));
              t.o.add(mo); t.modelName = cfg.name
            }
          }
        });
        tools.forEach(t => {
          t.hlF = 0; t.tintsOn = false;
          t.o.add(foodHit(t.o));
          let ol = foodOutline(t.o);
          t.outMat = ol.mat; t.outs = ol.parts; t.tints = foodTints(t.o)
        });
        let toolHalo = new THREE.Mesh(new THREE.RingGeometry(.56, .78, 56), new THREE.MeshBasicMaterial({ color: 0xffc95e, transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
        toolHalo.rotation.x = -Math.PI / 2; toolHalo.renderOrder = 20; toolHalo.visible = false; scene.add(toolHalo);
        let toolArrow = new THREE.Mesh(new THREE.ConeGeometry(.21, .5, 20), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: .95, depthWrite: false, depthTest: false }));
        toolArrow.rotation.x = Math.PI; toolArrow.renderOrder = 21; toolArrow.visible = false; scene.add(toolArrow);
        let ray = new THREE.Raycaster(), ndc = new THREE.Vector2(),
          plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit3 = new THREE.Vector3(), drag = null;
        function toNdc(e) {
          let r = renderer.domElement.getBoundingClientRect();
          ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
        }
        function objs() { return [...tools.filter(t => !t.noPick), ...cand.filter(c => !c.locked)].map(d => d.o) }
        function pickAt() {
          ray.setFromCamera(ndc, camera);
          let hits = ray.intersectObjects(objs(), true); if (!hits.length) return null;
          let o = hits[0].object; while (o && !(o.userData && o.userData.drag)) o = o.parent;
          return o ? o.userData.drag : null
        }
        let cnv = renderer.domElement;
        let dragPointer = null;
        cnv.style.cursor = 'none';
        cnv.addEventListener('pointerdown', e => {
          if (mobileNavigation && !interactionEnabled) return;
          cursorOn = true;
          if (drag) return; toNdc(e); ray.setFromCamera(ndc, camera);
          let dispHit = ray.intersectObjects([dispScreen, dispBezel], true);
          if (dispHit.length) { showOvenPanel(); return }
          let dh = ray.intersectObjects([doorPanel, doorGlass, doorHandle], false);
          if (dh.length) { if (formPlaced && ovenT <= 0) showOvenPanel(); else toggleOvenDoor(); return }
          let wh = ray.intersectObjects([fp1, fp2, fp3, ftip], false);
          if (wh.length) { waterOn = !waterOn; return }
          if (phase === 'dough' && doughHit.visible && ray.intersectObject(doughHit, false).length) { startKnead(); return }
          let d = pickAt(); if (!d) return;
          dragPointer = { clientX: e.clientX, clientY: e.clientY };
          drag = d; d.lift = d.o.position.y + .5; plane.constant = -d.lift;
          ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, hit3);
          d.off = { x: d.o.position.x - hit3.x, z: d.o.position.z - hit3.z };
          d.o.rotation.z = 0; cnv.setPointerCapture(e.pointerId)
        });
        cnv.addEventListener('pointermove', e => {
          if (mobileNavigation && !interactionEnabled) return;
          toNdc(e); cursorOn = true;
          if (!drag) {
            ray.setFromCamera(ndc, camera);
            let dispHover = ray.intersectObjects([dispScreen, dispBezel], true);
            if (dispHover.length) { handHot = false; return }
            let overDough = phase === 'dough' && doughHit.visible && ray.intersectObject(doughHit, false).length > 0;
            let h = pickAt(); hovered = h; handHot = !!h || overDough; return
          }
          dragPointer = { clientX: e.clientX, clientY: e.clientY };
          moveDraggedObject();
        });
        function moveDraggedObject() {
          toNdc(dragPointer);
          ray.setFromCamera(ndc, camera);
          if (!ray.ray.intersectPlane(plane, hit3)) return;
          let nx = THREE.MathUtils.clamp(hit3.x + drag.off.x, -6.5, 6.5),
            nz = THREE.MathUtils.clamp(hit3.z + drag.off.z, -3.7, 3.9);
          drag.tilt = THREE.MathUtils.clamp((nx - drag.o.position.x) * .9, -.45, .45);
          drag.o.position.x = nx; drag.o.position.z = nz;
          if (drag.kind === 'form') {
            let distOven = Math.hypot(nx - 4.7, nz - (-3.0));
            if (distOven < 2.6 && doorTarget < .5) doorTarget = 1
          }
        }
        function endDrag(e) {
          dragPointer = null;
          if (e && cnv.hasPointerCapture(e.pointerId)) cnv.releasePointerCapture(e.pointerId);
          if (!drag) return; let d = drag; drag = null; hovered = null; d.pinT = 1.2;
          let x = d.o.position.x, z = d.o.position.z;
          if (d.kind === 'food') {
            let distToForm = Math.hypot(x - formG.position.x, z - formG.position.z);
            let zone = Math.hypot(x, z - .05) < 1.3 ? 'bowl' : Math.hypot(x + 5.2, z + 2.35) < 1.5 ? 'sink' : Math.hypot(x + 3.1, z - 1.5) < 1.7 ? 'board' : distToForm < 1.4 ? 'form' : null;
            if (!zone) { d.back = true; d.o.rotation.z = 0; return }
            let verdict = sceneHooks ? sceneHooks.onFood(d.name, zone) : 'ok';
            if (verdict === 'pour') { pulse = 1; addMix(d.name); startPour(d, false) }
            else if (verdict === 'wash') { d.locked = true; d.pause = 0.75; d.back = false; d.absorb = 0; d.o.position.copy(sinkPos); pulse = 1; waterT = 2.0; setTimeout(() => { if (d) d.locked = false; }, 750); }
            else if (verdict === 'absorb') { d.absorb = .55; d.absorbPos = sinkPos; pulse = 1; waterT = 1.8 }
            else if (verdict === 'in-bowl') { d.locked = true; addMix(d.name); startPour(d, true) }
            else if (verdict === 'plop') { d.locked = true; d.absorb = .55; d.absorbPos = bowlPos; addMix(d.name, .18); pulse = 1 }
            else if (verdict === 'on-board') { d.locked = true; d.snapBoard = true }
            else if (verdict === 'on-form') {
              d.locked = true; if (d.label) { d.label.visible = false; d.labelA = 0 }
              if (d.outMat) d.outMat.opacity = 0;
              if (d.tints) d.tints.forEach(t => { t.m.material.emissive.setHex(t.hex); t.m.material.emissiveIntensity = t.ei });
              formG.add(d.o); d.o.position.set(0, 0.06, 0); d.o.rotation.set(0, 0, 0);
              if (d.o.userData.cookieBatch) d.o.scale.setScalar(1);
              let fm = toolMeta('form'); d.o.userData.drag = fm;
              d.o.traverse(ch => { if (ch.isMesh) ch.userData.drag = fm });
              formItems.push(d.o); cand = cand.filter(y => y !== d); if (pantry[d.name] === d) delete pantry[d.name]; pulse = 1
            }
            else if (verdict === 'wrong') { flashT = 1; d.back = true }
            else { d.back = true }
          }
          else {
            let zn = { spoon: [0, .05, 1.3], sieve: [0, .05, 1.3], knife: [-3.1, 1.5, 1.7], pan: [3.9, .65, 1], form: [4.7, -2.3, 1.5] }[d.kind];
            let inZone = Math.hypot(x - zn[0], z - zn[1]) < zn[2] || (d.kind === 'form' && Math.hypot(x - 4.7, z - (-3.0)) < 1.75);
            if (!inZone) {
              if (d.kind === 'form') d.home.set(2.2, -.25, -2.05);
              d.back = true; d.o.rotation.z = 0; return
            }
            if (d.kind === 'form') doorTarget = 1;
            let verdict = sceneHooks ? sceneHooks.onTool(d.kind) : 'none';
            if (verdict === 'ok') {
              if (d.kind === 'spoon') stirT = 2.2; if (d.kind === 'knife') chopT = chopDuration;
              if (d.kind === 'sieve') sieveT = 1.4; if (d.kind === 'pan') bakeT = 2.6;
              if (d.kind === 'form') {
                slideT = .95; formPlaced = true; toolMeta('form').noPick = true;
                d.back = false; d.o.rotation.z = 0;
                setTimeout(() => {
                  doorTarget = 0;
                  setTimeout(() => { if (sceneHooks && sceneHooks.onOvenReady) sceneHooks.onOvenReady() }, 450);
                }, 950)
              }
              pulse = 1;
              if (d.kind === 'knife') chopFromLocked();
              else if (d.kind !== 'form') cand.forEach(c => { if (c.locked && !c.absorb && !c.retire) c.absorb = .55 });
              if (d.kind !== 'form') d.back = true; d.o.rotation.z = 0
            }
            else if (verdict === 'wrong') { flashT = 1; d.back = true }
            else { d.back = true }
          }
        }
        cnv.addEventListener('pointerup', endDrag);
        cnv.addEventListener('pointercancel', e => {
          dragPointer = null;
          if (drag) { drag.back = true; drag.o.rotation.z = 0; drag = null }
          hovered = null; cursorOn = false;
          if (cnv.hasPointerCapture(e.pointerId)) cnv.releasePointerCapture(e.pointerId);
        });
        cnv.addEventListener('pointerleave', () => { if (!drag) { hovered = null; handHot = false; cursorOn = false } });

        /* ---------- Loop de animação ---------- */
        let T = 0, pulse = 0, flashT = 0, stirT = 0, chopT = 0, sieveT = 0, bakeT = 0, ang = 0, last = performance.now();
        let ovenT = 0, bakeDuration = 0, ovenDoorT = 0, doorTarget = 0, bakedTinted = false, ovenOutT = 0, slideT = 0, formPlaced = false, pour = null, waterOn = false, waterT = 0, bakeEl = 0, kneadT = 0, kneadDur = 3.2;
        let kneadOutV = new THREE.Vector3(), kneadInV = new THREE.Vector3(), kneadTip = new THREE.Vector3(), kneadFwd = new THREE.Vector3(), kneadEuler = new THREE.Euler();
        let kneadFromPos = new THREE.Vector3(), kneadToPos = new THREE.Vector3(), kneadFromQuat = new THREE.Quaternion(), kneadToQuat = new THREE.Quaternion(), kneadFromScale = 1, kneadToScale = 1;
        let phase = 'idle', required = null, hovered = null;
        let handEuler = [-1.20, Math.PI, 0];
        let camBase = camera.position.clone();
        function toolMeta(k) { return tools.find(t => t.kind === k) }
        function frame(now) {
          if (glLost) return;
          requestAnimationFrame(frame);
          if (document.hidden || !current || current.finished || !root.clientWidth) { last = now; return }
          if (mobileQuality && now - last < 1000 / 30) return;
          const elapsed = Math.max(0, (now - last) / 1000);
          let dt = Math.min(.05, elapsed); last = now; T += dt;
          if (drag && dragPointer && portraitViewport) {
            const bounds = root.getBoundingClientRect(), edge = 48;
            const direction = dragPointer.clientX < bounds.left + edge ? -1 : dragPointer.clientX > bounds.right - edge ? 1 : 0;
            if (direction) {
              const before = root.scrollLeft;
              root.scrollLeft += direction * 260 * dt;
              if (root.scrollLeft !== before) moveDraggedObject();
            }
          }
          if (kneadT <= 0) updateCursorHand(dt, now);
          tools.forEach(d => {
            if (drag === d) return;
            let busy = (d.kind === 'spoon' && stirT > 0) || (d.kind === 'knife' && chopT > 0) || (d.kind === 'sieve' && sieveT > 0) || (d.kind === 'pan' && bakeT > 0) || (d.kind === 'form' && (ovenT > 0 || ovenOutT > 0 || slideT > 0));
            if (d.back && !busy) {
              d.o.position.lerp(d.home, Math.min(1, dt * 4));
              d.o.rotation.x *= Math.max(0, 1 - dt * 6);
              if (d.kind === 'spoon') d.o.rotation.y += (-.6 - d.o.rotation.y) * Math.min(1, dt * 6);
              if (d.kind === 'knife') d.o.rotation.y += (2.65 - d.o.rotation.y) * Math.min(1, dt * 6);
              if (d.o.position.distanceTo(d.home) < .05) { d.back = false; d.o.rotation.z = 0 }
            }
            d.o.rotation.z *= Math.max(0, 1 - dt * 8);
            let wantHl = (hovered === d || drag === d) ? 1 : 0;
            d.hlF = (d.hlF || 0) + (wantHl - (d.hlF || 0)) * Math.min(1, dt * 12);
            if (d.outMat) d.outMat.opacity = .95 * d.hlF;
            if (d.tints) {
              if (d.hlF > .01) { d.tints.forEach(t => { t.m.material.emissive.setHex(0x8ee05a); t.m.material.emissiveIntensity = .26 * d.hlF }); d.tintsOn = true }
              else if (d.tintsOn) { d.tints.forEach(t => { t.m.material.emissive.setHex(t.hex); t.m.material.emissiveIntensity = t.ei }); d.tintsOn = false }
            }
            let sc = 1;
            if (d.glow > 0) { d.glow -= dt; sc = Math.max(1, 1 + Math.sin(T * 7) * .07 * d.glow); if (d.glow <= 0) sc = 1 }
            let wantReq = (phase === 'action' && required === d.kind && drag !== d) ? 1 : 0;
            d.hl = (d.hl || 0) + (wantReq - (d.hl || 0)) * Math.min(1, dt * 6);
            let wantY = d.home.y + (.07 + .05 * Math.sin(T * 3.4)) * d.hl;
            d.o.position.y += (wantY - d.o.position.y) * Math.min(1, dt * 8);
            if (d.hl > .02) {
              sc *= 1 + .05 * Math.sin(T * 6) * d.hl;
              if (d.label && d.labelBase) d.label.scale.copy(d.labelBase).multiplyScalar(1 + .12 * d.hl * (.5 + .5 * Math.sin(T * 6)))
            }
            else if (d.label && d.labelBase) d.label.scale.copy(d.labelBase);
            sc *= 1 + .045 * d.hlF;
            d.o.scale.setScalar(sc)
          });
          let reqTool = (phase === 'action' && required) ? tools.find(t => t.kind === required) : null;
          if (reqTool && drag !== reqTool && reqTool.hl > .05) {
            let k = Math.min(1, reqTool.hl);
            toolHalo.visible = toolArrow.visible = true;
            toolHalo.position.set(reqTool.o.position.x, reqTool.haloY, reqTool.o.position.z);
            toolHalo.scale.setScalar(1 + .08 * Math.sin(T * 4));
            toolHalo.material.opacity = (.45 + .30 * Math.abs(Math.sin(T * 2.2))) * k;
            toolArrow.position.set(reqTool.o.position.x, reqTool.home.y + 1.34 + .11 * Math.sin(T * 3), reqTool.o.position.z);
            toolArrow.rotation.y = T * 1.1;
            toolArrow.material.opacity = (.65 + .30 * Math.abs(Math.sin(T * 3))) * k
          }
          else { toolHalo.visible = toolArrow.visible = false }
          cand = cand.filter(c => {
            if (c.retire && c.back) {
              c.o.position.lerp(c.home, Math.min(1, dt * 4));
              if (c.o.position.distanceTo(c.home) < .09) { scene.remove(c.o); return false }
              return true
            }
            if (c.absorb > 0) {
              c.absorb -= dt;
              c.o.position.lerp(c.absorbPos || bowlPos, Math.min(1, dt * 8));
              c.o.scale.setScalar(Math.max(.01, c.absorb / .55));
              if (c.absorb <= 0) { scene.remove(c.o); return false }
              return true
            }
            let wantHl = (hovered === c || drag === c) ? 1 : 0;
            c.hlF = (c.hlF || 0) + (wantHl - (c.hlF || 0)) * Math.min(1, dt * 12);
            if (c.outMat) c.outMat.opacity = .95 * c.hlF;
            if (c.tints) {
              if (c.hlF > .01) { c.tints.forEach(t => { t.m.material.emissive.setHex(0x8ee05a); t.m.material.emissiveIntensity = .26 * c.hlF }); c.tintsOn = true }
              else if (c.tintsOn) { c.tints.forEach(t => { t.m.material.emissive.setHex(t.hex); t.m.material.emissiveIntensity = t.ei }); c.tintsOn = false }
            }
            if (!c.absorb) c.o.scale.setScalar((c.baseScale || 1) * (1 + .045 * c.hlF));
            if (drag === c) return true;
            if (c.snap) {
              c.o.position.lerp(bowlPos, Math.min(1, dt * 5));
              if (c.o.position.distanceTo(bowlPos) < .25) c.snap = false
            }
            if (c.snapBoard) {
              c.o.position.lerp(boardPos, Math.min(1, dt * 6));
              if (c.o.position.distanceTo(boardPos) < .22) c.snapBoard = false
            }
            if (c.snapForm) {
              c.o.position.lerp(formItemPos, Math.min(1, dt * 6));
              if (c.o.position.distanceTo(formItemPos) < .2) c.snapForm = false
            }
            if (c.pause > 0) { c.pause -= dt; if (c.pause <= 0) { c.back = true; c.locked = false; } }
            if (c.back) {
              c.o.position.lerp(c.home, Math.min(1, dt * 4));
              if (c.o.position.distanceTo(c.home) < .05) { c.back = false; c.o.rotation.z = 0 }
            }
            c.o.rotation.z *= Math.max(0, 1 - dt * 8);
            return true
          });
          if (drag) {
            drag.o.position.y += (drag.lift - drag.o.position.y) * Math.min(1, dt * 10);
            if (drag.tilt) { drag.o.rotation.z = -drag.tilt; drag.tilt *= Math.max(0, 1 - dt * 6) }
          }
          [...tools, ...cand].forEach(d => {
            let lb = d.label; if (!lb) return;
            if (d.pinT > 0) d.pinT -= dt;
            let target = (drag === d || hovered === d || d.pinT > 0 || (d.hl || 0) > .05) ? 1 : 0;
            d.labelA = d.labelA || 0; d.labelA += (target - d.labelA) * Math.min(1, dt * 8);
            lb.visible = d.labelA > .02; lb.material.opacity = d.labelA * .95;
            if (lb.material.color) lb.material.color.setHex(((d.hl || 0) > .05 || (d.hlF || 0) > .05) ? 0xffd98a : 0xffffff)
          });
          if (pulse > 0) {
            pulse = Math.max(0, pulse - dt * 2.2);
            let s = 1 + pulse * .07; bowlG.scale.set(s, s, s)
          }
          if (flashT > 0) {
            flashT = Math.max(0, flashT - dt * 2);
            scene.background.setRGB(.14 + flashT * .38, .21, .16 + flashT * .05);
            if (flashT <= 0) scene.background.setHex(0x233629)
          }
          if (stirT > 0) {
            stirT -= dt; ang += dt * 7;
            let tx = Math.cos(ang) * .85, tz = .05 + Math.sin(ang) * .85;
            spoon.position.x += (tx - spoon.position.x) * Math.min(1, dt * 8);
            spoon.position.z += (tz - spoon.position.z) * Math.min(1, dt * 8);
            spoon.position.y += (.98 - spoon.position.y) * Math.min(1, dt * 8);
            spoon.rotation.x += (Math.PI / 2 - spoon.rotation.x) * Math.min(1, dt * 8);
            spoon.rotation.y += (0 - spoon.rotation.y) * Math.min(1, dt * 8);
            spoon.rotation.z += (.15 + Math.sin(T * 3) * .08 - spoon.rotation.z) * Math.min(1, dt * 8);
            if (stirT <= 0) { toolMeta('spoon').back = true; finishTool() }
          }
          else if (chopT > 0) {
            chopElapsed += elapsed; chopT = Math.max(0, chopDuration - chopElapsed);
            const approach = THREE.MathUtils.smoothstep(chopElapsed, 0, .35);
            const progress = THREE.MathUtils.clamp((chopElapsed - .35) / (chopDuration - .35), 0, 1);
            // One deliberate slice for a lemon; short rocking chops for chocolate/herbs.
            const cycles = chopName === 'Limão' ? 1 : 3;
            const cycle = Math.min(.9999, progress) * cycles % 1;
            const down = THREE.MathUtils.smoothstep(cycle, .12, .62);
            const up = THREE.MathUtils.smoothstep(cycle, .74, 1);
            const stroke = down * (1 - up);
            chopTargetRotation.setFromEuler(chopEuler.set(Math.PI / 2, 0, -.08 - stroke * .12));
            knife.quaternion.slerpQuaternions(chopStartRotation, chopTargetRotation, approach);
            // Correct the blade's lowest point so it meets, never penetrates, the board.
            let lowest = 0;
            if (chopBladeBox) {
              lowest = Infinity;
              for (let i = 0; i < 8; i++) {
                chopCorner.set(i & 1 ? chopBladeBox.max.x : chopBladeBox.min.x, i & 2 ? chopBladeBox.max.y : chopBladeBox.min.y, i & 4 ? chopBladeBox.max.z : chopBladeBox.min.z).applyQuaternion(knife.quaternion);
                lowest = Math.min(lowest, chopCorner.y);
              }
            }
            chopTarget.set(chopX - .15 + stroke * .20, -.11 - lowest + .025 + (1 - stroke) * .55, chopZ);
            knife.position.lerpVectors(chopStart, chopTarget, approach);
            knife.userData.cuttingStroke = stroke;
            if (chopT <= 0) {
              if (chopName) doSplit(chopName, chopX, chopZ);
              let c = cand.find(y => y.locked && !y.retire); if (c) { scene.remove(c.o); cand = cand.filter(y => y !== c) }
              toolMeta('knife').back = true; finishTool()
            }
          }
          else if (sieveT > 0) {
            sieveT -= dt;
            sieve.position.set(0, .55 + Math.abs(Math.sin(T * 8)) * .22, .05);
            if (sieveT <= 0) { toolMeta('sieve').back = true; finishTool() }
          }
          else if (bakeT > 0) {
            bakeT -= dt;
            bakeLight.intensity = 6 + Math.sin(T * 26) * 3.5;
            if (bakeT <= 0) { bakeLight.intensity = 0; toolMeta('pan').back = true; finishTool() }
          }
          else if (kneadT > 0) {
            kneadT -= dt;
            let u = 1 - Math.max(0, kneadT) / kneadDur;
            let kin = Math.min(1, u / .16), kout = Math.min(1, (1 - u) / .16), reach = Math.min(kin, kout);
            let cyc = (u * 3) % 1, dip = Math.sin(cyc * Math.PI);
            kneadOutV.set(bowlPos.x + .08, 1.32, bowlPos.z + 1.15);
            kneadInV.set(bowlPos.x, .30, bowlPos.z + .16);
            kneadTip.copy(kneadOutV).lerp(kneadInV, reach * (.52 + .48 * dip));
            kneadToScale = 1.16 + (2.45 - 1.16) * reach;
            kneadToQuat.setFromEuler(kneadEuler.set(1.30 + .20 * dip, -.28, .46, 'XYZ'));
            kneadFwd.set(0, 0, 1).applyQuaternion(kneadToQuat);
            kneadToPos.copy(kneadTip).addScaledVector(kneadFwd, -.30 * kneadToScale);
            let bt = Math.min(1, u / .12);
            cursorHand.visible = true; cursorFade = 1;
            cursorHand.position.lerpVectors(kneadFromPos, kneadToPos, bt);
            cursorHand.quaternion.copy(kneadFromQuat).slerp(kneadToQuat, bt);
            cursorHand.scale.setScalar(kneadFromScale + (kneadToScale - kneadFromScale) * bt);
            poseHand(handRig, 'knead', Math.min(1, dt * 12));
            let sq = 1 + dip * .18;
            kneadBlob.scale.set(.34 * sq, .22 / (sq * .8), .34 * sq);
            kneadBlob.rotation.y += dt * 1.8 * dip;
            skinMat.emissiveIntensity = .05 + .10 * dip;
            if (kneadT <= 0) {
              kneadBlob.visible = false; kneadBlob.scale.set(.34, .22, .34); kneadBlob.rotation.set(0, 0, 0);
              phase = 'idle'; cursorFade = 0; cursorHand.visible = false; skinMat.emissiveIntensity = 0; finishTool()
            }
          }
          else if (ovenT > 0) {
            ovenT -= elapsed; bakeEl += elapsed;
            ovenLight.intensity = 5.5 + Math.sin(T * 27) * 2.4;
            if (!bakedTinted && bakeEl > Math.min(2, (bakeDuration || 10) * .3)) {
              bakedTinted = true;
              const bakedMaterials = new Map();
              formItems.forEach(o => o.traverse(m => {
                if (!m.isMesh || m.userData.outline || m.userData.hitbox || !m.material?.color) return;
                if (!bakedMaterials.has(m.material)) {
                  const baked = m.material.clone(); baked.color.multiplyScalar(.88);
                  bakedMaterials.set(m.material, baked);
                }
                m.material = bakedMaterials.get(m.material);
              }))
            }
            ovenSmoke.forEach(s => {
              s.ph = (s.ph + dt * .6) % 1;
              s.m.position.set(4.7 + s.x + Math.sin(T * 2 + s.ph * 9) * .07, 2.32 + s.ph * .9, -3.5);
              s.m.material.opacity = Math.sin(s.ph * Math.PI) * .25;
              s.m.scale.setScalar(.6 + s.ph)
            });
            renderOvenDoorCanvas('baking', currentOvenTemp, Math.max(0, Math.ceil(ovenT)));
            if (ovenT <= 0) {
              ovenLight.intensity = 0; ovenSmoke.forEach(s => s.m.material.opacity = 0);
              renderOvenDoorCanvas('done', currentOvenTemp, 0); doorTarget = 1; ovenOutT = .8
            }
          }
          else if (ovenOutT > 0) {
            ovenOutT -= elapsed;
            if (ovenOutT <= 0) { let fm = toolMeta('form'); fm.back = true; fm.noPick = false; formPlaced = false; renderOvenDoorCanvas('standby', currentOvenTemp, currentOvenTime); finishTool() }
          }
          ovenDoorT += (doorTarget - ovenDoorT) * Math.min(1, dt * 4);
          ovenDoor.rotation.x = ovenDoorT * 1.32;
          if (slideT > 0) { slideT -= dt; formG.position.lerp(ovenSlot, Math.min(1, dt * 4.5)) }
          if (pour) {
            let d = pour.d, t = pour.t; pour.t += dt;
            if (t < .35) {
              d.o.position.lerp(pourTop, Math.min(1, dt * 7));
              d.o.rotation.x *= Math.max(0, 1 - dt * 6); d.o.rotation.z *= Math.max(0, 1 - dt * 6)
            }
            else if (t < 1.3) {
              d.o.rotation.x += (-2.05 - d.o.rotation.x) * Math.min(1, dt * 6);
              let top = bowlG.position.y + .18 + .58 * mixCur;
              stream.visible = d.o.rotation.x < -1.15;
              stream.position.set(0, (top + 1.06) / 2, .05);
              stream.scale.set(1, Math.max(.12, 1.06 - top), 1)
            }
            else if (t < 1.8) {
              stream.visible = false;
              d.o.rotation.x += (0 - d.o.rotation.x) * Math.min(1, dt * 6);
              d.o.position.lerp(d.home, Math.min(1, dt * 5))
            }
            else {
              stream.visible = false;
              d.back = true; d.retire = true;
              if (!pour.stay) finishTool();
              pour = null
            }
          }
          if (waterOn || waterT > 0) {
            if (waterT > 0) waterT -= dt;
            wStream.visible = true;
            wStream.position.set(-5.2, .2, -2.35);
            wStream.scale.set(1 + Math.sin(T * 13) * .14, .75, 1 + Math.sin(T * 11) * .14);
            wStream.material.opacity = .55 + Math.sin(T * 9) * .08;
            water.material.opacity += (.5 - water.material.opacity) * Math.min(1, dt * 6);
            water.scale.set(1 + Math.sin(T * 6) * .03, 1, 1 + Math.cos(T * 6) * .03);
            drops.forEach(dp => {
              dp.ph = (dp.ph + dt * 1.3) % 1;
              dp.m.position.set(-5.2 + dp.vx * dp.ph * 2, -.15 + Math.sin(dp.ph * Math.PI) * .3, -2.35 + dp.vz * dp.ph * 2);
              dp.m.material.opacity = Math.sin(dp.ph * Math.PI) * .7
            })
          }
          else {
            wStream.visible = false;
            water.material.opacity *= Math.max(0, 1 - dt * 5);
            drops.forEach(dp => dp.m.material.opacity = 0)
          }
          pieces = pieces.filter(p => {
            if (p.vy) {
              p.o.position.y += p.vy * dt; p.vy -= 8 * dt;
              if (p.o.position.y <= p.restY) { p.o.position.y = p.restY; p.vy = 0 }
            }
            if (p.absorb > 0) { p.absorb -= dt; if (p.absorb <= 0) p.go = true }
            if (p.go) {
              p.o.position.lerp(bowlPos, Math.min(1, dt * 6));
              p.o.scale.multiplyScalar(Math.max(.01, 1 - dt * 3));
              if (p.o.scale.x < .07) { scene.remove(p.o); addMix(p.name, .05); return false }
            }
            return true
          });
          mixCur += (mixTgt - mixCur) * Math.min(1, dt * 3);
          if (mixCur > .02) {
            let rr = .55 + .48 * mixCur, ryy = .05 + .26 * mixCur;
            mixMesh.visible = true;
            mixMesh.position.y = .18 + .58 * mixCur;
            if (stirT > 0) {
              mixMesh.rotation.y += dt * 5;
              mixMesh.scale.set(rr * (1 + Math.sin(T * 9) * .04), ryy, rr * (1 + Math.cos(T * 9) * .04))
            }
            else mixMesh.scale.set(rr, ryy, rr)
          }
          else mixMesh.visible = false;
          let hot = mixTgt > .25 || stirT > 0;
          steam.forEach(s => {
            s.ph = (s.ph + dt * .35) % 1;
            s.m.position.set(s.x + Math.sin(T * 2 + s.ph * 9) * .08, .55 + s.ph * 1.5, s.z);
            s.m.material.opacity = hot ? Math.sin(s.ph * Math.PI) * .26 : 0;
            s.m.scale.setScalar(.6 + s.ph * .9)
          });
          if (ring.visible) ring.scale.setScalar(ringBase * (1 + Math.sin(T * 5) * .05));
          camera.position.x += (camBase.x + (mobileQuality ? 0 : ndc.x * .4) - camera.position.x) * Math.min(1, dt * 3);
          camera.position.y += (camBase.y + (mobileQuality ? 0 : ndc.y * .22) - camera.position.y) * Math.min(1, dt * 3);
          camera.lookAt(0, .55, 0);
          if (sceneVisible && (drag || now >= scrollingUntil)) renderer.render(scene, camera)
        }
        requestAnimationFrame(t => { last = t; frame(t) });

        function resize() {
          if (!root.clientWidth || !root.clientHeight) return;
          const wasPortrait = portraitViewport;
          const nextMobile = matchMedia('(pointer: coarse), (max-width: 900px)').matches;
          if (nextMobile !== mobileNavigation) { mobileNavigation = nextMobile; interactionEnabled = false }
          navigation.hidden = !mobileNavigation;
          portraitViewport = mobileNavigation && matchMedia('(orientation: portrait)').matches && root.clientWidth < 600;
          updateInteractionMode();
          const renderWidth = portraitViewport ? Math.max(760, root.clientWidth) : root.clientWidth;
          // Browser toolbars can resize the viewport while scrolling. Avoid reallocating
          // the WebGL drawing buffer when the actual scene dimensions stay unchanged.
          if (renderWidth === previousRenderWidth && root.clientHeight === previousRenderHeight) return;
          const scrollRatio = root.scrollLeft / Math.max(1, previousRenderWidth - root.clientWidth);
          previousRenderWidth = renderWidth; previousRenderHeight = root.clientHeight;
          camera.aspect = renderWidth / root.clientHeight;
          // Fit all workstations when rotating a phone, without moving under a finger.
          const distance = Math.max(11.65, 7.4 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
          camBase.set(0, 4.25, 10.6).normalize().multiplyScalar(distance);
          camera.position.copy(camBase); camera.lookAt(0, .55, 0);
          camera.updateProjectionMatrix();
          renderer.setSize(renderWidth, root.clientHeight);
          root.scrollLeft = portraitViewport ? (renderWidth - root.clientWidth) * (wasPortrait ? scrollRatio : .5) : 0;
        }
        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
        resize();

        three = {
          scene, camera, spawnStep, awaitTool, reset: reset3D, startBake, isFormPlaced() { return formPlaced }, isBaking() { return ovenT > 0 },
          onEvent(event) { if (event === 'wrong') flashT = 1; if (event === 'correct') pulse = 1 },
          bowl: bowlG
        }; $('engine').textContent = 'Cozinha 3D • Three.js • arraste os itens';
      } catch (err) { fallback() }
    }
    function fallback(reason) {
      $('sceneNavigation').hidden = true;
      $('threeRoot').style.display = 'none'; $('fallback').style.display = 'flex'; $('engine').textContent = 'Modo 2D • Aceleração gráfica desativada';
      let msg = $('fallbackMsg'), btn = $('retry3D');
      if (reason === 'webgl' && msg) { msg.textContent = 'A aceleração gráfica (WebGL) está desativada no seu navegador. O jogo está 100% jogável no modo 2D logo abaixo!'; if (btn) { btn.textContent = '🔄 Tentar carregar 3D'; btn.style.display = 'inline-flex'; } }
      else if (reason === 'lost' && msg) { msg.textContent = 'A GPU reiniciou o contexto 3D. O jogo continua perfeitamente no modo 2D!'; if (btn) btn.style.display = 'inline-flex' }
    }
    function retry3D() { location.reload() }
    function updateScene(event) {
      let emojis = { 'cookie': '🍪', 'lemonade': '🍋', 'focaccia': '🥖' };
      if (current) {
        $('fallbackArt').textContent = event === 'correct' ? '✨' + emojis[current.recipe.id] : event === 'wrong' ? '⚠️' : emojis[current.recipe.id];
        $('fallbackText').textContent = current.ingredient ? `${current.ingredient} • ${current.action || 'Preparo'}` : 'Sua bancada de preparo'
      }
      if (!three || !three.onEvent) return;
      three.onEvent(event)
    }
    if ($('btnAdminUnlock')) $('btnAdminUnlock').onclick = () => { if (isAdminAuthenticated()) showTab('dashboard'); else openAdminLogin('dashboard') };
    if ($('btnAdminLogout')) $('btnAdminLogout').onclick = handleAdminLogout;
    if ($('adminModalClose')) $('adminModalClose').onclick = closeAdminLogin;
    if ($('adminCancelBtn')) $('adminCancelBtn').onclick = closeAdminLogin;
    if ($('adminLoginForm')) $('adminLoginForm').onsubmit = e => { e.preventDefault(); handleAdminLogin() };
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('adminLoginModal').classList.contains('hidden')) closeAdminLogin() });
    updateAdminUI();
    renderRecipes(); renderAll(); if (window.THREE) init3D(); else { let script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js'; script.onload = init3D; script.onerror = fallback; document.head.appendChild(script); setTimeout(() => { if (!window.THREE && !three) fallback() }, 6500) }
