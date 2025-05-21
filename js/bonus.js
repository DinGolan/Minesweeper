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

        if (negCell.isMine) {
            elNegCell.innerText = BOMB;
        }
        else if (negCell.minesAroundCount > 0) {
            elNegCell.innerText = negCell.minesAroundCount;
            elNegCell.classList.add(`cell-${negCell.minesAroundCount}`);
        }
        else {
            elNegCell.innerText = EMPTY;
        }

        elNegCell.classList.add('cell-temp-reveal');
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
        elResetBtn.classList.remove('disabled');
    } else {
        elBestScore.innerText = `${TROPHY} Best Score : —`;
        elResetBtn.classList.add('disabled');
    }
    
    elResetBtn.innerText = RESET_BEST_SCORE;
    elResetBtn.title     = 'Reset Best Score';
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
    elSafeBtn.title    = 'Safe Click';
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
// [TODO] //
/**
 * [1] - There’s no need to save the previous state when clicking on a hint cell or a safe click cell.
 * [2] - There is an issue with `Undo` & `Safe Click`.
 * [3] - Search the `Debug` sections.
 **/
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
        isOn:           gGame.isOn,
        isHintMode:     gGame.isHintMode,
        isFirstClick:   gGame.isFirstClick,
        elHintActive:   gGame.elHintActive,
        markedCount:    gGame.markedCount,
        revealedCount:  gGame.revealedCount,
        livesLeft:      gGame.livesLeft,
        hintsLeft:      gGame.hintsLeft,
        safeClicksLeft: gGame.safeClicksLeft
    };
}

function undoMove() {
    if (!gUndoStack.length) return;

    // [Debug] //
    logUndoStack();

    const prevState = gUndoStack.pop();
    gBoard          = prevState.board;

    assignGameStateExceptTimer(prevState.game); // Copy saved values back into gGame (Except gGame.secsPassed)  //
    
    // [Debug] //
    /**
     * Explanations :
     * - Reset hint mode to avoid accidental activation after undo.
     * - Reset hint element to avoid accidental activation after undo.
     * - Remove any active hint classes.
     * 
     * if (gGame.isHintMode) {
     *     gGame.isHintMode   = false;
     *     gGame.elHintActive = null;
     *     document.querySelectorAll('.hints-container .hint.active').forEach(elHint => {
     *         elHint.classList.remove('active');
     *     });
     * }
     **/
    renderPrevGame();

    const isDisabled = gUndoStack.length === 0;
    disableUndoButton(isDisabled);

    if (gGame.isFirstClick) {
        disableSafeClickButton(true);
        clearSafeClicksCounts();
    }
}

function assignGameStateExceptTimer(restoredGame) {
    gGame.isOn           = restoredGame.isOn;
    gGame.isHintMode     = restoredGame.isHintMode;
    gGame.isFirstClick   = restoredGame.isFirstClick;
    gGame.elHintActive   = restoredGame.elHintActive;
    gGame.markedCount    = restoredGame.markedCount;
    gGame.revealedCount  = restoredGame.revealedCount;
    gGame.livesLeft      = restoredGame.livesLeft;
    gGame.hintsLeft      = restoredGame.hintsLeft;
    gGame.safeClicksLeft = restoredGame.safeClicksLeft;
}

function renderPrevGame() {
    renderBoard('.minesweeper-board');
    renderHints();
    updateLivesDisplay();
    updateMinesCounter();
    updateFaceDisplay(START_GAME);
    updateSafeClicksCounts();
}

function disableUndoButton(isDisabled) {
    const elUndoBtn    = document.querySelector('.undo-btn');
    elUndoBtn.disabled = isDisabled;
    elUndoBtn.title    = 'Undo Last Move';
}

// [Debug] //
function logUndoStack() {
    for (let idx = 0; idx < gUndoStack.length; idx++) {
        let prevState = gUndoStack[idx];
        console.log('Undo Stack [' + idx + ']:');

        let flatBoard = [];
        for (var i = 0; i < gLevel.SIZE; i++) {
            for (var j = 0; j < gLevel.SIZE; j++) {
                var prevCell = prevState.board[i][j];
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
        console.log('Game state:', state.game);
    }
}