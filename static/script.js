// ============================================================
// Lilac Calculator — lógica principal
// ============================================================

const display   = document.getElementById("display");
const historyEl  = document.getElementById("history");
const calculator = document.getElementById("calculator");
const modeText   = document.getElementById("modeText");

// Estado interno da expressão (fonte da verdade — NUNCA lemos display.value)
let expression      = "";   // string "crua", com os símbolos ÷ × − que o usuário vê
let justCalculated  = false; // true logo depois de apertar "="
let lastResultRaw   = "0";   // último resultado, sem formatação, pra continuar contas

const OPERATORS = ['+', '−', '×', '÷', '^'];
const FUNCTIONS = ['sin(', 'cos(', 'tan(', 'log(', '√('];

// ------------------------------------------------------------
// Helpers matemáticos que o eval() vai usar
// ------------------------------------------------------------
function sinDeg(x) { return Math.sin(x * Math.PI / 180); }
function cosDeg(x) { return Math.cos(x * Math.PI / 180); }
function tanDeg(x) { return Math.tan(x * Math.PI / 180); }

function factorial(n) {
    n = Number(n);
    if (n < 0 || !Number.isInteger(n)) throw new Error("invalid factorial");
    if (n > 170) return Infinity; // evita travar o eval com número gigante
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

// ------------------------------------------------------------
// Renderiza o estado atual no display
// ------------------------------------------------------------
function render() {
    display.value = expression === "" ? "0" : expression;
}

// ------------------------------------------------------------
// Entrada de valores (dígitos, operadores, funções...)
// ------------------------------------------------------------
function appendValue(value) {
    // Se acabou de calcular, decide se continua a conta ou começa uma nova
    if (justCalculated) {
        justCalculated = false;
        if (OPERATORS.includes(value)) {
            expression = lastResultRaw + value;
        } else {
            expression = "";
            historyEl.textContent = "";
        }
    }

    const lastChar = expression.slice(-1);

    // Não deixa repetir operador (mas permite trocar o operador digitado)
    if (OPERATORS.includes(value) && OPERATORS.includes(lastChar)) {
        expression = expression.slice(0, -1) + value;
        render();
        return;
    }

    // Não deixa começar a expressão com um operador (exceto "−" pra negativo)
    if (expression === "" && OPERATORS.includes(value) && value !== '−') {
        return;
    }

    // Não deixa colocar dois pontos decimais no mesmo número (ex: 3.5.6)
    if (value === '.') {
        const tail = expression.split(/[+−×÷^(,]/).pop();
        if (tail.includes('.')) return;
    }

    expression += value;
    render();
}

function clearDisplay() {
    expression = "";
    justCalculated = false;
    historyEl.textContent = "";
    render();
}

function deleteLast() {
    if (justCalculated) {
        clearDisplay();
        return;
    }
    expression = expression.slice(0, -1);
    render();
}

const scientificPanel = document.querySelector(".scientific");
const switchEl = document.querySelector(".switch");
const ENTER_DURATION = 1150; // 9 * 55ms de atraso + 650ms de animação, com folga
const EXIT_DURATION   = 750;  // 9 * 35ms de atraso + 400ms de animação, com folga

let animationTimeout = null;

function toggleScientific() {
    const turningOn = !calculator.classList.contains("scientific-mode");
    clearTimeout(animationTimeout);
    scientificPanel.classList.remove("anim-in", "anim-out");

    // O toggle responde na hora do clique, sem esperar a animação dos botões
    switchEl.classList.toggle("active", turningOn);

    if (turningOn) {
        // Mostra o painel e a área já cresce; os botões entram em cascata
        calculator.classList.add("scientific-mode");
        document.body.classList.add("dark");
        modeText.innerText = "Científico";

        void scientificPanel.offsetWidth; // força reflow pra reiniciar a animação
        scientificPanel.classList.add("anim-in");

        animationTimeout = setTimeout(() => {
            scientificPanel.classList.remove("anim-in");
        }, ENTER_DURATION);
    } else {
        // Os botões somem em cascata primeiro, só depois o espaço colapsa
        modeText.innerText = "Normal";
        scientificPanel.classList.add("anim-out");

        animationTimeout = setTimeout(() => {
            calculator.classList.remove("scientific-mode");
            document.body.classList.remove("dark");
            scientificPanel.classList.remove("anim-out");
        }, EXIT_DURATION);
    }
}

// ------------------------------------------------------------
// Formatação do resultado (padrão brasileiro)
// ------------------------------------------------------------
function formatResult(numero) {
    if (!isFinite(numero)) return "Erro";
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 10
    }).format(numero);
}

