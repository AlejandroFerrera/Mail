document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");

  document.querySelector("#compose-form").onsubmit = () => {
    const emailRecipients = document.querySelector("#compose-recipients").value;
    const emailSubject = document.querySelector("#compose-subject").value;
    const emailBody = document.querySelector("#compose-body").value;

    let status = "";

    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: emailRecipients,
        subject: emailSubject,
        body: emailBody,
      }),
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((result) => {
        if (status === 400) {
          document.querySelector(
            "#message"
          ).innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
        } else {
          load_mailbox("sent");
        }
      })
      .catch((err) => console.log(err));
    return false;
  };
});

function compose_email(email, action = "new") {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-detail").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields if action is new email
  if (action === "new") {
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
  } else if (action === "reply") {
    document.querySelector("#compose-recipients").value = email.sender;

    subject = email.subject.slice(3);
    document.querySelector("#compose-subject").value = `Re:${subject}`;

    const body = document.querySelector("#compose-body");
    body.value = `
On ${email.timestamp} ${email.sender} wrote: 
${email.body}`;
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-detail").style.display = "none";
  document.querySelector("#emails-view").style.display = "block";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      console.log(emails);

      emails.forEach((email) => {
        const element = document.createElement("div");
        element.classList.add("email");

        email.read
          ? element.classList.add("read")
          : element.classList.add("unread");

        mailbox == "inbox" || mailbox == "archive"
          ? (element.innerHTML = `<p>${email.sender}</p> <p>${email.subject}</p> <p>${email.timestamp}</p>`)
          : (element.innerHTML = `<p>For: ${email.recipients}</p> <p>${email.subject}</p> <p>${email.timestamp}</p>`);

        element.addEventListener("click", () => {
          view_email(email.id, mailbox);
        });

        document.querySelector("#emails-view").append(element);
      });
    });
}

function view_email(id, mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-detail").style.display = "block";

  mailbox === "sent"
    ? (document.querySelector("#archive-btn").style.display = "none")
    : (document.querySelector("#archive-btn").style.display = "flex");

  //Mark as read
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });

  //Load mail info
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector(
        "#email-sender"
      ).innerHTML = `<strong>From: </strong>${email.sender}`;
      document.querySelector(
        "#email-recipients"
      ).innerHTML = `<strong>To: </strong>${email.recipients}`;
      document.querySelector(
        "#email-subject"
      ).innerHTML = `<strong>Subject: </strong>${email.subject}`;
      document.querySelector(
        "#email-timestamp"
      ).innerHTML = `<strong>Timestamp: </strong>${email.timestamp}`;
      document.querySelector("#email-body").innerHTML = email.body;

      email.archived
        ? (document.querySelector(".isArchived").innerHTML = "Unarchive")
        : (document.querySelector(".isArchived").innerHTML = "Archive");

      //Archive/Unarchive Logic
      document.querySelector("#archive-btn").onclick = () => {
        fetch(`/emails/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: !email.archived,
          }),
        }).then(() => {
          load_mailbox("inbox");
        });
      };

      // Redirects to compose if click on reply button
      document.querySelector("#reply-btn").onclick = () => {
        compose_email(email, "reply");
      };
    });
}
