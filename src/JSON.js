export function showTokens(tokens) {
    return function () {
        return JSON.stringify(tokens, null, 2);
    };
}
