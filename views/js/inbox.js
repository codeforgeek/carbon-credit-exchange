jQuery(document).ready(function($) {
  initScrollHandler();
});

function initScrollHandler() {
  log("Scrolls Initialized!");
  $(window).scroll(function() {
    if ($(this).scrollTop() > 10) {
      $("#header-nav").addClass("header-shrink");
    } else {
      $("#header-nav").removeClass("header-shrink");
    }
  });
}

function log(a) {
  console.log(`Log:`, a);
}
