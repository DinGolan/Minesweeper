/***************/
/* MineSweeper */
/***************/
'use strict';

function onInit() {
    resetGameVars();
    stopTimer();
    resetDOM();

    gBoard = buildBoard();
    renderBoard('.minesweeper-board');

    setupEventListeners();
}

function resetGameVars() {
    gIsFirstClick       = true;
    gGame.isOn          = true;
    gGame.secsPassed    = 0;
    gGame.markedCount   = 0;
    gGame.revealedCount = 0;
}

function resetDOM() {
    updateTimerDisplay();
    updateFaceDisplay(START_GAME);
    updateMinesCounter();

    const elBoard = document.querySelector('.minesweeper-board');
    elBoard.classList.remove('game-over');

    hideMessage();
}

function setupEventListeners() {
    const elBoard = document.querySelector('.minesweeper-board');
    elBoard.removeEventListener('contextmenu', handleRightClick); // Avoid Duplicates //
    elBoard.addEventListener('contextmenu', handleRightClick);
}

function handleRightClick(event) {
    event.preventDefault();
}

function buildBoard() {
    let board = [];

    for (let i = 0; i < gLevel.SIZE; i++) {
        let row = [];

        for (let j = 0; j < gLevel.SIZE; j++) {
            let cell = createCell();
            row.push(cell);
        }

        board.push(row);
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
            const className = `${getClassName(i, j)} cell-closed`;
            strHTML        += `<td class="${className}"
                                   onclick="onCellClicked(this, ${i}, ${j})" 
                                   oncontextmenu="onCellMarked(this, ${i}, ${j})">
                               ${EMPTY}
                               </td>`;
        }

        strHTML += '</tr>';
    }

    strHTML += '</tbody></table>';

    const elContainer     = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return;

    if (gIsFirstClick) handleFirstClick(i, j);

    const currCell = gBoard[i][j];
    if (currCell.isMarked || currCell.isRevealed) return;

    if (currCell.isMine) {
        handleMineCell(elCell, i, j);
    }
    else if (currCell.minesAroundCount) {
        handleNumberCell(currCell, elCell);
    }
    else {
        handleEmptyCell(currCell, elCell, i, j);
    }
}

function handleFirstClick(i, j) {
    if (!isMineCountValid()) return;

    setMinesPositions(gBoard, i, j);
    setMinesNegsCount(gBoard);
    startTimer();
    gIsFirstClick = false;
}

function isMineCountValid() {
    if (gLevel.MINES > (gLevel.SIZE ** 2) - 1) {
        gGame.isOn = false;
        stopTimer();
        updateFaceDisplay(ERROR);
        showMessage(`<p>⚠️ Too many mines for this board size ...</p>
                     <p class="hint">💡 You need to click on ❌ to start the game again ...</p>`);
        return false;
    }

    hideMessage();
    return true;
}

// Option A - `setMinesPositions` //
/**
 * +-----------------+------------------+
 * | Time Complexity | Space Complexity |
 * +-----------------+------------------+
 * |       O(n)      |        O(n)      |
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
 * |     O(n ^ 2)    |      O(1)        |
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

function handleMineCell(elCell, i, j) {
    elCell.innerText = BOMB;

    elCell.classList.remove('cell-closed');
    elCell.classList.add('cell-mine-clicked');

    endGameAndRevealMines(i, j);
}

function handleNumberCell(currCell, elCell) {
    currCell.isRevealed = true;
    gGame.revealedCount++;
    
    // Remove any existing number color classes (cell-1 ... cell-8) from the cell before adding the class for the current minesAroundCount //
    for (let i = 1; i <= 8; i++) {
        if (elCell.classList.contains(`cell-${i}`)) {
            elCell.classList.remove(`cell-${i}`);
        }
    }

    elCell.innerText = currCell.minesAroundCount;

    elCell.classList.remove('cell-closed');
    elCell.classList.add('cell-number', `cell-${currCell.minesAroundCount}`);
    
    checkGameOver();
}

function handleEmptyCell(currCell, elCell, i, j) {
    currCell.isRevealed = true;
    gGame.revealedCount++;

    elCell.innerText = EMPTY;
    elCell.classList.remove('cell-closed');
    elCell.classList.add('cell-empty');
    expandReveal(gBoard, i, j);

    checkGameOver();
}

function endGameAndRevealMines(currI, currJ) {
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            if (i === currI && j === currJ) continue; // Mine gBoard[currI][currJ] already revealed // 

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

function checkGameOver() {
    const totalCells          = gLevel.SIZE ** 2;
    const areAllCellsRevealed = gGame.revealedCount === totalCells - gLevel.MINES;
    const areAllFlagsCorrect  = areAllFlagsOnMinesOnly();

    if (areAllCellsRevealed || areAllFlagsCorrect) {
        setGameOver(WIN_GAME);
    }
}

function setGameOver(faceEmoji) {
    const elBoard = document.querySelector('.minesweeper-board');
    elBoard.classList.add('game-over');

    updateFaceDisplay(faceEmoji);

    gGame.isOn = false;
    stopTimer();
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

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return;

    const currCell = gBoard[i][j];
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

    updateCellFlagDisplay(elCell, EMPTY, 'cell-flag', 'cell-closed');
    hideMessage();
}

function markCell(currCell, elCell) {
    currCell.isMarked = true;
    gGame.markedCount++;

    updateCellFlagDisplay(elCell, FLAG, 'cell-closed', 'cell-flag');
    checkGameOver();
}

function updateCellFlagDisplay(elCell, sign, removeSelector, addSelector) {
    elCell.innerText = sign;
    elCell.classList.remove(removeSelector);
    elCell.classList.add(addSelector);
}

function onRestart() {
    onInit();
}