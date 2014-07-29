define(function(require, exports, module){
    
    var controller = {
        "action":"action",
        "alarm":"alarm/action"
    };

    var $ = require("jquery");

    var $main;

    var curAction;

    return {
        init:function(){
            var me = this;
            $main = $("#main");
            $("[data-value]").on("click", function(){
                var action = $(this).attr("data-value");
                me.router(action);
            });
        },
        router:function(action){
            curAction && curAction.dispose();
            require.async(controller[action], function(alarm){
                curAction = alarm;
                alarm.init({
                    root:$main
                });
            });
        }
    };
});