// Original game from:
// http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/
// Slight modifications by Gregorio Robles <grex@gsyc.urjc.es>
// to meet the criteria of a canvas class for DAT @ Univ. Rey Juan Carlos
'use strict';

// Create the canvas
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function() {
  bgReady = true;
};
bgImage.src = 'images/background.png';

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function() {
  heroReady = true;
};
heroImage.src = 'images/hero.png';

// princess image
var princessReady = false;
var princessImage = new Image();
princessImage.onload = function() {
  princessReady = true;
};
princessImage.src = 'images/princess.png';

// stone image
var stoneReady = false;
var stoneImage = new Image();
stoneImage.onload = function() {
  stoneReady = true;
};
stoneImage.src = 'images/stone.png';

// monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function() {
  monsterReady = true;
};
monsterImage.src = 'images/monster.png';

// Game objects
var hero = {
  speed: 256 // movement in pixels per second
};
var princess = {};
var princessesCaught = 0;
localStorage.setItem('princessesCaught', princessesCaught);
var map;
var ELEMENT_SIZE = 32;
var rows = canvas.height / ELEMENT_SIZE;
var cols = canvas.width / ELEMENT_SIZE;
var numStones = 2;
localStorage.setItem('numStones', numStones);
var stones = [];
var numMonsters = 1;
localStorage.setItem('numMonsters', numMonsters);
var monsters = [];
var monsterSpeedFactor = 20;
localStorage.setItem('monsterSpeedFactor', monsterSpeedFactor);
var monsterSpeed = Math.round(hero.speed / monsterSpeedFactor);
//var allElements = [];
var level = 1;
localStorage.setItem('level', level);
// Handle keyboard controls
var keysDown = {};

addEventListener('keydown', function(e) {
  keysDown[e.keyCode] = true;
}, false);

addEventListener('keyup', function(e) {
  delete keysDown[e.keyCode];
}, false);

function newMap() {
  var m = new Array(rows);
  for (var i = 0; i < rows; i++) {
    m[i] = new Array(cols);
    for (var j = 0; j < cols; j++) {
      if (i > 0 && i < rows - 1 && j > 0 && j < cols - 1) {
        m[i][j] = true;
      }
    }
  }
  return m;
}

function levelUp() {
  level++;
  localStorage.setItem('level', level);
  numMonsters += 1;
  localStorage.setItem('numMonsters', numMonsters);
  monsterSpeedFactor -= 2;
  localStorage.setItem('monsterSpeedFactor', monsterSpeedFactor);
  monsterSpeed = Math.round(hero.speed / parseInt(localStorage.getItem('monsterSpeedFactor')));
  numStones += 1;
  localStorage.setItem('numStones', numStones);
}

function gameOver() {
  level = 1;
  localStorage.setItem('level', level);
  numMonsters = 1;
  localStorage.setItem('numMonsters', numMonsters);
  monsterSpeedFactor = 20;
  localStorage.setItem('monsterSpeedFactor', monsterSpeedFactor);
  monsterSpeed = Math.round(hero.speed / 20);
  numStones = 2;
  localStorage.setItem('numStones', numStones);
  princessesCaught = 0;
  localStorage.setItem('princessesCaught', princessesCaught);
}

function inField(elem) {
  return elem.y >= ELEMENT_SIZE &&
    elem.y <= (canvas.height - ELEMENT_SIZE * 2) &&
    elem.x >= ELEMENT_SIZE &&
    elem.x <= (canvas.width - ELEMENT_SIZE * 2);
}

function conv(n) {
  return Math.floor(n / ELEMENT_SIZE);
}

function isPosEmpty(elem) {
  return map[conv(elem.x)][conv(elem.y)];
}

function setPos(elem) {
  map[conv(elem.x)][conv(elem.y)] = false;
}

function notCharacter(elem) {
  return conv(elem.x) !== conv(hero.x) &&
    conv(elem.y) !== conv(hero.y) &&
    conv(elem.x) !== conv(princess.x) &&
    conv(elem.y) !== conv(princess.y);
}

function normalize(n) {
  return ELEMENT_SIZE * conv(n) + ELEMENT_SIZE / 2;
}

function addStones(num) {
  var elem = {};
  var s = [];
  for (var i = 0; i < num; i++) {
    do {
      elem.x = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.width - ELEMENT_SIZE * 3)));
      elem.y = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.height - ELEMENT_SIZE * 3)));
    } while (!isPosEmpty(elem) && notCharacter(elem) && inField(elem));

    s[i] = {
      x: normalize(elem.x),
      y: normalize(elem.y)
    };

    setPos(s[i]);
  }
  return s;
}

