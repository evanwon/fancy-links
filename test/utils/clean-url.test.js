describe('URL Cleaner', () => {
  let cleanUrl;

  beforeEach(() => {
    jest.resetModules();
    const module = require('../../src/utils/clean-url.js');
    cleanUrl = module.cleanUrl;
  });

  test('should remove utm parameters', () => {
    const dirty = 'https://example.com?utm_source=test&utm_medium=email&keep=this';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?keep=this');
  });

  test('should handle malformed URLs gracefully', () => {
    const result = cleanUrl('not-a-valid-url');
    expect(result).toBe('not-a-valid-url');
  });

  test('should remove multiple tracking parameters', () => {
    const dirty = 'https://example.com?fbclid=123&gclid=456&real=param';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?real=param');
  });

  test('should remove all utm variants', () => {
    const dirty = 'https://example.com?utm_source=test&utm_medium=email&utm_campaign=promo&utm_term=keyword&utm_content=ad&keep=this';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?keep=this');
  });

  test('should handle URLs with no parameters', () => {
    const clean = 'https://example.com';
    const result = cleanUrl(clean);
    expect(result).toBe('https://example.com/');
  });

  test('should handle URLs with only tracking parameters', () => {
    const dirty = 'https://example.com?utm_source=test&utm_medium=email';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/');
  });

  test('should preserve URL fragments', () => {
    const dirty = 'https://example.com?utm_source=test#section';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/#section');
  });

  test('should handle URLs with mixed parameter ordering', () => {
    const dirty = 'https://example.com?keep1=value&utm_source=test&keep2=value2&fbclid=123';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?keep1=value&keep2=value2');
  });

  test('should remove common tracking parameters', () => {
    const dirty = 'https://example.com?fbclid=123&gclid=456&mc_eid=789&yclid=abc&ref=source&keep=this';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?keep=this');
  });

  test('should handle URLs with encoded characters', () => {
    const dirty = 'https://example.com?utm_source=test&title=Hello%20World';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com/?title=Hello+World');
  });
});