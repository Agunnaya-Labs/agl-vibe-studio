// Agunnaya Labs Studio Chrome Extension - Background Service Worker

const STUDIO_URL = 'https://aistudio.agunnayalabs.xyz';
const ICON = {
  16: '/images/brand/agunnaya-logo.png',
  48: '/images/brand/agunnaya-logo.png',
  128: '/images/brand/agunnaya-logo.png'
};

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on install
    chrome.tabs.create({ url: `${STUDIO_URL}?ref=chrome_extension` });
    
    // Set initial badge
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#0052FF' });
    
    console.log('Agunnaya Labs Studio extension installed successfully');
  } else if (details.reason === 'update') {
    console.log('Agunnaya Labs Studio extension updated');
  }
});

// Command handler for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'open-studio':
      chrome.tabs.create({ url: STUDIO_URL });
      break;
    case 'create-contract':
      chrome.tabs.create({ url: `${STUDIO_URL}/?tab=ai-builder` });
      break;
    case 'explore-tokens':
      chrome.tabs.create({ url: `${STUDIO_URL}/?tab=explore` });
      break;
    default:
      console.log('Unknown command:', command);
  }
});

// Context menu items
chrome.contextMenus.create({
  id: 'open-studio',
  title: 'Open Agunnaya Labs Studio',
  contexts: ['page', 'link', 'selection'],
  icons: ICON
});

chrome.contextMenus.create({
  id: 'create-contract',
  title: 'Create Smart Contract',
  parentId: 'open-studio',
  contexts: ['page']
});

chrome.contextMenus.create({
  id: 'create-token',
  title: 'Launch Token',
  parentId: 'open-studio',
  contexts: ['page']
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'open-studio':
      chrome.tabs.create({ url: STUDIO_URL });
      break;
    case 'create-contract':
      chrome.tabs.create({ url: `${STUDIO_URL}/?tab=ai-builder` });
      break;
    case 'create-token':
      chrome.tabs.create({ url: `${STUDIO_URL}/?tab=ai-builder&preset=token` });
      break;
  }
});

// Message handler for communication with popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkInstallation') {
    sendResponse({ installed: true, version: chrome.runtime.getManifest().version });
  } else if (request.action === 'trackEvent') {
    console.log('Event tracked:', request.event, request.data);
    sendResponse({ success: true });
  } else if (request.action === 'openStudio') {
    const tab = request.tab || '';
    const url = tab ? `${STUDIO_URL}/?tab=${tab}` : STUDIO_URL;
    chrome.tabs.create({ url });
    sendResponse({ success: true });
  }
});

// Tab activation listener for monitoring
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('aistudio.agunnayalabs.xyz')) {
      // Update badge when studio is open
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    }
  });
});

// Update badge on tab change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (tab.url && tab.url.includes('aistudio.agunnayalabs.xyz')) {
      chrome.action.setBadgeText({ tabId, text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});

// Storage sync for extension settings
chrome.storage.local.get(['settings'], (result) => {
  if (!result.settings) {
    chrome.storage.local.set({
      settings: {
        autoOpen: false,
        notifications: true,
        theme: 'dark'
      }
    });
  }
});

// Periodic update check
chrome.alarms.create('updateCheck', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateCheck') {
    console.log('Checking for extension updates...');
    chrome.runtime.requestUpdateCheck((status) => {
      if (status === 'update_available') {
        console.log('Update available, will install on restart');
      }
    });
  }
});

console.log('Agunnaya Labs Studio extension background service worker loaded');
