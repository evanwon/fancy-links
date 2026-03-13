const { validate, validateChromeTemplate } = require('browser-extension-workflows/tools/validate-versions');

describe('validate', () => {
  test('matching stable versions pass', () => {
    const manifest = { version: '1.4.5', version_name: '1.4.5' };
    const pkg = { version: '1.4.5' };
    expect(validate(manifest, pkg)).toEqual([]);
  });

  test('mismatched package.json and manifest.json versions fail', () => {
    const manifest = { version: '1.4.5', version_name: '1.4.5' };
    const pkg = { version: '1.4.4' };
    const errors = validate(manifest, pkg);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Version mismatch/);
  });

  test('missing version_name fails', () => {
    const manifest = { version: '1.4.5' };
    const pkg = { version: '1.4.5' };
    const errors = validate(manifest, pkg);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/missing.*version_name/);
  });

  test('valid pre-release passes', () => {
    const manifest = { version: '1.4.5.1', version_name: '1.5.0-rc1' };
    const pkg = { version: '1.4.5.1' };
    expect(validate(manifest, pkg)).toEqual([]);
  });

  test('valid beta pre-release passes', () => {
    const manifest = { version: '1.4.5.2', version_name: '1.5.0-beta2' };
    const pkg = { version: '1.4.5.2' };
    expect(validate(manifest, pkg)).toEqual([]);
  });

  test('valid alpha pre-release passes', () => {
    const manifest = { version: '1.4.5.1', version_name: '1.5.0-alpha1' };
    const pkg = { version: '1.4.5.1' };
    expect(validate(manifest, pkg)).toEqual([]);
  });

  test('pre-release with wrong 4th segment fails', () => {
    const manifest = { version: '1.4.5.2', version_name: '1.5.0-rc1' };
    const pkg = { version: '1.4.5.2' };
    const errors = validate(manifest, pkg);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/4th segment.*does not match/);
  });

  test('pre-release with 3-segment version fails', () => {
    const manifest = { version: '1.4.5', version_name: '1.5.0-rc1' };
    const pkg = { version: '1.4.5' };
    const errors = validate(manifest, pkg);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/requires a 4-segment version/);
  });

  test('stable with version !== version_name fails', () => {
    const manifest = { version: '1.4.5', version_name: '1.4.6' };
    const pkg = { version: '1.4.5' };
    const errors = validate(manifest, pkg);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/must equal version_name/);
  });

  test('stable with non-X.Y.Z version fails', () => {
    const manifest = { version: '1.4.5.0', version_name: '1.4.5.0' };
    const pkg = { version: '1.4.5.0' };
    const errors = validate(manifest, pkg);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/not in X\.Y\.Z format/);
  });

  test('multiple errors reported together', () => {
    const manifest = { version: '1.4.5', version_name: '1.5.0-rc1' };
    const pkg = { version: '1.4.4' };
    const errors = validate(manifest, pkg);
    expect(errors.length).toBe(2);
    expect(errors[0]).toMatch(/Version mismatch/);
    expect(errors[1]).toMatch(/requires a 4-segment version/);
  });

  test('empty version_name fails', () => {
    const manifest = { version: '1.4.5', version_name: '' };
    const pkg = { version: '1.4.5' };
    const errors = validate(manifest, pkg);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/missing.*version_name/);
  });

  test('rc0 suffix number is rejected as stable mismatch', () => {
    const manifest = { version: '1.4.5', version_name: '1.5.0-rc0' };
    const pkg = { version: '1.4.5' };
    const errors = validate(manifest, pkg);
    // rc0 doesn't match the pre-release regex, so it falls through to stable checks
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/must equal version_name/);
  });

  test('pre-release version with non-numeric segments fails', () => {
    const manifest = { version: 'foo.bar.baz.1', version_name: '1.5.0-rc1' };
    const pkg = { version: 'foo.bar.baz.1' };
    const errors = validate(manifest, pkg);
    expect(errors.some(e => /non-numeric segments/.test(e))).toBe(true);
  });
});

describe('validateChromeTemplate', () => {
  test('template with __VERSION__ placeholder passes', () => {
    const chrome = { version: '__VERSION__', version_name: '__VERSION_NAME__' };
    const firefox = { version: '1.4.5', version_name: '1.4.5' };
    expect(validateChromeTemplate(chrome, firefox)).toEqual([]);
  });

  test('built manifest with matching version passes', () => {
    const chrome = { version: '1.4.5.3', version_name: '1.4.6-rc3' };
    const firefox = { version: '1.4.5.3', version_name: '1.4.6-rc3' };
    expect(validateChromeTemplate(chrome, firefox)).toEqual([]);
  });

  test('built manifest with mismatched version fails', () => {
    const chrome = { version: '1.4.5.2', version_name: '1.4.6-rc2' };
    const firefox = { version: '1.4.5.3', version_name: '1.4.6-rc3' };
    const errors = validateChromeTemplate(chrome, firefox);
    expect(errors.length).toBe(2);
    expect(errors[0]).toMatch(/does not match Firefox/);
    expect(errors[1]).toMatch(/does not match Firefox/);
  });

  test('built manifest with mismatched version_name only fails', () => {
    const chrome = { version: '1.4.5', version_name: '1.4.5' };
    const firefox = { version: '1.4.5', version_name: '1.4.6' };
    const errors = validateChromeTemplate(chrome, firefox);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/version_name.*does not match/);
  });
});
