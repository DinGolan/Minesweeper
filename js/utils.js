/***************/
/* MineSweeper */
/***************/
'use strict';

function getRandomIntExclusive(min, max) {
	const range = (max - min);
    return Math.floor(Math.random() * range) + min;
}

function getRandomIntInclusive(min, max) {
	const range = (max - min + 1);
    return Math.floor(Math.random() * range) + min;
}

function getClassName(i, j) {
    return `cell-${i}-${j}`;
}

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