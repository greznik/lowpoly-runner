const POSITION_X_LEFT = -0.5;
const POSITION_X_CENTER = 0;
const POSITION_X_RIGHT = 0.5;

/************
 * CONTROLS *
 ************/

// Position is one of 0 (left), 1 (center), or 2 (right)
let player_position_index = 1;

/**
 * Move player to provided index
 */
movePlayerTo = (position_index) => {
  player_position_index = position_index;

  let position = { x: 0, y: 0, z: 0 };
  if (position_index == 0) position.x = POSITION_X_LEFT;
  else if (position_index == 1) position.x = POSITION_X_CENTER;
  else position.x = POSITION_X_RIGHT;
  document.getElementById("player").setAttribute("position", position);
};

/**
 * Determine how `movePlayerTo` will be fired. Use camera's rotation.
 **/
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

/**
 * Add any number of trees across different lanes, randomly.
 **/
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
const POSITION_Z_LINE_START = 0.6;
const POSITION_Z_LINE_END = 0.7;

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

  teardownTrees();
  teardownScore();
  showGameOverMenu();
};

startGame = () => {
  if (isGameRunning) return;
  isGameRunning = true;

  setupScore();
  updateScoreDisplay();
  addTreesRandomlyLoop();
  hideAllMenus();
};

setupControls(); // TODO: AFRAME.registerComponent has to occur before window.onload?

window.onload = () => {
  setupAllMenus();
  setupScore();
  setupTrees();
};

/*************
 * UTILITIES *
 *************/

/**
 * Shuffles array in place.
 */
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

/**
 * Checks for mobile and tablet platforms.
 */
function mobileCheck() {
  var check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}
