$(function () {

    $('#getStarted').on('click', function () {
        $.ajax({
            type: 'GET',
            url: '/dashboard',
            success: function () {
                alert("Succes")
            },
            error: function () {
                alert("error");
            }
        })
    })

})