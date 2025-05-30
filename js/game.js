/***************/
/* Minesweeper */
/***************/
'use strict';

// ========================== //
//        Explanations        //
// ========================== //
/**
 * Cell States :
 * +----------------------+-------------------------------------+
 * | State (Name)         | Description                         |
 * +----------------------+-------------------------------------+
 * | "unrevealed"         | Cell is hidden, waiting for action  |
 * +----------------------+-------------------------------------+
 * | "flagged"            | Marked by the user as a flag        |
 * +----------------------+-------------------------------------+
 * | "revealed-number"    | Revealed with number (1 – 8)        |
 * +----------------------+-------------------------------------+
 * | "revealed-empty"     | Revealed, no mines around (0 count) |
 * +----------------------+-------------------------------------+
 * | "revealed-mine"      | Mine revealed → game over           |
 * +----------------------+-------------------------------------+
 * 
 * Transitions :
 * +----------------------+-----------------+-------------------------------------+
 * | State (Before)       | State (After)   | Click Type                          |
 * +----------------------+-----------------+-------------------------------------+
 * | unrevealed           | flagged         | Right click                         |
 * +----------------------+-----------------+-------------------------------------+
 * | flagged              | unrevealed      | Right click again                   |
 * +----------------------+-----------------+-------------------------------------+
 * | unrevealed           | revealed-number | Left click, has number              |
 * +----------------------+-----------------+-------------------------------------+
 * | unrevealed           | revealed-empty  | Left click, no mines around         |
 * +----------------------+-----------------+-------------------------------------+
 * | unrevealed           | mine-clicked    | Left click on mine, still has lives |
 * +----------------------+-----------------+-------------------------------------+
 * | mine-clicked         | unrevealed      | After reset / life lost             |
 * +----------------------+-----------------+-------------------------------------+
 * | unrevealed           | revealed-mine   | If game over and isMine             |
 * +----------------------+-----------------+-------------------------------------+
 **/

// --- //

// ============================= //
//        Level Selectors        //
// ============================= //
function onLevelChange(elLevel) {
    if (!gGame.isFirstClick) return;

    const selectedLevel = elLevel.value;
    const levelConfig   = LEVELS[selectedLevel];

    gLevel.SIZE  = levelConfig.SIZE;
    gLevel.MINES = levelConfig.MINES;
    gLevel.KEY   = selectedLevel;

    onInit();
}

function toggleLevelSelectors(isDisabled) {
    const radios = document.querySelectorAll('input[name="level"]');
    radios.forEach(radio => radio.disabled = isDisabled);
}

// --- //

// ================================== //
//         Game Initialization        //
// ================================== //
function onInit() {
    resetGameVars();
    resetDOM();
    resetAllTimersAndIntervals();

    gBoard = buildBoard();
    renderBoard('.minesweeper-board');

    setupEventListeners();
}

function resetGameVars() {
    gBoard       = [];
    gUndoStack   = [];
    gHintedCells = [];

    gGame.isOn               = false;
    gGame.isHintMode         = false;
    gGame.isFirstClick       = true;
    gGame.elHintActive       = null;
    gGame.secsPassed         = 0;
    gGame.markedCount        = 0;
    gGame.revealedCount      = 0;
    gGame.livesLeft          = 3;
    gGame.hintsLeft          = 3;
    gGame.safeClicksLeft     = 3;
    gGame.isManualMode       = false;
    gGame.manualPlacedMines  = 0;
    gGame.isMegaHintMode     = false;
    gGame.megaHintStartPos   = null;
    gGame.isUsedExterminator = false;
}

function resetDOM() {
    /**
     * Render Order :
     * [1]  - Theme.
     * [2]  - Radio Buttons.
     * [3]  - Best Score.
     * [4]  - Hints / Lives.
     * [5]  - Mines Counter / Emoji / Timer.
     * [6]  - Safe Click.
     * [7]  - Undo.
     * [8]  - Manual Mode.
     * [9]  - Mega Hint.
     * [10] - Exterminator.
     * [11] - Message to User (Edge Cases).
     **/
    resetToggleTheme();
    
    toggleLevelSelectors(false);

    renderBestScoreDisplay();

    renderHints();
    updateLivesDisplay();

    updateMinesCounter();
    updateFaceDisplay(START_GAME);
    updateTimerDisplay();

    const safeClickCountsContent = '';
    disableSafeClickButton(true);
    updateSafeClicksCounts(safeClickCountsContent);

    disableUndoButton(true);
    disableManualModeButton(false);
    disableMegaHintButton(true);
    disableExterminatorButton(true);

    hideMessage();
}

