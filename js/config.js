/***************/
/* MineSweeper */
/***************/
'use strict';

// Global Variables //
var gBoard = null;
var gIsFirstClick  = true;
var gTimerInterval = null;

const ZERO       = '0';
const EMPTY      = '\u00A0';
const BOMB       = '💣';
const FLAG       = '🚩';
const ERROR      = '❌';
const START_GAME = '😊';
const WIN_GAME   = '😎';
const LOSE_GAME  = '😖';
const M_SECONDS  = 1000;

var gLevel = {
    SIZE:  4,
    MINES: 2
};

var gGame = {
    isOn: false,
    secsPassed:    0,
    markedCount:   0,
    revealedCount: 0,
};