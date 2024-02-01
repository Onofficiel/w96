// src/colors.ts
function code(open, close) {
    return {
        open: `\x1B[${open.join(";")}m`,
        close: `\x1B[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
    };
}
function run(str, code2) {
    return `${code2.open}${str.replace(code2.regexp, code2.open)
        }${code2.close}`;
}
function bold(str) {
    return run(str, code([1], 22));
}
function red(str) {
    return run(str, code([31], 39));
}
function green(str) {
    return run(str, code([32], 39));
}
function yellow(str) {
    return run(str, code([33], 39));
}
function magenta(str) {
    return run(str, code([35], 39));
}
function cyan(str) {
    return run(str, code([36], 39));
}
function gray(str) {
    return brightBlack(str);
}
function brightBlack(str) {
    return run(str, code([90], 39));
}
var ANSI_PATTERN = new RegExp(
    [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
    ].join("|"),
    "g",
);
function stripColor(string) {
    return string.replace(ANSI_PATTERN, "");
}

// src/index.ts
function Inspect(value, options = {}) {
    circular = void 0;
    return inspectValue(value, {
        ...DEFAULT_INSPECT_OPTIONS,
        ...options,
    });
}
var circular;
function handleCircular(value, cyan2) {
    let index = 1;
    if (circular === void 0) {
        circular = /* @__PURE__ */ new Map();
        circular.set(value, index);
    } else {
        index = circular.get(value);
        if (index === void 0) {
            index = circular.size + 1;
            circular.set(value, index);
        }
    }
    return cyan2(`[Circular *${index}]`);
}
var DEFAULT_INSPECT_OPTIONS = {
    depth: 4,
    indentLevel: 0,
    sorted: false,
    trailingComma: false,
    compact: true,
    iterableLimit: 100,
    colors: false,
    getters: false,
    showHidden: false,
    strAbbreviateSize: 100,
};
var DEFAULT_INDENT = "  ";
var LINE_BREAKING_LENGTH = 80;
var MIN_GROUP_LENGTH = 6;
var STR_ABBREVIATE_SIZE = 100;
var CTX_STACK = [];
function ctxHas(x) {
    return CTX_STACK.slice(0, CTX_STACK.length - 1).includes(x);
}
function inspectValue(value, inspectOptions) {
    CTX_STACK.push(value);
    let x;
    try {
        x = _inspectValue(value, inspectOptions);
    } finally {
        CTX_STACK.pop();
    }
    return x;
}
function maybeColor(fn, inspectOptions) {
    return inspectOptions.colors ? fn : (s) => s;
}
var QUOTES = ['"', "'", "`"];
function replaceEscapeSequences(string) {
    const escapeMap = {
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "	": "\\t",
        "\v": "\\v",
    };
    return string.replace(
        /([\b\f\n\r\t\v])/g,
        (c) => escapeMap[c],
    ).replace(
        /[\x00-\x1f\x7f-\x9f]/g,
        (c) =>
            "\\x" + c.charCodeAt(0).toString(16).padStart(
                2,
                "0",
            ),
    );
}
function quoteString(string) {
    const quote = QUOTES.find((c) => !string.includes(c)) ?? QUOTES[0];
    const escapePattern = new RegExp(`(?=[${quote}\\\\])`, "g");
    string = string.replace(escapePattern, "\\");
    string = replaceEscapeSequences(string);
    return `${quote}${string}${quote}`;
}
function inspectValueWithQuotes(value, inspectOptions) {
    const abbreviateSize =
        typeof inspectOptions.strAbbreviateSize === "undefined"
            ? STR_ABBREVIATE_SIZE
            : inspectOptions.strAbbreviateSize;
    const green2 = maybeColor(green, inspectOptions);
    switch (typeof value) {
        case "string": {
            const trunc = value.length > abbreviateSize
                ? value.slice(0, abbreviateSize) + "..."
                : value;
            return green2(quoteString(trunc));
        }
        default:
            return inspectValue(value, inspectOptions);
    }
}
function isTypedArray(x) {
    return ArrayBuffer.isView(x) && !DataView.prototype.isPrototypeOf(x);
}
function isInvalidDate(x) {
    return isNaN(x.getTime());
}
function groupEntries(entries, level, value, iterableLimit = 100) {
    let totalLength = 0;
    let maxLength = 0;
    let entriesLength = entries.length;
    if (iterableLimit < entriesLength) {
        entriesLength--;
    }
    const separatorSpace = 2;
    const dataLen = new Array(entriesLength);
    for (let i = 0; i < entriesLength; i++) {
        const len = stripColor(entries[i]).length;
        dataLen[i] = len;
        totalLength += len + separatorSpace;
        if (maxLength < len) {
            maxLength = len;
        }
    }
    const actualMax = maxLength + separatorSpace;
    if (
        actualMax * 3 + (level + 1) < LINE_BREAKING_LENGTH &&
        (totalLength / actualMax > 5 || maxLength <= 6)
    ) {
        const approxCharHeights = 2.5;
        const averageBias = Math.sqrt(actualMax - totalLength / entries.length);
        const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
        const columns = Math.min(
            Math.round(
                Math.sqrt(approxCharHeights * biasedMax * entriesLength) / biasedMax,
            ),
            Math.floor((LINE_BREAKING_LENGTH - (level + 1)) / actualMax),
            15,
        );
        if (columns <= 1) {
            return entries;
        }
        const tmp = [];
        const maxLineLength = [];
        for (let i = 0; i < columns; i++) {
            let lineMaxLength = 0;
            for (let j = i; j < entries.length; j += columns) {
                if (dataLen[j] > lineMaxLength) {
                    lineMaxLength = dataLen[j];
                }
            }
            lineMaxLength += separatorSpace;
            maxLineLength[i] = lineMaxLength;
        }
        let order = "padStart";
        if (value !== void 0) {
            for (let i = 0; i < entries.length; i++) {
                if (typeof value[i] !== "number" && typeof value[i] !== "bigint") {
                    order = "padEnd";
                    break;
                }
            }
        }
        for (let i = 0; i < entriesLength; i += columns) {
            const max = Math.min(i + columns, entriesLength);
            let str = "";
            let j = i;
            for (; j < max - 1; j++) {
                const lengthOfColorCodes = entries[j].length - dataLen[j];
                const padding = maxLineLength[j - i] + lengthOfColorCodes;
                str += `${entries[j]}, `[order](padding, " ");
            }
            if (order === "padStart") {
                const lengthOfColorCodes = entries[j].length - dataLen[j];
                const padding = maxLineLength[j - i] + lengthOfColorCodes -
                    separatorSpace;
                str += entries[j].padStart(padding, " ");
            } else {
                str += entries[j];
            }
            tmp.push(str);
        }
        if (iterableLimit < entries.length) {
            tmp.push(entries[entriesLength]);
        }
        entries = tmp;
    }
    return entries;
}
function inspectIterable(value, options, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    if (inspectOptions.indentLevel >= inspectOptions.depth) {
        return cyan2(`[${options.typeName}]`);
    }
    const entries = [];
    let iter;
    let valueIsTypedArray = false;
    let entriesLength;
    switch (options.typeName) {
        case "Map":
            iter = value.entries();
            entriesLength = value.size;
            break;
        case "Set":
            iter = value.entries();
            entriesLength = value.size;
            break;
        case "Array":
            entriesLength = value.length;
            break;
        default:
            if (isTypedArray(value)) {
                entriesLength = value.length;
                iter = value.entries();
                valueIsTypedArray = true;
            } else {
                throw new TypeError("unreachable");
            }
    }
    let entriesLengthWithoutEmptyItems = entriesLength;
    if (options.typeName === "Array") {
        for (
            let i = 0, j = 0;
            i < entriesLength && j < inspectOptions.iterableLimit;
            i++, j++
        ) {
            inspectOptions.indentLevel++;
            const { entry, skipTo } = options.entryHandler(
                [i, value[i]],
                inspectOptions,
            );
            entries.push(entry);
            inspectOptions.indentLevel--;
            if (skipTo) {
                entriesLengthWithoutEmptyItems -= skipTo - i;
                i = skipTo;
            }
        }
    } else {
        let i = 0;
        while (true) {
            let el;
            try {
                const res = iter.next();
                if (res.done) {
                    break;
                }
                el = res.value;
            } catch (err) {
                if (valueIsTypedArray) {
                    break;
                }
                throw err;
            }
            if (i < inspectOptions.iterableLimit) {
                inspectOptions.indentLevel++;
                entries.push(options.entryHandler(
                    el,
                    inspectOptions,
                ));
                inspectOptions.indentLevel--;
            } else {
                break;
            }
            i++;
        }
    }
    if (options.sort) {
        entries.sort();
    }
    if (entriesLengthWithoutEmptyItems > inspectOptions.iterableLimit) {
        const nmore = entriesLengthWithoutEmptyItems -
            inspectOptions.iterableLimit;
        entries.push(`... ${nmore} more items`);
    }
    const iPrefix = `${options.displayName ? options.displayName + " " : ""}`;
    const level = inspectOptions.indentLevel;
    const initIndentation = `
${DEFAULT_INDENT.repeat(level + 1)}`;
    const entryIndentation = `,
${DEFAULT_INDENT.repeat(level + 1)}`;
    const closingDelimIndentation = DEFAULT_INDENT.repeat(level);
    const closingIndentation = `${inspectOptions.trailingComma ? "," : ""}
${closingDelimIndentation}`;
    let iContent;
    if (entries.length === 0 && !inspectOptions.compact) {
        iContent = `
${closingDelimIndentation}`;
    } else if (options.group && entries.length > MIN_GROUP_LENGTH) {
        const groups = groupEntries(entries, level, value);
        iContent = `${initIndentation}${groups.join(entryIndentation)
            }${closingIndentation}`;
    } else {
        iContent = entries.length === 0 ? "" : ` ${entries.join(", ")} `;
        if (
            stripColor(iContent).length > LINE_BREAKING_LENGTH ||
            !inspectOptions.compact
        ) {
            iContent = `${initIndentation}${entries.join(entryIndentation)
                }${closingIndentation}`;
        }
    }
    return `${iPrefix}${options.delims[0]}${iContent}${options.delims[1]}`;
}
function inspectArray(value, inspectOptions) {
    const gray2 = maybeColor(gray, inspectOptions);
    let lastValidIndex = 0;
    let keys;
    const options = {
        typeName: "Array",
        displayName: "",
        delims: ["[", "]"],
        entryHandler: (entry, inspectOptions2) => {
            const [index, val] = entry;
            let i = index;
            lastValidIndex = index;
            if (!value.hasOwnProperty(i)) {
                let skipTo;
                keys = keys || Object.keys(value);
                i = value.length;
                if (keys.length === 0) {
                    skipTo = i;
                } else {
                    while (keys.length) {
                        const key = keys.shift();
                        if (key > lastValidIndex && key < 2 ** 32 - 1) {
                            i = Number(key);
                            break;
                        }
                    }
                    skipTo = i - 1;
                }
                const emptyItems = i - index;
                const ending = emptyItems > 1 ? "s" : "";
                return {
                    entry: gray2(`<${emptyItems} empty item${ending}>`),
                    skipTo,
                };
            } else {
                return { entry: inspectValueWithQuotes(val, inspectOptions2) };
            }
        },
        group: inspectOptions.compact,
        sort: false,
    };
    return inspectIterable(value, options, inspectOptions);
}
function maybeQuoteSymbol(symbol) {
    if (symbol.description === void 0) {
        return symbol.toString();
    }
    if (/^[a-zA-Z_][a-zA-Z_.0-9]*$/.test(symbol.description)) {
        return symbol.toString();
    }
    return `Symbol(${quoteString(symbol.description)})`;
}
function getClassInstanceName(instance) {
    if (typeof instance != "object") {
        return "";
    }
    const constructor = instance?.constructor;
    if (typeof constructor == "function") {
        return constructor.name ?? "";
    }
    return "";
}
function maybeQuoteString(string) {
    if (/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(string)) {
        return replaceEscapeSequences(string);
    }
    return quoteString(string);
}
function propertyIsEnumerable(obj, prop) {
    if (obj == null || typeof obj.propertyIsEnumerable !== "function") {
        return false;
    }
    return obj.propertyIsEnumerable(prop);
}
function inspectRawObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    if (inspectOptions.indentLevel >= inspectOptions.depth) {
        return [cyan2("[Object]"), ""];
    }
    let baseString;
    let shouldShowDisplayName = false;
    let displayName = value[Symbol.toStringTag];
    if (!displayName) {
        displayName = getClassInstanceName(value);
    }
    if (
        displayName && displayName !== "Object" && displayName !== "anonymous"
    ) {
        shouldShowDisplayName = true;
    }
    const entries = [];
    const stringKeys = Object.keys(value);
    const symbolKeys = Object.getOwnPropertySymbols(value);
    if (inspectOptions.sorted) {
        stringKeys.sort();
        symbolKeys.sort(
            (s1, s2) => (s1.description ?? "").localeCompare(s2.description ?? ""),
        );
    }
    const red2 = maybeColor(red, inspectOptions);
    inspectOptions.indentLevel++;
    for (const key of stringKeys) {
        if (inspectOptions.getters) {
            let propertyValue;
            let error = null;
            try {
                propertyValue = value[key];
            } catch (error_) {
                error = error_;
            }
            const inspectedValue = error == null
                ? inspectValueWithQuotes(propertyValue, inspectOptions)
                : red2(`[Thrown ${error.name}: ${error.message}]`);
            entries.push(`${maybeQuoteString(key)}: ${inspectedValue}`);
        } else {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (descriptor.get !== void 0 && descriptor.set !== void 0) {
                entries.push(`${maybeQuoteString(key)}: [Getter/Setter]`);
            } else if (descriptor.get !== void 0) {
                entries.push(`${maybeQuoteString(key)}: [Getter]`);
            } else {
                entries.push(
                    `${maybeQuoteString(key)}: ${inspectValueWithQuotes(value[key], inspectOptions)
                    }`,
                );
            }
        }
    }
    for (const key of symbolKeys) {
        if (!inspectOptions.showHidden && !propertyIsEnumerable(value, key)) {
            continue;
        }
        if (inspectOptions.getters) {
            let propertyValue;
            let error;
            try {
                propertyValue = value[key];
            } catch (error_) {
                error = error_;
            }
            const inspectedValue = error == null
                ? inspectValueWithQuotes(propertyValue, inspectOptions)
                : red2(`Thrown ${error.name}: ${error.message}`);
            entries.push(`[${maybeQuoteSymbol(key)}]: ${inspectedValue}`);
        } else {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if (descriptor.get !== void 0 && descriptor.set !== void 0) {
                entries.push(`[${maybeQuoteSymbol(key)}]: [Getter/Setter]`);
            } else if (descriptor.get !== void 0) {
                entries.push(`[${maybeQuoteSymbol(key)}]: [Getter]`);
            } else {
                entries.push(
                    `[${maybeQuoteSymbol(key)}]: ${inspectValueWithQuotes(value[key], inspectOptions)
                    }`,
                );
            }
        }
    }
    inspectOptions.indentLevel--;
    const totalLength = entries.length + inspectOptions.indentLevel +
        stripColor(entries.join("")).length;
    if (entries.length === 0) {
        baseString = "{}";
    } else if (totalLength > LINE_BREAKING_LENGTH || !inspectOptions.compact) {
        const entryIndent = DEFAULT_INDENT.repeat(inspectOptions.indentLevel + 1);
        const closingIndent = DEFAULT_INDENT.repeat(inspectOptions.indentLevel);
        baseString = `{
${entryIndent}${entries.join(`,
${entryIndent}`)
            }${inspectOptions.trailingComma ? "," : ""}
${closingIndent}}`;
    } else {
        baseString = `{ ${entries.join(", ")} }`;
    }
    if (shouldShowDisplayName) {
        baseString = `${displayName} ${baseString}`;
    }
    let refIndex = "";
    if (circular !== void 0) {
        const index = circular.get(value);
        if (index !== void 0) {
            refIndex = cyan2(`<ref *${index}> `);
        }
    }
    return [baseString, refIndex];
}
var denoCustomInspect = Symbol.for("Deno.customInspect");
function inspectFunction(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    if (
        Reflect.has(value, denoCustomInspect) &&
        typeof value[denoCustomInspect] === "function"
    ) {
        return String(value[denoCustomInspect](Inspect, inspectOptions));
    }
    let cstrName = Object.getPrototypeOf(value)?.constructor?.name;
    if (!cstrName) {
        cstrName = "Function";
    }
    let suffix = ``;
    let refStr = "";
    if (
        Object.keys(value).length > 0 ||
        Object.getOwnPropertySymbols(value).length > 0
    ) {
        const [propString, refIndex] = inspectRawObject(
            value,
            inspectOptions,
        );
        refStr = refIndex;
        if (propString.length > 0 && propString !== "{}") {
            suffix = ` ${propString}`;
        }
    }
    if (value.name && value.name !== "anonymous") {
        return cyan2(`${refStr}[${cstrName}: ${value.name}]`) + suffix;
    }
    return cyan2(`${refStr}[${cstrName}]`) + suffix;
}
var colorKeywords = /* @__PURE__ */ new Map([
    ["black", "#000000"],
    ["silver", "#c0c0c0"],
    ["gray", "#808080"],
    ["white", "#ffffff"],
    ["maroon", "#800000"],
    ["red", "#ff0000"],
    ["purple", "#800080"],
    ["fuchsia", "#ff00ff"],
    ["green", "#008000"],
    ["lime", "#00ff00"],
    ["olive", "#808000"],
    ["yellow", "#ffff00"],
    ["navy", "#000080"],
    ["blue", "#0000ff"],
    ["teal", "#008080"],
    ["aqua", "#00ffff"],
    ["orange", "#ffa500"],
    ["aliceblue", "#f0f8ff"],
    ["antiquewhite", "#faebd7"],
    ["aquamarine", "#7fffd4"],
    ["azure", "#f0ffff"],
    ["beige", "#f5f5dc"],
    ["bisque", "#ffe4c4"],
    ["blanchedalmond", "#ffebcd"],
    ["blueviolet", "#8a2be2"],
    ["brown", "#a52a2a"],
    ["burlywood", "#deb887"],
    ["cadetblue", "#5f9ea0"],
    ["chartreuse", "#7fff00"],
    ["chocolate", "#d2691e"],
    ["coral", "#ff7f50"],
    ["cornflowerblue", "#6495ed"],
    ["cornsilk", "#fff8dc"],
    ["crimson", "#dc143c"],
    ["cyan", "#00ffff"],
    ["darkblue", "#00008b"],
    ["darkcyan", "#008b8b"],
    ["darkgoldenrod", "#b8860b"],
    ["darkgray", "#a9a9a9"],
    ["darkgreen", "#006400"],
    ["darkgrey", "#a9a9a9"],
    ["darkkhaki", "#bdb76b"],
    ["darkmagenta", "#8b008b"],
    ["darkolivegreen", "#556b2f"],
    ["darkorange", "#ff8c00"],
    ["darkorchid", "#9932cc"],
    ["darkred", "#8b0000"],
    ["darksalmon", "#e9967a"],
    ["darkseagreen", "#8fbc8f"],
    ["darkslateblue", "#483d8b"],
    ["darkslategray", "#2f4f4f"],
    ["darkslategrey", "#2f4f4f"],
    ["darkturquoise", "#00ced1"],
    ["darkviolet", "#9400d3"],
    ["deeppink", "#ff1493"],
    ["deepskyblue", "#00bfff"],
    ["dimgray", "#696969"],
    ["dimgrey", "#696969"],
    ["dodgerblue", "#1e90ff"],
    ["firebrick", "#b22222"],
    ["floralwhite", "#fffaf0"],
    ["forestgreen", "#228b22"],
    ["gainsboro", "#dcdcdc"],
    ["ghostwhite", "#f8f8ff"],
    ["gold", "#ffd700"],
    ["goldenrod", "#daa520"],
    ["greenyellow", "#adff2f"],
    ["grey", "#808080"],
    ["honeydew", "#f0fff0"],
    ["hotpink", "#ff69b4"],
    ["indianred", "#cd5c5c"],
    ["indigo", "#4b0082"],
    ["ivory", "#fffff0"],
    ["khaki", "#f0e68c"],
    ["lavender", "#e6e6fa"],
    ["lavenderblush", "#fff0f5"],
    ["lawngreen", "#7cfc00"],
    ["lemonchiffon", "#fffacd"],
    ["lightblue", "#add8e6"],
    ["lightcoral", "#f08080"],
    ["lightcyan", "#e0ffff"],
    ["lightgoldenrodyellow", "#fafad2"],
    ["lightgray", "#d3d3d3"],
    ["lightgreen", "#90ee90"],
    ["lightgrey", "#d3d3d3"],
    ["lightpink", "#ffb6c1"],
    ["lightsalmon", "#ffa07a"],
    ["lightseagreen", "#20b2aa"],
    ["lightskyblue", "#87cefa"],
    ["lightslategray", "#778899"],
    ["lightslategrey", "#778899"],
    ["lightsteelblue", "#b0c4de"],
    ["lightyellow", "#ffffe0"],
    ["limegreen", "#32cd32"],
    ["linen", "#faf0e6"],
    ["magenta", "#ff00ff"],
    ["mediumaquamarine", "#66cdaa"],
    ["mediumblue", "#0000cd"],
    ["mediumorchid", "#ba55d3"],
    ["mediumpurple", "#9370db"],
    ["mediumseagreen", "#3cb371"],
    ["mediumslateblue", "#7b68ee"],
    ["mediumspringgreen", "#00fa9a"],
    ["mediumturquoise", "#48d1cc"],
    ["mediumvioletred", "#c71585"],
    ["midnightblue", "#191970"],
    ["mintcream", "#f5fffa"],
    ["mistyrose", "#ffe4e1"],
    ["moccasin", "#ffe4b5"],
    ["navajowhite", "#ffdead"],
    ["oldlace", "#fdf5e6"],
    ["olivedrab", "#6b8e23"],
    ["orangered", "#ff4500"],
    ["orchid", "#da70d6"],
    ["palegoldenrod", "#eee8aa"],
    ["palegreen", "#98fb98"],
    ["paleturquoise", "#afeeee"],
    ["palevioletred", "#db7093"],
    ["papayawhip", "#ffefd5"],
    ["peachpuff", "#ffdab9"],
    ["peru", "#cd853f"],
    ["pink", "#ffc0cb"],
    ["plum", "#dda0dd"],
    ["powderblue", "#b0e0e6"],
    ["rosybrown", "#bc8f8f"],
    ["royalblue", "#4169e1"],
    ["saddlebrown", "#8b4513"],
    ["salmon", "#fa8072"],
    ["sandybrown", "#f4a460"],
    ["seagreen", "#2e8b57"],
    ["seashell", "#fff5ee"],
    ["sienna", "#a0522d"],
    ["skyblue", "#87ceeb"],
    ["slateblue", "#6a5acd"],
    ["slategray", "#708090"],
    ["slategrey", "#708090"],
    ["snow", "#fffafa"],
    ["springgreen", "#00ff7f"],
    ["steelblue", "#4682b4"],
    ["tan", "#d2b48c"],
    ["thistle", "#d8bfd8"],
    ["tomato", "#ff6347"],
    ["turquoise", "#40e0d0"],
    ["violet", "#ee82ee"],
    ["wheat", "#f5deb3"],
    ["whitesmoke", "#f5f5f5"],
    ["yellowgreen", "#9acd32"],
    ["rebeccapurple", "#663399"],
]);
function parseCssColor(colorString) {
    if (colorKeywords.has(colorString)) {
        colorString = colorKeywords.get(colorString);
    }
    const hashMatch = colorString.match(
        /^#([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})?$/,
    );
    if (hashMatch != null) {
        return [
            Number(`0x${hashMatch[1]}`),
            Number(`0x${hashMatch[2]}`),
            Number(`0x${hashMatch[3]}`),
        ];
    }
    const smallHashMatch = colorString.match(
        /^#([\dA-Fa-f])([\dA-Fa-f])([\dA-Fa-f])([\dA-Fa-f])?$/,
    );
    if (smallHashMatch != null) {
        return [
            Number(`0x${smallHashMatch[1]}0`),
            Number(`0x${smallHashMatch[2]}0`),
            Number(`0x${smallHashMatch[3]}0`),
        ];
    }
    const rgbMatch = colorString.match(
        /^rgba?\(\s*([+\-]?\d*\.?\d+)\s*,\s*([+\-]?\d*\.?\d+)\s*,\s*([+\-]?\d*\.?\d+)\s*(,\s*([+\-]?\d*\.?\d+)\s*)?\)$/,
    );
    if (rgbMatch != null) {
        return [
            Math.round(Math.max(0, Math.min(255, Number(rgbMatch[1])))),
            Math.round(Math.max(0, Math.min(255, Number(rgbMatch[2])))),
            Math.round(Math.max(0, Math.min(255, Number(rgbMatch[3])))),
        ];
    }
    const hslMatch = colorString.match(
        /^hsla?\(\s*([+\-]?\d*\.?\d+)\s*,\s*([+\-]?\d*\.?\d+)%\s*,\s*([+\-]?\d*\.?\d+)%\s*(,\s*([+\-]?\d*\.?\d+)\s*)?\)$/,
    );
    if (hslMatch != null) {
        let h = Number(hslMatch[1]) % 360;
        if (h < 0) {
            h += 360;
        }
        const s = Math.max(0, Math.min(100, Number(hslMatch[2]))) / 100;
        const l = Math.max(0, Math.min(100, Number(hslMatch[3]))) / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(h / 60 % 2 - 1));
        const m = l - c / 2;
        let r_;
        let g_;
        let b_;
        if (h < 60) {
            [r_, g_, b_] = [c, x, 0];
        } else if (h < 120) {
            [r_, g_, b_] = [x, c, 0];
        } else if (h < 180) {
            [r_, g_, b_] = [0, c, x];
        } else if (h < 240) {
            [r_, g_, b_] = [0, x, c];
        } else if (h < 300) {
            [r_, g_, b_] = [x, 0, c];
        } else {
            [r_, g_, b_] = [c, 0, x];
        }
        return [
            Math.round((r_ + m) * 255),
            Math.round((g_ + m) * 255),
            Math.round((b_ + m) * 255),
        ];
    }
    return null;
}
function getDefaultCss() {
    return {
        backgroundColor: null,
        color: null,
        fontWeight: null,
        fontStyle: null,
        textDecorationColor: null,
        textDecorationLine: [],
    };
}
function parseCss(cssString) {
    const css = getDefaultCss();
    const rawEntries = [];
    let inValue = false;
    let currentKey = null;
    let parenthesesDepth = 0;
    let currentPart = "";
    for (let i = 0; i < cssString.length; i++) {
        const c = cssString[i];
        if (c == "(") {
            parenthesesDepth++;
        } else if (parenthesesDepth > 0) {
            if (c == ")") {
                parenthesesDepth--;
            }
        } else if (inValue) {
            if (c == ";") {
                const value = currentPart.trim();
                if (value != "") {
                    rawEntries.push([currentKey, value]);
                }
                currentKey = null;
                currentPart = "";
                inValue = false;
                continue;
            }
        } else if (c == ":") {
            currentKey = currentPart.trim();
            currentPart = "";
            inValue = true;
            continue;
        }
        currentPart += c;
    }
    if (inValue && parenthesesDepth == 0) {
        const value = currentPart.trim();
        if (value != "") {
            rawEntries.push([currentKey, value]);
        }
        currentKey = null;
        currentPart = "";
    }
    for (const [key, value] of rawEntries) {
        if (key == "background-color") {
            if (value != null) {
                css.backgroundColor = value;
            }
        } else if (key == "color") {
            if (value != null) {
                css.color = value;
            }
        } else if (key == "font-weight") {
            if (value == "bold") {
                css.fontWeight = value;
            }
        } else if (key == "font-style") {
            if (["italic", "oblique", "oblique 14deg"].includes(value)) {
                css.fontStyle = "italic";
            }
        } else if (key == "text-decoration-line") {
            css.textDecorationLine = [];
            for (const lineType of value?.split(/\s+/g)) {
                if (["line-through", "overline", "underline"].includes(lineType)) {
                    css.textDecorationLine.push(lineType);
                }
            }
        } else if (key == "text-decoration-color") {
            const color = parseCssColor(value);
            if (color != null) {
                css.textDecorationColor = color;
            }
        } else if (key == "text-decoration") {
            css.textDecorationColor = null;
            css.textDecorationLine = [];
            for (const arg of value?.split(/\s+/g)) {
                const maybeColor2 = parseCssColor(arg);
                if (maybeColor2 != null) {
                    css.textDecorationColor = maybeColor2;
                } else if (["line-through", "overline", "underline"].includes(arg)) {
                    css.textDecorationLine.push(arg);
                }
            }
        }
    }
    return css;
}
function colorEquals(color1, color2) {
    return color1?.[0] == color2?.[0] && color1?.[1] == color2?.[1] &&
        color1?.[2] == color2?.[2];
}
function cssToAnsi(css, prevCss = null) {
    prevCss = prevCss ?? getDefaultCss();
    let ansi = "";
    if (!colorEquals(css.backgroundColor, prevCss.backgroundColor)) {
        if (css.backgroundColor == null) {
            ansi += "\x1B[49m";
        } else if (css.backgroundColor == "black") {
            ansi += `\x1B[40m`;
        } else if (css.backgroundColor == "red") {
            ansi += `\x1B[41m`;
        } else if (css.backgroundColor == "green") {
            ansi += `\x1B[42m`;
        } else if (css.backgroundColor == "yellow") {
            ansi += `\x1B[43m`;
        } else if (css.backgroundColor == "blue") {
            ansi += `\x1B[44m`;
        } else if (css.backgroundColor == "magenta") {
            ansi += `\x1B[45m`;
        } else if (css.backgroundColor == "cyan") {
            ansi += `\x1B[46m`;
        } else if (css.backgroundColor == "white") {
            ansi += `\x1B[47m`;
        } else {
            if (Array.isArray(css.backgroundColor)) {
                const [r, g, b] = css.backgroundColor;
                ansi += `\x1B[48;2;${r};${g};${b}m`;
            } else {
                const parsed = parseCssColor(css.backgroundColor);
                if (parsed !== null) {
                    const [r, g, b] = parsed;
                    ansi += `\x1B[48;2;${r};${g};${b}m`;
                } else {
                    ansi += "\x1B[49m";
                }
            }
        }
    }
    if (!colorEquals(css.color, prevCss.color)) {
        if (css.color == null) {
            ansi += "\x1B[39m";
        } else if (css.color == "black") {
            ansi += `\x1B[30m`;
        } else if (css.color == "red") {
            ansi += `\x1B[31m`;
        } else if (css.color == "green") {
            ansi += `\x1B[32m`;
        } else if (css.color == "yellow") {
            ansi += `\x1B[33m`;
        } else if (css.color == "blue") {
            ansi += `\x1B[34m`;
        } else if (css.color == "magenta") {
            ansi += `\x1B[35m`;
        } else if (css.color == "cyan") {
            ansi += `\x1B[36m`;
        } else if (css.color == "white") {
            ansi += `\x1B[37m`;
        } else {
            if (Array.isArray(css.color)) {
                const [r, g, b] = css.color;
                ansi += `\x1B[38;2;${r};${g};${b}m`;
            } else {
                const parsed = parseCssColor(css.color);
                if (parsed !== null) {
                    const [r, g, b] = parsed;
                    ansi += `\x1B[38;2;${r};${g};${b}m`;
                } else {
                    ansi += "\x1B[39m";
                }
            }
        }
    }
    if (css.fontWeight != prevCss.fontWeight) {
        if (css.fontWeight == "bold") {
            ansi += `\x1B[1m`;
        } else {
            ansi += "\x1B[22m";
        }
    }
    if (css.fontStyle != prevCss.fontStyle) {
        if (css.fontStyle == "italic") {
            ansi += `\x1B[3m`;
        } else {
            ansi += "\x1B[23m";
        }
    }
    if (!colorEquals(css.textDecorationColor, prevCss.textDecorationColor)) {
        if (css.textDecorationColor != null) {
            const [r, g, b] = css.textDecorationColor;
            ansi += `\x1B[58;2;${r};${g};${b}m`;
        } else {
            ansi += "\x1B[59m";
        }
    }
    if (
        css.textDecorationLine.includes("line-through") !=
        prevCss.textDecorationLine.includes("line-through")
    ) {
        if (css.textDecorationLine.includes("line-through")) {
            ansi += "\x1B[9m";
        } else {
            ansi += "\x1B[29m";
        }
    }
    if (
        css.textDecorationLine.includes("overline") !=
        prevCss.textDecorationLine.includes("overline")
    ) {
        if (css.textDecorationLine.includes("overline")) {
            ansi += "\x1B[53m";
        } else {
            ansi += "\x1B[55m";
        }
    }
    if (
        css.textDecorationLine.includes("underline") !=
        prevCss.textDecorationLine.includes("underline")
    ) {
        if (css.textDecorationLine.includes("underline")) {
            ansi += "\x1B[4m";
        } else {
            ansi += "\x1B[24m";
        }
    }
    return ansi;
}
function inspectArgs(args, inspectOptions = {}) {
    circular = void 0;
    const rInspectOptions = { ...DEFAULT_INSPECT_OPTIONS, ...inspectOptions };
    const first = args[0];
    let a = 0;
    let string = "";
    if (typeof first == "string" && args.length > 1) {
        a++;
        let appendedChars = 0;
        let usedStyle = false;
        let prevCss = null;
        for (let i = 0; i < first.length - 1; i++) {
            if (first[i] == "%") {
                const char = first[++i];
                if (a < args.length) {
                    let formattedArg = null;
                    if (char == "s") {
                        formattedArg = String(args[a++]);
                    } else if (["d", "i"].includes(char)) {
                        const value = args[a++];
                        if (typeof value == "bigint") {
                            formattedArg = `${value}n`;
                        } else if (typeof value == "number") {
                            formattedArg = `${Number.parseInt(String(value))}`;
                        } else {
                            formattedArg = "NaN";
                        }
                    } else if (char == "f") {
                        const value = args[a++];
                        if (typeof value == "number") {
                            formattedArg = `${value}`;
                        } else {
                            formattedArg = "NaN";
                        }
                    } else if (["O", "o"].includes(char)) {
                        formattedArg = inspectValue(args[a++], rInspectOptions);
                    } else if (char == "c") {
                        const value = args[a++];
                        if (rInspectOptions.colors) {
                            const css = parseCss(value);
                            formattedArg = cssToAnsi(css, prevCss);
                            if (formattedArg != "") {
                                usedStyle = true;
                                prevCss = css;
                            }
                        } else {
                            formattedArg = "";
                        }
                    }
                    if (formattedArg != null) {
                        string += first.slice(appendedChars, i - 1) + formattedArg;
                        appendedChars = i + 1;
                    }
                }
                if (char == "%") {
                    string += first.slice(appendedChars, i - 1) + "%";
                    appendedChars = i + 1;
                }
            }
        }
        string += first.slice(appendedChars);
        if (usedStyle) {
            string += "\x1B[0m";
        }
    }
    for (; a < args.length; a++) {
        if (a > 0) {
            string += " ";
        }
        if (typeof args[a] == "string") {
            string += args[a];
        } else {
            string += inspectValue(args[a], rInspectOptions);
        }
    }
    if (rInspectOptions.indentLevel > 0) {
        const groupIndent = DEFAULT_INDENT.repeat(rInspectOptions.indentLevel);
        string = groupIndent + string.replaceAll(
            "\n",
            `
${groupIndent}`,
        );
    }
    return string;
}
function inspectError(value, cyan2) {
    const causes = [value];
    let err = value;
    while (err.cause) {
        if (causes.includes(err.cause)) {
            causes.push(handleCircular(err.cause, cyan2));
            break;
        } else {
            causes.push(err.cause);
            err = err.cause;
        }
    }
    const refMap = /* @__PURE__ */ new Map();
    for (const cause of causes) {
        if (circular !== void 0) {
            const index = circular.get(cause);
            if (index !== void 0) {
                refMap.set(cause, cyan2(`<ref *${index}> `));
            }
        }
    }
    causes.shift();
    let finalMessage = refMap.get(value) ?? "";
    if (AggregateError.prototype.isPrototypeOf(value)) {
        const stackLines = value.stack?.split("\n");
        while (true) {
            const line = stackLines?.shift();
            if (/\s+at/.test(line)) {
                stackLines?.unshift(line);
                break;
            } else if (typeof line === "undefined") {
                break;
            }
            finalMessage += line;
            finalMessage += "\n";
        }
        const aggregateMessage = value.errors.map((error) =>
            inspectArgs([error]).replace(/^(?!\s*$)/gm, " ".repeat(4))
        ).join("\n");
        finalMessage += aggregateMessage;
        finalMessage += "\n";
        finalMessage += stackLines?.join("\n");
    } else {
        finalMessage += value.stack;
    }
    finalMessage += causes.map((cause) =>
        "\nCaused by " + (refMap.get(cause) ?? "") + (cause?.stack ?? cause)
    ).join("");
    return finalMessage;
}

function inspectNumberObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return cyan2(
        `[Number: ${Object.is(value.valueOf(), -0) ? "-0" : value.toString()}]`,
    );
}
function inspectBigIntObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return cyan2(`[BigInt: ${value.toString()}n]`);
}
function inspectBooleanObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return cyan2(`[Boolean: ${value.toString()}]`);
}
function inspectStringObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return cyan2(`[String: "${value.toString()}"]`);
}
function inspectSymbolObject(value, inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return cyan2(`[Symbol: ${maybeQuoteSymbol(value.valueOf())}]`);
}
function inspectPromise(inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return `Promise { ${cyan2("[items unknown]")} }`;
}
function inspectRegExp(value, inspectOptions) {
    const red2 = maybeColor(red, inspectOptions);
    return red2(value.toString());
}
function inspectDate(value, inspectOptions) {
    const magenta2 = maybeColor(magenta, inspectOptions);
    return magenta2(
        isInvalidDate(value) ? "Invalid Date" : value.toISOString(),
    );
}
function inspectSet(value, inspectOptions) {
    const options = {
        typeName: "Set",
        displayName: "Set",
        delims: ["{", "}"],
        entryHandler: (entry, inspectOptions2) => {
            const val = entry[1];
            inspectOptions2.indentLevel++;
            const inspectedValue = inspectValueWithQuotes(val, inspectOptions2);
            inspectOptions2.indentLevel--;
            return inspectedValue;
        },
        group: false,
        sort: inspectOptions.sorted,
    };
    return inspectIterable(value, options, inspectOptions);
}
function inspectMap(value, inspectOptions) {
    const options = {
        typeName: "Map",
        displayName: "Map",
        delims: ["{", "}"],
        entryHandler: (entry, inspectOptions2) => {
            const [key, val] = entry;
            inspectOptions2.indentLevel++;
            const inspectedValue = `${inspectValueWithQuotes(key, inspectOptions2)
                } => ${inspectValueWithQuotes(val, inspectOptions2)}`;
            inspectOptions2.indentLevel--;
            return inspectedValue;
        },
        group: false,
        sort: inspectOptions.sorted,
    };
    return inspectIterable(
        value,
        options,
        inspectOptions,
    );
}
function inspectWeakSet(inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return `WeakSet { ${cyan2("[items unknown]")} }`;
}
function inspectWeakMap(inspectOptions) {
    const cyan2 = maybeColor(cyan, inspectOptions);
    return `WeakMap { ${cyan2("[items unknown]")} }`;
}
function inspectTypedArray(typedArrayName, value, inspectOptions) {
    const valueLength = value.length;
    const options = {
        typeName: typedArrayName,
        displayName: `${typedArrayName}(${valueLength})`,
        delims: ["[", "]"],
        entryHandler: (entry, inspectOptions2) => {
            const val = entry[1];
            inspectOptions2.indentLevel++;
            const inspectedValue = inspectValueWithQuotes(val, inspectOptions2);
            inspectOptions2.indentLevel--;
            return inspectedValue;
        },
        group: inspectOptions.compact,
        sort: false,
    };
    return inspectIterable(value, options, inspectOptions);
}
function inspectObject(value, inspectOptions, proxyDetails) {
    if (
        Reflect.has(value, denoCustomInspect) &&
        typeof value[denoCustomInspect] === "function"
    ) {
        return String(value[denoCustomInspect](Inspect, inspectOptions));
    }
    const denoPrivateCustomInspect = Symbol.for("Deno.privateCustomInspect");
    if (
        Reflect.has(value, denoPrivateCustomInspect) &&
        typeof value[denoPrivateCustomInspect] === "function"
    ) {
        return String(
            value[denoPrivateCustomInspect](Inspect, inspectOptions),
        );
    }

    function objectToString(value) {
        return Object.prototype.toString.call(value);
    }

    if (objectToString(value) === "[object Error]") {
        return inspectError(value, maybeColor(cyan, inspectOptions));
    } else if (Array.isArray(value)) {
        return inspectArray(value, inspectOptions);
    } else if (objectToString(value) === "[object Number]") {
        return inspectNumberObject(value, inspectOptions);
    } else if (objectToString(value) === "[object BigInt]") {
        return inspectBigIntObject(value, inspectOptions);
    } else if (objectToString(value) === "[object Boolean]") {
        return inspectBooleanObject(value, inspectOptions);
    } else if (objectToString(value) === "[object String]") {
        return inspectStringObject(value, inspectOptions);
    } else if (objectToString(value) === "[object Symbol]") {
        return inspectSymbolObject(value, inspectOptions);
    } else if (objectToString(value) === "[object Promise]") {
        return inspectPromise(inspectOptions);
    } else if (objectToString(value) === "[object RegExp]") {
        return inspectRegExp(value, inspectOptions);
    } else if (objectToString(value) === "[object Date]") {
        return inspectDate(
            proxyDetails ? proxyDetails[0] : value,
            inspectOptions,
        );
    } else if (objectToString(value) === "[object Set]") {
        return inspectSet(
            proxyDetails ? proxyDetails[0] : value,
            inspectOptions,
        );
    } else if (objectToString(value) === "[object Map]") {
        return inspectMap(
            proxyDetails ? proxyDetails[0] : value,
            inspectOptions,
        );
    } else if (objectToString(value) === "[object WeakSet]") {
        return inspectWeakSet(inspectOptions);
    } else if (objectToString(value) === "[object WeakMap]") {
        return inspectWeakMap(inspectOptions);
    } else if (isTypedArray(value)) {
        return inspectTypedArray(
            Object.getPrototypeOf(value).constructor.name,
            value,
            inspectOptions,
        );
    } else {
        let [insp, refIndex] = inspectRawObject(value, inspectOptions);
        insp = refIndex + insp;
        return insp;
    }
}
function _inspectValue(value, inspectOptions) {
    const green2 = maybeColor(green, inspectOptions);
    const yellow2 = maybeColor(yellow, inspectOptions);
    const gray2 = maybeColor(gray, inspectOptions);
    const cyan2 = maybeColor(cyan, inspectOptions);
    const red2 = maybeColor(red, inspectOptions);
    switch (typeof value) {
        case "string":
            return green2(quoteString(value));
        case "number":
            return yellow2(Object.is(value, -0) ? "-0" : `${value}`);
        case "boolean":
            return yellow2(String(value));
        case "undefined":
            return gray2(String(value));
        case "symbol":
            return green2(maybeQuoteSymbol(value));
        case "bigint":
            return yellow2(`${value}n`);
        case "function":
            if (ctxHas(value)) {
                return handleCircular(value, cyan2);
            }
            return inspectFunction(value, inspectOptions);
        case "object":
            if (value === null) {
                return gray2("null");
            }
            if (ctxHas(value)) {
                return handleCircular(value, cyan2);
            }
            return inspectObject(
                value,
                inspectOptions,
            );
        default:
            return red2("[Not Implemented]");
    }
}

module.exports = Inspect;
