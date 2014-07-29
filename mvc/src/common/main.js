define(function(require, exports, module){
    
    var controller = {
        "action":"action",
        "alarm/action":"alarm/action"
    };

    var $ = require("jquery");

    var fly = require("flyjs");

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

            var history = new fly.History();
            history.addRouter(new RegExp(".+?"), function(fragment){
                var arr = fragment.split("~");
                var action = arr[0].substring(2);
                console.log(action);
                if(arr.length > 1){
                    var paramArray = arr[1].split("&");
                    
                }
                me.router(action);
            });
            history.start();
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