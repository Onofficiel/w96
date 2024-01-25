import YAML from "yaml";
import AdmZip from "adm-zip";

import Path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = Path.dirname(fileURLToPath(import.meta.url));
const rootPath = Path.join(__dirname, "..");

// Recursive function to add files and subdirectories to the zip archive
function addFilesToZip(zip, basePath, relativePath) {
    const fullPath = Path.join(basePath, relativePath);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
        const subFiles = fs.readdirSync(fullPath);
        subFiles.forEach(subFile => {
            addFilesToZip(zip, basePath, Path.join(relativePath, subFile));
        });
    } else {
        const fileContent = fs.readFileSync(fullPath);
        zip.addFile(relativePath, fileContent);
    }
}

function toNumberString(num) {
    if (Number.isInteger(num)) {
        return num + ".0";
    } else {
        return num.toString();
    }
}

console.log(
    [
       "  ___            __  __ _    _     _ ",
       " / _ \\ _ _  ___ / _|/ _(_)__(_)___| |",
       "| (_) | ' \\/ _ \\  _|  _| / _| / -_) |",
       " \\___/|_||_\\___/_| |_| |_\\__|_\\___|_|",
       " _ __  __ _ __| |____ _ __ _ ___ _ _ ",
       "| '_ \\/ _` / _| / / _` / _` / -_) '_|",
       "| .__/\\__,_\\__|_\\_\\__,_\\__, \\___|_|  ",
       "|_|                    |___/         ",
       "",
    ].join("\n")
)

const pkgsPath = `${rootPath}/packages`;
const distPath = `${rootPath}/dist`;

// Create the "./dist" folder if it doesn't exist
if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
}

// Create the "./dist/dist" folder if it doesn't exist
if (!fs.existsSync(distPath + "/dist")) {
    fs.mkdirSync(distPath + "/dist");
}

const packagesJson = [];

// Iterate over all packages into the "./packages" folder.
const pkgsRead = fs.readdirSync(pkgsPath);

console.log(`Starting to package ${pkgsRead.length} packages...`);

for (let i = 0; i < pkgsRead.length; i++) {
    const path = pkgsRead[i];
    console.log(`[${i+1}/${pkgsRead.length}] Packaging "${path}"...`);

    // Full path
    const fullPath = `${pkgsPath}/${path}`;

    // Set the project yaml file path
    const yamlPath = `${fullPath}/project.yml`;

    // Check if the package has a "project.yml" file
    if (!fs.existsSync(yamlPath)) {
        console.error(`Package "${path}" does not have a "project.yml" file!`);
        continue;
    }

    // Parse the "package.yaml" file of the package.
    const manifest = YAML.parse(fs.readFileSync(yamlPath).toString());

    // package props
    const pName = manifest.package?.name || manifest.outputs.bin.artifactName;
    const pVersion = manifest.outputs.bin.spec.version;

    // Create the folder for the package in the "./dist" folder.
    const pkgPath = `${distPath}/dist/${pName}`;
    if (!fs.existsSync(pkgPath)) fs.mkdirSync(pkgPath);

    // Add the package to the "Packages.json" file
    packagesJson.push({
        name: pName,
        version: pVersion,
        friendlyName: manifest.outputs.bin.spec.friendlyName,
        description: manifest.outputs.bin.spec.description,
        author: manifest.outputs.bin.spec.author,
        category: manifest.package.category,

        feature_requirements: manifest.package.featureRequirements,
        depends: manifest.package.depends,

        min_os_version: manifest.package.min_os_version,
        max_os_version: manifest.package.max_os_version,

        iconFiles: {
            "16x16": `$REPO_PATH$/dist/${pName}/icon16.png`,
            "32x32": `$REPO_PATH$/dist/${pName}/icon32.png`
        },

        packageRoot: `$REPO_PATH$/dist/${pName}`
    });

    // Add the package icon to the package folder
    fs.copyFileSync(Path.join(fullPath, manifest.package.icon16), `${pkgPath}/icon16.png`);
    fs.copyFileSync(Path.join(fullPath, manifest.package.icon32), `${pkgPath}/icon32.png`);

    // Zip the package "./content" folder
    const contentPath = `${fullPath}/content`;
    const zip = new AdmZip();

    // Use the recursive function to add files and subdirectories to the zip archive
    addFilesToZip(zip, contentPath, '');

    // Generate the zip file
    const zipData = zip.toBuffer();
    
    // Save the zip file to the package folder
    fs.writeFileSync(`${pkgPath}/content@${toNumberString(pVersion)}.zip`, zipData);
}

console.log("Done packaging!");
console.log("Writing the Packages.json file...");

// Write the "Packages.json" file
fs.writeFileSync(`${distPath}/Packages.json`, JSON.stringify(packagesJson, null, 4));

console.log("Done!");
