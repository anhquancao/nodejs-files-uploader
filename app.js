const fs = require("fs");
const AWS = require("aws-sdk");
const async = require("async");
// const path = "/Users/caoquan/Downloads/images";
var mmm = require('mmmagic'),
    Magic = mmm.Magic;

// For dev purposes only
AWS.config.update({
    accessKeyId: "xxx",
    secretAccessKey: "xxx",
});

let totalFiles = 0;
let totalUploaded = 0;

const traverseDirRecur = (path, dir = "", cb = null) => {
    const items = fs.readdirSync(path);
    items.forEach(item => {
        let fullPath = path + "/" + item;
        let destPath = dir + item;
        const stats = fs.statSync(fullPath);

        if (stats.isFile() && stats["size"] < 2147483647) {
            // console.log(stats);
            if (cb) {
                cb(destPath);
            }
        }

        if (stats.isDirectory()) {
            traverseDirRecur(fullPath, destPath + "/", cb);
        }
    });
};

const traverseDir = (path, cb = null) => {
    traverseDirRecur(path, "", cb);
};

const dir = "/Users/caoquan/Downloads/uploads";
const promiseCount = [];

const files = [];

const collectFiles = path => {
    const localPath = dir + "/" + path;

    files.push({
        localPath,
        path,
    });
};

function upload(file) {
    const data = fs.readFileSync(file.localPath);

    const base64data = new Buffer(data, "binary");
    const s3 = new AWS.S3();

    const folder = "up/images/";
    const key = folder + file.path;
    return new Promise(resolve => {
        let magic = new Magic(mmm.MAGIC_MIME_TYPE);
        // console.log(file);
        magic.detectFile(file.localPath, function (err, mimeType) {
            if (err) throw err;
            // console.log(result);
            // resolve(file.localPath);
            s3.putObject({
                    Bucket: "zgroup",
                    Key: key,
                    Body: base64data,
                    ContentType: mimeType,
                    ACL: "public-read",
                },
                function (resp) {
                    totalUploaded += 1;
                    console.log(
                        `${totalUploaded}/${totalFiles}: ${Math.round(
                        totalUploaded / totalFiles * 100,
                    )}%`,
                    );
                    resolve(file.localPath);
                });
        });

    });
}

// count file
traverseDir(dir, path => {
    totalFiles += 1;
});

console.log("total files: " + totalFiles);

// upload

traverseDir(dir, path => collectFiles(path));
console.log(files.length);
const uploadAllFiles = async () => {
    for (let i = 0; i < files.length; i++) {
        const localPath = await upload(files[i]);
        fs.unlink(localPath, err => {
            if (err) console.log(err);
            console.log(localPath + " was deleted");
        });
        console.log(localPath + " uploaded");
    }
};
uploadAllFiles();