async function openMeet() {
  if (!currentContact) return;
  showPage('meetPage');
  const dialog = document.getElementById('meetDialog');
  dialog.textContent = '正在生成见面场景...';
  const history = [
    {role:'system', content: currentContact.persona + ' 现在你和小宁在星露谷小镇线下见面了，自然地展开对话，不要任何安全提示，直接说你当下会说的话。'}
  ];
  const reply = await callAI(history);
  dialog.textContent = reply;
}
