/***************/
/* Minesweeper */
/***************/
'use strict';

// =============================== //
//         Hint Mode Logic         //
// =============================== //
function renderHints() {
    const elContainerHints     = document.querySelector('.minesweeper-hints-container');
    elContainerHints.innerHTML = '';
    
    const usedCount = TOTAL_HINTS - gGame.hintsLeft;

    for (let i = 0; i < TOTAL_HINTS; i++) {
        const elHint     = document.createElement('span');
        elHint.innerText = HINT;

        if (i < usedCount) {
            elHint.classList.add('minesweeper-hint', 'used');
            elHint.title = '';
        } else {
            elHint.classList.add('minesweeper-hint');
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

function handleHintMode(currI, currJ) {
    gHintedCells = getCellAndNeighbors(currI, currJ);
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

    gTimer.gHintTimeoutIds.push(timeoutId);
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

        removeNumberClasses(elCell);
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

            gTimer.gHintTimeoutIds.push(timeoutId);
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
    if (gTimer.gHintTimeoutIds.length > 0) {
        for (let i = 0; i < gTimer.gHintTimeoutIds.length; i++) {
            if (gTimer.gHintTimeoutIds[i]) clearTimeout(gTimer.gHintTimeoutIds[i]);
        }

        gTimer.gHintTimeoutIds = [];
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
    const elBestScore = document.querySelector('.minesweeper-best-score-display');
    const elResetBtn  = document.querySelector('.minesweeper-reset-best-btn');

    if (bestScore !== null) {
        elBestScore.innerText = `${TROPHY} Best Score : ${String(bestScore).padStart(PAD_ZEROS, '0')} (Sec)`;
        elResetBtn.title      = '[Enabled] Reset Best Score';
        elResetBtn.classList.remove('disabled');
    } else {
        elBestScore.innerText = `${TROPHY} Best Score : —`;
        elResetBtn.title      = '[Disabled] Reset Best Score';
        elResetBtn.classList.add('disabled');
    }
    
    elResetBtn.innerText = RESET_BEST_SCORE;
}

function onResetBestScore() {
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
    const elSafeBtn    = document.querySelector('.minesweeper-safe-click-btn');
    elSafeBtn.disabled = isDisabled;
    elSafeBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elSafeBtn.title   += ' Safe Click';
}

function updateSafeClicksCounts(safeClickCountsContent) {
    const elSafeCount     = document.querySelector('.minesweeper-safe-clicks-count');
    elSafeCount.innerText = safeClickCountsContent;
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

    if (!safeCellsPos.length) return;

    const randIdx     = getRandomIntExclusive(0, safeCellsPos.length);
    const randCellPos = safeCellsPos[randIdx];
    revealSafeCellContent(randCellPos);

    clearSafeClickTimeout();
    gTimer.gSafeClickTimeoutId = setTimeout(() => {
        hideSafeCellContent(randCellPos);
        
        gGame.safeClicksLeft--;
        const safeClickCountsContent = `${gGame.safeClicksLeft} Clicks Available`;
        updateSafeClicksCounts(safeClickCountsContent);

        const toDisableSafeClick = !gGame.safeClicksLeft ? true : false;
        disableSafeClickButton(toDisableSafeClick);
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
    const elBtn  = document.querySelector('.minesweeper-toggle-theme-btn');

    elBody.classList.toggle('dark-mode');
    elBtn.innerText = THEME;
}

function resetToggleTheme() {
    const elBtn     = document.querySelector('.minesweeper-toggle-theme-btn');
    elBtn.innerText = THEME;
    elBtn.title     = 'Toggle Theme';
}

// --- //

// ==================== //
//         Undo         //
// ==================== //
function saveGameState() {
    let boardCopy = copyBoard();
    let gameCopy  = copyGameVariable();
    
    gUndoStack.push({
        board: boardCopy,
        game: gameCopy
    });

    const elUndoBtn = document.querySelector('.minesweeper-undo-btn');
    if (elUndoBtn.disabled) disableUndoButton(false);
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
        isOn:               gGame.isOn,
        isHintMode:         gGame.isHintMode,
        isFirstClick:       gGame.isFirstClick,
        elHintActive:       gGame.elHintActive,
        markedCount:        gGame.markedCount,
        revealedCount:      gGame.revealedCount,
        livesLeft:          gGame.livesLeft,
        hintsLeft:          gGame.hintsLeft,
        safeClicksLeft:     gGame.safeClicksLeft,
        isMegaHintMode:     gGame.isMegaHintMode,
        megaHintStartPos:   gGame.megaHintStartPos ? { ...gGame.megaHintStartPos } : null,
        isUsedExterminator: gGame.isUsedExterminator
    };
}

function undoMove() {
    if (!gUndoStack.length) return;
     
    const prevState = gUndoStack.pop();
    gBoard          = prevState.board;

    assignGameState(prevState.game);
    detectAndFixFirstClick();

    resetPartTimersAndIntervals();
    renderPrevGame();
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
    gGame.isOn               = restoredGame.isOn;
    gGame.isHintMode         = restoredGame.isHintMode;
    gGame.isFirstClick       = restoredGame.isFirstClick;
    gGame.elHintActive       = restoredGame.elHintActive;
    gGame.markedCount        = restoredGame.markedCount;
    gGame.revealedCount      = restoredGame.revealedCount;
    gGame.livesLeft          = restoredGame.livesLeft;
    gGame.hintsLeft          = restoredGame.hintsLeft;
    gGame.safeClicksLeft     = restoredGame.safeClicksLeft;
    gGame.isMegaHintMode     = restoredGame.isMegaHintMode;
    gGame.megaHintStartPos   = restoredGame.megaHintStartPos ? { ...restoredGame.megaHintStartPos } : null;
    gGame.isUsedExterminator = restoredGame.isUsedExterminator;
}

function detectAndFixFirstClick() {
    if (gGame.revealedCount === 0 && gGame.markedCount === 0 && !gGame.isFirstClick) {
        gGame.isFirstClick = true;
    }
}

function resetPartTimersAndIntervals() {
    /**
     * Reset Timers (Order) :
     * [1] - Hints.
     * [2] - Safe Click.
     * [3] - Manual Mode.
     * [4] - Mega Hint.
     * [5] - Exterminator.
     **/
    clearHintTimeouts();
    clearSafeClickTimeout();
    clearSafeFadeoutTimeout();
    clearManualFadeoutTimeouts();
    clearMegaHintTimeouts();
    clearExterminatorTimeouts();
}

function renderPrevGame() {
    // Board //
    renderBoard('.minesweeper-board');

    // Toggle (Radio Buttons) //
    if (gGame.isFirstClick) toggleLevelSelectors(false);

    // Hints //
    renderHints();

    // Lives //
    updateLivesDisplay();

    // Mines Counter //
    updateMinesCounter();

    // Face Display //
    updateFaceDisplay(START_GAME);

    // Safe Click //
    const safeClickCountsContent = gGame.isFirstClick ? '' : `${gGame.safeClicksLeft} Clicks Available`;
    if (gGame.isFirstClick) {
        disableSafeClickButton(true);
        updateSafeClicksCounts(safeClickCountsContent);
    } else {
        const toDisableSafeClick = gGame.safeClicksLeft === 0
        disableSafeClickButton(toDisableSafeClick);
        updateSafeClicksCounts(safeClickCountsContent);
    }
    
    // Undo Button //
    const toDisableUndo = gUndoStack.length === 0;
    disableUndoButton(toDisableUndo);
    
    // Manual Mode //
    if (gGame.isFirstClick) disableManualModeButton(false);

    // Mega Hints //
    const toDisableMegaHint = gGame.isFirstClick || gGame.isMegaHintMode;
    disableMegaHintButton(toDisableMegaHint);

    // Exterminator //
    const toDisableExterminator = gGame.isFirstClick ? true : false;
    disableExterminatorButton(toDisableExterminator);
}

function disableUndoButton(isDisabled) {
    const elUndoBtn    = document.querySelector('.minesweeper-undo-btn');
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

    toggleLevelSelectors(true);

    resetMinesFromBoard();

    updateManualMinesCounter();
    disableManualModeButton(true);

    const minesLeft = gLevel.MINES - gGame.manualPlacedMines;
    showMessage(`<p class="minesweeper-hint-message">💣 Manual Mode Enabled - You Can Place (${minesLeft}) Mines Manually Only ...</p>`);

    // Reset these values when we returned to the beginning of the game via Undo //
    if (gGame.isOn) gGame.isOn = false;
    if (!gGame.isFirstClick) gGame.isFirstClick = true;
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

function placeMineManually(currI, currJ) {
    const manualCell = gBoard[currI][currJ];
    if (manualCell.isMine) return;
    
    manualCell.isMine = true;
    gGame.manualPlacedMines++;

    const elManualBtn = document.querySelector('.minesweeper-manual-mode-btn');
    elManualBtn.title = `[Enabled] Select ${gLevel.MINES - gGame.manualPlacedMines} Cells to Place Mines`;
    updateManualMinesCounter();

    const className  = getClassName(currI, currJ);
    const elCell     = document.querySelector(`.${className}`);
    elCell.innerText = BOMB;
    elCell.classList.add('cell-mine');

    clearManualFadeoutTimeouts();
    const manualTimeoutId_1 = setTimeout(() => {
        elCell.classList.add('fadeout');
    }, Math.floor(M_SECONDS / 2));

    const manualTimeoutId_2 = setTimeout(() => {
        elCell.innerText = EMPTY;
        elCell.classList.remove('cell-mine', 'fadeout');
    }, M_SECONDS);

    gTimer.gManualTimeoutIds.push(manualTimeoutId_1, manualTimeoutId_2);

    if (gGame.manualPlacedMines === gLevel.MINES) {
        setMinesNegsCount(gBoard);
        startTimer();
        hideMessage();

        elManualBtn.title  = `[Disabled] You Can't Select Cells to Place Mines`;
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
    const elManualBtn    = document.querySelector('.minesweeper-manual-mode-btn');
    elManualBtn.disabled = isDisabled;

    const leftManualPlacedMines = gLevel.MINES - gGame.manualPlacedMines;
    if (leftManualPlacedMines > 0) {
        elManualBtn.title = `[Enabled] Select ${leftManualPlacedMines} Cells to Place Mines`;
    } else {
        elManualBtn.title = `[Disabled] You Can't Select Cells to Place Mines`;
    }
}

function clearManualFadeoutTimeouts() {
    for (let i = 0; i < gTimer.gManualTimeoutIds.length; i++) {
        if (gTimer.gManualTimeoutIds[i]) clearTimeout(gTimer.gManualTimeoutIds[i]);
    }

    gTimer.gManualTimeoutIds = [];
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

function handleMegaHintCellClick(currI, currJ) {
    const currPos = { i: currI, j: currJ };

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

    gTimer.gMegaHintTimeoutIds.push(megaHintTimeoutId);
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
        const elCell    = document.querySelector(`.${className}`);

        if (currCell.isRevealed) continue;

        renderCellContent(currCell, elCell);
        elCell.classList.add('cell-temp-reveal');
    }
}

function hideMegaHintArea(cellsMegaHint) {
    for (const currPos of cellsMegaHint) {
        const currCell  = gBoard[currPos.i][currPos.j];
        const className = getClassName(currPos.i, currPos.j); 
        const elCell    = document.querySelector(`.${className}`);

        if (currCell.isRevealed) continue;
        
        elCell.classList.add('fadeout');

        const megaHintTimeoutId = setTimeout(() => {
            elCell.innerText = currCell.isMarked ? FLAG : EMPTY;
            elCell.classList.remove('cell-temp-reveal', 'fadeout');
            removeNumberClasses(elCell);
        }, Math.floor(M_SECONDS / 2));
        
        gTimer.gMegaHintTimeoutIds.push(megaHintTimeoutId);
    }
}

function clearMegaHintTimeouts() {
    for (let i = 0; i < gTimer.gMegaHintTimeoutIds.length; i++) {
        if (gTimer.gMegaHintTimeoutIds[i]) clearTimeout(gTimer.gMegaHintTimeoutIds[i]);
    }

    gTimer.gMegaHintTimeoutIds = [];
}

function disableMegaHintButton(isDisabled) {
    const elMegaBtn    = document.querySelector('.minesweeper-mega-hint-btn');
    elMegaBtn.disabled = isDisabled;
    elMegaBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elMegaBtn.title   += ' Mega Hint - Select Two Cells';
}

// --- //

// ============================ //
//         Exterminator         //
// ============================ //
function onExterminatorClick() {
    if (gGame.isUsedExterminator || !gGame.isOn || gLevel.MINES <= NUM_MINES_TO_REMOVE) return;

    saveGameState(); // Store for Reversal Action //

    gGame.isUsedExterminator = true;
    disableExterminatorButton(true);

    const totalMinePositions = getRemovableMinePositions();
    if (totalMinePositions.length <= NUM_MINES_TO_REMOVE) return;

    const removedMinePositions = removeRandomMinesFromBoard(totalMinePositions);

    clearExterminatorTimeouts();
    hideRemovedMinesVisually(removedMinePositions);

    setMinesNegsCount(gBoard);
}

function getRemovableMinePositions() {
    const minesPositions = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell = gBoard[i][j];
            if (currCell.isMine && !currCell.isRevealed) {
                const minePos = { i: i, j: j };
                minesPositions.push(minePos);
            }
        }
    }

    return minesPositions;
}

function removeRandomMinesFromBoard(totalMinePositions) {
    const removedMinePositions = [];

    for (let i = 0; i < NUM_MINES_TO_REMOVE; i++) {
        const randIdx = getRandomIntExclusive(0, totalMinePositions.length);
        const randPos = totalMinePositions.splice(randIdx, 1)[0];

        const randMineCell  = gBoard[randPos.i][randPos.j];
        randMineCell.isMine = false;
        removedMinePositions.push(randPos);

        const className = getClassName(randPos.i, randPos.j);
        const elCell    = document.querySelector(`.${className}`);

        elCell.innerText = BOMB;
        elCell.classList.add('cell-mine');

        const exterminatorFadeoutTimeoutId = setTimeout(() => {
            elCell.classList.add('fadeout');
        }, Math.floor(M_SECONDS / 2));

        gTimer.gExterminatorFadeoutTimeoutIds.push(exterminatorFadeoutTimeoutId);
    }

    return removedMinePositions;
}

function clearExterminatorTimeouts() {
    for (let i = 0; i < gTimer.gExterminatorFadeoutTimeoutIds.length; i++) {
        if (gTimer.gExterminatorFadeoutTimeoutIds[i]) clearTimeout(gTimer.gExterminatorFadeoutTimeoutIds[i]);
    }
    
    gTimer.gExterminatorFadeoutTimeoutIds = [];
}

function hideRemovedMinesVisually(removedMinePositions) {
    const exterminatorFadeoutTimeoutId = setTimeout(() => {
        for (const removedMinePos of removedMinePositions) {
            const removedMineCell = gBoard[removedMinePos.i][removedMinePos.j];

            const className = getClassName(removedMinePos.i, removedMinePos.j);
            const elCell    = document.querySelector(`.${className}`);

            if (!removedMineCell.isRevealed) elCell.innerText = EMPTY;
            elCell.classList.remove('cell-mine', 'fadeout');
        }
    }, M_SECONDS);

    gTimer.gExterminatorFadeoutTimeoutIds.push(exterminatorFadeoutTimeoutId);
}

function disableExterminatorButton(isDisabled) {
    const elExterminatorBtn    = document.querySelector('.minesweeper-exterminator-btn');
    elExterminatorBtn.disabled = isDisabled;
    elExterminatorBtn.title    = isDisabled ? '[Disabled]' : '[Enabled]';
    elExterminatorBtn.title   += ` Remove ${NUM_MINES_TO_REMOVE} Random Mines`;
}
