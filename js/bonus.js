/***************/
/* MineSweeper */
/***************/
'use strict';

// =============================== //
//         Hint Mode Logic         //
// =============================== //
function renderHints() {
    const elContainerHints     = document.querySelector('.hints-container');
    elContainerHints.innerHTML = '';

    for (let i = 0; i < gGame.hintsLeft; i++) {
        const elHint     = document.createElement('span');
        elHint.innerText = HINT;
        elHint.onclick   = () => onHintClicked(elHint);
        elHint.classList.add('hint');
        elContainerHints.appendChild(elHint);
    }
}

function onHintClicked(elHint) {
    if (!gGame.hintsLeft || gGame.isHintMode) return;

    gGame.activeHintEl = elHint;
    gGame.isHintMode   = true;
    elHint.classList.add('active');
}

function handleHintMode(i, j) {
    gHintedCells = getCellAndNeighbors(i, j);
    revealHintCells(gHintedCells)

    const timeoutId = setTimeout(() => {
         // Remove active hint element //
        if (gGame.activeHintEl) {
            gGame.activeHintEl.classList.remove('active');
            gGame.activeHintEl.classList.add('used');
            gGame.activeHintEl = null;
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
            }, M_SECONDS / 2);

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