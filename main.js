/*
 global showdown
 global html_beautify
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
    return decodedMessage
}

function loadFile(fileId, el) {
    return $.get(`./files/${fileId}.md`).then((res) => {
        currentText = res;
        const html = markdownConverter.makeHtml(currentText);
        el.innerHTML = html_beautify(html);
    }).catch((err) => {
        el.innerHTML = '<pre>There\'s nothing there.</pre>';
    });
}

const classMap = {
    h1: 'title is-2',
    h2: 'title is-3',
    h3: 'title is-4',
    h4: 'title is-5',
    h5: 'title is-6'
}
const bindings = Object.keys(classMap).map(key => ({
    type: 'output',
    regex: new RegExp(`<${key}(.*)>`, 'g'),
    replace: `<${key} class="${classMap[key]}" $1>`
}));
let markdownConverter = new showdown.Converter({
    headerLevelStart: 3,
    extensions: [...bindings]
});

let currentText = '';
const comboForm = document.querySelector('#combo-code');
const comboField = document.querySelector('#combo-code [type="text"]');
const comboBtn = document.querySelector('#combo-code [type="button"]');
const fileBodyEl = document.querySelector('#file-body');
comboBtn.addEventListener('click', (e) => {
    const key = comboField.value.replace(/-/g, '').split('').map(d => parseInt(d));
    const decodedText = decode(currentText, key);
    const decodedHTML = markdownConverter.makeHtml(decodedText);
    fileBodyEl.innerHTML = html_beautify(decodedHTML);
});

const clueField = document.querySelector('#clue-code [type="text"]');
const clueBtn = document.querySelector('#clue-code [type="button"]');
clueBtn.addEventListener('click', (e) => {
    const clue = clueField.value.toLowerCase();
    comboForm.classList.add('is-hidden');
    loadFile(clue, fileBodyEl).then(() => {
        const isDecoded = clue.includes("s");
        if (isDecoded) {
            comboForm.classList.remove('is-hidden');
        }
    });
});