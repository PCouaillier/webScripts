const fs = require('fs');
const promisify = require('util').promisify;

const fsAccess = promisify(fs.access);
const fsMkdir = promisify(fs.mkdir);

const newWriteStream = flag => fs.createWriteStream('dist/chan.js', {
    encoding: 'utf8',
    flags: flag ? flag : 'a',
});

const customWriter = (fileName, readerStreamBuilder) => {
    return writeStream => new Promise((resolve, reject) => {
        const readerStream = readerStreamBuilder(writeStream, fileName);
        readerStream.once('end', () => {
            writeStream.write('\n');
        });
        readerStream.once('open', () => {
            readerStream.pipe(writeStream);
        });
        readerStream.once('error', reject);
        writeStream.once('close', resolve);
    });
};

const defaultWriter = fileName => customWriter(fileName, () => fs.createReadStream(fileName));

const writeHeader = defaultWriter('header.txt');
const writeRequireJS = defaultWriter('lib/require.js');

const writeGeneratedCode = customWriter('.tmp/chan.js', (writeStream, fileName) => {
    const reader = fs.createReadStream(fileName);
    reader.prependOnceListener('end', () => {
        writeStream.write('\nrequire([\'chan\']);');
    });
    return reader;
});

const steps = Object.freeze([
    writeHeader,
    writeRequireJS,
    writeGeneratedCode,
]);

const iter = async () => {
    for (let i = 0; i < steps.length; i += 1) {
        let writeStream = newWriteStream(i === 0 ? 'w' : 'a');
        await steps[i](writeStream);
    }
}

const createLibDir = async () => {
    try {
        await fsAccess('dist');
    } catch (err) {
        if (err.errno === -4058) {
            return fsMkdir('dist');
        }
        throw err;
    }
}

createLibDir()
    .then(iter)
    .catch(console.error);
