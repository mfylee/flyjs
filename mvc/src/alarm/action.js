define(function(require, exports, module){

    var view = require('./view');

    var model = require('./model');


    exports.init = function(options){

        console.log("i'm in alarm");
        view.init(options);
        model.init(options);

//        options.root.html("I'm in alarm<div><div id='charts' style='iwidth:500px;height:300px;'></div></div>");

    };
    exports.dispose = function(){
        console.log("alarm dispose");
        view.dispose();
        model.dispose();
    };

});