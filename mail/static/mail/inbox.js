document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox')

  document.querySelector('#compose-form').onsubmit = () => {

    const emailRecipients = document.querySelector('#compose-recipients').value;
    const emailSubject = document.querySelector('#compose-subject').value
    const emailBody = document.querySelector('#compose-body').value

    let status = ""

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: emailRecipients,
        subject: emailSubject,
        body: emailBody
      })
    })
      .then(response => {
        status = response.status
        return response.json()
      })
      .then(result => {
        if (status === 400) {
          document.querySelector('#message').innerHTML = `<div class="alert alert-danger">${result.error}</div>`
        }
        else {
          load_mailbox('sent');
        }
      })
      .catch(err => console.log(err));
    return false;
  }



});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails);

      emails.forEach(email => {
        const element = document.createElement('div')
        element.classList.add('email')

        email.read ? element.classList.add('read')
                   : element.classList.add('unread')

        mailbox == 'inbox' || mailbox == 'archive'
          ? element.innerHTML = `<p>${email.sender}</p> <p>${email.subject}</p> <p>${email.timestamp}</p>`
          : element.innerHTML = `<p>For: ${email.recipients}</p> <p>${email.subject}</p> <p>${email.timestamp}</p>`


        element.addEventListener('click', () => {
          view_email(email.id);
        });

        document.querySelector('#emails-view').append(element)
      });
    })

  function view_email(id) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detail').style.display = 'block';

    fetch(`/emails/${id}`)
      .then(response => response.json())
      .then(email => {
        document.querySelector('#email-sender').innerHTML = `<strong>From: </strong>${email.sender}`
        document.querySelector('#email-recipients').innerHTML = `<strong>To: </strong>${email.recipients}`
        document.querySelector('#email-subject').innerHTML = `<strong>Subject: </strong>${email.subject}`
        document.querySelector('#email-timestamp').innerHTML = `<strong>Timestamp: </strong>${email.timestamp}`
        document.querySelector('#email-body').innerHTML = email.body

        const pArchived = document.querySelector('.isArchived');

        email.archived ? pArchived.innerHTML = 'Unarchive'
                       : pArchived.innerHTML = 'Archive'

        document.querySelector('.archive-btn').addEventListener('click', () => {

          if (email.archived) {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: false
              })
            });
          } else {
            fetch(`/emails/${id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            });
          }
          load_mailbox('inbox');
        })

      })

    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    });




  }

}