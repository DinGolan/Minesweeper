/***************/
/* MineSweeper */
/***************/
'use strict';

// ============================= //
//       Random Utilities        //
// ============================= //
function getRandomIntExclusive(min, max) {
	const range = (max - min);
    return Math.floor(Math.random() * range) + min;
}

function getRandomIntInclusive(min, max) {
	const range = (max - min + 1);
    return Math.floor(Math.random() * range) + min;
}

// --- //

// ================================ //
//     Class & Selector Helpers     //
// ================================ //
function getClassName(i, j) {
    return `cell-${i}-${j}`;
}

// --- //

// ============================== //
//     UI Rendering / Updates     //
// ============================== //
function updateTimerDisplay() {
    const elTimer     = document.querySelector('.minesweeper-timer');
    elTimer.innerText = String(gGame.secsPassed).padStart(3, '0'); 
}

function updateFaceDisplay(faceEmoji) {
    const elFace     = document.querySelector('.minesweeper-face');
    elFace.innerText = faceEmoji;
}

function updateMinesCounter() {
    const minesLeft          = gLevel.MINES - gGame.markedCount
    const elMinesCounter     = document.querySelector('.minesweeper-counter');
    elMinesCounter.innerText = String(minesLeft).padStart(3, '0');
}

function updateLivesDisplay() {
    const elLives     = document.querySelector('.lives-display');
    elLives.innerText = LIVE.repeat(gGame.livesLeft);
}

function removeNumberClasses(elCell) {
    for (let i = 1; i <= 8; i++) {
        if (elCell.classList.contains(`cell-${i}`)) {
            elCell.classList.remove(`cell-${i}`);
        }
    }
}

// --- //

// =========================== //
//         Timer Logic         //
// =========================== //
function startTimer() {
    gTimerInterval = setInterval(() => {
        gGame.secsPassed++;
        updateTimerDisplay();
    }, M_SECONDS);
}

function stopTimer() {
    if (gTimerInterval) {
        clearInterval(gTimerInterval);
        gTimerInterval = null;
    }
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

function clearMineResetTimeout() {
    if (gMineResetTimeoutId) {
        clearTimeout(gMineResetTimeoutId);
        gMineResetTimeoutId = null;
    }
}

// --- //

// ============================== //
//      In-Game Messaging UI      //
// ============================== //
function showMessage(msgHTML) {
    const elMsg         = document.querySelector('.minesweeper-message');
    elMsg.innerHTML     = msgHTML;
    elMsg.classList.add('active');
}

function hideMessage() {
    const elMsg     = document.querySelector('.minesweeper-message');
    elMsg.innerHTML = '';
    elMsg.classList.remove('active');
}