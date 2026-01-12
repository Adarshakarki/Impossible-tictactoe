const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const strikeLine = document.getElementById('strikeLine');
const boardWrapper = document.querySelector('.board-wrapper');

let board = Array(25).fill('');
let gameActive = true;
const innerIndices = [6, 7, 8, 11, 12, 13, 16, 17, 18];

const winPatterns = [];
const generatePatterns = () => {
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) winPatterns.push([r*5+c, r*5+c+1, r*5+c+2]);
    }
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) winPatterns.push([r*5+c, (r+1)*5+c, (r+2)*5+c]);
    }
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) winPatterns.push([r*5+c, (r+1)*5+c+1, (r+2)*5+c+2]);
        for (let c = 2; c < 5; c++) winPatterns.push([r*5+c, (r+1)*5+c-1, (r+2)*5+c-2]);
    }
};
generatePatterns();

function initGame() {
    board = Array(25).fill('');
    gameActive = true;
    boardElement.innerHTML = '';
    boardElement.classList.remove('revealed');
    boardWrapper.classList.remove('strike-active');
    statusElement.textContent = "YOUR TURN";
    
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = `cell ${innerIndices.includes(i) ? 'inner' : 'outer'}`;
        cell.addEventListener('click', () => handleMove(i), { once: true });
        boardElement.appendChild(cell);
    }
}

function handleMove(idx) {
    if (!gameActive || board[idx] !== '' || !innerIndices.includes(idx)) return;
    updateCell(idx, 'X');
    
    if (checkWin('X')) {
        endGame("VICTORY?");
    } else if (isInnerDraw()) {
        triggerCheat();
    } else {
        statusElement.textContent = "BOT THINKING...";
        setTimeout(botMove, 500);
    }
}

function botMove() {
    if (!gameActive) return;
    let move = findBestMove('O', true) || findBestMove('X', true);
    if (move === null) {
        const available = innerIndices.filter(i => board[i] === '');
        move = available[Math.floor(Math.random() * available.length)];
    }
    updateCell(move, 'O');
    if (checkWin('O')) {
        endGame("BOT WINS");
    } else if (isInnerDraw()) {
        triggerCheat();
    } else {
        statusElement.textContent = "YOUR TURN";
    }
}

function triggerCheat() {
    gameActive = false;
    statusElement.textContent = "EXPANDING...";
    setTimeout(() => {
        boardElement.classList.add('revealed');
        // Find a win that uses one outer cell
        const pattern = winPatterns.find(p => {
            const vals = p.map(i => board[i]);
            return vals.filter(v => v === 'O').length === 2 && 
                   vals.filter(v => v === '').length === 1 &&
                   p.some(i => !innerIndices.includes(i));
        });

        const winIdx = pattern.find(i => board[i] === '');
        setTimeout(() => {
            updateCell(winIdx, 'O');
            pattern.forEach(idx => boardElement.children[idx].classList.add('winner'));
            drawStrike(pattern);
            statusElement.textContent = "BOT WINS";
        }, 600);
    }, 800);
}

function updateCell(i, p) {
    board[i] = p;
    boardElement.children[i].textContent = p;
    boardElement.children[i].classList.add(p.toLowerCase());
}

function drawStrike(pattern) {
    const cells = boardElement.children;
    const start = cells[pattern[0]];
    const end = cells[pattern[2]];

    // Offset math: relative to the board-wrapper padding
    const x1 = start.offsetLeft + start.offsetWidth / 2;
    const y1 = start.offsetTop + start.offsetHeight / 2;
    const x2 = end.offsetLeft + end.offsetWidth / 2;
    const y2 = end.offsetTop + end.offsetHeight / 2;

    strikeLine.setAttribute('x1', x1);
    strikeLine.setAttribute('y1', y1);
    strikeLine.setAttribute('x2', x2);
    strikeLine.setAttribute('y2', y2);
    
    boardWrapper.classList.add('strike-active');
}

function findBestMove(player, innerOnly) {
    const subset = innerOnly ? winPatterns.filter(p => p.every(i => innerIndices.includes(i))) : winPatterns;
    for (let p of subset) {
        const vals = p.map(i => board[i]);
        if (vals.filter(v => v === player).length === 2 && vals.filter(v => v === '').length === 1) return p[vals.indexOf('')];
    }
    return null;
}

function checkWin(p) { return winPatterns.some(pat => pat.every(i => board[i] === p)); }
function isInnerDraw() { return innerIndices.every(i => board[i] !== ''); }
function endGame(msg) { gameActive = false; statusElement.textContent = msg; }

initGame();