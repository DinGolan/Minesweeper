/***************/
/* Minesweeper */
/***************/
'use strict';

// ============================= //
//       Global Game State       //
// ============================= //
var gBoard       = [];
var gUndoStack   = [];
var gHintedCells = [];

var gTimer = {
    gTimerInterval:        null,
    gMineResetTimeoutId:   null,
    gSafeClickTimeoutId:   null,
    gSafeFadeoutTimeoutId: null,
    gHintTimeoutIds:       [],
    gManualTimeoutIds:     [],
    gMegaHintTimeoutIds:   [],
    gExterminatorFadeoutTimeoutIds: []
};

var gLevel = {
    SIZE:  4,
    MINES: 2,
    KEY:   'beginner'
};

var gGame = {
    isOn:               false,
    isHintMode:         false,
    isFirstClick:       true,
    elHintActive:       null,
    secsPassed:         0,
    markedCount:        0,
    revealedCount:      0,
    livesLeft:          3,
    hintsLeft:          3,
    safeClicksLeft:     3,
    isManualMode:       false,
    manualPlacedMines:  0,
    isMegaHintMode:     false,
    megaHintStartPos:   null,
    isUsedExterminator: false
};

// --- //

// ============================= //
//           Constants           //
// ============================= //
const EMPTY       = '\u00A0';
const BOMB        = '💣';
const FLAG        = '🚩';
const ERROR       = '❌';
const LIVE        = '❤️';
const HINT        = '💡';
const TROPHY      = '🏆';
const THEME       = '🌗';
const START_GAME  = '😊';
const WIN_GAME    = '😎';
const LOSE_GAME   = '😖';
const M_SECONDS   = 1000;
const PAD_ZEROS   = 3;
const TOTAL_HINTS = 3;
const RESET_BEST_SCORE    = '🗑';
const NUM_MINES_TO_REMOVE = 3;

// --- //

// =============================== //
//        Level Definitions        //
// =============================== //
const LEVELS = {
    beginner: { SIZE: 4,  MINES: 2  },
    medium:   { SIZE: 8,  MINES: 14 },
    expert:   { SIZE: 12, MINES: 32 },
};