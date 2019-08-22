const fs = require('fs');

function encode(message, key) {
    let output = [];
    for (let i = 0; i < message.length; i++) {
        const c = message.charCodeAt(i);
        const j = i % key.length;
        const d = c + key[j];
        output.push(d);
    }
    const encodedMessage = output.join(" ");
    return encodedMessage
}

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

// const m = "Situation briefing";
// let k = [3, 1, 2];

// console.log('Original Message:');
// console.log(m);

// console.log('Encoded Message:');
// a = encode(m, k)
// console.log(a);

// k = [2, 1, 2];

// console.log('Decoded Message:');
// b = decode(a, k)
// console.log(b);

// C-ATK: Situation Briefing
// S-QUP: Advisor Assessment (9999) 
// S-PLD: Shue on Torture (1978) -> page 134 (1978)
// S-HYR: Historical Records (5345)
// S-BWE: Pamphlet (212)
// C-APA: APA Article
// S-OGX: Psychological Authorization (401060)


const clues = [
    {
        infile: "original/briefing.md",
        outfile: "files/s-atk.md",
        key: "9999"
    },
    {
        infile: "original/shue.md",
        outfile: "files/s-pld.md",
        key: "1978"
    },
    {
        infile: "original/records.md",
        outfile: "files/s-hyr.md",
        key: "7031"
    },
    {
        infile: "original/steinhoff.md",
        outfile: "files/s-hof.md",
        key: "5345"
    },
    {
        infile: "original/pamphlet.md",
        outfile: "files/s-bwe.md",
        key: "87"
    },
    {
        infile: "original/intervening.md",
        outfile: "files/s-frk.md",
        key: "212"
    },
    {
        infile: "original/truth.md",
        outfile: "files/s-tru.md",
        key: "4121"
    },
]

console.log(`Encoding ${clues.length} clues.\n`);
clues.forEach((clue, i) => {
    console.log(`Encoding clue ${i + 1}/${clues.length}.`);
    const infile = clue["infile"];;
    console.log(`\tReading original file: ${infile}`);
    const content = fs.readFileSync(infile).toString();
    const k = clue["key"].replace(/-/g, '').split('').map(d => parseInt(d));
    console.log(`\tEncoding with key: ${k}`)

    const secret = encode(content, k);
    const outfile = clue["outfile"];
    console.log(`\tWriting encoded file: ${outfile}`);
    fs.writeFileSync(outfile, secret);

    const recovered = fs.readFileSync(outfile).toString();
    const result = decode(recovered, k);
    const flag = result === content ? 'matches' : 'DOES NOT match';
    console.log(`\tDecoded outfile ${flag} original message.\n`);
});
console.log("Done.");








