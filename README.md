# Ethics Escape Room

Web application and clues for ethics escape room about torture.

- [Blog Article about the Escape Room](https://blog.codingitforward.com/ethics-escape-room-f0c067333a23)
- [Live Website for Decoding Clues](https://vingkan.github.io/ethicsescape/decoder)
- [Fully Digital Version of the Game](https://vingkan.github.io/ethicsescape)

## Physical Room Setup Instructions

Coming soon...

## Developer Instructions

If you want to change the clues and rebuild the website for decoding clues, follow these instructions.

Write clues in markdown in the `/original` directory. Specify the destination files and decoding keys in `encode.js`. Secret clues that require a decoding key should have a filename that starts with the letter `s`. Run this command to encode the clues:

```bash
node encode.js
```

Serve the following directories files on a static website:

- `/files`
- `/decode/index.html`
- `/decode/main.js`

Share the website link (`/decode`) with the players and explain how to unlock digital clues.

## Acknowledgements

Activity designed by:

- Christina Qiu
- Maria Gargiulo
- Vinesh Kannan
- Zhi Keng He
