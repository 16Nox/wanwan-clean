let currentContact = null;
let settings = { apiBase:'', apiKey:'', model:'', delay:20 };
let activeTimers = {};

async function loadSettings() {
  const s = await dbGetAll('settings');
  s.forEach(item => settings[item.key] = item.value);
  document.getElementById('apiBase').value = settings.apiBase || '';
  document.getElementById('apiKey').value = settings.apiKey || '';
  document.getElementById('modelName').value = settings.model || '';
  document.getElementById('replyDelay').value = settings.delay || 20;
}

async function saveSettings() {
  settings.apiBase = document.getElementById('apiBase').value.trim();
  settings.apiKey = document.getElementById('apiKey').value.trim();
  settings.model = document.getElementById('modelName').value.trim();
  settings.delay = parseInt(document.getElementById('replyDelay').value) || 20;
  await dbPut('settings', {key:'apiBase', value:settings.apiBase});
  await dbPut('settings', {key:'apiKey', value:settings.apiKey});
  await dbPut('settings', {key:'model', value:settings.model});
  await dbPut('settings', {key:'delay', value:settings.delay});
  alert('设置已保存');
  document.getElementById('settingsModal').classList.remove('active');
}

async function renderContactList() {
  const list = document.getElementById('contactList');
  list.innerHTML = '';
  for (const c of CONTACTS) {
    const msgs = await dbQuery('messages', 'contactId', c.id);
    const last = msgs.length ? msgs[msgs.length-1].text : '点击开始聊天';
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
      <div class="contact-avatar">${c.avatar}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-last">${last.slice(0,20)}</div>
      </div>`;
    item.onclick = () => openChat(c);
    list.appendChild(item);
  }
}

async function openChat(contact) {
  currentContact = contact;
  document.getElementById('chatName').textContent = contact.name;
  document.getElementById('meetName').textContent = contact.name;
  document.getElementById('meetAvatar').textContent = contact.avatar;
  showPage('chatPage');
  await renderMessages();
}

async function renderMessages() {
  const box = document.getElementById('messageList');
  box.innerHTML = '';
  const msgs = await dbQuery('messages', 'contactId', currentContact.id);
  for (const m of msgs) {
    appendMsgBubble(m);
  }
  box.scrollTop = box.scrollHeight;
}

function appendMsgBubble(m) {
  const box = document.getElementById('messageList');
  const div = document.createElement('div');
  div.className = `msg ${m.from==='me'?'me':'other'}`;
  div.innerHTML = `<div class="msg-bubble">${m.text}</div>`;
  box.appendChild(div);
}

async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !currentContact) return;
  input.value = '';

  await dbPut('messages', {contactId:currentContact.id, from:'me', text:text, time:Date.now()});
  appendMsgBubble({from:'me', text});
  document.getElementById('messageList').scrollTop = 100000;

  scheduleReply(currentContact);
}

async function callAI(history) {
  if (!settings.apiBase || !settings.apiKey || !settings.model) {
    return '（请先点右上角齿轮填好API设置）';
  }
  const resp = await fetch(settings.apiBase.replace(/\/$/,'') + '/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+settings.apiKey},
    body:JSON.stringify({
      model: settings.model,
      messages: history,
      max_tokens: 32768,
      temperature: 0.8
    })
  });
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

async function scheduleReply(contact) {
  if (activeTimers[contact.id]) clearTimeout(activeTimers[contact.id]);
  const delay = (settings.delay || 20) * 1000;
  activeTimers[contact.id] = setTimeout(async () => {
    const msgs = await dbQuery('messages', 'contactId', contact.id);
    const history = [{role:'system', content: contact.persona}];
    for (const m of msgs.slice(-10)) {
      history.push({role: m.from==='me'?'user':'assistant', content: m.text});
    }
    const reply = await callAI(history);
    await dbPut('messages', {contactId:contact.id, from:'them', text:reply, time:Date.now()});
    if (currentContact && currentContact.id === contact.id) {
      appendMsgBubble({from:'them', text:reply});
      document.getElementById('messageList').scrollTop = 100000;
    }
    renderContactList();
  }, delay);
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
