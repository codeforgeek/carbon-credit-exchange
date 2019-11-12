var month = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

var selectedTheme = "default";

var lang = new Lang();
lang.dynamic("mr", "./langpack/mr.json");
lang.dynamic("hi", "./langpack/hi.json");
lang.init({
  defaultLang: "en"
});

$(function() {
  console.log("DOM Ready!");
  initialize();
});

const simulateClick = id => {
  $(`#${id}`).click();
};

changeThemeFile = () => {
  document.getElementById(
    "theme_css"
  ).href = `css/theme/theme-${selectedTheme}.css`;
  localStorage.setItem("dec-theme", selectedTheme);
};

const changeTheme = themeName => {
  if (themeName) {
    selectedTheme = themeName;
    changeThemeFile();
  } else {
    alert("Invalid theme");
  }
};

const changeLanguage = (langKey = null) => {
  if (langKey) {
    window.lang.change(langKey);
    localStorage.setItem("dec-lang", langKey);
  }
};

const preloadTheme = () => {
  if (localStorage.getItem("dec-theme")) {
    changeTheme(localStorage.getItem("dec-theme"));
  }
};

const initialize = () => {
  preloadTheme();
  // renderDashboard();
  getLoggedInUserEmail();
  hideAlerts();
  registerClickEvents();
  simulateClick("sidebar-inbox");
  changeLanguage(localStorage.getItem("dec-lang"));
};

const getLoggedInUserEmail = () => {
  if (localStorage.getItem("userEmail")) {
    console.log("User Found");
    $("#current-user").html(localStorage.getItem("userEmail"));
  } else {
    window.location.href = "./login.html";
  }
};

const hideAlerts = () => {
  $(".custom-alert").each(function() {
    $(this).hide();
  });
};

const registerClickEvents = () => {
  registerInboxClick();
  registerSentClick();
  registerComposeClick();
  registerContactsClick();
  registerDashboardClick();
  registerRequestClick();
  registerAllRequestsClick();
};

const sendEmail = e => {
  console.log("Inside sendEmail");
  const recipientEmail = $("#recipient-email").val();
  const emailSubject = $("#email-subject").val();
  const emailBody = $("#email-body").val();

  var emailData = {
    to: recipientEmail,
    subject: emailSubject,
    email: emailBody
  };

  $.ajax({
    type: "POST",
    url: "../api/email",
    data: JSON.stringify(emailData),
    contentType: "application/json",
    success: function(data) {
      if (data.error) {
        console.log("Error", data.error);
        launchEmailSentModal("failed");
      } else {
        launchEmailSentModal("success");
        simulateClick("sidebar-inbox");
      }
    },
    error: function() {
      alert("error");
      // window.location.href = 'index.html';
    }
  });
};

const updateBreadcrumb = levels => {
  var htmlStr = `<li class="breadcrumb-item" aria-current="page"><i class="fas fa-home fa-sm"></i></li>`;
  $.each(levels, (i, level) => {
    if (i === levels.length - 1)
      htmlStr += `<li lang="en" class="breadcrumb-item active" aria-current="page">${level}</li>`;
    else
      htmlStr += `<li lang="en" class="breadcrumb-item" aria-current="page">${level}</li>`;
  });
  $("#breadcrumb").html(htmlStr);
};

const formatDate = date => {
  if (typeof date === "string") date = Number.parseInt(date);
  var emailDate = new Date(date);
  return `<span lang="en" class="dd">${emailDate.getDate()}</span> <span lang="en" class="mmm">${
    month[emailDate.getMonth()]
  }</span>, <span lang="en" class="hh">${emailDate.getHours()}</span>:<span lang="en" class="mm">${
    emailDate.getMinutes() < 10
      ? `0${emailDate.getMinutes()}`
      : emailDate.getMinutes()
  }</span>`;
};

