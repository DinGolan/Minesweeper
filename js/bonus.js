/***************/
/* Minesweeper */
/***************/
'use strict';

// =============================== //
//         Hint Mode Logic         //
// =============================== //
function renderHints() {
    const elContainerHints     = document.querySelector('.hints-container');
    elContainerHints.innerHTML = '';
    const usedCount            = TOTAL_HINTS - gGame.hintsLeft;

    for (let i = 0; i < TOTAL_HINTS; i++) {
        const elHint     = document.createElement('span');
        elHint.innerText = HINT;

        if (i < usedCount) {
            elHint.classList.add('hint', 'used');
            elHint.title = '';
        } else {
            elHint.classList.add('hint');
            elHint.title   = 'Click to Activate Hint';
            elHint.onclick = () => onHintClicked(elHint);
        }
        
        elContainerHints.appendChild(elHint);
    }
}

function onHintClicked(elHint) {
    saveGameState(); // Store for Reversal Action //

    if (!gGame.hintsLeft || gGame.isHintMode) return;

    gGame.elHintActive = elHint;
    gGame.isHintMode   = true;
    elHint.classList.add('active');
}

function handleHintMode(i, j) {
    gHintedCells = getCellAndNeighbors(i, j);
    revealHintCells(gHintedCells)

    const timeoutId = setTimeout(() => {
        
        // Remove active hint element //
        if (gGame.elHintActive) {
            gGame.elHintActive.classList.remove('active');
            gGame.elHintActive.classList.add('used');
            gGame.elHintActive.title = '';
            gGame.elHintActive       = null;
        }
        
        hideHintCells(gHintedCells);
        
        gGame.hintsLeft--;
        gGame.isHintMode = false;
        gHintedCells     = [];
    }, M_SECONDS * 1.5);

    gHintTimeoutIds.push(timeoutId);
}

function getCellAndNeighbors(cellI, cellJ) {
    const neighbors = [];

    for (let i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;
        
        for (let j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE)  continue;
            
            const negPosition = { i: i, j: j };
            neighbors.push(negPosition);
        }
    }

    return neighbors;
}

function revealHintCells(gHintedCells) {
    for (let idx = 0; idx < gHintedCells.length; idx++) {
        const { negCellKey: negCell, elNegCellKey: elNegCell } = getCellAndElement(gHintedCells[idx]); // gHintedCells[idx] is a position object : { i: rowIndex, j: colIndex } //

        if (negCell.isRevealed) continue;

        renderCellContent(negCell, elNegCell);
        elNegCell.classList.add('cell-temp-reveal');
    }
}

function renderCellContent(currCell, elCell) {
    if (currCell.isMine) {
        elCell.innerText = BOMB;
    }
    else if (currCell.minesAroundCount > 0) {
        elCell.innerText = currCell.minesAroundCount;
        elCell.classList.add(`cell-${currCell.minesAroundCount}`);
    }
    else {
        elCell.innerText = EMPTY;
    }
}

function hideHintCells(gHintedCells) {
    for (let idx = 0; idx < gHintedCells.length; idx++) {
        const { negCellKey: negCell, elNegCellKey: elNegCell } = getCellAndElement(gHintedCells[idx]); // gHintedCells[idx] is a position object : { i: rowIndex, j: colIndex } //

        if (!negCell.isRevealed) {
            if (negCell.isMarked) elNegCell.innerText = FLAG; // Restore original content after hint : Show 🚩 again if cell was flagged //

            elNegCell.classList.add('fadeout');

            const timeoutId = setTimeout(() => {
                if (!negCell.isMarked) elNegCell.innerText = EMPTY;

                elNegCell.classList.remove('cell-temp-reveal');
                elNegCell.classList.remove('fadeout');

                removeNumberClasses(elNegCell);
            }, Math.floor(M_SECONDS / 2));

            gHintTimeoutIds.push(timeoutId);
        }
    }
}

function getCellAndElement(cellPosition) {
    const negCell   = gBoard[cellPosition.i][cellPosition.j];
    const className = getClassName(cellPosition.i, cellPosition.j);
    const elNegCell = document.querySelector(`.${className}`);

    return { negCellKey: negCell, elNegCellKey: elNegCell };
}

function clearHintTimeouts() {
    /**
     * Explanations :
     * - Clears any active hint-related timeouts to prevent delayed UI updates from running after game state has changed.
     **/
    if (gHintTimeoutIds.length > 0) {
        for (let i = 0; i < gHintTimeoutIds.length; i++) {
            if (gHintTimeoutIds[i]) clearTimeout(gHintTimeoutIds[i]);
        }

        gHintTimeoutIds = [];
    }
}

