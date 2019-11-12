$(function () {

    // $('.left-container').css("display", "none");
    // $('.left-container-mobile').css("display", "none");



    // $(emails).load('dashboard.html#');
    var month = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ]

    // list all mails
    $('#Inbox').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/email',
            success: function (data) {
                if (data.error) {
                    alert(data.message)
                } else {
                    $(emails).html('');
                    $.each(data.data, function (i, email) {
                        var sender = email.from.split("@");
                        console.log(data)
                        // var time = new Date(email.time).toUTCString()
                        var dt = new Date(email.time);
                        var time = dt.getDate() + " " + month[dt.getMonth()] + " " + dt.getHours() + ":" + dt.getMinutes();
                        var subject = (email.subject ? email.subject : "(NO SUBJECT)");
                        $(emails).append('<li class = "inbox-list" id="emailid" onclick="readMail(\'' + email._id + '\')">' + "From: " + sender[0] + "<span class = \"subject\">" + "Subject: " + subject + "</span><span class = \"date\">" + time + '</span></li>')
                    })
                }
            },
            error: function () {
                alert("error");
            }
        })
    });

    // get all contacts in list
    $('#Contacts').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/user/contacts',
            success: function (data) {
                $(emails).html('');
                $(emails).append('<li class="list-group"><b>Names</b></li>');
                $.each(data.data, function (i, contact) {
                    var contactEmail = contact.contactEmail.split("@");
                    if (contact.status == 1)
                        $(emails).append('<li class="list-group-item">' + contactEmail[0] + '</li>')
                })
            },
            error: function () {
                alert("error");
            }
        })
    });

    // get user contact requests
    $('#ContactRequests').click(function (e) {
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: '../api/user/contacts/request',
            success: function (data) {
                $(emails).html('');
                $(emails).append('<li class="list-group"><b>Names</b></li>');
                $.each(data.data, function (i, contact) {
                    var contactEmail = contact.senderData.email.split("@");
                    $(emails).append('<li list-group-item>Name:' + contactEmail[0] + '&nbsp;&nbsp;&nbsp;<button onclick="approve(\'' + contact._id + '\')">Approve</button> &nbsp;&nbsp;&nbsp;&nbsp;<button onclick="reject(\'' + contact._id + '\')">Reject</button>' + '</li>')
                })
            },
            error: function () {
                alert("error");
            }
        })
    });

    // display Request template
    $('#Request').click(function (e) {
        e.preventDefault();
        $(emails).html(
            "<label class=\"width-100\">Contact Email</label><br />" +
            "<input type=\"email\" id=\"contactEmail\" placeholder=\"Email\"> <br />" +
            "<button class=\"btn btn-primary request-btn\" style = \"margin-left: 20%\" onclick = \"request()\">Send</button>"
        )
    });

    // display email compose template
    $('#Compose').click(function (e) {
        e.preventDefault();
        $(emails).html(
            "<label class = \"width-100\">To</label>" +
            "<input style = \"width:100%\" type=\"email\" id=\"to\" placeholder=\"To\"> <br />" +
            "<label class = \"width-100\">Subject</label>" +
            "<input style = \"width:100%\" type=\"text\" id=\"subject\" placeholder=\"Subject\"> <br />" +
            "<label class = \"width-100\">Message</label>" +
            "<textarea name=\"message\" style = \"width:100%\" id=\"message\" placeholder=\"Enter message\"></textarea><br /><br />" +
            "<button class=\"btn btn-primary center-block\" onclick=\"sendmail()\" id=\"sendEmail\">Send</button>"
        )

    });

    $('.container-box').click(function (e) {
        if ($(window).width() < 823) {
        if ($('.left-container').css('display') == 'block') {
            showMobileView();
        } else {

        }
    }
    })

    $('#Close').click(function (e) {
        showMobileView();
    })

    if ($(window).width() < 823) {
        // change functionality for smaller screens
    } else {
        $('#Close').css("display", "none");
        $('.left-container').css("display", "block");
        $('.left-container').addClass("col-2");
        $('.left-container').removeClass("overlay");
        $('.right-container').addClass("col-10");
        $('.right-container').removeClass("col-12");
    }

})

// send Email
function sendmail() {
    var $to = $('#to');
    var $message = $('#message');
    var $subject = $('#subject');
    var emailData = {
        to: $to.val(),
        subject: $subject.val(),
        email: $message.val()
    }
    $.ajax({
        type: 'POST',
        url: '../api/email',
        data: JSON.stringify(emailData),
        contentType: "application/json",
        success: function (data) {
            if (data.error) {
                alert(data.message)
            } else {
                $(emails).html("");
                alert("Sent")
            }
        },
        error: function () {
            alert("error");
            // window.location.href = 'index.html';
        }
    })
}


// Send Request
function request() {
    var $contactEmail = $('#contactEmail');
    var requestData = {
        contactEmail: $contactEmail.val(),
    }
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts',
        data: JSON.stringify(requestData),
        contentType: "application/json",
        success: function (data) {
            $(email).html("");
            alert("Requested");
        },
        error: function () {
            alert("error");
        }
    })
}
// Approve Request
function approve(id) {
    var data = {
        contactRequestId: id,
        action: "approve"
    };
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts/action',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            $(emails).html("");
            if (data.error)
                $(emails).html("<p>" + data.message + "</p>")
            else
                $(emails).html("<p>" + "Approved" + "</p>")
        },
        error: function () {
            alert("error");
        }
    })
}

// Reject Request
function reject(id) {
    var data = {
        contactRequestId: id,
        action: "reject"
    };
    $.ajax({
        type: 'POST',
        url: '../api/user/contacts/action',
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            $(emails).html("");
            if (data.error)
                $(emails).html("<p>" + data.message + "</p>")
            else
                $(emails).html("<p>" + "Rejected" + "</p>")
        },
        error: function () {
            alert("error");
        }
    })
}
// Display email content
function readMail(id) {
    $.ajax({
        type: 'GET',
        url: '../api/email/' + id + '',
        success: function (data) {
            console.log(data)
            var subject = (data.data.subject ? data.data.subject : "(NO SUBJECT)");
            $(emails).html("<b>Sender:</b><h4>" + data.data.from + "</h4><br /><b>Subject:</b><p>" + subject + "</p><br /><b>Body:</b><p><pre>" + data.data.email + "</pre></p>");
        },
        error: function () {
            alert("error");
        }
    })
}


// responsive

function showMobileView() {
    if ($('.left-container').css('display') == 'block') {
        $('.left-container').css("display", "none");
        $('.left-container').removeClass("col-2");
        $('.left-container').removeClass("col-4");
        $('.right-container').addClass("col-12");
        $('.right-container').removeClass("col-10");
    } else {
        $('.left-container').css("display", "block");
        $('.left-container').addClass("col-4");
        $('.right-container').addClass("col-8");
        $('.right-container').removeClass("col-12");
    }
}