const getMailLineItem = (email, source) => {
  var sender =
    source === "inbox"
      ? email.from.split("@")[0]
      : email.to.split("@")[0] || "No Sender";
  var subject = email.subject ? email.subject : "(No Subject)";
  var mailTime = formatDate(email.time);
  return `<li onClick="openMail('${email._id}','${
    email.time
  }','${source}')" class="list-group-item">
    <div class="row align-items-center">
    <div  class="col-lg-3"><span lang="en">${
      source === "inbox" ? "From" : "To"
    }</span>: <b>${sender}</b></div>
    <div lang="en" class="col-lg-7"><span lang="en">Subject</span>: <b>${subject}</b></div>
    <div class="col-lg-2" style="font-size: 11px; text-align: right;"><b lang="en">${mailTime}</b></div>
  </div>
  </li>`;
};

const renderMails = (mails = [], source = "inbox") => {
  if (source === "inbox") updateBreadcrumb(["Inbox"]);
  else if (source === "sent") updateBreadcrumb(["Sent"]);

  if (mails && mails.length > 0) {
    var htmlStr = `<div class="col shadow"><ul id="inbox-mails" class="mail-list list-group">`;
    $.each(mails, (i, mail) => {
      htmlStr += getMailLineItem(mail, source);
    });
    htmlStr += `</ul></div>`;
    $("div#current-pane").html(htmlStr);
  } else {
    renderNoData(
      "No mails yet!",
      "Share you email with others to receive mails."
    );
  }
};

const accept = reqId => {
  var data = {
    contactRequestId: reqId,
    action: "approve"
  };
  $.ajax({
    type: "POST",
    url: "../api/user/contacts/action",
    data: JSON.stringify(data),
    contentType: "application/json",
    success: function(data) {
      if (data.error) console.log("Accept operation failed!");
      else {
        $("#request-accepted-alert").fadeIn();
        setTimeout(function() {
          $("#request-accepted-alert").fadeOut(300);
        }, 3000);
        simulateClick("sidebar-all-request");
      }
    },
    error: function() {
      alert("error");
    }
  });
};

const renderNoData = (title = "No Data Found", subTitle = "") => {
  var htmlStr = `<div class="col text-center">
  <i class="fa fa-7x fa-exclamation-circle mb-3"></i>
  <p lang="en" class="lead text-gray-800">${title}</p>
  <p lang="en" class="text-gray-500 mb-0">${subTitle}</p>
  <a lang="en" href="#" onclick="simulateClick('sidebar-dashboard')" >Back to Dashboard</a>
</div>`;
  $("div#current-pane").html(htmlStr);
};

const reject = reqId => {
  var data = {
    contactRequestId: reqId,
    action: "reject"
  };
  $.ajax({
    type: "POST",
    url: "../api/user/contacts/action",
    data: JSON.stringify(data),
    contentType: "application/json",
    success: function(data) {
      if (data.error) console.log("Reject operation failed!");
      else {
        $("#request-rejected-alert").fadeIn();
        setTimeout(function() {
          $("#request-rejected-alert").fadeOut(300);
        }, 3000);
        simulateClick("sidebar-all-request");
      }
    },
    error: function() {
      alert("error");
    }
  });
};

const getContactRequestLineItem = request => {
  const {
    _id: requestId,
    senderData: { email: senderEmail, publicKey },
    time
  } = request;

  const requestTime = formatDate(time);

  return `<li class="list-group-item">
  <div class="row align-items-center">
     <div class="col-lg-1 col-sm-1 text-center xs-none">
        <i class="fas fa-user-circle fa-2x"></i>
     </div>
     <div class="col-lg-6 col-sm-11">
        <div><b>${senderEmail}</b></div>
        <div style="font-size: 11px;" class="xs-none">
          <i class="fa fa-key" aria-hidden="true"></i>: 
          <b>
            <i>${publicKey}</i>
          </b> 
        </div>
        <div style="font-size: 11px;"><span lang="en">Sent on:</span> <b lang="en">${requestTime}</b></div>
     </div>
     <div class="col-lg-5" style="font-size: 11px; text-align: right;">
        <div class="dropdown-divider lg-none xl-none"></div>
        <a href="#" class="btn btn-primary btn-icon-split btn-sm" onclick="accept('${requestId}')">
          <span class="icon text-white-50">
            <i class="fa-user-plus fas" style="color: #3cc535;"></i>
          </span>
          <span lang="en" class="text">Accept</span>
        </a>
        <a href="#" class="btn btn-icon-split btn-primary btn-sm ml-2" onclick="reject('${requestId}')">
          <span class="icon text-white-50">
            <i class="fa-user-times fas" style="color: #e74a3b;"></i>
          </span>
          <span lang="en" class="text">Reject</span>
        </a>
     </div>
  </div>
</li>`;
};