function resetAllTimersAndIntervals() {
    /**
     * Reset Timers (Order) :
     * [1] - Timer.
     * [2] - Mines.
     * [3] - Hints.
     * [4] - Safe Click.
     * [5] - Manual Mode.
     * [6] - Mega Hint.
     * [7] - Exterminator.
     **/
    stopTimer();
    clearMineTimeout();
    clearHintTimeouts();
    clearSafeClickTimeout();
    clearSafeFadeoutTimeout();
    clearManualFadeoutTimeouts();
    clearMegaHintTimeouts();
    clearExterminatorTimeouts();
}

function onRestart() {
    onInit();
}

// --- //

// ================================ //
//        Board Setup & Build       //
// ================================ //
function buildBoard() {
    let board = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        let newRow = [];

        for (let j = 0; j < gLevel.SIZE; j++) {
            let currCell = createCell();
            newRow.push(currCell);
        }

        board.push(newRow);
    }

    return board;
}

function createCell() {
    return {
        minesAroundCount: 0,
        isMine:     false,
        isMarked:   false,
        isRevealed: false
    };
}

function renderBoard(selector) {
    let strHTML = '<table><tbody>';

    for (let i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>';
        
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell     = gBoard[i][j];
            const className    = `${getClassName(i, j)}`;
            let cellContent    = EMPTY;
            let cellStateClass = '';

            if (currCell.isRevealed) {
                if (currCell.isMine) {
                    cellContent    = BOMB;
                    cellStateClass = 'cell-mine';
                } 
                else if (currCell.minesAroundCount > 0) {
                    cellContent    = currCell.minesAroundCount;
                    cellStateClass = `cell-number cell-${currCell.minesAroundCount}`;
                } 
                else {
                    cellContent    = EMPTY;
                    cellStateClass = 'cell-empty';
                }
            } 
            else if (currCell.isMarked) {
                cellContent    = FLAG;
                cellStateClass = 'cell-flag';
            }

            strHTML += `<td class="${className} ${cellStateClass}"
                            onclick="onCellClicked(this, ${i}, ${j})" 
                            oncontextmenu="onCellMarked(this, ${i}, ${j})">
                            ${cellContent}
                        </td>`;
        }

        strHTML += '</tr>';
    }

    strHTML += '</tbody></table>';

    const elContainer     = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

// --- //

// =============================== //
//        First Click Logic        //
// =============================== //
function onCellClicked(elCell, currI, currJ) {
    // Manual Mode //
    if (gGame.isManualMode) {
        placeMineManually(currI, currJ);
        return;
    }

    // Mega Hint //
    if (gGame.isMegaHintMode) {
        handleMegaHintCellClick(currI, currJ);
        return;
    }

    // First Click //
    if (gGame.isFirstClick) handleFirstClick(currI, currJ);

    // Game is Off //
    if (!gGame.isOn) return;

    // Hint Mode //
    if (gGame.isHintMode) {
        clearHintTimeouts();
        handleHintMode(currI, currJ);
        return;
    }

    // Store for Reversal Action //
    saveGameState();

    const currCell = gBoard[currI][currJ];
    if (currCell.isMarked || currCell.isRevealed) return;

    if (currCell.isMine) {
        handleMineCell(elCell, currI, currJ);
    }
    else if (currCell.minesAroundCount) {
        handleNumberCell(currCell, elCell);
    }
    else {
        handleEmptyCell(currCell, elCell, currI, currJ);
    }
}

function handleFirstClick(currI, currJ) {
    if (!isMineCountValid()) return;

    toggleLevelSelectors(true);
    setMinesPositions(gBoard, currI, currJ);
    setMinesNegsCount(gBoard);
    startTimer();

    gGame.isOn         = true;
    gGame.isFirstClick = false;

    const safeClickCountsContent = `${gGame.safeClicksLeft} Clicks Available`;
    disableSafeClickButton(false);
    updateSafeClicksCounts(safeClickCountsContent);

    disableManualModeButton(true);
    disableMegaHintButton(false);

    if (gLevel.MINES > 3) disableExterminatorButton(false);
}

