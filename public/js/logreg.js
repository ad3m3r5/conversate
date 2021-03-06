(function($){
    "use strict";
    var userFormat = /^[a-zA-Z0-9_-]{4,16}$/;
    var passFormat = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,512}$/;

    let ru = $('#reg-user');
    ru.keyup(function() {
        if (!userFormat.test(ru.val())) {
            ru.css({ border: "1px solid red" });
        } else {
            ru.css({ border: "1px solid green" });
        }
    });
    var rp = $('#reg-pass');
    rp.keyup(function() {
        if (!passFormat.test(rp.val())) {
            rp.css({ border: "1px solid red" });
        } else {
            rp.css({ border: "1px solid green" });
        }
    });

})(jQuery);
