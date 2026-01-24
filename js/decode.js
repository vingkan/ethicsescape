/**
 * Decoding algorithm for encoded clue files
 * Extracted from decode/main.js
 */

function decode(encodedMessage, key) {
    let blocks = encodedMessage.split(" ");
    let solution = [];
    for (let i = 0; i < blocks.length; i++) {
        const j = i % key.length;
        const d = parseInt(blocks[i]) - key[j];
        const c = String.fromCharCode(d);
        solution.push(c);
    }
    const decodedMessage = solution.join("");
    return decodedMessage;
}