function isMineCountValid() {
    if (gLevel.MINES > (gLevel.SIZE ** 2) - 1) {
        gGame.isOn = false;
        stopTimer();

        updateFaceDisplay(ERROR);
        showMessage(`<p>⚠️ Too many mines for this board size ...</p>
                     <p class="minesweeper-hint-message">💡 You need to click on ❌ to start the game again ...</p>`);
        
        return false;
    }

    hideMessage();
    return true;
}

// --- //

// ================================ //
//       Mine Placement Logic       //
// ================================ //

// Option A - `setMinesPositions` //
/**
 * +-----------------+------------------+
 * | Time Complexity | Space Complexity |
 * +-----------------+------------------+
 * |     O(n ^ 2)    |       O(n)       |
 * +-----------------+------------------+
 **/
function setMinesPositions(board, firstClickI, firstClickJ) {
    const minesPositions = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            if (i === firstClickI && j === firstClickJ) continue;
            minesPositions.push({i: i, j: j});
        }
    }

    // Shuffling //
    for (let i = minesPositions.length - 1; i > 0; i--) {
        const randIdx = getRandomIntInclusive(0, i);
        [minesPositions[i], minesPositions[randIdx]] = [minesPositions[randIdx], minesPositions[i]]; // Swap //
    }

    for (let i = 0; i < gLevel.MINES; i++) {
        const randPos = minesPositions[i];
        board[randPos.i][randPos.j].isMine = true;
    }
}

// Option B - `setMinesPositions` //
/**
 * +-----------------+------------------+
 * | Time Complexity | Space Complexity |
 * +-----------------+------------------+
 * |     O(n)        |      O(1)        |
 * +-----------------+------------------+
 *
 * function setMinesPositions(board, firstClickI, firstClickJ) {
 *     let idx = 0;
 *
 *     while (idx < gLevel.MINES) {
 *         const randIdx  = getRandomIntExclusive(0, gLevel.SIZE);
 *         const randJdx  = getRandomIntExclusive(0, gLevel.SIZE);
 *         if (randIdx === firstClickI && randJdx === firstClickJ) continue;
 *             
 *         const randCell = board[randIdx][randJdx];
 *            
 *         if (!randCell.isMine) {
 *             randCell.isMine = true;
 *             idx++;
 *         }
 *     }
 * }
 **/

function setMinesNegsCount(board) {
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell = board[i][j];
            if (currCell.isMine) continue;
            currCell.minesAroundCount = calculateMinesAroundCell(board, i, j);
        }
    }
}

function calculateMinesAroundCell(board, currI, currJ) {
    let minesNegsCount = 0;

    for (let i = currI - 1; i <= currI + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;

        for (let j = currJ - 1; j <= currJ + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE || (i === currI && j === currJ)) continue;

            const neighborCell = board[i][j];
            if (neighborCell.isMine) minesNegsCount++;
        }
    }

    return minesNegsCount;
}

// --- //

// ================================= //
//        Cell Click Handlers        //
// ================================= //
function handleMineCell(elCell, currI, currJ) {
    elCell.innerText = BOMB;

    elCell.classList.add('cell-mine-clicked');

    gGame.livesLeft--;
    updateLivesDisplay();

    if (!gGame.livesLeft) {
        endGameAndRevealMines(currI, currJ);
    } else {
        const currCell = gBoard[currI][currJ];
        resetMineCell(currCell, elCell);
    }
}

function resetMineCell(currCell, elCell) {
    clearMineTimeout();

    gTimer.gMineResetTimeoutId = setTimeout(() => {
        elCell.innerText    = EMPTY;
        currCell.isRevealed = false;
        elCell.classList.remove('cell-mine-clicked');
    }, Math.floor(M_SECONDS / 3));
} 

function handleNumberCell(currCell, elCell) {
    currCell.isRevealed = true;
    gGame.revealedCount++;
    
    removeNumberClasses(elCell); // Remove any existing number color classes (cell-1 ... cell-8) from the cell before adding the class for the current minesAroundCount //

    elCell.innerText = currCell.minesAroundCount;
    elCell.classList.add('cell-number', `cell-${currCell.minesAroundCount}`);
    
    checkGameOver();
}

