'use strict';

const five = require("johnny-five");
const board = new five.Board({
    port: "COM3"
});

const buzzerTime = 100;

let buzzer;
let gameButtons;
let confirmButton;

const gameControllers = [
    {
        on: false,
        note: 'A',
    },
    {
        on: false,
        note: 'C',
    },
    {
        on: false,
        note: 'F',
    }
];
const confirmController = {
    sound: 'B',
};

let gameLeds;
let confirmLed;

let gameRunning = false;

let numberOfTurns;

const game = [];
let boardThis;
let playerTurn = false;
let playerIndex = 0;

board.on("ready", function() {

    boardThis = this;
    buzzer = new five.Piezo(7);
    board.repl.inject({
        piezo: buzzer,
    });

    gameButtons = new five.Buttons([2, 3, 4]);
    gameButtons.on('press', (button) => {
        const btnIndex = button.pin - 2;
        sound(gameControllers [btnIndex].note);
        if (!gameRunning) {
            gameControllers[btnIndex].on = !gameControllers[btnIndex].on;
            gameLeds[btnIndex].toggle();
        } else {
            gameLeds[btnIndex].on();
            if (playerTurn) {
                const next = game[playerIndex];
                const last = playerIndex + 1 === game.length;
                if (btnIndex !== next) {
                    playerIndex = 0;
                    game.length = 0;
                    gameRunning = playerTurn = false;
                    console.log('Game Over');
                    gameOver();
                } else {
                    if (!last) {
                        console.log('Next LED');
                        playerIndex++;
                    } else if (game.length === numberOfTurns) {
                        playerIndex = 0;
                        game.length = 0;
                        gameRunning = playerTurn = false;
                        console.log('Congratulations! You won Arduinon Game!!');
                        congratulations();
                    } else {
                        playerIndex = 0;
                        console.log('Nice! Next round.');
                        turn();
                    }
                }
            }
            this.wait(300, () => {
                gameLeds[btnIndex].off();
            })
        }
    });

    confirmButton = new five.Button(5);
    confirmButton.on('press', () => {
        confirmLed.on();
        sound(confirmController.sound);
        const binary = gameControllers.reduce((result, item) => {
            // Mount binary string
            result += item.on ? '1' : '0';
            item.on = false;
            // Turn all leds off
            gameLeds.off();
            return result;
        }, '');
        let number = parseInt(binary, 2);
        if (number > 0) {
            numberOfTurns = number;
            gameLeds.blink(500);
            gameRunning = true;
            console.log(`${number} rounds`);
        } else {
            gameLeds.blink();
            number = 5;
        }
        this.wait(number * 1000, function() {
            gameLeds.stop().off();
            if (gameRunning) {
                turn();
            }
        });
        confirmLed.off();
    });

    gameLeds = new five.Leds([8, 9, 10]);
    confirmLed = new five.Led(11);
});

function gameOver() {
    gameLeds.blink(200);
    confirmLed.blink(200);

    boardThis.wait(5000, () => {
        gameLeds.stop().off();
        confirmLed.stop().off();
    });
}

function congratulations() {
    gameLeds.blink(50);
    confirmLed.blink(50);

    boardThis.wait(5000, () => {
        gameLeds.stop().off();
        confirmLed.stop().off();
    });
}

function turn() {
    playerTurn = false;
    step();
    lightLeds();
}

function lightLeds() {
    let ledIndex = 0;
    const interval = setInterval(() => {
        const led = game[ledIndex++];
        if (led === undefined) {
            playerTurn = true;
            console.log('Player Turn');
            clearInterval(interval);
            return;
        }
        gameLeds[led].on();
        boardThis.wait(1000, () => {
            gameLeds[led].off();
        })
    }, 1500);
}

function step() {
    const random = Math.floor(Math.random() * 3);
    game.push(random);
    return random;
}

function sound(note) {
    buzzer.play({
        song: note,
        beats: 1/4,
        tempo: buzzerTime,
    });
}