const renderContactRequestsMails = requests => {
  updateBreadcrumb(["All Requests"]);
  if (requests && requests.length > 0) {
    var htmlStr = `<div class="col shadow"><ul id="contact-requests" class="mail-list list-group">`;
    $.each(requests, (i, request) => {
      htmlStr += getContactRequestLineItem(request);
    });
    htmlStr += `</ul></div>`;
    $("div#current-pane").html(htmlStr);
  } else {
    renderNoData("No new contact requests!");
  }
};

const renderDashboard = () => {
  updateBreadcrumb([]);
  const htmlStr = `
  <div class="col-xl-3 col-md-6 mb-4 p-2">
    <div class="card shadow h-100 py-2">
      <div class="card-body">
        <div class="row no-gutters align-items-center">
          <div class="col mr-2">
            <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Inbox</div>
            <div class="h5 mb-0 font-weight-bold text-gray-800">48 Mails</div>
          </div>
          <div class="col-auto">
            <i class="fas fa-envelope-open-text fa-2x text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-md-6 mb-4 p-2">
    <div class="card shadow h-100 py-2">
      <div class="card-body">
        <div class="row no-gutters align-items-center">
          <div class="col mr-2">
            <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Sentbox</div>
            <div class="h5 mb-0 font-weight-bold text-gray-800">20 Mails</div>
          </div>
          <div class="col-auto">
            <i class="fas fa-paper-plane fa-2x text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-md-6 mb-4 p-2">
    <div class="card shadow h-100 py-2">
      <div class="card-body">
        <div class="row no-gutters align-items-center">
          <div class="col mr-2">
            <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Outbox</div>
            <div class="row no-gutters align-items-center">
              <div class="col-auto">
                <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">21 Mails</div>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <i class="fas fa-mail-bulk fa-2x text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="col-xl-3 col-md-6 mb-4 p-2">
    <div class="card shadow h-100 py-2">
      <div class="card-body">
        <div class="row no-gutters align-items-center">
          <div class="col mr-2">
            <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Contacts</div>
            <div class="h5 mb-0 font-weight-bold text-gray-800">18</div>
          </div>
          <div class="col-auto">
            <i class="fas fa-comments fa-2x text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>
</div>`;
  $("div#current-pane").html(htmlStr);
};

const closeAppendedSection = () => {
  if ($("#include-reply #appended-compose-section").length !== 0) {
    $("#include-reply")
      .children("#appended-compose-section")
      .remove();
  }
};

const renderForwardSection = subject => {
  if ($("#include-reply #appended-compose-section").length !== 0) {
    $("#include-reply")
      .children("#appended-compose-section")
      .remove();
  }

  $("#include-reply").append(`
  <div class="col-12" id="appended-compose-section">
  <div class="dropdown-divider"></div>
  <div style="text-align: right; padding: 1%; cursor: pointer;">
    <i class="fas fa-times" onclick="closeAppendedSection()" aria-hidden="true"></i>
  </div>
  <form class="user">
     <div class="form-group row">
        <label for="recipient-email" class="col-xl-1 col-form-label"><b lang="en">Email </b></label>
        <div class="col-xl-11">
           <input lang="en" type="email" class="form-control" id="recipient-email" placeholder="Enter email address">
        </div>
     </div>
     <div class="form-group row">
        <label for="email-subject" class="col-xl-1 col-form-label"><b lang="en">Subject </b></label>
        <div class="col-xl-11">
           <input lang="en" type="text" value="Forward: ${subject}" class="form-control" id="email-subject" placeholder="Enter email subject">
        </div>
     </div>
     <div class="form-group row">
        <label for="email-body" class="col-xl-1 col-form-label"><b lang="en">Message </b></label>
        <div class="col-xl-11">
           <textarea lang="en" rows="20" type="text" class="form-control" id="email-body" placeholder="Enter email body">${$(
             "#rendered-email-body"
           ).html()}</textarea>
        </div>
     </div>
     <!--<div class="form-group row">
      <label for="email-files" class="col-xl-1 control-label col-form-label">
          <b>File(s)</b>
      </label>
      <div class="col-xl-11">
            <input id="email-files" class="form-control" type="file" name="img" multiple>
      </div>
     </div> -->
     <div class="row justify-content-center">
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6" style="padding: 2%;">
           <a lang="en" href="#" onclick="sendEmail()" class="btn btn-user btn-block" style="background-color: green; color: #fff; font-weight: bold; font-size: 1rem;">
           Send
           </a>
        </div>

     </div>
  </form>
</div>
  `);
};