function handleEmptyCell(currCell, elCell, currI, currJ) {
    currCell.isRevealed = true;
    gGame.revealedCount++;

    elCell.innerText = EMPTY;
    elCell.classList.add('cell-empty');
    expandReveal(gBoard, currI, currJ);

    checkGameOver();
}

// --- //

// ============================= //
//        Expansion Logic        //
// ============================= //
function expandReveal(board, currI, currJ) {
    for (let i = currI - 1; i <= currI + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue;

        for (let j = currJ - 1; j <= currJ + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE || (i === currI && j === currJ)) continue;

            const currNeg = board[i][j];
            if (currNeg.isRevealed || currNeg.isMine || currNeg.isMarked)  continue;
        
            const className      = getClassName(i, j);
            const neighborElCell = document.querySelector(`.${className}`);

            if (currNeg.minesAroundCount > 0) {
                handleNumberCell(currNeg, neighborElCell);
            } else {
                handleEmptyCell(currNeg, neighborElCell, i, j);
            }
        }
    }
}

// --- //

// ============================= //
//         Marking Logic         //
// ============================= //
function onCellMarked(elCell, currI, currJ) {    
    if (gGame.isFirstClick) handleFirstClick(currI, currJ);

    if (!gGame.isOn) return;

    saveGameState(); // Store for Reversal Action //

    const currCell = gBoard[currI][currJ];
    if (currCell.isRevealed) return;

    if (!currCell.isMarked && gGame.markedCount >= gLevel.MINES) {
        showMessage('<p>🚫 You cannot place more than ' + gLevel.MINES + ' flags ...</p>');
        return;
    }

    if (currCell.isMarked) {
        unmarkCell(currCell, elCell);
    } else {
        markCell(currCell, elCell);
    }

    updateMinesCounter();
}

function unmarkCell(currCell, elCell) {
    currCell.isMarked = false;
    gGame.markedCount--;

    updateCellFlagDisplay(elCell, EMPTY, 'cell-flag');
    hideMessage();
}

function markCell(currCell, elCell) {
    currCell.isMarked = true;
    gGame.markedCount++;

    updateCellFlagDisplay(elCell, FLAG, 'cell-flag');
    checkGameOver();
}

function updateCellFlagDisplay(elCell, sign, selector) {
    elCell.innerText = sign;

    switch (sign) {
        case EMPTY:
            elCell.classList.add(selector);
            break;
        
        case FLAG:
            elCell.classList.remove(selector);
            break;
    }
}

// --- //

// =============================== //
//         Game Over Logic         //
// =============================== //
function checkGameOver() {
    const totalCells          = gLevel.SIZE ** 2;
    const areAllCellsRevealed = gGame.revealedCount === totalCells - gLevel.MINES;
    const areAllFlagsCorrect  = areAllFlagsOnMinesOnly();

    if (areAllCellsRevealed && areAllFlagsCorrect) {
        setGameOver(WIN_GAME);
    }
}

function areAllFlagsOnMinesOnly() {
    if (gGame.markedCount != gLevel.MINES) return false;

    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const currCell = gBoard[i][j];
            if ((currCell.isMine  && !currCell.isMarked) ||
                (!currCell.isMine &&  currCell.isMarked)) return false;
        }
    }

    return true;
}

function setGameOver(faceEmoji) {
    if (faceEmoji === WIN_GAME) {
        updateBestScoreIfNeeded(gLevel.KEY, gGame.secsPassed);
    }

    updateFaceDisplay(faceEmoji);

    gGame.isOn = false;
    stopTimer();

    const safeClickCountsContent = '';
    disableSafeClickButton(true);
    updateSafeClicksCounts(safeClickCountsContent);

    disableUndoButton(true);
    disableMegaHintButton(true);
    disableExterminatorButton(true);
}

function endGameAndRevealMines(currI, currJ) {
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            if (i === currI && j === currJ) continue; 

            const currCell = gBoard[i][j];
            if (currCell.isMine) {
                const className  = getClassName(i, j);
                const elCell     = document.querySelector(`.${className}`);
                elCell.innerText = BOMB;
                elCell.classList.add('cell-mine');
            }
        }
    }

    setGameOver(LOSE_GAME);
}