const fs = require('fs');
const readline = require('readline');

const fileExtension = '.las';
const regexKey = new RegExp(/UWI *\.|API *\.|LIC *\./gm);
const newFileNames = new Map();

async function parseFile(fileName) {
    try {
        const fileStream = fs.createReadStream(fileName);

        const rl = readline.createInterface({
            input: fileStream,
        });

        for await (const line of rl) {
            const matchResult = line.match(regexKey);
            if (matchResult?.length > -1) {
                const newFileSuffix = line.match(/\d/g)?.join('');
                if (newFileSuffix) {
                    console.log('Found', matchResult[0], 'match for file', fileName);
                    const newFileName = newFileSuffix + fileExtension;
                    if (fileName === newFileName) return;
                    console.log('New filename for', fileName, newFileName);
                    newFileNames.set(fileName, newFileName);
                    rl.close();
                }
            }
        }
        rl.close();
    } catch (e) {
        console.log('parseFile Error', fileName, e);
    }
}

async function getNewFileNames() {
    const filesToParse = fs.readdirSync('.').filter(x => x.endsWith(fileExtension));
    console.log('Parsing a total of', filesToParse?.length, 'files');
    console.log();

    if (!filesToParse?.length) return;

    await Promise.all(filesToParse.map(parseFile));
    console.log();
    console.log('fileNames to change', newFileNames?.size, newFileNames);
    console.log();
    const fileNamesNotFound = filesToParse.filter(x => !newFileNames.get(x));
    console.log('fileNames not changing', fileNamesNotFound?.length, fileNamesNotFound);
    console.log();
    return newFileNames;
}

getNewFileNames().then(newFileNames => newFileNames.forEach((v, k) => {
    if (fs.existsSync(v)) return console.log('ERROR, file name already exists for', k, '=>', v);
    fs.renameSync(k, v);
}));
