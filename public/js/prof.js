(function($){
    "use strict";
    var userFormat = /^[a-z0-9_-]{4,16}$/;
    var passFormat = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,512}$/;

    var cuu = $('#new-user');
    var cup = $('#ver-pass');
    var cpp = $('#old-pass');
    var cpnp = $('#new-pass');
    var cpvp = $('#new-pass-ver');

    cuu.keyup(function() {
        if(!userFormat.test(cuu.val())) {
            cuu.css({ border: '1px solid red' });
        } else {
            cuu.css({ border: '1px solid green' });
        }
    });
    cup.keyup(function() {
        if(!passFormat.test(cup.val())) {
            cup.css({ border: '1px solid red' });
        } else {
            cup.css({ border: '1px solid green' });
        }
    });
    cpp.keyup(function() {
        if(!passFormat.test(cpp.val())) {
            cpp.css({ border: '1px solid red' });
        } else {
            cpp.css({ border: '1px solid green' });
        }
    });
    cpnp.keyup(function() {
        if(!passFormat.test(cpnp.val())) {
            cpnp.css({ border: '1px solid red' });
        } else {
            cpnp.css({ border: '1px solid green' });
        }
    });
    cpvp.keyup(function() {
        if(!passFormat.test(cpvp.val())) {
            cpvp.css({ border: '1px solid red' });
        } else {
            cpvp.css({ border: '1px solid green' });
        }
    });

})(jQuery);
