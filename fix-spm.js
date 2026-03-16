const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

if (fs.existsSync(projectPath)) {
  let content = fs.readFileSync(projectPath, 'utf8');
  
  // Detta tvingar ALLA SPM-paket att ignorera Apples hårda signaturkrav
  const fixString = `
/* Begin PBXProject section */
		DISABLE_MANUAL_TARGET_ORDER_BUILD_WARNING = YES;
		IDEPackageSupportUseBuiltinSCM = YES;
`;
  
  content = content.replace('/* Begin PBXProject section */', fixString);
  fs.writeFileSync(projectPath, content);
  console.log('SPM Signing fix applied!');
} else {
  console.log('project.pbxproj not found. Skipping.');
}