// --- //

// ========================== //
//         Best Score         //
// ========================== //
function getBestScoreKey(levelKey) {
    return `minesweeper-bestScore-${levelKey}`;
}

function getBestScoreValueFromLocalStorage(levelKey) {
    const key   = getBestScoreKey(levelKey);
    const value = localStorage.getItem(key);
    return value ? +value : null; 
}

function updateBestScoreIfNeeded(levelKey, currentScore) {
    const key       = getBestScoreKey(levelKey);
    const bestScore = getBestScoreValueFromLocalStorage(levelKey);

    if (bestScore === null || currentScore < bestScore) {
        localStorage.setItem(key, currentScore);
        renderBestScoreDisplay();
    }
}

function renderBestScoreDisplay() {
    const bestScore   = getBestScoreValueFromLocalStorage(gLevel.KEY);
    const elBestScore = document.querySelector('.best-score-display');
    const elResetBtn  = document.querySelector('.reset-best-btn');

    if (bestScore !== null) {
        elBestScore.innerText = `${TROPHY} Best Score : ${String(bestScore).padStart(PAD_ZEROS, '0')}`;
        elResetBtn.title      = '[Enabled] Reset Best Score';
        elResetBtn.classList.remove('disabled');
    } else {
        elBestScore.innerText = `${TROPHY} Best Score : —`;
        elResetBtn.title      = '[Disabled] Reset Best Score';
        elResetBtn.classList.add('disabled');
    }
    
    elResetBtn.innerText = RESET_BEST_SCORE;
}

function resetBestScore() {
    const bestScore = getBestScoreValueFromLocalStorage(gLevel.KEY);
    if (bestScore === null) return;

    const key = getBestScoreKey(gLevel.KEY);
    localStorage.removeItem(key);
    renderBestScoreDisplay();
}

// --- //

// ========================== //
//         Safe Click         //
// ========================== //
function disableSafeClickButton(isDisabled) {
    const elSafeBtn    = document.querySelector('.safe-click-btn');
    elSafeBtn.disabled = isDisabled;
    elSafeBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elSafeBtn.title   += ' Safe Click';
}

function updateSafeClicksCounts() {
    const elSafeCount = document.querySelector('.safe-clicks-count');
    
    if (!gGame.isOn) {
        elSafeCount.innerText = '';
        return;
    }
    
    elSafeCount.innerText = `${gGame.safeClicksLeft} Clicks Available`;
}

function onSafeClick() {
    if (!gGame.isOn || !gGame.safeClicksLeft) return;
    
    saveGameState(); // Store for Reversal Action //

    disableSafeClickButton(true); // Prevent rapid consecutive clicks by temporarily disabling the button //

    const safeCellsPos = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell = gBoard[i][j];
            if (!currCell.isMine && !currCell.isMarked && !currCell.isRevealed) {
                const cellPos = { i: i, j: j };
                safeCellsPos.push(cellPos);
            }
        }
    }

    const randIdx     = getRandomIntExclusive(0, safeCellsPos.length);
    const randCellPos = safeCellsPos[randIdx];
    revealSafeCellContent(randCellPos);

    clearSafeClickTimeout();
    gTimer.gSafeClickTimeoutId = setTimeout(() => {
        hideSafeCellContent(randCellPos);
        gGame.safeClicksLeft--;
        updateSafeClicksCounts();

        if (!gGame.safeClicksLeft) {
            disableSafeClickButton(true);
        } else {
            disableSafeClickButton(false); // Re-enable for next safe click //
        }
    }, M_SECONDS * 1.5);
}

function revealSafeCellContent(safeCellPos) {
    const safeCell   = gBoard[safeCellPos.i][safeCellPos.j];
    const className  = getClassName(safeCellPos.i, safeCellPos.j);
    const elSafeCell = document.querySelector(`.${className}`);
    
    if (safeCell.isMine || safeCell.isRevealed) return;

    if (safeCell.minesAroundCount > 0) {
        elSafeCell.innerText = safeCell.minesAroundCount;
        
        removeNumberClasses(elSafeCell);
        elSafeCell.classList.add(`cell-${safeCell.minesAroundCount}`);
    } else {
        elSafeCell.innerText = EMPTY;
    }

    elSafeCell.classList.add('cell-safe-click');
}

