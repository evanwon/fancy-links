describe('Format Registry', () => {
  let formatRegistry;
  
  beforeEach(() => {
    jest.resetModules();
    formatRegistry = require('../../src/formats/format-registry.js');
  });

  describe('Markdown Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.markdown.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('[Test Title](https://example.com)');
    });

    test('should escape special characters', () => {
      const result = formatRegistry.formatConfig.markdown.format(
        'Title [with] brackets',
        'https://example.com'
      );
      expect(result).toBe('[Title \\[with\\] brackets](https://example.com)');
    });

    test('should truncate long titles', () => {
      const longTitle = 'a'.repeat(600);
      const result = formatRegistry.formatConfig.markdown.format(
        longTitle,
        'https://example.com'
      );
      expect(result.length).toBeLessThan(550);
      expect(result).toContain('...');
    });
  });

  describe('Slack Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.slack.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('<https://example.com|Test Title>');
    });

    test('should escape HTML entities', () => {
      const result = formatRegistry.formatConfig.slack.format(
        'Title & Description',
        'https://example.com'
      );
      expect(result).toBe('<https://example.com|Title & Description>');
    });

    test('should handle URLs with special characters', () => {
      const result = formatRegistry.formatConfig.slack.format(
        'Test Title',
        'https://example.com?param=value&other=test'
      );
      expect(result).toBe('<https://example.com?param=value&other=test|Test Title>');
    });
  });

  describe('HTML Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.html.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('<a href="https://example.com">Test Title</a>');
    });

    test('should escape HTML entities in title', () => {
      const result = formatRegistry.formatConfig.html.format(
        'Title <with> & "quotes"',
        'https://example.com'
      );
      expect(result).toBe('<a href="https://example.com">Title &lt;with&gt; &amp; &quot;quotes&quot;</a>');
    });

    test('should handle URLs with special characters', () => {
      const result = formatRegistry.formatConfig.html.format(
        'Test Title',
        'https://example.com?a=1&b=2'
      );
      expect(result).toBe('<a href="https://example.com?a=1&amp;b=2">Test Title</a>');
    });
  });

  describe('Plain Text Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.plaintext.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('Test Title - https://example.com');
    });

    test('should handle title with special characters', () => {
      const result = formatRegistry.formatConfig.plaintext.format(
        'Title - with dashes & symbols',
        'https://example.com'
      );
      expect(result).toBe('Title - with dashes & symbols - https://example.com');
    });

    test('should truncate long titles', () => {
      const longTitle = 'a'.repeat(600);
      const result = formatRegistry.formatConfig.plaintext.format(
        longTitle,
        'https://example.com'
      );
      expect(result.length).toBeLessThan(550);
      expect(result).toContain('...');
    });
  });

  describe('URL Params Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.urlparams.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('https://example.com?_title=Test Title');
    });

    test('should append to existing query parameters', () => {
      const result = formatRegistry.formatConfig.urlparams.format(
        'Test Title',
        'https://example.com?existing=param'
      );
      expect(result).toBe('https://example.com?existing=param&_title=Test Title');
    });

    test('should encode special characters in title', () => {
      const result = formatRegistry.formatConfig.urlparams.format(
        'Title & Description',
        'https://example.com'
      );
      expect(result).toBe('https://example.com?_title=Title %26 Description');
    });
  });

  describe('RTF Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.rtf.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toContain('{\\rtf1');
      expect(result).toContain('Test Title');
      expect(result).toContain('https://example.com');
      expect(result).toContain('HYPERLINK');
    });

    test('should escape RTF special characters', () => {
      const result = formatRegistry.formatConfig.rtf.format(
        'Title with {braces} and \\backslash',
        'https://example.com'
      );
      expect(result).toContain('Title with \\{braces\\} and \\\\backslash');
    });

    test('should handle unicode characters', () => {
      const result = formatRegistry.formatConfig.rtf.format(
        'Title with émoji 😀',
        'https://example.com'
      );
      expect(result).toContain('{\\rtf1');
      expect(result).toContain('HYPERLINK');
    });
  });
});