const renderReplySection = (recipientEmail, subject) => {
  if ($("#include-reply #appended-compose-section").length !== 0) {
    $("#include-reply")
      .children("#appended-compose-section")
      .remove();
  }
  $("#include-reply").append(`
  <div class="col-12" id="appended-compose-section">
  <div class="dropdown-divider"></div>
    <div style="text-align: right; padding: 1%; cursor: pointer;">
      <i class="fas fa-times" onclick="closeAppendedSection()" aria-hidden="true"></i>
    </div>
  <form class="user">
     <div class="form-group row">
        <label for="recipient-email" class="col-xl-1 col-form-label"><b lang="en">Email </b></label>
        <div class="col-xl-11">
           <input lang="en" type="email" value="${recipientEmail}" class="form-control" id="recipient-email" placeholder="Enter email address" disabled>
        </div>
     </div>
     <div class="form-group row">
        <label for="email-subject" class="col-xl-1 col-form-label"><b lang="en">Subject </b></label>
        <div class="col-xl-11">
           <input lang="en" type="text" value="${subject}" class="form-control" id="email-subject" placeholder="Enter email subject">
        </div>
     </div>
     <div class="form-group row">
        <label for="email-body" class="col-xl-1 col-form-label"><b lang="en">Message </b></label>
        <div class="col-xl-11">
           <textarea lang="en" rows="20" type="text" class="form-control" id="email-body" placeholder="Enter email body"></textarea>
        </div>
     </div>
     <!--<div class="form-group row">
      <label for="email-files" class="col-xl-1 control-label col-form-label">
          <b>File(s)</b>
      </label>
      <div class="col-xl-11">
            <input id="email-files" class="form-control" type="file" name="img" multiple>
      </div>
     </div> -->
     <div class="row justify-content-center">
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6" style="padding: 2%;">
           <a lang="en" href="#" onclick="sendEmail()" class="btn btn-user btn-block" style="background-color: green; color: #fff; font-weight: bold; font-size: 1rem;">
           Send
           </a>
        </div>
     </div>
  </form>
</div>
  `);
};

const renderConnectionSuccessPanel = () => {
  var htmlStr = `
  <div class="row container-fluid">
  <div class="col">
    <div class="p-sm-1 p-md-3 p-lg-5 p-xl-5">
      <div class="text-center">
      <i class="fa fa-check-circle fa-7x mb-4" aria-hidden="true" style="color: green"></i>
        <h1 lang="en" class="h4 text-gray-900 mb-2">Connection request sent!</h1>
        <p class="mb-4">
          <span lang="en">A connection request has been sent.</span> 
          <span lang="en">You'll be connected when the recipient accepts the request.</span>
        </p>
        <a  lang="en" href="#" onclick="simulateClick('sidebar-inbox')" class="btn btn-primary btn-user">
        Back
      </a>
      </div>

    </div>
  </div>
</div>
  `;
  $("div#current-pane").html(htmlStr);
};

