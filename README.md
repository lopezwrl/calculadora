# Lilac Calculator

Calculadora web (modo Normal + modo Científico) construída com **Flask** no back-end apenas para servir a página, com **toda a lógica de cálculo em JavaScript puro** no navegador. Projeto de portfólio, com identidade visual própria (paleta lilás/violeta) e animações de transição entre os dois modos.

---

## Índice

- [Principais funcionalidades](#principais-funcionalidades)
- [Como o cálculo funciona](#como-o-cálculo-funciona)
- [Arquitetura do código](#arquitetura-do-código)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Stack utilizada](#stack-utilizada)
- [Como rodar localmente](#como-rodar-localmente)
- [Atalhos de teclado](#atalhos-de-teclado)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Principais funcionalidades

- **Modo Normal**: as quatro operações básicas, parênteses e ponto decimal.
- **Modo Científico**: alternado por um switch animado — adiciona `sin`, `cos`, `tan`, raiz quadrada (`√`), `log`, `π`, `e`, potência (`xʸ`), porcentagem (`%`) e fatorial (`x!`), com os botões entrando/saindo em cascata (delay escalonado por botão) e o tema mudando para escuro automaticamente nesse modo.
- **Histórico da última expressão**: mostra acima do display a expressão que gerou o resultado atual (`expressão =`).
- **Encadeamento de contas**: depois de um `=`, se o próximo toque for um operador, a conta continua a partir do resultado anterior; se for um número, começa uma expressão nova.
- **Correção automática de digitação**:
  - Não deixa repetir operador seguido (troca o último em vez de duplicar).
  - Não deixa a expressão começar com operador (exceto `−`, para números negativos).
  - Não deixa colocar dois pontos decimais no mesmo número.
  - Fecha automaticamente parênteses que o usuário esqueceu de fechar (ex.: `√(25` sem o `)` final).
- **Suporte a teclado físico**: números, operadores, parênteses, `%`, `^`, `Enter`/`=` para calcular, `Backspace` para apagar e `Esc` para limpar.
- **Copiar resultado**: botão que copia o valor do display para a área de transferência, com feedback visual temporário ("Copiado!").
- **Formatação de resultado no padrão brasileiro** (`Intl.NumberFormat('pt-BR')`), com até 10 casas decimais.
- **Tratamento de erro**: expressões inválidas mostram "Erro", o cartão da calculadora treme (`shake`) e a expressão é limpa automaticamente logo em seguida.

---

## Como o cálculo funciona

O display nunca é a "fonte da verdade" — a variável `expression` guarda a expressão como o usuário a vê (com os símbolos `÷ × − ^`), e é ela que é transformada e avaliada a cada `=`:

1. **Balanceamento de parênteses**: conta quantos `(` estão sem `)` correspondente e completa automaticamente.
2. **Tradução de símbolos** para uma expressão JavaScript válida:
   - `÷ → /`, `× → *`, `− → -`, `^ → **`
   - `π → Math.PI`, `e → Math.E`, `√( → Math.sqrt(`
   - `sin(`/`cos(`/`tan(` → funções auxiliares próprias (`sinDeg`, `cosDeg`, `tanDeg`) que trabalham em **graus**, não radianos.
   - `log( → Math.log10(`
   - Número seguido de `%` → `(numero/100)`
   - Número seguido de `!` → `factorial(numero)` (função própria, com limite de `n ≤ 170` para não travar o navegador com números astronômicos)
3. **Avaliação** via `eval()` da expressão já traduzida.
4. **Correção de ponto flutuante**: o resultado passa por `toPrecision(12)` antes de virar string, evitando o clássico erro de `0.1 + 0.2 = 0.30000000000000004` ao continuar a conta a partir do resultado anterior.

> **Nota de segurança**: o cálculo usa `eval()` no próprio navegador — é seguro nesse contexto porque roda 100% no lado do cliente, sobre uma entrada que o próprio usuário digitou nos botões da calculadora (não há envio dessa expressão para o servidor).

---

## Arquitetura do código

- **`app.py`**: Flask mínimo — uma única rota (`/`) que apenas renderiza `index.html`. Não há nenhuma lógica de cálculo no backend.
- **`static/script.js`**: toda a lógica da calculadora (estado da expressão, parsing/avaliação, teclado físico, animação do modo científico, copiar para a área de transferência).
- **`static/style.css`**: identidade visual (paleta lilás/violeta/dourado definida em variáveis CSS), animações de entrada/saída dos botões científicos e efeito de "tremida" no erro.
- **`templates/index.html`**: estrutura da calculadora — display, botões numéricos/operadores e o painel científico (inicialmente oculto).

---

## Estrutura do projeto

```
calculadora-main/
├── app.py                 # Flask: única rota, serve o template
├── requirements.txt        # Dependências Python
├── static/
│   ├── script.js            # Lógica da calculadora (parsing, cálculo, UI)
│   └── style.css              # Estilos e animações
└── templates/
    └── index.html              # Marcação da calculadora
```

---

## Stack utilizada

**Backend**
- [Flask](https://flask.palletsprojects.com/) — serve a página; não participa do cálculo.

**Frontend**
- HTML + CSS + **JavaScript puro** (sem frameworks/bundler).
- Fonte [Poppins](https://fonts.google.com/specimen/Poppins) via Google Fonts.

---

## Como rodar localmente

### Pré-requisitos
- Python 3.9+

### Passos

```bash
# 1. Entrar na pasta do projeto
cd calculadora-main

# 2. Criar e ativar um ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Rodar a aplicação
python app.py
```

A aplicação sobe por padrão em `http://localhost:5000` (modo debug ativado).

---

## Atalhos de teclado

| Tecla | Ação |
|---|---|
| `0`–`9` | Insere o dígito |
| `+` `-` `*` `/` | Operadores (`-` e `/` são convertidos para `−` e `÷`) |
| `.` | Ponto decimal |
| `(` `)` | Parênteses |
| `%` | Porcentagem |
| `^` | Potência |
| `Enter` ou `=` | Calcula |
| `Backspace` | Apaga o último caractere |
| `Esc` | Limpa tudo |

---

## Limitações conhecidas

- O arquivo `requirements.txt` lista `sympy` como dependência, mas a biblioteca **não é utilizada em nenhum lugar do código atual** (todo o cálculo é feito via `eval()` no JavaScript do navegador) — pode ser removida com segurança ou é resquício de uma versão anterior/planejada do projeto.
- Funções trigonométricas (`sin`, `cos`, `tan`) trabalham sempre em **graus**; não há alternância para radianos.
- Por depender de `eval()`, a calculadora não deve ser adaptada para aceitar expressões vindas de uma fonte não confiável (ex.: um parâmetro de URL ou uma API) sem antes trocar para um parser seguro — hoje isso não é um risco porque a expressão só é montada pelos próprios botões/teclado do usuário no navegador dele.
