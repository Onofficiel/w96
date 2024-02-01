const Table = await include("./TableLib.js");
const inspect = await include("./inspect.js");

function isIterable(data) {
    return typeof data !== 'string' && typeof data[Symbol.iterator] === 'function';
}

function getTableStr(data) {
    // If data is an array
    if (Array.isArray(data) || data instanceof Set) {
        // If data is an array and has iterable elements
        if (data.some(isIterable)) {
            // Get the array with the max length
            const length = Math.max(...data.map(item => Array.isArray(item) ? item.length : 1));

            const hasNonIterable = data.some(item => !isIterable(item));
            const header = ["(idx)", ...Array.from({ length }, (_, i) => i), ...(hasNonIterable ? ["Values"] : [])];

            const content = [
                header,
                "separator",
                ...data.map((v, i) => {
                    if (isIterable(v)) {
                        return [i, ...v.map(i => JSON.stringify(i)).concat(new Array(length - v.length).fill(undefined)), ...(hasNonIterable ? [""] : [])];
                    } else {
                        return [i, ...Array(length).fill(""), JSON.stringify(v)];
                    }
                })
            ]

            return new Table({ content }).toString();
        } else {
            const content = [
                ["(idx)", "Values"],
                "separator",
                ...[...data].map((v, i) => [i, JSON.stringify(v)]),
            ];

            return new Table({ content }).toString();
        }
    }

    // If data is an object
    if (typeof data === "object") {
        // If data is an object and has iterable values
        if (Object.values(data).some(isIterable)) {
            // Get the array with the max length
            const length = Math.max(...Object.values(data).map(item => Array.isArray(item) ? item.length : 1));

            const hasNonIterable = Object.values(data).some(item => !isIterable(item));
            const header = ["(idx)", ...Array.from({ length }, (_, i) => i), ...(hasNonIterable ? ["Values"] : [])];

            const content = [
                header,
                "separator",
                ...Object.entries(data).map(([k, v]) => {
                    if (isIterable(v)) {
                        return [k, ...v.map(i => JSON.stringify(i)).concat(new Array(length - v.length).fill(undefined)), ...(hasNonIterable ? [""] : [])];
                    } else {
                        return [k, ...Array(length).fill(""), JSON.stringify(v)];
                    }
                })
            ];

            return new Table({ content }).toString();
        } else {
            const content = [
                ["(idx)", "Values"],
                "separator",
                ...Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]),
            ];

            return new Table({ content }).toString();
        }
    }
    // If data is a Map
    if (isIterable(data)) {
        const content = [
            ["(iter idx)", "Key", "Values"],
            "separator",
            ...[...data].map(([k, v]) => [k, JSON.stringify(k), JSON.stringify(v)]),
        ];

        return new Table({ content }).toString();
    }
}

module.exports = getTableStr;