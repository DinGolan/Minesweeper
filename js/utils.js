/***************/
/* Minesweeper */
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
    elTimer.innerText = String(gGame.secsPassed).padStart(PAD_ZEROS, '0'); 
    elTimer.title     = 'Timer Display';
}

function updateFaceDisplay(faceEmoji) {
    const elFace     = document.querySelector('.minesweeper-face');
    elFace.innerText = faceEmoji;
    elFace.title     = 'Restart Game';
}

function updateMinesCounter() {
    const minesLeft          = gLevel.MINES - gGame.markedCount
    const elMinesCounter     = document.querySelector('.minesweeper-counter');
    elMinesCounter.innerText = String(minesLeft).padStart(PAD_ZEROS, '0');
    elMinesCounter.title     = 'Number of Left Mines';
}

function updateLivesDisplay() {
    const elLives     = document.querySelector('.lives-display');
    elLives.innerText = LIVE.repeat(gGame.livesLeft);
    elLives.title     = 'Remaining Lives';
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
    if (gTimer.gTimerInterval !== null) return;

    gTimer.gTimerInterval = setInterval(() => {
        gGame.secsPassed++;
        updateTimerDisplay();
    }, M_SECONDS);
}

function stopTimer() {
    if (gTimer.gTimerInterval) {
        clearInterval(gTimer.gTimerInterval);
        gTimer.gTimerInterval = null;
    }
}

function clearMineTimeout() {
    if (gTimer.gMineResetTimeoutId) {
        clearTimeout(gTimer.gMineResetTimeoutId);
        gTimer.gMineResetTimeoutId = null;
    }
}

// --- //

// ================================== //
//        Context Menu Handler        //
// ================================== //
function setupEventListeners() {
    const elBoard = document.querySelector('.minesweeper-board');
    elBoard.removeEventListener('contextmenu', handleRightClick); // Avoid Duplicates //
    elBoard.addEventListener('contextmenu', handleRightClick);
}

function handleRightClick(event) {
    event.preventDefault();
}

// --- //

// ============================== //
//      In-Game Messaging UI      //
// ============================== //
function showMessage(msgHTML) {
    const elMsg         = document.querySelector('.minesweeper-message');
    const elContainer   = document.querySelector('.game-container');

    elMsg.innerHTML = msgHTML;
    elMsg.classList.add('active');
    elContainer.classList.add('with-message');
}

function hideMessage() {
    const elMsg       = document.querySelector('.minesweeper-message');
    const elContainer = document.querySelector('.game-container');

    elMsg.innerHTML = '';
    elMsg.classList.remove('active');
    elContainer.classList.remove('with-message');
}