const renderConnectionFailedPanel = () => {
  var htmlStr = `
  <div class="row container-fluid">
  <div class="col">
    <div class="p-sm-1 p-md-3 p-lg-5 p-xl-5">
      <div class="text-center">
      <i class="fa fa-exclamation-triangle fa-7x mb-4" aria-hidden="true" style="color: red"></i>
        <h1 lang="en" class="h4 text-gray-900 mb-2">Connection request could not be sent!</h1>
        <p lang="en" class="mb-4">Please try again later.</p>
        <a lang="en" href="#" onclick="simulateClick('sidebar-inbox')" class="btn btn-primary btn-user">
        Back
      </a>
      </div>

    </div>
  </div>
</div>
  `;
  $("div#current-pane").html(htmlStr);
};

const sendRequest = () => {
  var recipientEmail = $("#connRequestRecipient").val();
  var requestData = {
    contactEmail: recipientEmail
  };
  $.ajax({
    type: "POST",
    url: "../api/user/contacts",
    data: JSON.stringify(requestData),
    contentType: "application/json",
    success: function(data) {
      if (data.error) renderConnectionFailedPanel();
      else renderConnectionSuccessPanel();
    },
    error: function() {
      renderConnectionFailedPanel();
    }
  });
};

const renderRequestSection = () => {
  updateBreadcrumb(["New Request"]);
  var htmlStr = `
  <div class="row container-fluid">
  <div class="col">
    <div class="p-sm-1 p-md-3 p-lg-5 p-xl-5">
      <div class="text-center">
        <h1 lang="en" class="h4 text-gray-900 mb-2">Send a connection request</h1>
        <p lang="en" class="mb-4">Kindly enter the email address below and we'll send connection request to the recipient!</p>
      </div>
      <form class="user">
        <div class="form-group">
          <input lang="en" type="email" class="form-control form-control-user" id="connRequestRecipient" aria-describedby="emailHelp" placeholder="Enter Email Address...">
        </div>
        <a lang="en" href="#" onclick="sendRequest()" class="btn btn-primary btn-user btn-block">
          Send Request
        </a>
      </form>
    </div>
  </div>
</div>
  `;
  $("div#current-pane").html(htmlStr);
};

const getContactCard = contact => {
  return `<div class="col-md-6 col-xl-3 p-2">
<div class="card shadow h-100 py-2">
  <div class="card-body">
    <div class="row no-gutters align-items-center">
      <div class="col mr-2">
        <div class="font-weight-bold" style="color: #4f4f4f;">${
          contact.contactEmail.split("@")[0]
        }</div>
        <div class="font-weight-bold mb-0 text-gray-800 text-xs">${
          contact.contactEmail
        }</div>
      </div>
      <div class="col-auto">
        <i class="fas fa-user fa-2x text-gray-300"></i>
      </div>
    </div>
  </div>
</div>
</div>`;
};

const renderContactsCard = contacts => {
  updateBreadcrumb(["Contacts"]);
  var htmlStr = "";
  $.each(contacts, (i, contact) => {
    htmlStr += getContactCard(contact);
  });
  $("div#current-pane").html(htmlStr);
};