function hideSafeCellContent(safeCellPos) {
    const safeCell   = gBoard[safeCellPos.i][safeCellPos.j];
    const className  = getClassName(safeCellPos.i, safeCellPos.j);
    const elSafeCell = document.querySelector(`.${className}`);

    elSafeCell.classList.add('fadeout');

    clearSafeFadeoutTimeout();
    gTimer.gSafeFadeoutTimeoutId = setTimeout(() => {
        elSafeCell.classList.remove('cell-safe-click', 'fadeout');

        if (!safeCell.isRevealed) {
            elSafeCell.innerText = safeCell.isMarked ? FLAG : EMPTY;
            removeNumberClasses(elSafeCell);
        }
    }, Math.floor(M_SECONDS / 2));
}

function clearSafeClicksCounts() {
    const elSafeCount     = document.querySelector('.safe-clicks-count');
    elSafeCount.innerText = '';
}

function clearSafeClickTimeout() {
    if (gTimer.gSafeClickTimeoutId) {
        clearTimeout(gTimer.gSafeClickTimeoutId);
        gTimer.gSafeClickTimeoutId = null;
    }
}

function clearSafeFadeoutTimeout() {
    if (gTimer.gSafeFadeoutTimeoutId) {
        clearTimeout(gTimer.gSafeFadeoutTimeoutId);
        gTimer.gSafeFadeoutTimeoutId = null;
    }
}

// --- //

// ========================= //
//         Dark Mode         //
// ========================= //
function onToggleTheme() {
    const elBody = document.body
    const elBtn  = document.querySelector('.toggle-theme-btn');

    elBody.classList.toggle('dark-mode');
    elBtn.innerText = THEME;
}

function resetToggleTheme() {
    const elBtn     = document.querySelector('.toggle-theme-btn');
    elBtn.innerText = THEME;
    elBtn.title     = 'Toggle Theme';
}

// --- //

// =============================== //
//         Save Game State         //
// =============================== //
function saveGameState() {
    let boardCopy = copyBoard();
    let gameCopy  = copyGameVariable();
    
    gUndoStack.push({
        board: boardCopy,
        game: gameCopy
    });

    const elUndoBtn = document.querySelector('.undo-btn');
    if (elUndoBtn.disabled) {
        disableUndoButton(false);
    }
}

function copyBoard() {
    let boardCopy = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        let rowCopy = [];

        for (let j = 0; j < gLevel.SIZE; j++) {
            let currCell = gBoard[i][j];
            let cellCopy = {
                minesAroundCount: currCell.minesAroundCount,
                isMine: currCell.isMine,
                isMarked: currCell.isMarked,
                isRevealed: currCell.isRevealed
            };

            rowCopy.push(cellCopy);
        }

        boardCopy.push(rowCopy);
    }

    return boardCopy;
}

function copyGameVariable() {
    return {
        isOn:             gGame.isOn,
        isHintMode:       gGame.isHintMode,
        isFirstClick:     gGame.isFirstClick,
        elHintActive:     gGame.elHintActive,
        markedCount:      gGame.markedCount,
        revealedCount:    gGame.revealedCount,
        livesLeft:        gGame.livesLeft,
        hintsLeft:        gGame.hintsLeft,
        safeClicksLeft:   gGame.safeClicksLeft,
        isMegaHintMode:   gGame.isMegaHintMode,
        megaHintStartPos: gGame.megaHintStartPos ? { ...gGame.megaHintStartPos } : null
    };
}

function undoMove() {
    if (!gUndoStack.length) return;
     
    const prevState = gUndoStack.pop();
    gBoard          = prevState.board;

    assignGameState(prevState.game);
    detectAndFixFirstClick();

    renderPrevGame();

    const isDisabled = gUndoStack.length === 0;
    disableUndoButton(isDisabled);

    if (gGame.isFirstClick) {
        disableSafeClickButton(true);
        clearSafeClicksCounts();
        disableManualModeButton(false);
    } else {
        disableSafeClickButton(gGame.safeClicksLeft === 0);
        updateSafeClicksCounts();
    }
} 

