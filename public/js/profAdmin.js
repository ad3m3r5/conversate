(function($){
    "use strict";
    var chanFormat = /^[a-z0-9_-]{2,15}$/;

    var dcc = $('#channel-name');
    dcc.keyup(function() {
        if(!chanFormat.test(dcc.val())) {
            dcc.css({ border: '1px solid red' });
        } else {
            dcc.css({ border: '1px solid green' });
        }
    });

})(jQuery);