const renderContactsTable = () => {
  updateBreadcrumb(["Contacts"]);
  $("div#current-pane").html("");
  var htmlStr = `<div class="col card shadow mb-4">
  <div class="card-header py-3">
    <h6 class="m-0 font-weight-bold text-primary">My Contacts</h6>
  </div>
  <div class="card-body">
    <div class="table-responsive">
      <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
            <th>Office</th>
            <th>Age</th>
            <th>Start date</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tiger Nixon</td>
            <td>System Architect</td>
            <td>Edinburgh</td>
            <td>61</td>
            <td>2011/04/25</td>
            <td>$320,800</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;
  $("div#current-pane").html(htmlStr);
};

const renderMail = (mailId, mailTime, mailRes, source) => {
  if (source === "inbox") updateBreadcrumb(["Inbox", `Mail: ${mailId}`]);
  else if (source === "sent") updateBreadcrumb(["Sent", `Mail: ${mailId}`]);

  $("div#current-pane").html("");
  $("div#current-pane")
    .html(`<div id="mail-view" class="container-fluid shadow">
  <div class="row no-gutters">
      <div class="col mail-view-subject">
        <h3>${mailRes.subject}</h3>
      </div>
    </div>
    <div class="dropdown-divider"></div>
    <div class="row no-gutters align-items-center" style="padding: 10px;">
      <div class="col col-lg-1 text-center xs-none sm-none md-none">
        <i class="fas fa-user-circle fa-2x"></i>
      </div>
      <div class="col col-lg-11 text-left">
        <div class="row no-gutters">
            <div class="col-sm-9 row no-gutters mail-view-from">
                <b class="col-sm-12">${mailRes.from}</b>
                <div class="col-sm-12 mail-view-to">to: ${
                  source === "inbox" ? "you" : mailRes.to
                }</div>
            </div>
            <div class="col-sm-3 text-right mail-view-time row no-gutters align-items-center" >
              <div class="col-6 col-sm-12 order-last order-sm-first" ><b lang="en">${formatDate(
                mailTime
              )}</b></div>
              <div id="attachments" class="col-6 col-sm-12 order-first order-sm-last">
              <button type="button" class="btn btn-sm"><i class="fa-paperclip fas"></i><span class="badge badge-light">0</span>
              </button>
                </div>
            </div>
        </div>
      </div>
    </div>
    <div class="dropdown-divider"></div>
    <div class="row no-gutters">
      <div class="col">
        <pre class="mail-body" id="rendered-email-body">${mailRes.email}</pre>
      </div>
    </div>
    <div class="row" id="include-reply" style="display: ${
      source === "inbox" ? "" : "none"
    }">
      <div class="col-xl-2 col-lg-3 col-md-3 col-sm-12" style="padding: 2%;">
          <a href="#" class="btn btn-sm btn-user btn-block mail-action-buttons" onclick="renderReplySection('${
            mailRes.from
          }','${mailRes.subject}')">
          <i class="fas fa-reply"></i>
          <span lang="en">Reply</span>
          </a>
      </div>
      <div class="col-xl-2 col-lg-3 col-md-3 col-sm-12" style="padding: 2%;">
          <a lang="en" href="#" class="btn btn-user btn-sm btn-block mail-action-buttons" onclick="renderForwardSection('${
            mailRes.subject
          }')">
          <i class="fas fa-share"></i>
          <span lang="en">Forward</span>
          </a>
      </div>
    </div>  
  </div>`);
};

const renderComposeSection = () => {
  $("div#current-pane").html("");
  $("div#current-pane").html(`<div class="col">
  <form class="user">
     <div class="form-group row">
        <label for="recipient-email" class="col-xl-1 col-form-label"><b lang="en">Email </b></label>
        <div class="col-xl-11">
           <input lang="en" type="email" class="form-control" id="recipient-email" placeholder="Enter email address">
        </div>
     </div>
     <div class="form-group row">
        <label for="email-subject" class="col-xl-1 col-form-label"><b lang="en">Subject </b></label>
        <div class="col-xl-11">
           <input lang="en" type="text" class="form-control" id="email-subject" placeholder="Enter email subject">
        </div>
     </div>
     <div class="form-group row">
        <label for="email-body" class="col-xl-1 col-form-label"><b lang="en">Message </b></label>
        <div class="col-xl-11">
           <textarea lang="en" rows="20" type="text" class="form-control" id="email-body" placeholder="Enter email body" />
        </div>
     </div>
     <!--<div class="form-group row">
      <label for="email-files" class="col-xl-1 control-label col-form-label">
          <b>File(s)</b>
      </label>
      <div class="col-xl-11">
            <input id="email-files" class="form-control" type="file" name="img" multiple>
      </div>
     </div> -->
     <div class="row justify-content-center">
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6" style="padding: 2%;">
           <a lang="en" href="#" onClick="sendEmail()" class="btn btn-user btn-block" style="background-color: green; color: #fff; font-weight: bold; font-size: 1rem;">
           Send
           </a>
        </div>
        <!--<div class="col-xl-3 col-lg-4 col-md-6 col-sm-6" style="padding: 2%;">
           <a href="#" class="btn btn-user btn-block" style="background-color: gray; color: #fff; font-weight: bold; font-size: 1rem;" >
           Save as draft
           </a>
        </div> -->
     </div>
  </form>
