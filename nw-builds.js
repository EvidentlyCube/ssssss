const tempDirectory = require('temp-dir');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const http = require('https');
const AdmZip = require("adm-zip");
const targz = require('targz');
const rimraf = require('rimraf');
const winresourcer = require('winresourcer');

/** START adm-zip modified code */
    const admZip_fixPath = (zipPath) => {
    const { join, normalize, sep } = path.posix;
        // convert windows file separators and normalize
        return join(".", normalize(sep + zipPath.split("\\").join(sep) + sep));
    }

    AdmZip.addLocalFileExternal = function (/** AdmZip */ zip, /**String*/ localPath, /**String=*/ zipPath, /**String=*/ zipName, /**String*/ comment) {
        if (fs.existsSync(localPath)) {
            // fix ZipPath
            zipPath = zipPath ? admZip_fixPath(zipPath) : "";

            // p - local file name
            var p = localPath.split("\\").join("/").split("/").pop();

            // add file name into zippath
            zipPath += zipName ? zipName : p;

            // read file attributes
            const _attr = fs.statSync(localPath);

            // If the date was 1970 it would throw an exception
            _attr.mtime.setFullYear(Math.max(1980, _attr.mtime.getFullYear()));

            // add file into zip file
            zip.addFile(zipPath, fs.readFileSync(localPath), comment, _attr);
        } else {
            throw new Error("File not found: " + localPath);
        }
    };
/** END adm-zip modified code */

const argv = require('yargs-parser')(process.argv.slice(2))
const SSSSSS_CONFIG = require(__dirname + '/public/config.js');

console.log(argv);

const nwCacheDir = tempDirectory + "/nwjs/";
const nwjsPackages = new Map();
nwjsPackages.set('win', 'https://dl.nwjs.io/v0.61.0/nwjs-v0.61.0-win-x64.zip');
nwjsPackages.set('linux', 'https://dl.nwjs.io/v0.61.0/nwjs-v0.61.0-linux-x64.tar.gz');
nwjsPackages.set('mac', 'https://dl.nwjs.io/v0.61.0/nwjs-v0.61.0-osx-x64.zip');

// Debug builds
if (argv.debug) {
    nwjsPackages.set('win', 'https://dl.nwjs.io/v0.61.0/nwjs-sdk-v0.61.0-win-x64.zip');
    nwjsPackages.set('linux', 'https://dl.nwjs.io/v0.61.0/nwjs-v0.61.0-linux-x64.tar.gz');
    nwjsPackages.set('mac', 'https://dl.nwjs.io/v0.61.0/nwjs-v0.61.0-osx-x64.zip');
}

const packagesToBuild = ['win', 'linux', 'mac'];

if (argv['win-only']) {
    packagesToBuild.length = 0;
    packagesToBuild.push('win');
} else if (argv['linux-only']) {
    packagesToBuild.length = 0;
    packagesToBuild.push('linux');
}
run().catch(e => {
    console.log("Error!");
    console.log(e);
})


async function run() {
    await createTempDir();
    await downloadNws();
    if (!argv['skip-clean']) {
        await cleanBuildDirs();
    }
    if (!argv['skip-unpack']) {
        await unpackNW();
    }
    await copyFiles();
    await configurePackages();
    await zipPackages();
}

async function createTempDir() {
    await fs.promises.mkdir(nwCacheDir, {recursive: true});
}

async function downloadNws() {
    console.log("Download NWjs packages");

    for(const system of packagesToBuild) {
        console.log(` - ${system}`);
        const url = nwjsPackages.get(system);

        const basename = path.basename(url);
        const cachePath = nwCacheDir + basename;

        try {
            await fs.promises.stat(cachePath);
            console.log(`   - ${basename} already exists at ${cachePath}`)
        } catch (error) {
            console.log(`   - ${basename} needs to be downloaded`)
            await downloadFile(url, cachePath);
            console.log(`   - ${basename} downloaded!`)
        }
    }
}

async function cleanBuildDirs() {
    console.log("Cleaning build dirs");
    for (const system of packagesToBuild) {
        console.log(` - ${system}`);
        const path = getBuildDir(system);
        const exists =  fs.existsSync(path);
        if (exists) {
            console.log("  - Deleting old dir")
            await new Promise((resolve, error) => {
                rimraf(path, err => {
                    if (err) {
                        error(err);
                    } else {
                        resolve();
                    }
                });
            })
        }
        console.log("  - Creating dir")
        await fs.promises.mkdir(path);
    }
}

