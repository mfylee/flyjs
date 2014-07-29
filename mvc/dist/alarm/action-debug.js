define("#/test/1.0.0/alarm/action-debug", [ "./view-debug", "./model-debug" ], function(require, exports, module) {
    var view = require("./view-debug");
    var model = require("./model-debug");
    exports.init = function() {
        view.init();
        model.init();
    };
});

define("#/test/1.0.0/alarm/view-debug", [], function(require, exports, module) {
    exports.init = function() {
        console.log("view");
    };
});

define("#/test/1.0.0/alarm/model-debug", [], function(require, exports, module) {
    exports.init = function() {
        console.log("model");
    };
});
