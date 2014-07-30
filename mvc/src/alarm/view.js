define(function(require, exports, module){

    var fly = require("flyjs");
    exports.template = "/alarm.tpl.html";


    var uri = require('uri');

    var echarts = require("echarts").echarts;

    var chartOption = {
        title : {
            text: '未来一周气温变化',
            subtext: '纯属虚构'
        },
        tooltip : {
            trigger: 'axis'
        },
        legend: {
            data:['最高气温','最低气温']
        },
        toolbox: {
            show : true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {show: true, type: ['line', 'bar']},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        xAxis : [
            {
                type : 'category',
                boundaryGap : false,
                data : ['周一','周二','周三','周四','周五','周六','周日']
            }
        ],
        yAxis : [
            {
                type : 'value',
                axisLabel : {
                    formatter: '{value} °C'
                }
            }
        ],
        series : [
            {
                name:'最高气温',
                type:'line',
                data:[11, 11, 15, 13, 12, 13, 10],
                markPoint : {
                    data : [
                        {type : 'max', name: '最大值'},
                        {type : 'min', name: '最小值'}
                    ]
                },
                markLine : {
                    data : [
                        {type : 'average', name: '平均值'}
                    ]
                }
            },
            {
                name:'最低气温',
                type:'line',
                data:[1, -2, 2, 5, 3, 2, 0],
                markPoint : {
                    data : [
                        {name : '周最低', value : -2, xAxis: 1, yAxis: -1.5}
                    ]
                },
                markLine : {
                    data : [
                        {type : 'average', name : '平均值'}
                    ]
                }
            }
        ]
    };
    var viewContainer;
    exports.init = function(options){
        console.log('view');
        var tpl = uri.join(uri.dirname(module.uri), this.template);
        fly.addModule(tpl, tpl, "url");
        fly.Modules.use(tpl, function(html){
            options.root.html(html);


            viewContainer = fly.View.extend({
                el:options.root,
                events:{
                    "click .refresh":"refresh",
                    "click .refresh2":function(){
                        console.log(this);
                    }
                },
                init:function(){
                    console.log("init view");
                    var $chart = options.root.find("#echarts");

                    var myChart = echarts.init($chart[0]);
                    myChart.setOption(chartOption);

                },
                refresh:function(){
                    console.log(this);
                }
            });
        });
    };

    exports.dispose = function(){
        viewContainer.dispose();
    };


});