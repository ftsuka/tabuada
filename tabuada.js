// Modern tabuada game logic
// phases 1–9 use 1‑digit × 1‑digit questions; from phase 10 onward include 2-digit × 1-digit
// shuffle using crypto for stronger, non‑predictable randomness
const embaralhar = arr => {
    const random = () => {
        // returns a floating point number in [0,1)
        const r = new Uint32Array(1);
        window.crypto.getRandomValues(r);
        return r[0] / (0xFFFFFFFF + 1);
    };
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};
const gerarPerguntasBasicas = () => {
    // return all 1‑digit × 1‑digit combos sorted by product (easiest first)
    const lista = [];
    for (let a = 1; a <= 9; a++) {
        for (let b = 1; b <= 9; b++) {
            lista.push({ texto: `${a} × ${b}`, resposta: a * b });
        }
    }
    return lista.sort((p, q) => p.resposta - q.resposta || p.texto.localeCompare(q.texto));
};
const gerarPerguntasAvancadas = () => {
    const lista = [];
    for (let dois = 10; dois <= 20; dois++) {
        for (let um = 1; um <= 9; um++) {
            lista.push({ texto: `${dois} × ${um}`, resposta: dois * um });
            lista.push({ texto: `${um} × ${dois}`, resposta: dois * um });
        }
    }
    return lista;
};
const fases = [];
const QUESTIONS_PER_PHASE = 20;
const TOTAL_PHASES = 30;
const BASIC_PHASES = 9;
// first nine phases: progressively harder 1‑digit tables
const baseBasicas = gerarPerguntasBasicas();
let allBasicas = [];
while (allBasicas.length < QUESTIONS_PER_PHASE * BASIC_PHASES) {
    allBasicas = allBasicas.concat(baseBasicas);
}
for (let i = 0; i < BASIC_PHASES; i++) {
    fases.push(allBasicas.slice(i * QUESTIONS_PER_PHASE, (i + 1) * QUESTIONS_PER_PHASE));
}
// remaining phases use advanced 2‑digit questions
const ADVANCED_PHASES = TOTAL_PHASES - BASIC_PHASES;
const baseAvancadas = embaralhar(gerarPerguntasAvancadas());
let allAvancadas = [];
while (allAvancadas.length < QUESTIONS_PER_PHASE * ADVANCED_PHASES) {
    allAvancadas = allAvancadas.concat(embaralhar([...baseAvancadas]));
}
for (let i = 0; i < ADVANCED_PHASES; i++) {
    fases.push(allAvancadas.slice(i * QUESTIONS_PER_PHASE, (i + 1) * QUESTIONS_PER_PHASE));
}
let faseAtual = 1;
let perguntaAtual = null;
let acertos = 0;
let total = 0;
let perguntasRestantes = [];

const pontosParaProximaFase = fase => fase * 10;

const prepararPerguntasFase = () => {
    if (faseAtual > fases.length) faseAtual = fases.length;
    perguntasRestantes = [...fases[faseAtual - 1]];
};

const sortearPergunta = () => {
    if (perguntasRestantes.length === 0) prepararPerguntasFase();
    perguntaAtual = perguntasRestantes.pop();
    document.getElementById('pergunta-tabuada').textContent = `${perguntaAtual.texto} =`;
    const input = document.getElementById('resposta-tabuada');
    input.value = '';
    input.setAttribute('aria-label', `Quanto é ${perguntaAtual.texto}?`);
    document.getElementById('resultado-tabuada').textContent = '';
    atualizarStatus();
    input.focus();
};

const atualizarStatus = () => {
    document.getElementById('score').textContent = `Pontuação: ${acertos} de ${total} | Fase: ${faseAtual}/${fases.length} | Para avançar: ${pontosParaProximaFase(faseAtual)} pontos`;
};

