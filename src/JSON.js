export function showTokens(tokens) {
    return function () {
        return JSON.stringify(tokens, null, 2);
    };
}

export function showAST(program) {
    return function () {
        return JSON.stringify(program, null, 2);
    };
}
