const inspect = await include("./inspect.js");
const format = await include("./format.js");
const getTableStr = await include("./table.js");

const { requestTerminal } = w96.util;

class Console {
    #group = 0;
    #counts = new Map();

    term = null;

    static async create(term) {
        if (!term) {
            term = (await requestTerminal("Console")).terminal;
        }

        const self = new this();
        self.term = term;

        return self;
    }

    #fmtPrint(data, color = true) {
        let str = format(data)
            .map((v) =>
                typeof v === "string" ? v : inspect(v, { colors: color === true })
            )
            .join(" ");

        const padding = "  ".repeat(this.#group);
        str = padding + str.replaceAll("\n", `\n${padding}`);

        if (typeof color === "string") {
            this.term.println(this.term.color[color](str));
        } else {
            this.term.println(str);
        }
    }

    /**
     * Prints data to the console
     * @param data {...any} The data to print
     */
    log(...data) {
        this.#fmtPrint(data, true);
    }

    table(data) {
        this.#fmtPrint([getTableStr(data)], false);
    }

    /**
     * Prints data to the console as an error
     * @param data {...any} The data to print
     */
    error(...data) {
        this.#fmtPrint(data, "red");
    }

    /**
     * Prints data to the console as a warning
     * @param data {...any} The data to print
     */
    warn(...data) {
        this.#fmtPrint(data, "yellow");
    }

    /**
     * Prints data to the console as an info
     * @param data {...any} The data to print
     */
    info(...data) {
        this.#fmtPrint(data, "cyan");
    }

    /**
     * Prints data to the console as a debug message
     * @param data {...any} The data to print
     */
    debug(...data) {
        this.#fmtPrint(data, "blue");
    }

    /**
     * Prints data to the console as a trace
     * @param data {...any} The data to print
     */
    trace(...data) {
        class Trace extends Error {
            name = "Trace";
        }

        const trace = new Trace(data.join(" ")).stack;
        this.#fmtPrint([trace], false);
    }

    /**
     * Adds a level of indentation to the console
     * @param data {...any} The data to print before the indentation
     */
    group(...data) {
        this.#fmtPrint(data, true);
        this.#group++;
    }

    /**
     * Removes a level of indentation from the console
     */
    groupEnd() {
        this.#group > 0 && this.#group--;
    }

    /**
     * Adds a level of indentation to the console
     * @param data {...any} The data to print before the indentation
     */
    groupCollapsed(...data) {
        this.group(...data);
    }

    /**
     * Clears the console
     */
    clear() {
        this.term.clear();
    }

    /**
     * Adds one to a count or creates a count if it doesn't exist
     * @param tag {string} The tag of the count
     */
    count(tag = "default") {
        if (!this.#counts.has(tag)) this.#counts.set(tag, 0);

        const count = this.#counts.get(tag) + 1;
        this.#counts.set(tag, count);
        this.#fmtPrint([`${tag}: ${count}`], false);
    }

    /**
     * Resets a count if it exists
     * @param tag {string} The tag of the count
     */
    countReset(tag = "default") {
        if (!this.#counts.has(tag)) {
            this.#fmtPrint([`Count for '${tag}' does not exists`], "yellow");
        } else {
            this.#counts.delete(tag);
        }
    }
}

module.exports = Console;