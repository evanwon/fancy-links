/**
 * Utility for removing tracking parameters from URLs
 * Cross-browser compatible implementation
 */

// Common tracking parameters to remove
const TRACKING_PARAMS = [
    // Google Analytics
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
    
    // Facebook
    'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
    
    // Microsoft/Bing
    'msclkid', 'mc_cid', 'mc_eid',
    
    // Twitter
    'twclid', 'ref_src', 'ref_url',
    
    // Amazon
    'tag', 'ref', 'ref_', 'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i',
    'pd_rd_wg', 'pd_rd_r', 'pd_rd_w', 'psc', 'ascsubtag',
    
    // YouTube
    'feature', 'kw', 'si',
    
    // Other common tracking
    '_hsenc', '_hsmi', 'vero_id', 'vero_conv', 'yclid',
    'wickedid', 'at_medium', 'at_campaign', 'at_custom1', 'at_custom2', 'at_custom3', 'at_custom4',
    'igshid', 'epik', 'pp', 'cvid', 'form', 'sk'
];

/**
 * Remove tracking parameters from a URL
 * @param {string} url - The URL to clean
 * @returns {string} - The cleaned URL
 */
function cleanUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Remove tracking parameters
        TRACKING_PARAMS.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        
        // Convert back to string
        let cleanedUrl = urlObj.toString();
        
        // Remove trailing ? if no parameters remain
        if (cleanedUrl.endsWith('?')) {
            cleanedUrl = cleanedUrl.slice(0, -1);
        }
        
        return cleanedUrl;
        
    } catch (error) {
        // If URL parsing fails, return original URL
        return url;
    }
}

/**
 * Check if a URL has tracking parameters
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL has tracking parameters
 */
function hasTrackingParams(url) {
    try {
        const urlObj = new URL(url);
        return TRACKING_PARAMS.some(param => urlObj.searchParams.has(param));
    } catch (error) {
        return false;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { cleanUrl, hasTrackingParams, TRACKING_PARAMS };
} else {
    // Browser environment - make available globally
    window.FancyLinkCleanUrl = { cleanUrl, hasTrackingParams, TRACKING_PARAMS };
}