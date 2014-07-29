define(function(require, exports, module){

    var $ = require('jquery');
    var view = require('./view');

    var model = require('./model');

	var fly = require("flyjs");

    return {
        init: function(options){
            view.init();
            model.init();
            
            options.root.html("I'm at Home");
			console.log(fly);
        },
        dispose:function(){
            console.log("home dispose");
        }
    };

});
