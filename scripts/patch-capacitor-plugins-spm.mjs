import fs from "fs";
import path from "path";

const root = process.cwd();
const appleSignInPackage = path.join(
  root,
  "node_modules",
  "@capacitor-community",
  "apple-sign-in",
  "Package.swift"
);

const stripePackage = path.join(
  root,
  "node_modules",
  "@capacitor-community",
  "stripe",
  "Package.swift"
);

function patchAppleSignIn() {
  if (!fs.existsSync(appleSignInPackage)) {
    console.log("[patch-capacitor-spm] apple-sign-in Package.swift not found, skipping");
    return false;
  }

  const content = fs.readFileSync(appleSignInPackage, "utf8");
  const patched = content.replace(
    'capacitor-swift-pm.git", from: "7.0.0"',
    'capacitor-swift-pm.git", from: "8.0.0"'
  );

  if (patched === content) {
    console.log("[patch-capacitor-spm] apple-sign-in already patched or pattern missing");
    return content.includes('from: "8.0.0"');
  }

  fs.writeFileSync(appleSignInPackage, patched);
  console.log("[patch-capacitor-spm] Patched apple-sign-in for capacitor-swift-pm 8.x");
  return true;
}

function logDependencySummary() {
  const readConstraint = (filePath) => {
    if (!fs.existsSync(filePath)) return "missing";
    const match = fs.readFileSync(filePath, "utf8").match(/capacitor-swift-pm\.git", from: "([^"]+)"/);
    return match?.[1] ?? "unknown";
  };

  console.log(
    "[patch-capacitor-spm] SPM constraints:",
    JSON.stringify({
      stripe: readConstraint(stripePackage),
      appleSignIn: readConstraint(appleSignInPackage),
      nativePurchases: readConstraint(
        path.join(root, "node_modules", "@capgo", "native-purchases", "Package.swift")
      ),
    })
  );
}

const patched = patchAppleSignIn();
logDependencySummary();

if (!patched) {
  const appleConstraint = fs.existsSync(appleSignInPackage)
    ? fs.readFileSync(appleSignInPackage, "utf8").match(/from: "([^"]+)"/)?.[1]
    : null;
  if (appleConstraint?.startsWith("7.")) {
    console.error("[patch-capacitor-spm] ERROR: apple-sign-in still requires Capacitor 7 SPM");
    process.exit(1);
  }
}
