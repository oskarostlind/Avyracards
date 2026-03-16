"use strict";

const fs = require("fs");
const path = require("path");

const projectPath = path.join(__dirname, "ios", "App", "App.xcodeproj", "project.pbxproj");
const BUILD_FILE_ID = "B7C8D9E0F1A2B3C4D5E6F708";
const FILE_REF_ID = "B7C8D9E0F1A2B3C4D5E6F709";

let content = fs.readFileSync(projectPath, "utf8");

if (content.includes("GoogleService-Info.plist")) {
  console.log("GoogleService-Info.plist already linked in project.pbxproj.");
  process.exit(0);
}

const buildFileEntry = `\t\t${BUILD_FILE_ID} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${FILE_REF_ID} /* GoogleService-Info.plist */; };\n`;
const fileRefEntry = `\t\t${FILE_REF_ID} /* GoogleService-Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = "GoogleService-Info.plist"; sourceTree = "<group>"; };\n`;

content = content.replace(
  /\t\tA084ECDBA7D38E1E42DFC39D \/\* Pods_App\.framework in Frameworks \*\/ = \{isa = PBXBuildFile;[^}]+\};\n(\/\* End PBXBuildFile section \*\/)/,
  `\t\tA084ECDBA7D38E1E42DFC39D /* Pods_App.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = AF277DCFFFF123FFC6DF26C7 /* Pods_App.framework */; };\n${buildFileEntry}$1`
);

content = content.replace(
  /(\t\t50B271D01FEDC1A000F3C39B \/\* public \*\/ = \{isa = PBXFileReference;[^}]+\};\n)(\t\tAF277DCFFFF123FFC6DF26C7)/,
  `$1${fileRefEntry}\t\tAF277DCFFFF123FFC6DF26C7`
);

content = content.replace(
  /(504EC3061FED79650016851F \/\* App \*\/ = \{\s+isa = PBXGroup;\s+children = \(\s+)(50379B222058CBB4000EE86E \/\* capacitor\.config\.json \*\/)/,
  `$1$2,\n\t\t\t\t${FILE_REF_ID} /* GoogleService-Info.plist */`
);

content = content.replace(
  /(50379B232058CBB4000EE86E \/\* capacitor\.config\.json in Resources \*\/,)\n(\s+)(504EC30D1FED79650016851F \/\* Main\.storyboard in Resources \*\/)/,
  `$1\n$2${BUILD_FILE_ID} /* GoogleService-Info.plist in Resources */,\n$2$3`
);

fs.writeFileSync(projectPath, content, "utf8");
console.log("GoogleService-Info.plist linked in project.pbxproj.");
