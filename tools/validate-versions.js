#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'src', 'manifest.json');
const PACKAGE_PATH = path.resolve(__dirname, '..', 'package.json');
const CHROME_TEMPLATE_PATH = path.resolve(__dirname, '..', 'manifests', 'chrome', 'manifest.json');

/**
 * Validate version consistency between manifest.json and package.json.
 * Returns an array of error strings (empty = valid).
 */
function validate(manifest, pkg) {
  const errors = [];

  // Check 1: package.json version === manifest.json version
  if (pkg.version !== manifest.version) {
    errors.push(
      `Version mismatch: package.json has "${pkg.version}" but manifest.json has "${manifest.version}"`
    );
  }

  // Check 2: manifest.json must have version_name
  if (!manifest.version_name) {
    errors.push('manifest.json is missing the "version_name" field');
    return errors; // Can't do further checks without version_name
  }

  const versionName = manifest.version_name;
  const version = manifest.version;

  // Detect pre-release from version_name
  const preReleaseMatch = versionName.match(/^(\d+\.\d+\.\d+)-(rc|beta|alpha)([1-9]\d*)$/);

  if (preReleaseMatch) {
    // Check 3: Pre-release — version must have 4 segments
    const parts = version.split('.');
    if (parts.length !== 4) {
      errors.push(
        `Pre-release version_name "${versionName}" requires a 4-segment version, but got "${version}"`
      );
    } else if (!parts.every(seg => /^\d+$/.test(seg))) {
      errors.push(
        `Pre-release version "${version}" has non-numeric segments`
      );
    } else {
      // 4th segment must match suffix number
      const fourthSegment = parseInt(parts[3], 10);
      const suffixNum = parseInt(preReleaseMatch[3], 10);
      if (fourthSegment !== suffixNum) {
        errors.push(
          `Pre-release version 4th segment (${fourthSegment}) does not match suffix number in "${versionName}" (${suffixNum})`
        );
      }
    }
  } else {
    // Check 4: Stable — version === version_name, both X.Y.Z
    if (version !== versionName) {
      errors.push(
        `Stable release: version ("${version}") must equal version_name ("${versionName}")`
      );
    }
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      errors.push(
        `Stable release: version "${version}" is not in X.Y.Z format`
      );
    }
  }

  return errors;
}

/**
 * Validate Chrome manifest template or built Chrome manifest.
 * In template mode (__VERSION__ placeholder), it's always valid.
 * In built mode, version must match the Firefox manifest.
 * Returns an array of error strings (empty = valid).
 */
function validateChromeTemplate(chromeManifest, firefoxManifest) {
  const errors = [];

  // Template mode: placeholders present — valid as a template
  if (chromeManifest.version === '__VERSION__') {
    return errors;
  }

  // Built mode: versions must match Firefox manifest
  if (chromeManifest.version !== firefoxManifest.version) {
    errors.push(
      `Chrome manifest version "${chromeManifest.version}" does not match Firefox manifest version "${firefoxManifest.version}"`
    );
  }
  if (chromeManifest.version_name !== (firefoxManifest.version_name || firefoxManifest.version)) {
    errors.push(
      `Chrome manifest version_name "${chromeManifest.version_name}" does not match Firefox manifest version_name "${firefoxManifest.version_name || firefoxManifest.version}"`
    );
  }

  return errors;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));

  const errors = validate(manifest, pkg);

  // Validate Chrome template if it exists
  if (fs.existsSync(CHROME_TEMPLATE_PATH)) {
    const chromeManifest = JSON.parse(fs.readFileSync(CHROME_TEMPLATE_PATH, 'utf8'));
    errors.push(...validateChromeTemplate(chromeManifest, manifest));
  }

  if (errors.length === 0) {
    console.log(`Version check passed: ${manifest.version_name || manifest.version}`);
    process.exit(0);
  } else {
    console.error('Version validation failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validate, validateChromeTemplate };
