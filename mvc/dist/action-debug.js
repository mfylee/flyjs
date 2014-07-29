define("#/test/1.0.0/action-debug", [ "dep/jquery/jquery-debug", "./view-debug", "./model-debug" ], function(require, exports, module) {
    var $ = require("dep/jquery/jquery-debug");
    var view = require("./view-debug");
    var model = require("./model-debug");
    return {
        init: function() {
            view.init();
            model.init();
            console.log($);
            console.log($.ajax);
        }
    };
});

define("#/test/1.0.0/view-debug", [], function(require, exports, module) {
    exports.init = function() {
        console.log("view");
    };
});

define("#/test/1.0.0/model-debug", [], function(require, exports, module) {
    exports.init = function() {
        console.log("model");
    };
});
