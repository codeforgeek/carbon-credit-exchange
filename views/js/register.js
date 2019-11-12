$(function() {
  // Form Fields
  var $email = $("#email");
  var $password = $("#password");

  // Register Form Submission
  $("form").submit(function(e) {
    e.preventDefault();
    var registerdata = {
      email: $email.val(),
      password: $password.val()
    };
    $.ajax({
      type: "POST",
      url: "../api/user",
      data: JSON.stringify(registerdata),
      contentType: "application/json",
      success: function(data) {
        if (data.error) {
          alert(data.message);
        } else {
          alert(data.hash);
          window.location.href = "/login";
        }
      },
      error: function() {
        alert("error");
      }
    });
  });

  $(".validatedForm").validate({
    rules: {
      password: {
        minlength: 5
      },
      cnfpassword: {
        minlength: 5,
        equalTo: '[name="password"]'
      },
      email: {
        pattern: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        // pattern: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@graminno.in/
      } // As RegExp
    }
  });

  // password visibility
  $("#check").click(function() {
    $(this).is(":checked")
      ? $("#password").attr("type", "text")(
          $("#cnfpassword").attr("type", "text")
        )
      : $("#password").attr("type", "password")(
          $("#cnfpassword").attr("type", "password")
        );
  });
});
