window.onload = async () => {
  await openDB();
  await loadSettings();
  await renderContactList();

  document.getElementById('sendBtn').onclick = sendMessage;
  document.getElementById('msgInput').onkeydown = e => { if (e.key==='Enter') sendMessage(); };
  document.getElementById('backToList').onclick = () => { showPage('chatListPage'); renderContactList(); };
  document.getElementById('meetBtn').onclick = openMeet;
  document.getElementById('backFromMeet').onclick = () => showPage('chatPage');
  document.getElementById('settingsBtn').onclick = () => document.getElementById('settingsModal').classList.add('active');
  document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.remove('active');
  document.getElementById('saveSettings').onclick = saveSettings;
};
