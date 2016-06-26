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
        this.element.addEventListener('oncontextmenu', () => { return false; });

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
        this.isFlagged ^= true;
    }

    /**
     * Explodes the cell
     */
    explode() {
        this.isExploded = true;
        this.isRevealed = true;
        this.element.className += ' exploded';
        this._explodeHandler(this.row, this.col);

        // Vibrate the phone, if that's a feature
        window.navigator.vibrate(200);
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

    _handleMouseDown (e) {
        e.preventDefault();
        this.actionCompleted = false;
        this.longPressTimer = window.setTimeout(() => {
            if (!this.actionCompleted) {
                this.toggleFlagged();
                this.actionCompleted = true;
            }
        }, 250);
        return false;
    }

    _handleClick () {

        // On some cells we don't need to do anything
        if (this.isExploded || this.isRevealed || this.isFlagged) return;

        // On mines, we blow up
        if (this.isMine) {
            this.explode();
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
    var shortest = [-1, -1, Infinity];

    minefield.map((x, r) => {
        x.map((cell, c) => {
            // Get the Euclidean distance between the two cells
            var distance = Math.sqrt(Math.pow(Math.abs(col - c), 2) + Math.pow(Math.abs(row - r), 2));
            if (distance < shortest[2] && cell.isMine && !cell.isExploded) {
                shortest = [r, c, distance];
            }
        });
    });

    if (shortest[0] >= 0 && shortest[1] >= 0) {
        // Explode that cell 100 ms later
        var next = minefield[shortest[0]][shortest[1]];
        setTimeout(next.explode.bind(next), 50);
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

document.addEventListener('selectstart', () => { return false; });
minefield = createField(FIELD_SIZE, document.getElementById('minefield'));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js').catch(function(err) {
    console.error('ServiceWorker registration failed: ', err);
  });
}