function assignGameState(restoredGame) {
    /**
     * Exclude :
     * [1] - gGame.secsPassed
     * [2] - gGame.isManualMode
     * [3] - gGame.manualPlacedMines
     * [4] - gGame.isMegaHintMode
     * [5] - gGame.megaHintStartPos
     **/
    gGame.isOn             = restoredGame.isOn;
    gGame.isHintMode       = restoredGame.isHintMode;
    gGame.isFirstClick     = restoredGame.isFirstClick;
    gGame.elHintActive     = restoredGame.elHintActive;
    gGame.markedCount      = restoredGame.markedCount;
    gGame.revealedCount    = restoredGame.revealedCount;
    gGame.livesLeft        = restoredGame.livesLeft;
    gGame.hintsLeft        = restoredGame.hintsLeft;
    gGame.safeClicksLeft   = restoredGame.safeClicksLeft;
    gGame.isMegaHintMode   = restoredGame.isMegaHintMode;
    gGame.megaHintStartPos = restoredGame.megaHintStartPos ? { ...restoredGame.megaHintStartPos } : null;
}

function detectAndFixFirstClick() {
    if (gGame.revealedCount === 0 && gGame.markedCount === 0 && !gGame.isFirstClick) {
        gGame.isFirstClick = true;
    }
}

function renderPrevGame() {
    // Board //
    renderBoard('.minesweeper-board');

    // Hints //
    renderHints();

    // Lives //
    updateLivesDisplay();

    // Mines Counter //
    updateMinesCounter();

    // Face Display //
    updateFaceDisplay(START_GAME);

    // Safe Clicks //
    updateSafeClicksCounts();

    // Mega Hints //
    const toDisableMegaHint = gGame.isFirstClick || gGame.isMegaHintMode;
    disableMegaHintButton(toDisableMegaHint);
}

function disableUndoButton(isDisabled) {
    const elUndoBtn    = document.querySelector('.undo-btn');
    elUndoBtn.disabled = isDisabled;
    elUndoBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elUndoBtn.title   += ' Undo Last Move';
}

// [Debug] //
function logUndoStack() {
    for (let idx = 0; idx < gUndoStack.length; idx++) {
        let prevState = gUndoStack[idx];
        console.log('Undo Stack [' + idx + ']:');

        let flatBoard = [];
        for (let i = 0; i < gLevel.SIZE; i++) {
            for (let j = 0; j < gLevel.SIZE; j++) {
                let prevCell = prevState.board[i][j];
                flatBoard.push({
                    row: i,
                    col: j,
                    minesAroundCount: prevCell.minesAroundCount,
                    isMine: prevCell.isMine,
                    isMarked: prevCell.isMarked,
                    isRevealed: prevCell.isRevealed
                });
            }
        }

        console.table(flatBoard);
        console.log('Game state:', prevState.game);
    }
}

// --- //

// =========================== //
//         Manual Mode         //
// =========================== //
function onManualMode() {
    gGame.isManualMode      = true;
    gGame.manualPlacedMines = 0;

    resetMinesFromBoard();

    updateManualMinesCounter();
    disableManualModeButton(true);

    // Reset these values when we returned to the beginning of the game via Undo //
    gGame.isFirstClick = true;
    gGame.isOn         = false;
}

function resetMinesFromBoard() {
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell  = gBoard[i][j];
            currCell.isMine = false;
            currCell.minesAroundCount = 0;
        }
    }
}

function placeMineManually(i, j) {
    const manualCell = gBoard[i][j];

    if (manualCell.isMine) return;

    manualCell.isMine = true;
    
    gGame.manualPlacedMines++;
    const elManualBtn = document.querySelector('.manual-mode-btn');
    elManualBtn.title = `Select ${gLevel.MINES - gGame.manualPlacedMines} Cells to Place Mines`;
    updateManualMinesCounter();

    const className  = getClassName(i, j);
    const elCell     = document.querySelector(`.${className}`);
    elCell.innerText = BOMB;
    elCell.classList.add('cell-mine');

    clearManualFadeTimeouts();
    const manualTimeoutId_1 = setTimeout(() => {
        elCell.classList.add('fadeout');
    }, Math.floor(M_SECONDS / 2));

    const manualTimeoutId_2 = setTimeout(() => {
        elCell.innerText = EMPTY;
        elCell.classList.remove('cell-mine', 'fadeout');
    }, M_SECONDS);

    gManualTimeoutIds.push(manualTimeoutId_1, manualTimeoutId_2);

    if (gGame.manualPlacedMines === gLevel.MINES) {
        setMinesNegsCount(gBoard);
        startTimer();

        gGame.isManualMode = false;
        gGame.isFirstClick = false;
        gGame.isOn         = true;
    }
}

