const browserAPI = (() => {
  const api = typeof browser !== 'undefined' ? browser : chrome;
  
  return {
    tabs: {
      query: (queryInfo) => api.tabs.query(queryInfo),
      sendMessage: (tabId, message) => api.tabs.sendMessage(tabId, message),
      executeScript: (tabId, details) => api.tabs.executeScript(tabId, details)
    },
    
    storage: {
      local: {
        get: (keys) => api.storage.local.get(keys),
        set: (items) => api.storage.local.set(items)
      },
      sync: {
        get: (keys) => api.storage.sync.get(keys),
        set: (items) => api.storage.sync.set(items)
      }
    },
    
    runtime: {
      onMessage: api.runtime.onMessage,
      sendMessage: (message) => api.runtime.sendMessage(message),
      getURL: (path) => api.runtime.getURL(path)
    },
    
    commands: {
      onCommand: api.commands.onCommand
    },
    
    notifications: {
      create: (id, options) => api.notifications.create(id, options),
      clear: (id) => api.notifications.clear(id)
    },
    
    browserAction: {
      setBadgeText: (details) => api.browserAction.setBadgeText(details),
      setBadgeBackgroundColor: (details) => api.browserAction.setBadgeBackgroundColor(details)
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = browserAPI;
}