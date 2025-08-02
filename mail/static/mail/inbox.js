document.addEventListener('DOMContentLoaded', () => {

  // Navigation buttons
  document.querySelector('#inbox').onclick = () => openMailbox('inbox');
  document.querySelector('#sent').onclick = () => openMailbox('sent');
  document.querySelector('#archived').onclick = () => openMailbox('archive');
  document.querySelector('#compose').onclick = composeNewMessage;

  // Submit email
  document.querySelector('#compose-form').onsubmit = handleEmailSend;

  // Default view
  openMailbox('inbox');
});

function composeNewMessage() {
  // Show compose view
  toggleViews('compose');

  // Clear fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function displayEmail(emailId) {
  fetch(`/emails/${emailId}`)
    .then(res => res.json())
    .then(data => {
      console.log(data);

      toggleViews('detail');

      const detailView = document.querySelector('#email-detail-view');
      detailView.innerHTML = `
        <ul class="list-group">
          <li class="list-group-item"><strong>From:</strong> ${data.sender}</li>
          <li class="list-group-item"><strong>To:</strong> ${data.recipients}</li>
          <li class="list-group-item"><strong>Subject:</strong> ${data.subject}</li>
          <li class="list-group-item"><strong>Time:</strong> ${data.timestamp}</li>
          <li class="list-group-item">${data.body}</li>
        </ul>
      `;

      if (!data.read) {
        fetch(`/emails/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
        });
      }

      // Archive/Unarchive button
      const archiveBtn = document.createElement('button');
      archiveBtn.textContent = data.archived ? "Unarchive" : "Archive";
      archiveBtn.className = data.archived ? "btn btn-success" : "btn btn-danger";
      archiveBtn.onclick = () => {
        fetch(`/emails/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: !data.archived })
        }).then(() => openMailbox('archive'));
      };
      detailView.append(archiveBtn);

      // Reply button
      const replyBtn = document.createElement('button');
      replyBtn.textContent = "Reply";
      replyBtn.className = "btn btn-info";
      replyBtn.onclick = () => {
        composeNewMessage();
        document.querySelector('#compose-recipients').value = data.sender;
        const subj = data.subject.startsWith("Re:") ? data.subject : `Re: ${data.subject}`;
        document.querySelector('#compose-subject').value = subj;
        document.querySelector('#compose-body').value = `On ${data.timestamp}, ${data.sender} wrote:\n${data.body}`;
      };
      detailView.append(replyBtn);
    });
}

function openMailbox(folder) {
  toggleViews('mailbox');

  const view = document.querySelector('#emails-view');
  view.innerHTML = `<h3>${folder.charAt(0).toUpperCase() + folder.slice(1)}</h3>`;

  fetch(`/emails/${folder}`)
    .then(res => res.json())
    .then(messages => {
      messages.forEach(msg => {
        const mailCard = document.createElement('div');
        mailCard.className = msg.read ? 'read' : 'unread';
        mailCard.innerHTML = `
          <h6>Sender: ${msg.sender}</h6>
          <h5>Subject: ${msg.subject}</h5>
          <p>${msg.timestamp}</p>
        `;
        mailCard.onclick = () => displayEmail(msg.id);
        view.append(mailCard);
      });
    });
}

function handleEmailSend(e) {
  e.preventDefault();

  const to = document.querySelector('#compose-recipients').value;
  const subjectLine = document.querySelector('#compose-subject').value;
  const messageBody = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: to,
      subject: subjectLine,
      body: messageBody
    })
  })
    .then(res => res.json())
    .then(response => {
      console.log(response);
      openMailbox('sent');
    });
}

// Helper to toggle view visibility
function toggleViews(activeView) {
  document.querySelector('#emails-view').style.display = activeView === 'mailbox' ? 'block' : 'none';
  document.querySelector('#compose-view').style.display = activeView === 'compose' ? 'block' : 'none';
  document.querySelector('#email-detail-view').style.display = activeView === 'detail' ? 'block' : 'none';
}
