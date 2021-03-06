/**
 * Minesweeper
 *
 * @author Abe Fehr
 */

/**
 * Represents one cell on the screen
 */
class Cell {

  constructor (row, col) {
    /**
     * The basic properties of the cell
     */
    this.isMine = false;
    this.isExploded = false;
    this.isFlagged = false;
    this.isRevealed = false;
    /**
     * The location of the cell
     */
    this.row = row;
    this.col = col;
    /**
     * A link to the element on the screen
     */
    this.element;
    /**
     * A few properties needed for the handlers
     */
    this.longPressTimer;
    this.actionCompleted = true;
    /**
     * What to do when a cell is revealed
     */
    this._revealHandler;
  }

  /**
   * Creates an element on the screen
   */
  createElement () {
    this.element = document.createElement('div');
    this.element.className = 'cell';
    this.element.addEventListener('click', () => { return false; });
    this.element.addEventListener('mouseout', () => { this.actionCompleted = true; });
    this.element.addEventListener('mousedown', this._handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this._handleMouseUp.bind(this));
    this.element.addEventListener('contextmenu', this._handleMouseRightClick.bind(this));

    var contents = document.createElement('div');
    contents.className = 'cell-content';
    this.element.appendChild(contents);

    return this.element;
  }

  /**
   * Toggles the flagged status of the cell
   */
  toggleFlagged () {
    if (this.isExploded || this.isRevealed) return;
    if (this.element.className.indexOf('flagged') === -1) {
      this.element.className += ' flagged';
    } else {
      this.element.className = this.element.className.replace(/flagged/,'');
    }
    window.navigator.vibrate(50);
    this.isFlagged ^= true;
  }

  /**
   * Explodes the cell
   */
  explode() {
    this.isExploded = true;
    this.isRevealed = true;
    this.element.classList.add('exploded');

    // Vibrate the device
    window.navigator.vibrate(20);
    var flash = document.getElementById('flash');
    flash.classList.add('flashing');
    setTimeout(() => {
      flash.classList.remove('flashing');
    }, 100)
  }

  /**
   * Event handlers
   */
  _handleMouseUp (e) {
    e.preventDefault();
    if (this.longPressTimer && !this.actionCompleted) {
      clearTimeout(this.longPressTimer);
      this._handleClick();
    }
    this.actionCompleted = true;
  }

  _handleMouseRightClick (e) {
    e.preventDefault();
    if (this.longPressTimer && !this.actionCompleted) {
      clearTimeout(this.longPressTimer);
      this.toggleFlagged();
    }
    this.actionCompleted = true;
    return false;
  }

  _handleMouseDown (e) {
    e.preventDefault();
    this.actionCompleted = false;
    this.longPressTimer = window.setTimeout(() => {
      if (!this.actionCompleted) {
        this.toggleFlagged();
        this.actionCompleted = true;
      }
    }, LONG_PRESS_TIMEOUT);
    return false;
  }

  _handleClick () {

    // On some cells we don't need to do anything
    if (this.isExploded || this.isRevealed || this.isFlagged) return;

    // On mines, we blow up
    if (this.isMine) {
      this.explode();

      // Propagate this
      // debugger;
      this._explodeHandler(this.row, this.col);
      return;
    }

    // Reveal this cell
    this._revealHandler(this.row, this.col);
  }

  onReveal (revealHandler) {
    this._revealHandler = revealHandler;
  }

  onExplode (explodeHandler) {
    this._explodeHandler = explodeHandler;
  }

  reveal () {
    this.isRevealed = true;
    this.element.className += ' revealed';
  }

  setValue (value) {
    this.element.querySelector('.cell-content').innerText = value ? value : ' '
  }

}

/**
 * The odds of placing a mine
 */
const MINE_ODDS = 0.15;

/**
 * The size of the playing field
 */
const FIELD_SIZE = 8;

/**
 * The number of milleseconds to wait for a long press
 */
const LONG_PRESS_TIMEOUT = 150;

/**
 * The minefield
 */
var minefield;

/**
 * Creates a field of cells of a given size and places them on the canvas
 */
var createField = (size, canvas) => {
  var field = [];
  for (let i = 0; i < size; ++i) {
    field.push([]);
    var tr = document.createElement('div');
    tr.className += 'row';
    for (let j = 0; j < size; ++j) {
      cell = new Cell(i, j);
      cell.isMine = Math.random() < MINE_ODDS ? true : false;
      cell.onReveal(handleReveal);
      cell.onExplode(handleExplode);
      tr.appendChild(cell.createElement());
      field[i].push(cell);
    }
    canvas.appendChild(tr);
  }
  return field;
}

var handleExplode = (row, col) => {
  var distances = [];

  minefield.map((x, r) => {
    x.map((cell, c) => {
      // Get the Euclidean distance between the two cells
      if (minefield[cell.row][cell.col].isMine) {
        var distance = ~~Math.sqrt(Math.pow(Math.abs(col - c), 2) + Math.pow(Math.abs(row - r), 2));
        distances.push({
          row: r,
          col: c,
          distance,
        });
      }
    });
  });

  // Set a timeout for each cell, relative to the distance away it is from the current cell
  debugger;
  for (let cell of distances) {
    // debugger;
    var next = minefield[cell.row][cell.col];
    setTimeout(next.explode.bind(next), 50 * cell.distance);
  }
}

var handleReveal = (row, col) => {
  var count = 0;

  // Don't run this function sometimes
  if ((row < 0 || row > FIELD_SIZE - 1 || col < 0 || col > FIELD_SIZE - 1) ||
    minefield[row][col].isRevealed ||
    minefield[row][col].isFlagged ||
    minefield[row][col].isMine)
    return;

  // Reveal the cell
  minefield[row][col].reveal(count);

  // Check if the gmae is done
  if (checkComplete()) setTimeout(alert.bind(this, "Puzzle Complete! Refresh to play again"), 200);

  // Count the number of cells around it
  [-1, 0, 1].map((i) => {
    [-1, 0, 1].map((j) => {
      if ((i !== 0 || j !== 0) &&
        minefield[row+i] &&
        minefield[row+i][col+j] &&
        minefield[row+i][col+j].isMine) {
        ++count;
      }
    })
  })

  // Reveal the adjacent cells if this was a zero
  if (count === 0) {
    [-1, 0, 1].map((i) => {
      [-1, 0, 1].map((j) => handleReveal(row+i, col+j));
    });
  }

  // Show the value in the actual cell
  minefield[row][col].setValue(count);
}

var checkComplete = () => {
  // If every non-mine tile has been revealed, then we're golden
  count = 0;
  minefield.map((row, r) => {
    row.map((cell, c) => {
      if (cell.isMine || cell.isRevealed) ++count;
    });
  });

  return count === FIELD_SIZE * FIELD_SIZE;
}

document.addEventListener('selectstart', () => { return false; });
minefield = createField(FIELD_SIZE, document.getElementById('minefield'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js').catch(function(err) {
    console.error('ServiceWorker registration failed: ', err);
  });
}