// purchases
const darDica = () => {
    if (acertos >= 5) {
        acertos -= 5;
        // repeat the second factor as many times as the first factor (inverted)
        if (perguntaAtual && perguntaAtual.texto) {
            const parts = perguntaAtual.texto.split(/[×x]/).map(s => s.trim());
            if (parts.length === 2) {
                const a = parseInt(parts[0], 10);
                const b = parseInt(parts[1], 10);
                if (!isNaN(a) && !isNaN(b)) {
                    if (a === 1) {
                        // 1×b: show b + 0
                        document.getElementById('resultado-tabuada').textContent = `💡 Dica: ${b} + 0`;
                    } else if (b === 1) {
                        // a×1: show a + 0 (still inverted logic applies)
                        document.getElementById('resultado-tabuada').textContent = `💡 Dica: ${a} + 0`;
                    } else {
                        const times = a;
                        const repeat = Array(times).fill(b).join(' + ');
                        document.getElementById('resultado-tabuada').textContent = `💡 Dica: ${repeat}`;
                    }
                } else {
                    document.getElementById('resultado-tabuada').textContent = '💡 Dica: não disponível';
                }
            } else {
                document.getElementById('resultado-tabuada').textContent = '💡 Dica: não disponível';
            }
        } else {
            document.getElementById('resultado-tabuada').textContent = '💡 Dica: não disponível';
        }
        document.getElementById('resultado-tabuada').style.color = '#2980b9';
        atualizarStatus();
    } else {
        alert('Você não tem pontos suficientes para comprar uma dica!');
    }
};

const pularFase = () => {
    if (acertos >= 10) {
        acertos -= 10;
        if (faseAtual < fases.length) {
            faseAtual++;
            prepararPerguntasFase();
            alert(`Você pulou para a fase ${faseAtual}!`);
        } else {
            alert('Você já está na última fase.');
        }
        sortearPergunta();
        atualizarStatus();
    } else {
        alert('Você não tem pontos suficientes para pular fase!');
    }
};

const verificarTabuada = e => {
    e.preventDefault();
    const input = document.getElementById('resposta-tabuada');
    const valor = parseInt(input.value, 10);
    const resultado = document.getElementById('resultado-tabuada');
    if (isNaN(valor)) {
        resultado.textContent = 'Digite um número!';
        resultado.style.color = '#e67e22';
        input.focus();
        return;
    }
    total++;
    if (valor === perguntaAtual.resposta) {
        resultado.textContent = '✔️ Correto!';
        resultado.style.color = '#27ae60';
        acertos++;
        input.classList.remove('input-err');
        input.classList.add('input-ok');
    } else {
        resultado.textContent = `❌ Errado! Resposta: ${perguntaAtual.resposta}`;
        resultado.style.color = '#e74c3c';
        input.classList.remove('input-ok');
        input.classList.add('input-err');
    }
    setTimeout(() => {
        input.classList.remove('input-ok', 'input-err');
        if (acertos >= pontosParaProximaFase(faseAtual)) {
            if (faseAtual < fases.length) {
                faseAtual++;
                prepararPerguntasFase();
                alert(`Parabéns! Você avançou para a fase ${faseAtual}!`);
                sortearPergunta();
            } else {
                alert('Você completou todas as fases! Parabéns!');
                faseAtual = 1;
                acertos = 0;
                total = 0;
                prepararPerguntasFase();
                sortearPergunta();
            }
        } else {
            sortearPergunta();
        }
        atualizarStatus();
    }, 900);
};

window.addEventListener('DOMContentLoaded', () => {
    prepararPerguntasFase();
    sortearPergunta();
    atualizarStatus();
    document.getElementById('form-tabuada').addEventListener('submit', verificarTabuada);
    // shop toggle
    const shopButton = document.getElementById('btn-shop');
    const shopMenu = document.getElementById('shop-menu');
    shopButton && shopButton.addEventListener('click', () => {
        if (shopMenu.style.display === 'flex') {
            shopMenu.style.display = 'none';
        } else {
            shopMenu.style.display = 'flex';
        }
    });
    // hide menu when clicking outside
    document.addEventListener('click', e => {
        if (!shopMenu || !shopButton) return;
        if (shopMenu.contains(e.target) || shopButton.contains(e.target)) return;
        shopMenu.style.display = 'none';
    });
    // attach purchase handlers (buttons live inside shop-menu)
    const btnDica = document.getElementById('btn-dica');
    const btnPular = document.getElementById('btn-pular');
    if (btnDica) btnDica.addEventListener('click', () => {
        darDica();
        shopMenu && (shopMenu.style.display = 'none');
    });
    if (btnPular) btnPular.addEventListener('click', () => {
        pularFase();
        shopMenu && (shopMenu.style.display = 'none');
    });

    // block default drag/drop navigation (prevents breaking when folder dropped)
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());
});