</div>`);
};

const registerInboxClick = () => {
  $("#sidebar-inbox").click(function(e) {
    e.preventDefault();
    $.ajax({
      type: "GET",
      url: "../api/email",
      success: function(data) {
        if (data.error) {
          alert(data.message);
        } else {
          renderMails(data.data, "inbox");
        }
      },
      error: function() {
        alert("error");
      }
    });
  });
};

const registerSentClick = () => {
  $("#sidebar-sent").click(function(e) {
    e.preventDefault();
    $.ajax({
      type: "GET",
      url: "../api/email/sent",
      success: function(data) {
        if (data.error) {
          alert(data.message);
        } else {
          renderMails(data.data, "sent");
          console.log("Sent mail response", data);
        }
      },
      error: function() {
        alert("error");
      }
    });
  });
};

const registerComposeClick = () => {
  $("#sidebar-compose").click(function(e) {
    e.preventDefault();
    updateBreadcrumb(["Compose Mail"]);
    renderComposeSection();
  });
};

const registerContactsClick = () => {
  $("#sidebar-contacts").click(function(e) {
    e.preventDefault();
    $.ajax({
      type: "GET",
      url: "../api/user/contacts",
      success: function(data) {
        if (data.error) {
          alert("Error");
        } else {
          renderContactsCard(data.data);
        }
      },
      error: function() {
        alert("error");
      }
    });
  });
};

const registerRequestClick = () => {
  $("#sidebar-request").click(function(e) {
    e.preventDefault();
    renderRequestSection();
  });
};

const registerAllRequestsClick = () => {
  $("#sidebar-all-request").click(function(e) {
    e.preventDefault();
    $.ajax({
      type: "GET",
      url: "../api/user/contacts/request",
      success: function(data) {
        if (data.error) {
          alert(data.message);
        } else {
          renderContactRequestsMails(data.data);
        }
      },
      error: function() {
        alert("error");
      }
    });
  });
};

$("#ContactRequests").click(function(e) {
  e.preventDefault();
  $.ajax({
    type: "GET",
    url: "../api/user/contacts/request",
    success: function(data) {
      $(emails).html("");
      $(emails).append('<li class="list-group"><b>Names</b></li>');
      $.each(data.data, function(i, contact) {
        var contactEmail = contact.senderData.email.split("@");
        $(emails).append(
          "<li list-group-item>Name:" +
            contactEmail[0] +
            "&nbsp;&nbsp;&nbsp;<button onclick=\"approve('" +
            contact._id +
            "')\">Approve</button> &nbsp;&nbsp;&nbsp;&nbsp;<button onclick=\"reject('" +
            contact._id +
            "')\">Reject</button>" +
            "</li>"
        );
      });
    },
    error: function() {
      alert("error");
    }
  });
});

const registerDashboardClick = () => {
  $("#sidebar-dashboard").click(function(e) {
    e.preventDefault();
    renderDashboard();
  });
};

const launchEmailSentModal = status => {
  console.log("In launchEmailSentModal", status);
  if (status === "success") {
    $("#email-sent-success-alert").fadeIn();
    setTimeout(function() {
      $("#email-sent-success-alert").fadeOut(300);
    }, 3000);
  } else {
    $("#email-sent-failed-alert").fadeIn();
    setTimeout(function() {
      $("#email-sent-failed-alert").fadeOut(300);
    }, 3000);
  }
};

const openMail = (mailId, mailTime, source = "inbox") => {
  $.ajax({
    type: "GET",
    url: `../api/email/${source}/${mailId}`,
    success: function(data) {
      console.log("Read Mail Response:", data);
      renderMail(mailId, mailTime, data.data, source);
    },
    error: function() {
      alert("error");
    }
  });
};
