const POSITION_X_LEFT = -0.5;
const POSITION_X_CENTER = 0;
const POSITION_X_RIGHT = 0.5;

document.addEventListener("DOMContentLoaded", function () {
  let scene = document.querySelector("a-scene");
  let splash = document.querySelector("#splash");
  scene.addEventListener("loaded", function (e) {
    splash.style.display = "none";
  });
});
/************
 * CONTROLS *
 ************/

// Position is one of 0 (left), 1 (center), or 2 (right)
let player_position_index = 1;

movePlayerTo = (position_index) => {
  player_position_index = position_index;

  let position = { x: 0.5, y: 0.5, z: 0.5 };
  if (position_index == 0) position.x = POSITION_X_LEFT;
  else if (position_index == 1) position.x = POSITION_X_CENTER;
  else position.x = POSITION_X_RIGHT;
  document.getElementById("player").setAttribute("position", position);
};

setupControls = () => {
  AFRAME.registerComponent("lane-controls", {
    tick: function (time, timeDelta) {
      let rotation = this.el.object3D.rotation;

      if (rotation.y > 0.1) movePlayerTo(0);
      else if (rotation.y < -0.1) movePlayerTo(2);
      else movePlayerTo(1);
    },
  });
};

/*********
 * TREES *
 *********/

let templateTreeLeft;
let templateTreeCenter;
let templateTreeRight;
let templates;
let treeContainer;
let numberOfTrees = 0;
let treeTimer;

const audio = new Audio("https://ecast.myautodj.com/public1channel");
audio.volume = 0.05;

setupTrees = () => {
  templateTreeLeft = document.getElementById("template-tree-left");
  templateTreeCenter = document.getElementById("template-tree-center");
  templateTreeRight = document.getElementById("template-tree-right");
  treeContainer = document.getElementById("tree-container");
  templates = [templateTreeLeft, templateTreeCenter, templateTreeRight];

  removeTree(templateTreeLeft);
  removeTree(templateTreeRight);
  removeTree(templateTreeCenter);
};

teardownTrees = () => {
  clearInterval(treeTimer);
};

removeTree = (tree) => {
  tree.parentNode.removeChild(tree);
};

addTree = (el) => {
  numberOfTrees += 1;
  el.id = "tree-" + numberOfTrees;
  treeContainer.appendChild(el);
};

addTreeTo = (position_index) => {
  let template = templates[position_index];
  addTree(template.cloneNode(true));
};

addTreesRandomly = ({
  probTreeLeft = 0.5,
  probTreeCenter = 0.5,
  probTreeRight = 0.5,
  maxNumberTrees = 2,
} = {}) => {
  let trees = [
    { probability: probTreeLeft, position_index: 0 },
    { probability: probTreeCenter, position_index: 1 },
    { probability: probTreeRight, position_index: 2 },
  ];
  shuffle(trees);

  let numberOfTreesAdded = 0;
  let position_indices = [];
  trees.forEach((tree) => {
    if (
      Math.random() < tree.probability &&
      numberOfTreesAdded < maxNumberTrees
    ) {
      addTreeTo(tree.position_index);
      numberOfTreesAdded += 1;

      position_indices.push(tree.position_index);
    }
  });

  return numberOfTreesAdded;
};

addTreesRandomlyLoop = ({ intervalLength = 500 } = {}) => {
  treeTimer = setInterval(addTreesRandomly, intervalLength);
};

/**************
 * COLLISIONS *
 **************/

const POSITION_Z_OUT_OF_SIGHT = 1;
const POSITION_Z_LINE_START = 0.2;
const POSITION_Z_LINE_END = 0.6;

AFRAME.registerComponent("player", {
  tick: () => {
    document.querySelectorAll(".tree").forEach((tree) => {
      position = tree.getAttribute("position");
      tree_position_index = tree.getAttribute("data-tree-position-index");
      tree_id = tree.getAttribute("id");

      if (position.z > POSITION_Z_OUT_OF_SIGHT) {
        removeTree(tree);
      }

      if (!isGameRunning) return;

      if (
        POSITION_Z_LINE_START < position.z &&
        position.z < POSITION_Z_LINE_END &&
        tree_position_index == player_position_index
      ) {
        gameOver();
      }

      if (position.z > POSITION_Z_LINE_END && !countedTrees.has(tree_id)) {
        addScoreForTree(tree_id);
        updateScoreDisplay();
      }
    });
  },
});

/*********
 * SCORE *
 *********/

let score;
let countedTrees;
let gameOverScoreDisplay;
let scoreDisplay;

setupScore = () => {
  score = 0;
  countedTrees = new Set();
  scoreDisplay = document.getElementById("score");
  gameOverScoreDisplay = document.getElementById("game-score");
};

teardownScore = () => {
  scoreDisplay.setAttribute("value", "");
  gameOverScoreDisplay.setAttribute("value", score);
};

addScoreForTree = (tree_id) => {
  score += 1;
  countedTrees.add(tree_id);
};

updateScoreDisplay = () => {
  scoreDisplay.setAttribute("value", score);
};

/********
 * MENU *
 ********/

let menuStart;
let menuGameOver;
let menuContainer;
let isGameRunning = false;
let startButton;
let restartButton;

hideEntity = (el) => {
  el.setAttribute("visible", false);
};

showEntity = (el) => {
  el.setAttribute("visible", true);
};

setupAllMenus = () => {
  menuStart = document.getElementById("start-menu");
  menuGameOver = document.getElementById("game-over");
  menuContainer = document.getElementById("menu-container");
  startButton = document.getElementById("start-button");
  restartButton = document.getElementById("restart-button");

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);

  showStartMenu();
};

hideAllMenus = () => {
  hideEntity(menuContainer);
  startButton.classList.remove("clickable");
  restartButton.classList.remove("clickable");
};

showGameOverMenu = () => {
  showEntity(menuContainer);
  hideEntity(menuStart);
  showEntity(menuGameOver);
  startButton.classList.remove("clickable");
  restartButton.classList.add("clickable");
};

showStartMenu = () => {
  showEntity(menuContainer);
  hideEntity(menuGameOver);
  showEntity(menuStart);
  startButton.classList.add("clickable");
  restartButton.classList.remove("clickable");
};

/********
 * GAME *
 ********/

gameOver = () => {
  isGameRunning = false;

  audio.pause();
  teardownTrees();
  teardownScore();
  showGameOverMenu();
};

startGame = () => {
  if (isGameRunning) return;
  isGameRunning = true;

  audio.play();
  setupScore();
  updateScoreDisplay();
  addTreesRandomlyLoop();
  hideAllMenus();
};

setupControls();

window.onload = () => {
  setupAllMenus();
  setupScore();
  setupTrees();
};

/*************
 * UTILITIES *
 *************/

shuffle = (a) => {
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
};