function updateManualMinesCounter() {
    const elMinesCounter     = document.querySelector('.minesweeper-counter');
    elMinesCounter.innerText = String(gGame.manualPlacedMines).padStart(PAD_ZEROS, '0');
}

function disableManualModeButton(isDisabled) {
    const elManualBtn    = document.querySelector('.manual-mode-btn');
    elManualBtn.disabled = isDisabled;

    const leftManualPlacedMines = gLevel.MINES - gGame.manualPlacedMines;
    if (!leftManualPlacedMines || isDisabled) {
        elManualBtn.title = `[Disabled] You Can't Select Cells to Place Mines`;
    } else {
        elManualBtn.title = `[Enabled] Select ${leftManualPlacedMines} Cells to Place Mines`;
    }
}

function clearManualFadeTimeouts() {
    for (let i = 0; i < gManualTimeoutIds.length; i++) {
        if (gManualTimeoutIds[i]) clearTimeout(gManualTimeoutIds[i]);
    }

    gManualTimeoutIds = [];
}

// --- //

// ========================= //
//         Mega Hint         //
// ========================= //
function onMegaHintClick() {
    if (gGame.isMegaHintMode || gGame.isFirstClick || !gGame.isOn) return;

    saveGameState(); // Store for Reversal Action //

    gGame.isMegaHintMode   = true;
    gGame.megaHintStartPos = null;

    disableMegaHintButton(true);
}

function handleMegaHintCellClick(i, j) {
    const currPos = { i, j };

    if (!gGame.megaHintStartPos) {
        gGame.megaHintStartPos = currPos;
        return;
    }

    // [Error] The same cell //
    if (currPos.i === gGame.megaHintStartPos.i &&
        currPos.j === gGame.megaHintStartPos.j) return;

    const startPos = gGame.megaHintStartPos;
    const endPos   = currPos;

    const cellsToReveal = getCellsInRect(startPos, endPos);
    revealMegaHintArea(cellsToReveal);

    gGame.isMegaHintMode   = false;
    gGame.megaHintStartPos = null;

    clearMegaHintTimeouts();
    const megaHintTimeoutId = setTimeout(() => {
        hideMegaHintArea(cellsToReveal);
    }, M_SECONDS * 1.5);

    gMegaHintTimeoutIds.push(megaHintTimeoutId);
}

function getCellsInRect(startPos, endPos) {
    const cellsMegaHint = [];

    const startI = Math.min(startPos.i, endPos.i);
    const endI   = Math.max(startPos.i, endPos.i);
    const startJ = Math.min(startPos.j, endPos.j);
    const endJ   = Math.max(startPos.j, endPos.j);

    for (let i = startI; i <= endI; i++) {
        for (let j = startJ; j <= endJ; j++) {
            const currPos = { i: i, j: j };
            cellsMegaHint.push(currPos);
        }
    }

    return cellsMegaHint;
}

function revealMegaHintArea(cellsMegaHint) {
    for (const currPos of cellsMegaHint) {
        const currCell  = gBoard[currPos.i][currPos.j];
        const className = getClassName(currPos.i, currPos.j); 
        const elCell   = document.querySelector(`.${className}`);

        if (currCell.isRevealed) continue;

        renderCellContent(currCell, elCell);
        elCell.classList.add('cell-temp-reveal');
    }
}

function hideMegaHintArea(cellsMegaHint) {
    for (const currPos of cellsMegaHint) {
        const currCell  = gBoard[currPos.i][currPos.j];
        const className = getClassName(currPos.i, currPos.j); 
        const elCell   = document.querySelector(`.${className}`);

        if (currCell.isRevealed) continue;
        
        elCell.classList.add('fadeout');

        const megaHintTimeoutId = setTimeout(() => {
            elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
            elCell.classList.remove('cell-temp-reveal', 'fadeout');
            removeNumberClasses(elCell);
        }, Math.floor(M_SECONDS / 2));
        
        gMegaHintTimeoutIds.push(megaHintTimeoutId);
    }
}

function clearMegaHintTimeouts() {
    for (let i = 0; i < gMegaHintTimeoutIds.length; i++) {
        if (gMegaHintTimeoutIds[i]) clearTimeout(gMegaHintTimeoutIds[i]);
    }

    gMegaHintTimeoutIds = [];
}

function disableMegaHintButton(isDisabled) {
    const elMegaBtn    = document.querySelector('.mega-hint-btn');
    elMegaBtn.disabled = isDisabled;
    elMegaBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elMegaBtn.title   += ' Mega Hint - Select Two Cells';
}