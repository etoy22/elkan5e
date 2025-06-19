import { execSync } from 'child_process';
import fs from 'fs';

function cleanVersion(ver) {
  return ver.replace(/[.\s-]+$/g, "");
}

function extractIntPart(versionStr) {
  if (!versionStr) return null;
  const match = versionStr.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function main() {
  try {
    const commitMsg = execSync("git log -1 --pretty=%B").toString().trim();
    const versionRegex = /^([vV])(\d+(\.\d+)+)((\s*-\s*\w+)*)$/;
    const match = commitMsg.match(versionRegex);

    if (!match) {
      console.log(JSON.stringify({
        should_continue: false,
        error: "Invalid commit message: must start with 'v' and have version numbers with optional suffixes separated by spaces and dashes."
      }));
      process.exit(0);
    }

    const prefix = match[1].toLowerCase();  // 'v'
    const versionNumbers = match[2];        // e.g. '1.1.1'
    const suffixesStr = match[4] || "";     // e.g. " -alpha -beta"

    const fullVersion = prefix + versionNumbers;

    // Extract suffixes, clean spaces, lowercase:
    // " -alpha -beta" => ["alpha", "beta"]
    const suffixes = suffixesStr
      .split("-")
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    // Determine flags:
    const isTest = suffixes.includes("test");
    // prerelease if any suffix except test is present
    const prerelease = suffixes.some(s => s !== "test");

    // Load module.json compatibility
    const moduleJson = JSON.parse(fs.readFileSync("module.json", "utf8"));
    const comp = moduleJson.compatibility || {};
    let { minimum, verified, maximum } = comp;

    // Your compatibility logic here (unchanged)...

    const output = {
      version: fullVersion,
      compatibility: { minimum, verified, maximum },
      should_continue: true,
      prerelease,
      test: isTest
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (err) {
    console.error("::error::Script failed: " + (err.message || err));
    process.exit(1);
  }
}

main();