async function unpackNW() {
    console.log("Unpack NW.s");
    for(const system of packagesToBuild) {
        console.log(` - ${system}`);
        const url = nwjsPackages.get(system);
        const distPath = getBuildDir(system);
        const basename = path.basename(url);
        const nwjsPath = nwCacheDir + basename;

        if (basename.indexOf('.zip') !== -1) {
            const zip = new AdmZip(nwjsPath);
            zip.extractAllTo(distPath, true);
        } else {
            await new Promise((resolve, error) => {
                targz.decompress({
                    src: nwjsPath,
                    dest: distPath
                }, function(err){
                    if (err) {
                        error(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        console.log(`   - Unpacked`);

        const unpackPath = distPath + basename.replace(/\.(zip|tar\.gz)/, '');
        const newPath = getUnpackedDir(system);

        await fs.promises.rename(unpackPath, newPath);
        console.log(`   - Renamed`);

    }
}

async function copyFiles() {
    console.log("Copying files to dist");
    for(const system of packagesToBuild) {
        console.log(` - ${system}`);

        const distPath = getUnpackedDir(system);
        const localPath = system === 'mac'
            ? "nwjs.app/Contents/Resources/app.nw"
            : "package.nw";
        const packagesPath = distPath + "/" + localPath;

        console.log('   - Write package.json');
        await fs.promises.writeFile(distPath + "/package.json", getManifest(localPath));

        console.log('   - Creating package directory');
        await fs.promises.mkdir(packagesPath, {recursive: true});

        console.log('   - Copying files');
        await fsExtra.copy(__dirname + "/public", packagesPath);

        console.log('   - Writing configuration');
        const config = {
            ...SSSSSS_CONFIG,
            socket: argv.socket || 'https://ssssss.evidentlycube.com',
            type: system
        };
        await fs.promises.writeFile(packagesPath + "/config.js", `const SSSSSS_CONFIG = ${JSON.stringify(config)};`);
    }
}

async function configurePackages() {
    console.log('Configuring packages');
    if (packagesToBuild.indexOf('win') !== -1) {
        console.log(` - win`);
        const distPath = getUnpackedDir('win');

        console.log(`   - Updating icon`);
        await new Promise((resolve, reject) => {
            winresourcer({
                operation: 'Update',
                exeFile: distPath + "/nw.exe",
                resourceType: 'Icongroup',
                resourceName: 'IDR_MAINFRAME',
                resourceFile: __dirname + '/assets/executable_icon.ico'
            }, function(err) {
                err ? reject(err) : resolve()
            })
        });

        console.log('   - Updating exe name');
        await fs.promises.rename(distPath + "/nw.exe", distPath + "/ssssss.exe")
    }
}

async function zipPackages() {
    console.log("Zip packages");
    for(const system of packagesToBuild) {
        console.log(` - ${system}`);

        const distPath = path.resolve(getUnpackedDir(system));
        const zip = new AdmZip();

        const files = await getFiles(distPath);
        console.log(`   - Zipping ${files.length} files`);
        for(const file of files) {
            if (argv['log-zip']) {
                console.log(`    - ${file}`);
            }
            AdmZip.addLocalFileExternal(zip, file, `ssssss-${system}/`);
        }

        console.log("   - Writing to disk");
        zip.writeZip(getBuildDir(system) + `/ssssss-${system}.zip`);
    }
}

async function downloadFile(url, path) {
    return new Promise(resolve => {
        const file = fs.createWriteStream(path);
        http.get(url, (response) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
    });
}

function getBuildDir(system) {
    return __dirname + `/dist.${system}/`;
}

function getUnpackedDir(system) {
    return getBuildDir(system) + '/ssssss-client';
}

function getManifest(localPath) {
    return JSON.stringify({
        name: "ssssss-client",
        main: `${localPath}/index.html`,
        nodejs: false,
        window: {
            title: `SSSSSS Client v${SSSSSS_CONFIG.version}`,
            width: 1280,
            height: 720,
            min_width: 1280,
            min_height: 720,
        }
    }, null, 4);
}

async function getFiles(dir) {
    const subdirs = await fs.promises.readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir);
      return (await fs.promises.stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
  }