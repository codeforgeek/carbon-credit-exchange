$(function() {
  // Form Fields
  var $email = $("#email");
  var $password = $("#password");

  // Form Submission
  $("form").submit(function(e) {
    // alert("Submitted");
    e.preventDefault();
    var logindata = {
      email: $email.val(),
      password: $password.val()
    };
    $.ajax({
      type: "POST",
      url: "../api/login",
      data: JSON.stringify(logindata),
      contentType: "application/json",
      success: function(data) {
        if (data.error) {
          alert(data.message);
        } else {
          localStorage.setItem("userEmail", data.email);
          window.location.href = "/mailbox";
        }
      },
      error: function() {
        alert("error");
      }
    });
  });

  // Form validation
  jQuery(".validatedForm").validate({
    rules: {
      password: {
        minlength: 5
      },
      email: {
        pattern: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
      } // As RegExp
    }
  });

  // password visibility
  $("#check").click(function() {
    $(this).is(":checked")
      ? $("#password").attr("type", "text")
      : $("#password").attr("type", "password");
  });
});
