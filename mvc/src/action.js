define(function(require, exports, module){

    var $ = require('jquery');
    var view = require('./view');

    var model = require('./model');

    return {
        init: function(options){
            view.init();
            model.init();
            
            options.root.html("I'm at Home");
        },
        dispose:function(){
            console.log("home dispose");
        }
    };

});