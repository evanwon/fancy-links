# Pre-Release Mechanism Implementation Plan (Simplified)

## Overview
Implement a pre-release testing mechanism using AMO's unlisted distribution channel combined with GitHub releases. This allows early testing with select users before releasing to all customers via AMO.

## Key Design Decisions
1. **Consistent version format**: Use `1.5.0rc1` format everywhere (no hyphens)
2. **Beta instructions in README**: Add to existing README rather than separate document
3. **Automatic handling**: Workflow automatically detects pre-releases by version suffix

## Implementation Tasks

### Task 1: Modify `.github/workflows/build-release.yml`

Add the following changes to handle pre-releases:

#### 1.1 Move "Extract version" step earlier (after "Validate manifest" step, around line 77)
```yaml
- name: Extract version
  id: get_version
  run: |
    if [[ "${{ github.event_name }}" == "push" ]]; then
      # Extract from tag
      echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
    else
      # Extract from manifest.json for manual builds
      version=$(node -e "console.log(JSON.parse(require('fs').readFileSync('src/manifest.json', 'utf8')).version)")
      echo "version=$version" >> $GITHUB_OUTPUT
    fi
```

#### 1.2 Add Pre-release Detection (immediately after the moved "Extract version" step)
```yaml
- name: Determine release type
  id: release_type
  run: |
    VERSION="${{ steps.get_version.outputs.version }}"
    # Check if version contains pre-release suffix
    if [[ "$VERSION" =~ (rc|beta|pre|alpha)[0-9]*$ ]]; then
      echo "is_prerelease=true" >> $GITHUB_OUTPUT
      echo "Pre-release detected: $VERSION"
    else
      echo "is_prerelease=false" >> $GITHUB_OUTPUT
      echo "Stable release detected: $VERSION"
    fi
```

#### 1.3 Update AMO Submission Logic
Replace the existing "Firefox - Determine AMO submission" step:
```yaml
- name: Firefox - Determine AMO submission
  if: matrix.browser == 'firefox'
  id: amo_config
  run: |
    # Pre-releases never go to AMO listed channel
    if [[ "${{ steps.release_type.outputs.is_prerelease }}" == "true" ]]; then
      echo "submit=false" >> $GITHUB_OUTPUT
      echo "channel=unlisted" >> $GITHUB_OUTPUT
      echo "Pre-release: Will sign via unlisted channel only"
    elif [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
      # Manual trigger - use provided inputs
      echo "submit=${{ github.event.inputs.submit_to_amo }}" >> $GITHUB_OUTPUT
      echo "channel=${{ github.event.inputs.channel }}" >> $GITHUB_OUTPUT
    elif [[ "${{ github.event_name }}" == "push" && "${{ vars.AMO_SUBMISSION_ENABLED }}" == "true" ]]; then
      # Stable release with AMO enabled
      echo "submit=true" >> $GITHUB_OUTPUT
      echo "channel=listed" >> $GITHUB_OUTPUT
    else
      echo "submit=false" >> $GITHUB_OUTPUT
      echo "channel=unlisted" >> $GITHUB_OUTPUT
    fi
```

#### 1.4 Update GitHub Release Creation
In the "Create Release with Asset (Firefox)" step, modify the release creation:
```yaml
# Determine release flags based on type
if [[ "${{ steps.release_type.outputs.is_prerelease }}" == "true" ]]; then
  RELEASE_FLAGS="--prerelease"
  RELEASE_TITLE="Fancy Links v${{ steps.get_version.outputs.version }} (Pre-release)"
else
  RELEASE_FLAGS=""
  RELEASE_TITLE="Fancy Links v${{ steps.get_version.outputs.version }}"
fi

# Create release
if [[ "${{ github.event_name }}" == "push" ]]; then
  gh release create "${{ github.ref_name }}" \
    --title "$RELEASE_TITLE" \
    --notes-file release_notes.md \
    $RELEASE_FLAGS \
    "$xpi_file"
else
  # Manual trigger
  gh release create "v${{ steps.get_version.outputs.version }}-manual-$(date +%Y%m%d%H%M%S)" \
    --title "$RELEASE_TITLE (Manual Build)" \
    --notes-file release_notes.md \
    --prerelease \
    "$xpi_file"
fi
```

#### 1.5 Update Release Notes Generation
Add pre-release notice to release notes when applicable (insert after the signing status section, around line 304):
```yaml
# After the existing installation instructions based on signing status...

# Add pre-release notice if applicable
if [ "${{ steps.release_type.outputs.is_prerelease }}" == "true" ]; then
  cat >> release_notes.md << 'EOF'

---

**⚠️ Pre-release Version**

This is a pre-release version for testing new features.
- May contain bugs or incomplete features
- Will auto-update to stable version when released
- Please report issues at https://github.com/evanwon/fancy-links/issues

EOF
fi

# Then continue with "What's New" section...
```

