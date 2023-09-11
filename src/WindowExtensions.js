/**
 * @param {Window} win
 */
export function getComputedStyle(win) {
    /**
     * @param {Element} elt
     */
    return function (elt) {
        return function () {
            return win.getComputedStyle(elt);
        }
    }
}