function addMonsters(num) {
  var elem = {};
  var m = [];
  for (var i = 0; i < num; i++) {
    do {
      elem.x = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.width - ELEMENT_SIZE * 3)));
      elem.y = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.height - ELEMENT_SIZE * 3)));
    } while (!isPosEmpty(elem) && notCharacter(elem) && inField(elem));

    m[i] = {
      x: normalize(elem.x),
      y: normalize(elem.y),
      speed: monsterSpeed
    };
  }
  return m;
}

// Reset the game when the player catches a princess
var reset = function() {
  if (parseInt(localStorage.getItem('princessesCaught')) !== 0 &&
    (parseInt(localStorage.getItem('princessesCaught')) % 10 === 0)) {
    levelUp();
  }

  map = newMap();

  hero.x = canvas.width / 2;
  hero.y = canvas.height / 2;

  // Throw the princess somewhere on the screen randomly
  princess.x = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.width - ELEMENT_SIZE * 3)));
  princess.y = Math.round(ELEMENT_SIZE + (Math.random() * (canvas.height - ELEMENT_SIZE * 3)));

  stones = addStones(parseInt(localStorage.getItem('numStones')));
  monsters = addMonsters(parseInt(localStorage.getItem('numMonsters')));
};

function isTouching(elem, another) {
  return elem.x <= (another.x + ELEMENT_SIZE) &&
    another.x <= (elem.x + ELEMENT_SIZE) &&
    elem.y <= (another.y + ELEMENT_SIZE) &&
    another.y <= (elem.y + ELEMENT_SIZE);
}

// Update game objects
var update = function(modifier) {
  var next = {};
  next.x = hero.x;
  next.y = hero.y;
  if (38 in keysDown) { // Player holding up
    //hero.y -= hero.speed * modifier;
    next.y -= hero.speed * modifier;
  }
  if (40 in keysDown) { // Player holding down
    //hero.y += hero.speed * modifier;
    next.y += hero.speed * modifier;
  }
  if (37 in keysDown) { // Player holding left
    //hero.x -= hero.speed * modifier;
    next.x -= hero.speed * modifier;
  }
  if (39 in keysDown) { // Player holding right
    //hero.x += hero.speed * modifier;
    next.x += hero.speed * modifier;
  }

  if (inField(next) && isPosEmpty(next)) {
    hero.x = next.x;
    hero.y = next.y;
  }

  // Are they touching?
  if (isTouching(hero, princess)) {
    ++princessesCaught;
    localStorage.setItem('princessesCaught', princessesCaught);
    reset();
  }

  for (var i = 0; i < monsters.length; i++) {
    var nextMonster = {
      x: monsters[i].x,
      y: monsters[i].y
    };

    if (hero.y < monsters[i].y) {
      nextMonster.y -= monsters[i].speed * modifier;
    }

    if (hero.y > monsters[i].y) {
      nextMonster.y += monsters[i].speed * modifier;
    }

    if (hero.x < monsters[i].x) {
      nextMonster.x -= monsters[i].speed * modifier;
    }

    if (hero.x > monsters[i].x) {
      nextMonster.x += monsters[i].speed * modifier;
    }

    if (inField(nextMonster) && isPosEmpty(nextMonster)) {
      monsters[i].x = nextMonster.x;
      monsters[i].y = nextMonster.y;
    }

    if (isTouching(hero, monsters[i])) {
      gameOver();
      reset();
    }
  }
};

// Draw everything
var render = function() {
  if (bgReady) {
    ctx.drawImage(bgImage, 0, 0);
  }

  if (heroReady) {
    ctx.drawImage(heroImage, hero.x, hero.y);
  }

  if (princessReady) {
    ctx.drawImage(princessImage, princess.x, princess.y);
  }

  if (stoneReady) {
    for (var i = 0; i < stones.length; i++) {
      ctx.drawImage(stoneImage, stones[i].x, stones[i].y);
    }
  }

  if (monsterReady) {
    for (var j = 0; j < monsters.length; j++) {
      ctx.drawImage(monsterImage, monsters[j].x, monsters[j].y);
    }
  }
  // Score
  ctx.fillStyle = 'rgb(250, 250, 250)';
  ctx.font = '24px Helvetica';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Princesses caught: ' + princessesCaught + ' Level: ' + level, 32, 32);
};


var then = Date.now();
// The main game loop
var main = function() {
  var now = Date.now();
  var delta = now - then;

  update(delta / 1000);
  render();

  then = now;
};

// Let's play this game!
reset();

//The setInterval() method will wait a specified number of milliseconds, and then execute a specified function, and it
// will continue to execute the function, once at every given time-interval.
//Syntax: setInterval('javascript function',milliseconds);
setInterval(main, 1); // Execute as fast as possible