### Task 2: Update README.md

Add a new section for pre-release/beta testing in the Installation section:

```markdown
## Installation

### Stable Version
Install the latest stable version from the [Firefox Add-ons store](https://addons.mozilla.org/firefox/addon/fancy-links/).

### Pre-release/Beta Testing
Want to test new features before they're released? You can install pre-release versions:

1. Visit our [Releases page](https://github.com/evanwon/fancy-links/releases)
2. Look for versions marked as "Pre-release" (e.g., v1.5.0rc1)
3. Download the `.xpi` file from the pre-release
4. Open Firefox and drag the downloaded file into the browser window
5. Click "Add" when prompted to install

**Note:** Pre-release versions:
- Are signed by Mozilla and safe to install
- Will automatically update to the stable version when it's released
- May contain experimental features or minor bugs
- Your feedback is valuable! Please [report any issues](https://github.com/evanwon/fancy-links/issues)
```

### Task 3: Update CLAUDE.md

Add pre-release workflow documentation to the existing workflow section:

```markdown
## Version Management and Releases

### Pre-release Versions
For testing new features before public release:

1. **Version format**: Use suffixes like `rc1`, `beta1`, `alpha1`
   - Example: `1.5.0rc1` in manifest.json
   - Git tag: `v1.5.0rc1`

2. **Create pre-release**:
   ```bash
   # Update manifest.json version to X.Y.Zrc1
   # Commit changes
   git commit -am "Prepare v1.5.0rc1 pre-release"
   git tag v1.5.0rc1
   git push origin v1.5.0rc1
   ```

3. **Pre-release behavior**:
   - Automatically signed via AMO unlisted channel
   - Creates GitHub pre-release
   - NOT submitted to AMO public listing
   - Distributed via GitHub releases page

### Stable Releases
Follow existing process - same as before:
- Version format: `1.5.0`
- Git tag: `v1.5.0`
- Submitted to AMO (if enabled)
```

## Testing the Implementation

### Test Pre-release Flow
1. Create a test branch
2. Update `src/manifest.json` version to `1.5.1rc1`
3. Commit: `git commit -am "Test pre-release v1.5.1rc1"`
4. Tag: `git tag v1.5.1rc1`
5. Push: `git push origin v1.5.1rc1`
6. Verify:
   - [ ] GitHub Actions workflow runs
   - [ ] Creates signed XPI via unlisted channel
   - [ ] Creates GitHub pre-release (not regular release)
   - [ ] Does NOT submit to AMO listed channel
   - [ ] Release notes include pre-release warning

### Test Stable Release Flow
1. Update `src/manifest.json` version to `1.5.1`
2. Commit: `git commit -am "Release v1.5.1"`
3. Tag: `git tag v1.5.1`
4. Push: `git push origin v1.5.1`
5. Verify:
   - [ ] GitHub Actions workflow runs
   - [ ] Submits to AMO (if enabled)
   - [ ] Creates regular GitHub release
   - [ ] No pre-release warnings in release notes

## Version Naming Conventions

### Supported Pre-release Suffixes
- `rc[0-9]+` - Release candidates (e.g., `1.5.0rc1`, `1.5.0rc2`)
- `beta[0-9]+` - Beta versions (e.g., `1.5.0beta1`)
- `alpha[0-9]+` - Alpha versions (e.g., `1.5.0alpha1`)
- `pre[0-9]+` - Pre-release versions (e.g., `1.5.0pre1`)

### Examples
- Pre-release: `v1.5.0rc1` → Unlisted signing only
- Stable: `v1.5.0` → Full AMO submission

## Implementation Checklist

- [ ] Modify `.github/workflows/build-release.yml` with pre-release detection
- [ ] Update README.md with beta testing instructions
- [ ] Update CLAUDE.md with pre-release workflow
- [ ] Test pre-release flow with rc version
- [ ] Test stable release flow still works
- [ ] Verify early testers can install pre-releases
- [ ] Document process for team members

## Benefits of This Approach

1. **Simple and consistent**: One version format everywhere
2. **Automatic**: Workflow detects pre-releases by version suffix
3. **Safe**: Pre-releases never accidentally go to all users
4. **Official**: Signed by Mozilla, works in standard Firefox
5. **Seamless updates**: Beta testers auto-update to stable
6. **Low maintenance**: No separate infrastructure needed

## Notes for Future Claude Sessions

When implementing this plan:
1. Start by modifying the workflow file - it's the core change
2. Test with a harmless version bump (e.g., 1.4.1rc1)
3. The workflow already has most infrastructure needed (unlisted signing)
4. Key is the conditional logic based on version suffix detection
5. Preserve all existing functionality for stable releases