// ------------------------------------------------------------
// Cálculo — converte a expressão "amigável" em JS válido
// ------------------------------------------------------------
function toEvaluableExpression(raw) {
    // Fecha parênteses que o usuário esqueceu de fechar (ex: "√(25" ou "sin(30")
    // — sem isso, qualquer função científica sem ")" manual quebrava o eval.
    const abertos = (raw.match(/\(/g) || []).length;
    const fechados = (raw.match(/\)/g) || []).length;
    let balanced = raw + ")".repeat(Math.max(0, abertos - fechados));

    let expr = balanced
        .replace(/÷/g, "/")
        .replace(/×/g, "*")
        .replace(/−/g, "-")
        .replace(/π/g, "Math.PI")
        .replace(/\be\b/g, "Math.E")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/sin\(/g, "sinDeg(")
        .replace(/cos\(/g, "cosDeg(")
        .replace(/tan\(/g, "tanDeg(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/\^/g, "**");

    // Porcentagem: número seguido de % vira (numero/100)
    expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    // Fatorial: número seguido de ! vira factorial(numero)
    expr = expr.replace(/(\d+(\.\d+)?)!/g, "factorial($1)");

    return expr;
}

function calculate() {
    if (expression === "") return;

    try {
        const evaluable = toEvaluableExpression(expression);
        let resultado = eval(evaluable);

        if (typeof resultado !== "number" || !isFinite(resultado)) {
            throw new Error("resultado inválido");
        }

        // Corrige erros de ponto flutuante (ex: 0.1 + 0.2 = 0.30000000000000004)
        // pra não acumular lixo binário quando o usuário continua a conta.
        resultado = parseFloat(resultado.toPrecision(12));

        historyEl.textContent = expression + " =";
        lastResultRaw = String(resultado);
        expression = formatResult(resultado);
        justCalculated = true;
        render();
    } catch {
        showError();
    }
}

function showError() {
    display.value = "Erro";
    calculator.classList.add("shake");
    setTimeout(() => {
        calculator.classList.remove("shake");
    }, 300);
    setTimeout(() => {
        expression = "";
        justCalculated = false;
        historyEl.textContent = "";
        render();
    }, 1200);
}

// ------------------------------------------------------------
// Copiar resultado
// ------------------------------------------------------------
function copyToClipboard() {
    if (display.value === "" || display.value === "0") return;

    navigator.clipboard.writeText(display.value).then(() => {
        const originalValue = display.value;
        display.value = "Copiado!";

        setTimeout(() => {
            display.value = originalValue;
        }, 900);
    });
}

// ------------------------------------------------------------
// Teclado físico
// ------------------------------------------------------------
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/[0-9]/.test(key)) appendValue(key);
    if (key === '+') appendValue('+');
    if (key === '-') appendValue('−');
    if (key === '*') appendValue('×');
    if (key === '/') { event.preventDefault(); appendValue('÷'); }
    if (key === '.') appendValue('.');
    if (key === '(') appendValue('(');
    if (key === ')') appendValue(')');
    if (key === '%') appendValue('%');
    if (key === '^') appendValue('^');

    if (key === 'Enter' || key === '=') {
        event.preventDefault();
        calculate();
    }
    if (key === 'Backspace') deleteLast();
    if (key === 'Escape') clearDisplay();
});

render();