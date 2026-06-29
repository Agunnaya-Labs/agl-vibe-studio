// Extension popup script
const STUDIO_URL = 'https://aistudio.agunnayalabs.xyz';

// Menu item handlers
document.getElementById('open-studio').addEventListener('click', () => {
  chrome.tabs.create({ url: STUDIO_URL });
  window.close();
});

document.getElementById('create-contract').addEventListener('click', () => {
  chrome.tabs.create({ url: `${STUDIO_URL}/?tab=ai-builder` });
  window.close();
});

document.getElementById('explore-tokens').addEventListener('click', () => {
  chrome.tabs.create({ url: `${STUDIO_URL}/?tab=explore` });
  window.close();
});

document.getElementById('create-nft').addEventListener('click', () => {
  chrome.tabs.create({ url: `${STUDIO_URL}/?tab=nfts` });
  window.close();
});

document.getElementById('build-dao').addEventListener('click', () => {
  chrome.tabs.create({ url: `${STUDIO_URL}/?tab=daos` });
  window.close();
});

document.getElementById('docs').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://docs.agunnayalabs.xyz' });
  window.close();
});

document.getElementById('settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

// Button handlers
document.getElementById('launch-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: STUDIO_URL });
  window.close();
});

document.getElementById('docs-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://docs.agunnayalabs.xyz' });
  window.close();
});
