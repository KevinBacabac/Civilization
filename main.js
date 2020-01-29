$(document).ready(() => {
  document.body.onmousedown = () => { return false; }; // so page is unselectable

  // Canvas stuff
  var canvas = $("#canvas")[0];
  var ctx = canvas.getContext("2d");
  initializeLib(ctx);
  var w = $("#canvas").width();
  var h = $("#canvas").height();
  var mx, my;

  noise.seed(0);

  // Custom functions required for defining variables

  class createTextButton extends SmallButton {}

  // For use in world editor
  function createBlockButton(x, y, block) {
    // Returns a button with the image of a block inside and a grey border
    var button = new SmallButton(x, y, hexMap.hWidth + 4, hexMap.hHeight + 4, '');
    button.enabled = false;

    button.borderSpacing = 2;
    button.w = hexMap.hWidth + button.borderSpacing * 2;
    button.h = hexMap.hHeight + button.borderSpacing * 2;

    button.block = block;
    button.blockImage = blockIDToImage[block];
    button.blockString = blockIDToString[block];

    button.draw = () => {
      if (this.enabled) {
        // Border
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Block display
        ctx.drawImage(this.blockImage, this.x + this.borderSpacing, this.y + this.borderSpacing);

        // Text label
        if (this.mouseOver) {
          ctx.fillRect(mx, my, 32, 12);

          ctx.fillStyle = 'black';
          ctx.textAlign = 'left';
          ctx.font = '10pt Alcubierre';
          ctx.fillText(this.blockString, mx, my + 9) // Center text
        }
      }
    };

    button.do = () => {
      selectedBlock = this.block;
    };

    return button;
  }

  class Camera {
    constructor() {
      this.moveLeft = false;
      this.moveRight = false;
      this.moveUp = false;
      this.moveDown = false;
      this.panSpeed = 500;

      // Camera information
      this.fineShiftVert = 0;
      this.fineShiftHoriz = 0;

      this.blockShiftVert = 0;
      this.blockShiftHoriz = 0;
    }

    move(){
      if (this.moveLeft) { // Press left arrow and camera is not at left edge
        this.fineShiftHoriz -= this.panSpeed * dTime;

        if (this.fineShiftHoriz < 0) {
          this.fineShiftHoriz += hexMap.hX_Dist; // Reset fine shift if there is more room to move
          this.blockShiftHoriz -= 1;

          if (this.blockShiftHoriz < 0) {
            this.blockShiftHoriz += hexMap.tiles.length / 2; // Loop from left to right
          }
        }
      }

      // Press right arrow and camera is not at right edge
      if (this.moveRight) {
        this.fineShiftHoriz += this.panSpeed * dTime;

        if (this.fineShiftHoriz >= hexMap.hX_Dist) {
          this.fineShiftHoriz -= hexMap.hX_Dist;
          this.blockShiftHoriz += 1;

          // Loop from right to left
          if (this.blockShiftHoriz >= hexMap.tiles.length / 2) {
            this.blockShiftHoriz -= hexMap.tiles.length / 2;
          }
        }

      }

      if (this.moveUp) { // Press up arrow and camera is not at top edge
        this.fineShiftVert -= this.panSpeed * dTime;

        if (this.fineShiftVert < 0){
          if (this.blockShiftVert > 0) {
            this.fineShiftVert += hexMap.hHeight;
            this.blockShiftVert -= 1;
          }
          else if (this.blockShiftVert == 0) {
            this.fineShiftVert = 0;
          }
        }
      }

      if (this.moveDown) { // Press down arrow and camera is not at bottom edge
        this.fineShiftVert += this.panSpeed * dTime;

        if (this.fineShiftVert >= hexMap.hHeight && this.blockShiftVert + Math.ceil(h / hexMap.hHeight) < hexMap.tiles[0].length - 1) {
          this.fineShiftVert -= hexMap.hHeight;
          this.blockShiftVert += 1;
        } else if (this.fineShiftVert >= hexMap.hHeight * 2 - 5 && this.blockShiftVert + Math.ceil(h / hexMap.hHeight) == hexMap.tiles[0].length - 1) {
          this.fineShiftVert = hexMap.hHeight * 2;
        }
      }
    }

    keyup(key){
      if (key == 37) { // Left arrow
        this.moveLeft = false;
      } else if (key == 39) { // Right arrow
        this.moveRight = false;
      } else if (key == 38) { // Up arrow
        this.moveUp = false;
      } else if (key == 40) { // Down arrow
        this.moveDown = false;
      }
    }

    keydown(key){
      if (key == 37) { // Left arrow
        this.moveLeft = true;
      } else if (key == 39) { // Right arrow
        this.moveRight = true;
      } else if (key == 38) { // Up arrow
        this.moveUp = true;
      } else if (key == 40) { // Down arrow
        this.moveDown = true;
      }
    }
  }

  class Minimap {
    constructor (){
      this.borderSize = 10;
      var width = 400 + this.borderSize * 2;
      var height = 200 + this.borderSize * 2;
      var x = 0;
      var y = h - height;

      this.rect = new Rect(x, y, width, height);
    }
  }

  class HexMap {
    constructor (qSize, zSize){
      this.showCoords = false;
      this.cylindrical = true;
      this.minimap = new Minimap();
      this.camera = new Camera();

      // Hex graphics
      this.hSize = 32; // Distance from center to horizontal side
      this.redefDimensions();

      this.tiles = [];

      // 0.5 is terrestrial, 1+ is archipelago
      const ELEVATE_FACTOR = 0.5 + Math.random();
      const ZOOM = 25;


      // If the width is equal to height, the mapBlockShiftVertical must be modified
      // but the sides do not evenly match
      for (var q = 0; q < qSize; q++) { // Width must be twice of height
        this.tiles[q] = [];
        for (var z = 0; z < zSize; z++) {
          this.tiles[q][z] = {};
          // var value = Math.random();
          // var value = Math.round(PerlinSimplex.noise(q, z) * 3); // Incomplete


          // var value = (noise.simplex2(q/10, z/10) + 1) / 2;
          // var value = (noise.simplex2(center_x/20, center_y/20) + 1) / 2;

          var center_x = (q * this.hHorizDist + this.hSize) / this.hSize;
          var center_y = (z * this.hVertDist + q * this.hVertDist / 2 + this.hSize) / this.hSize;

          // var value = Math.pow(Math.abs((noise.simplex2(center_x/ZOOM, center_y/ZOOM) + noise.simplex2(center_x/ZOOM/25, center_y/ZOOM/25)) / 2), ELEVATE_FACTOR);
          var value = Math.pow(Math.abs(noise.simplex2(center_x/ZOOM, center_y/ZOOM)), ELEVATE_FACTOR);

          this.tiles[q][z].block = Math.floor(value * 4);
          this.tiles[q][z].pop = 0;
        }
      }
    }

    redefDimensions(){
      this.hWidth = this.hSize * 2;
      this.hHeight = Math.floor(Math.sqrt(3) / 2 * this.hWidth);
      this.hHorizDist = 3 / 4 * this.hWidth;
      this.hVertDist = this.hHeight;
      this.hX_Dist = 3 / 2 * this.hWidth; // Distance between x coordinates
    }

    grow(){
      var oldPops = [];
      for (var q = 0; q < this.tiles.length; q++) { // Width must be twice of height
        oldPops[q] = [];
        for (var z = 0; z < this.tiles[q].length; z++) {
          oldPops[q][z] = {};
          oldPops[q][z].pop = this.tiles[q][z].pop;
        }
      }

      for (var q = 0; q < this.tiles.length; q++) { // Width must be twice of height
        for (var z = 0; z < this.tiles[q].length; z++) {
          if (oldPops[q][z].pop == 0) continue;

          var nearby = findNeighbours({x: q, z: z}, 2);

          for (var tile of nearby){
            // if (this.tiles[tile.x][tile.z].block == 0 || this.tiles[tile.x][tile.z].pop > 3) continue;
            if (this.tiles[tile.x][tile.z].block == 0) continue;

            this.tiles[tile.x][tile.z].pop += 1;
          }
        }
      }

      for (var q = 0; q < this.tiles.length; q++) { // Width must be twice of height
        for (var z = 0; z < this.tiles[q].length; z++) {
          if (this.tiles[q][z].pop > 255){
            this.tiles[q][z].pop = 255;
          }
        }
      }
    }

    draw(){
      if (this.showCoords || true) {
        ctx.fillStyle = 'black';
        ctx.font = '16pt Alcubierre';
        ctx.textAlign = 'center';
      }

      if (this.camera.blockShiftVert == 0) {
        start = 0;
      } else {
        start = -1;
      }

      for (var r = start; r < Math.ceil(h / this.hHeight) + 1; r++) { // r = -1 and + 1 show edges, top and bottom hexes
        for (var q = 0; q < 2; q++) { // Alternate between adding nothing or one, to get the tiles in between
          // The above for loops iterate the side row
          // 3/4 is hexagonal width (1/4 is inside previous hex), w/() checks how much fit,
          for (var x = -1; x < Math.ceil(w / (3 / 4 * this.hWidth) / 2) + 1; x++) {
            var qCoord, zCoord, xCoord, yCoord;

            // Internal coordinates
            qCoord = mod(q + (this.camera.blockShiftHoriz + x) * 2, this.tiles.length);
            zCoord = mod(r - x + this.camera.blockShiftVert - this.camera.blockShiftHoriz, this.tiles[0].length);

            // Display coordinates
            xCoord = q * this.hHorizDist + x * this.hX_Dist - this.camera.fineShiftHoriz;
            yCoord = r * this.hVertDist + q * this.hVertDist / 2 - this.camera.fineShiftVert;

            var image = blockIDToImage[this.tiles[qCoord][zCoord].block];

            ctx.drawImage(image, xCoord, yCoord);

            ctx.globalAlpha = Math.sqrt(this.tiles[qCoord][zCoord].pop) / 20;
            // ctx.globalAlpha = 1;
            ctx.fillStyle = 'red';
            hexMap.highlightBlock({x: qCoord, z: zCoord});
            ctx.globalAlpha = 1;

            ctx.fillStyle = 'black';
            if (this.showCoords) {
                ctx.fillText(qCoord + ', ' + zCoord,
                            xCoord + this.hSize, // this.hSize centers text in hex
                            yCoord + this.hSize);
            } else {
                ctx.fillText(this.tiles[qCoord][zCoord].pop,
                            xCoord + this.hSize, // this.hSize centers text in hex
                            yCoord + this.hSize);
            }
          }
        }
      }
    }

    drawMinimap(){
        // Minimap border
        ctx.fillStyle = 'grey';
        this.minimap.rect.draw();

        ctx.globalAlpha = 0.5;

        // Minimap, must be separated to run after tiles are displayed, add colour blending in the future

        /*
         * Optimization by using a for loop before iterating over all other blocks to check for a specific
         * type of block so that the fillStyle is only set once
         */


        for (var block = 0; block < 2; block++) { // Iterate over all block IDs

            for (var x = 0; x < this.tiles.length; x++) {
                for (var q = 0; q < 2; q++) {
                    for (var r = 0; r < this.tiles[x].length; r++) {
                        if (this.tiles[mod(q + x * 2, this.tiles.length)][mod(r - x, this.tiles[x].length)].block != block) {
                            continue;
                        }

                        ctx.fillRect(x * 2 + q + this.minimap.rect.x + this.minimap.borderSize, q + r * 2 + this.minimap.rect.y + this.minimap.borderSize, 1, 1);
                    }
                }
            }
        }

        ctx.globalAlpha = 1;

    }

    inTile(x, y) {
        // Mouse coordinates adjusted for map shifts, subtracting this.hSize at end is a kludge
        const tempX = x + this.camera.blockShiftHoriz * this.hX_Dist + this.camera.fineShiftHoriz - this.hSize;
        const tempY = y + this.camera.blockShiftVert * this.hVertDist + this.camera.fineShiftVert - this.hSize;

        // http://www.redblobgames.com/grids/hexagons/#pixel-to-hex
        // Fractional hex coordinates
        const fractionalX = 2 / 3 * tempX / this.hSize;
        const fractionalZ = (1 / 3 * Math.sqrt(3) * tempY - 1 / 3 * tempX) / this.hSize;

        return this.hex_round(fractionalX, -fractionalX - fractionalZ, fractionalZ);
    }

    // Accepts cube coordinates
    // http://www.redblobgames.com/grids/hexagons/#rounding
    hex_round(x, y, z) {
        var rx = Math.round(x);
        var ry = Math.round(y);
        var rz = Math.round(z);

        const x_diff = Math.abs(rx - x);
        const y_diff = Math.abs(ry - y);
        const z_diff = Math.abs(rz - z);

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        } else if (y_diff > z_diff) {
            ry = -rx - rz;
        } else {
            rz = -rx - ry;
        }

        return { // Return axial coordinates
            x: rx,
            z: rz
        };
    }

    // http://www.redblobgames.com/grids/hexagons/#distances
    hex_distance(pos1, pos2) {
        var q1 = pos1.x;
        var r1 = pos1.z;
        var q2 = pos2.x;
        var r2 = pos2.z;

        return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
    }


    highlightBlock(block) {
      ctx.beginPath();

      var center_x = block.x * this.hHorizDist - this.camera.fineShiftHoriz - this.camera.blockShiftHoriz * this.hX_Dist + this.hSize;
      var center_y = block.z * this.hVertDist + block.x * this.hVertDist / 2 - this.camera.fineShiftVert - this.camera.blockShiftVert * this.hVertDist + this.hSize;

      // http://www.redblobgames.com/grids/hexagons/#basics (Angles)
      for (var j = 0; j < 6; j++) {
        var angle = 2 * Math.PI / 6 * j;

        var x_i = center_x + this.hSize * Math.cos(angle);
        var y_i = center_y + this.hSize * Math.sin(angle);

        if (j == 0) {
          ctx.moveTo(x_i, y_i);
        } else {
          ctx.lineTo(x_i, y_i);
        }
      }

      ctx.closePath();
      ctx.fill();
    }
  }

  var hexMap = new HexMap(200, 100);

  // Graphics
  // Tiles

  function getTileImages() {
    var grassImage = new Image();
    grassImage.src = 'images/hextiles/grass.gif';

    var forestImage = new Image();
    forestImage.src = 'images/hextiles/forest.gif';

    var sandImage = new Image();
    sandImage.src = 'images/hextiles/sand.gif';

    var waterImage = new Image();
    waterImage.src = 'images/hextiles/water.gif';

    // Ordered by sea level
    const blockIDToImage = {
      0: waterImage,
      1: sandImage,
      2: grassImage,
      3: forestImage
    };

    return blockIDToImage;
  }

  // Ordered by sea level
  const blockIDToImage = getTileImages();

  var blockIDToString = {
    0: 'Water',
    1: 'Sand',
    2: 'Grass',
    3: 'Forest'
  };

  // Mode
  var worldEditor = false;
  var showSaveGamePrompt = false;
  var showLoadGamePrompt = false;

  // A star
  var startPoint = null;
  var endPoint = null;
  var path = null;

  // Menu
  var menuOpen = false;

  var menuButtons = [];

  const MENUS = ['World Builder', 'Save Simulation', 'Load Simulation'];
  for (var i = 0; i < 3; i++) {
    menuButtons.push(new createTextButton(w - 110, i * 20, 110, 20, MENUS[i]));
  }

  menuButtons[0].do = function() {
    worldEditor = !worldEditor;

    for (var i = 0; i < worldEditorButtons.length; i++) {
      worldEditorButtons[i].enabled = worldEditor;
    }
  };

  menuButtons[1].do = function() {
    /*
    showSaveGamePrompt = !showSaveGamePrompt;
    prompt('Copy This', JSON.stringify([hexMap.tiles]));
    */
    localStorage.save = JSON.stringify([hexMap.tiles]);
  };

  menuButtons[2].do = function() {
    // showLoadGamePrompt = !showLoadGamePrompt;
    // inputString = JSON.parse(prompt('Paste in here'));

    inputString = localStorage.save;
    hexMap.tiles = inputString[0];
  };

  // World editor variables
  var selectedBlock = 0;
  var mouseOverBlock = [];
  var brushSize = 1;

  // World editor buttons
  var worldEditorButtons = [];

  for (var i = 0; i < 4; i++) {
      // 40 is the size of a button, position on top, i is each block
      worldEditorButtons.push(createBlockButton(i * (hexMap.hWidth + 5), 0, i));
  }

  for (var i = 0; i < 6; i++) {
      worldEditorButtons.push(new createTextButton(i * 20, h - 20, 20, 20, (i + 1).toString()));

      worldEditorButtons[worldEditorButtons.length - 1].do = function() {
          brushSize = i - 2;
      }
  }

  /////////////////////////////////
  ////////////////////////////////
  ////////	GAME INIT
  ///////	Runs this code right away, as soon as the page loads.
  //////	Use this code to get everything in order before your game starts
  //////////////////////////////
  /////////////////////////////
  function init() {

      //////////
      ///STATE VARIABLES


      //////////////////////
      ///GAME ENGINE START
      //	This starts your game/program
      //	"paint is the piece of code that runs over and over again, so put all the stuff you want to draw in here

      requestAnimationFrame(paint);
      setInterval(hexMap.grow, 1000);
  }
  var start = null;
  var dTime = 0;
  init();

  ///////////////////////////////////////////////////////
  //////////////////////////////////////////////////////
  ////////	Main Game Engine
  ////////////////////////////////////////////////////
  ///////////////////////////////////////////////////
  function paint(timestamp) {
    if (!start) start = timestamp;
    dTime = (timestamp - start) / 1000;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h)

    // Move camera
    hexMap.camera.move();
    hexMap.draw();
    //hexMap.drawMinimap();

    // Minimap mini camera position

    // Display menu if open
    if (menuOpen) {
      for (var i = 0; i < menuButtons.length; i++) {
        menuButtons[i].draw();
      }
    }

    // Display world editor
    if (worldEditor) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'red';

      for (var i = 0; i < mouseOverBlock.length; i++) {
        hexMap.highlightBlock(mouseOverBlock[i]);
      }

      ctx.globalAlpha = 1;

      // Draw menu on top of tile overlay
      for (var i = 0; i < worldEditorButtons.length; i++) {
        worldEditorButtons[i].draw();
      }
    }

    ctx.globalAlpha = 0.5;
    if (startPoint !== null) {
      ctx.fillStyle = 'red';
      hexMap.highlightBlock(startPoint);
    }
    if (endPoint !== null) {
      ctx.fillStyle = 'green';
      hexMap.highlightBlock(endPoint);
    }

    if (path !== null) {
      ctx.fillStyle = 'blue';

      for (var i = 0; i < path.length; i++) {
        hexMap.highlightBlock(path[i]);
      }
    }


    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.fillText('FPS - ' + Math.round(1 / dTime), 20, 30);
    ctx.textAlign = 'center';
    start = timestamp;
    requestAnimationFrame(paint);

  } ////////////////////////////////////////////////////////////////////////////////END PAINT/ GAME ENGINE




  ////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////
  /////	MOUSE LISTENER
  //////////////////////////////////////////////////////
  /////////////////////////////////////////////////////

  // Custom functions

  function findNeighbours(centerHex, radius) { // Make this a method of hex map
    var adjacentBlocks = [];
    for (var i = 1; i < radius; i++) { // Expand from center
      // The first -1 on for loop below is same as top loop, the second is to avoid filling the startHex of next point
      for (var j = 0; j < radius; j++) { // Iterate to fill hexes
        var startHex = { // Top
          x: centerHex.x,
          z: centerHex.z - i
        };

        adjacentBlocks.push({ // Increment by going down right
          x: startHex.x + j,
          z: startHex.z
        });

        ////

        startHex = { // Top right
          x: centerHex.x + i,
          z: centerHex.z - i
        };

        adjacentBlocks.push({ // Increment by going down
          x: startHex.x,
          z: startHex.z + j
        });

        ////

        startHex = { // Down right
          x: centerHex.x + i,
          z: centerHex.z
        };

        adjacentBlocks.push({ // Increment by going down left
          x: startHex.x - j,
          z: startHex.z + j
        });

        ////

        startHex = { // Down
          x: centerHex.x,
          z: centerHex.z + i
        };

        adjacentBlocks.push({ // Increment by going up left
          x: startHex.x - j,
          z: startHex.z
        });

        ////

        startHex = { // Down left
          x: centerHex.x - i,
          z: centerHex.z + i
        };

        adjacentBlocks.push({ // Increment by going up
          x: startHex.x,
          z: startHex.z - j
        });

        ////

        startHex = { // Up left
          x: centerHex.x - i,
          z: centerHex.z
        };

        adjacentBlocks.push({ // Increment by going up right
          x: startHex.x + j,
          z: startHex.z - j
        });
      }
    }

    for (var i = adjacentBlocks.length - 1; i >= 0; i--){
      if (adjacentBlocks[i].x < 0 || adjacentBlocks[i].x >= 200 ||
          adjacentBlocks[i].z < 0 || adjacentBlocks[i].z >= 100) {
        adjacentBlocks.splice(i, 1);
      }
    }

    return adjacentBlocks;
  }

  function newNode(position) {
    return {
      f: 0,
      g: 0,
      h: 0,
      x: position.x,
      z: position.z,
      parent: null
    };
  }

  function sameNode(node1, node2) {
    return node1.x == node2.x && node1.z == node2.z
  }

  function aStar(startPoint, endPoint) {
      var openList = [];
      openList.push(newNode(startPoint));

      var closedList = [];

      while (openList.length > 0) {
        // Find best scoring node
        var bI = 0;

        for (var i = 0; i < openList; i++) {
          if (openList[i].f < openList[bI].f) {
            bI = i;
          }
        }

        var currentNode = openList[bI];

        // End case
        if (sameNode(currentNode, endPoint)) {
          var curr = currentNode;
          var ret = [];
          while (curr.parent) {
            ret.push(curr);
            curr = curr.parent;
          }

          return ret.reverse();
        }

        // Remove current node from openlist
        for (var a = 0; a < openList.length; a++) {
          if (sameNode(openList[a], currentNode)) {
            openList.splice(a, 1);
          }
        }

        // Push current node onto closed list
        closedList.push(currentNode);

        // Load neighbors for checking
        var neighbors = findNeighbours(currentNode, 2);

        for (var a = 0; a < neighbors.length; a++) {
          var neighbor = neighbors[a];

          // Make sure neighbor is not already processed
          var onClosed = false;
          for (var b = 0; b < closedList.length; b++) {
            if (sameNode(closedList[b], neighbor)) {
              onClosed = false;
            }
          }

          if (onClosed) continue;

          // Find best scoring neighbor
          var gScore = currentNode.g + 1; // 1 is the distance from a node to it's neighbor
          var gScoreIsBest = false;

          // Check if this neighbor is on the list or not, if new is best so far
          var onList = false;
          for (var b = 0; b < openList.length; b++) {
            if (sameNode(openList[b], neighbor)) {
              onList = true;
            }
          }

          if (!onList) {
            // Is new, is the best so far
            gScoreIsBest = true;
            neighbor.h = hexMap.dist(neighbor.x, endPoint);
            openList.push(neighbor);
          } else if (gScore < neighbor.g) {
            // We have already seen the node, but last time it had a worse g (distance from start)
            gScoreIsBest = true;
          }

          if (gScoreIsBest) {
            // Found an optimal (so far) path to this node. Store info
            // on how we got here and just how good it really is
            neighbor.parent = currentNode;
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
          }
        }
      }
      return [];

  }

  function mod(x, m) {
    var result = x % m;

    if (result >= 0) {
      return result;
    } else {
      return result + m;
    }
  }

  /////////////////
  // Mouse Click
  ///////////////
  canvas.addEventListener('click',(evt) => {
      var clickButton = false; // Checks if button is clicked
      if (menuOpen) {
        for (var i = 0; i < menuButtons.length; i++) {
          if (menuButtons[i].rect.mouseOver(mx, my) && menuButtons[i].enabled) {
            menuButtons[i].do();
            console.log('clicked on ' + i);
            clickButton = true;
            break;
          }
        }
      }

      if (worldEditor) {
        for (var i = 0; i < worldEditorButtons.length; i++) { // Clicking on buttons
          if (worldEditorButtons[i].rect.mouseOver(mx, my) && worldEditorButtons[i].enabled) {
            worldEditorButtons[i].do();
            clickButton = true;
            break;
          }
        }

        if (!clickButton) { // Only modify blocks if not clicking on anything else
          for (var i = 0; i < mouseOverBlock.length; i++) {
            // Negative coordinates are saved to make displaying highlighted hexes easier
            var x = mod(mouseOverBlock[i].x, hexMap.tiles.length);
            var z = mod(mouseOverBlock[i].z, hexMap.tiles[x].length);
            hexMap.tiles[x][z].block = selectedBlock;
          }
        }
      }
      for (var i = 0; i < mouseOverBlock.length; i++) {
        // Negative coordinates are saved to make displaying highlighted hexes easier
        var x = mod(mouseOverBlock[i].x, hexMap.tiles.length);
        var z = mod(mouseOverBlock[i].z, hexMap.tiles[x].length);
        hexMap.tiles[x][z].pop += 1;
      }
  }, false);




  canvas.addEventListener('mouseout', function() {
      pause = true;
  }, false);
  canvas.addEventListener('mouseover',() => {
      pause = false;
  }, false);

  canvas.addEventListener('mousemove',(evt) => {
    var mousePos = getMousePos(canvas, evt);

    mx = mousePos.x;
    my = mousePos.y;

    mouseOverBlock = [];
    mouseOverBlock.push(hexMap.inTile(mx, my));
    if (worldEditor) {
      mouseOverBlock = findNeighbours(mouseOverBlock[0], brushSize);
    }

  }, false);


  function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
      };
  }

  ///////////////////////////////////
  //////////////////////////////////
  ////////	KEY BOARD INPUT
  ////////////////////////////////

  window.addEventListener('keydown',(evt) => {
      var key = evt.keyCode;

      hexMap.camera.keydown(key);

      if (key == 65) { // a
          // Sets initial point to pathfind to
          startPoint = hexMap.inTile(mx, my);
          if (startPoint !== null && endPoint !== null) {
              path = aStar(startPoint, endPoint);
          }
      } else if (key == 68) { // d
          endPoint = hexMap.inTile(mx, my);
          if (startPoint !== null && endPoint !== null) {
              path = aStar(startPoint, endPoint);
          }
      }

  }, false);

  window.addEventListener('keyup',(evt) => {
      var key = evt.keyCode;

      if (key == 27) { // Escape -> Menu
          menuOpen = !menuOpen;

          for (var i = 0; i < menuButtons.length; i++) {
              menuButtons[i].enabled = menuOpen;
          }
      } else if (key == 71) { // G -> Toggle coordinates
          hexMap.showCoords = !hexMap.showCoords;
      }
      hexMap.camera.keyup(key);

  }, false);
})
