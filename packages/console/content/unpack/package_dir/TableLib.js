class Table {
    #emptyValue;
    #marginSize;

    #formatContent() {
        for (const row of this.content) {
            if (!Array.isArray(row)) continue;

            for (let i = 0; i < this.rowNumber; i++) {
                const cell = row[i];

                if (cell === undefined) {
                    row[i] = this.#emptyValue;
                } else {
                    row[i] = String(cell);
                }
            }
        }
    }

    constructor({ marginSize, emptyValue, content } = {}) {
        this.#marginSize = marginSize ?? 1;
        this.#emptyValue = emptyValue ?? "(empty)";

        /** @type {("separator" | any[])[]} */
        this.content = content;

        this.#formatContent();
    }

    get rowNumber() {
        let maxRow = 0;

        this.content.filter(Array.isArray).forEach(row => {
            if (row.length > maxRow) {
                maxRow = row.length;
            }
        });

        return maxRow;
    }

    get columnNumber() {
        return this.content.filter(Array.isArray).length;
    }

    #getColumnWidths() {
        const columnWidths = Array(this.rowNumber).fill(0);

        for (const row of this.content) {
            if (!Array.isArray(row)) continue;

            for (const i in row) {
                if (row[i].length > columnWidths[i]) {
                    columnWidths[i] = row[i].length;
                }
            }
        }

        return columnWidths;
    }

    toString() {
        let str = "";

        // Top of the tablebox
        str += "┌";
        str += this.#getColumnWidths().map(w => "─".repeat(w + this.#marginSize * 2)).join("┬");
        str += "┐\n";

        const margin = " ".repeat(this.#marginSize);
        const separator = `├${this.#getColumnWidths().map(w => "─".repeat(w + this.#marginSize * 2)).join("┼")}┤\n`;
        const blank = `|${this.#getColumnWidths().map(w => " ".repeat(w + this.#marginSize * 2)).join("|")}|\n`;

        for (const row of this.content) {
            if (row === "separator") {
                str += separator;
            } else if (row === "blank") {
                str += blank;
            } else {
                str += "│" + margin;
                str += row.map((cell, i) => {
                    let res = cell;
                    console.log(cell);
                    res = res.padEnd(this.#getColumnWidths()[i], " ");
                    return res;
                }).join(margin + "│" + margin);
                str += margin + "│";
                str += "\n";
            }
        }

        // Bottom of the tablebox
        str += "└";
        str += this.#getColumnWidths().map(w => "─".repeat(w + this.#marginSize * 2)).join("┴");
        str += "┘";

        return str;
    }

    pushRow(row) {
        this.content.push(row);
        this.#formatContent();
    }
}

module.exports = Table;