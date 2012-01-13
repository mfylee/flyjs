/**
 * flyjs Base库
 * author lifayu@baidu.com
 * date 2011年8月5日 17:37:18
 */
window["$FLYJS$"] = {};
//用于存储对象实例
window["$FLYJS$"]._instances = {};
var flyjs = flyjs || {};
//视图层
flyjs.View = {};
//模型层
flyjs.Model = {};
//模块层
flyjs.Modules = {};

//生成guid
flyjs.guid = (function(){
    var guid = 1;
    return function(){
        return "FLYJS__" + (guid++).toString(36);
    };
})();
//基类
flyjs.Class = function(guid){
    this.guid = guid || flyjs.guid();
    window["$FLYJS$"]._instances[this.guid] = this;
};
/**
 * 数组，对象遍历器
 * @param {Array|Object} source 目标源
 * @param {Function} fun 迭代器
 * @param {Object} thisObj this指针
 */
flyjs.each = function(source,fun,thisObj){
	var returnValue,item;
	if(Object.prototype.toString.call(source) === "[object Array]"){
		for (var i=0; i < source.length; i++) {
		   item = source[i];
		   returnValue = fun.call(thisObj || source,item,i);
		   if(returnValue === false){
		   		break;
		   }
		};
	}else if(Object.prototype.toString.call(source) === "[object Object]"){
		for(var i in source){
			item = source[i];
			returnValue = fun.call(thisObj || source,item,i);
		   	if(returnValue === false){
		   		break;
		   	}
		}
	}else{
		return source;
	}
};
/**
 * 类型判断
 */
flyjs.each(["Array","Boolean","Date","Number","Object","RegExp","String","Window","HTMLDocument"],function(item,i){
	flyjs["is"+item] = function (args) {
	  	return Object.prototype.toString.call(args) === "[object "+item+"]";
	}
});
/**
 * 对象克隆
 * @param {Boolean} deep 是否深度克隆，默认false，可选
 * @param {*} source 目标对象
 */
flyjs.clone = function () {
	var target = arguments[0],deep = false;
	if(typeof target === "boolean"){
		deep = target;
		target = arguments[1];
	}
	if(!target || flyjs.isString(target) || flyjs.isNumber(target) || flyjs.isBoolean(target)) {
		return target;
	}else if(flyjs.isArray(target)){
		var arr = [];
		for (var i=0; i < target.length; i++) {
		 	arr[i] = deep ? flyjs.clone(deep,target[i]) : target[i];
		};
		return arr;
	}else if(flyjs.isObject(target)){
		var obj = {};
		for(var i in target){
			obj[i] = deep ? flyjs.clone(deep,target[i]) : target[i];
		}
		return obj;
	}
	return {};
}
//对象扩充
flyjs.extend = function(){
	var target = arguments[0] || {}, i = 1,length = arguments.length, deep = false, opts, name, src, copy;
	if(typeof target === "boolean"){
		deep = target;
		target = arguments[1] || {};
		i = 2;
	}
	if(length === i){
		return flyjs.clone(deep,target);
	}else{
		for(; i<length; i++){
			if((opts = arguments[i]) != null){
				for(name in opts){
					src = target[name];
					copy = opts[name];
					if(src === copy){
						continue;
					}
					if(deep && copy &&(flyjs.isArray(copy) || flyjs.isObject(copy))){
						var clone = src && (flyjs.isArray(src) || flyjs.isObject(src)) ? src : flyjs.isArray(copy)? [] : {};
						target[name] = flyjs.extend(deep,clone,copy);
					}else if(copy !== undefined){
						target[name] = copy;
					}
				}
			}
		}
		return target;
	}
};

/**
 * 字符串格式化
 * @param {String} str		目标字符串
 * @param {Object} opts		填充参数
 * @return {String}
 */
flyjs.format = function(str,opts){
    str = String(str);
    return str.replace(/#<(.+?)>/g,function(match,key){
        var replacer = opts[key];
        if(typeof replacer == "function"){
            replacer = replacer(key);
        }
        return ('undefined' == typeof replacer ? '' : replacer);
    });
};
/**
 * 模版引擎
 * 参考：underscope.js
 */
flyjs.template = function(str, data) {
    var c  = {
        evaluate    : /<\?([\s\S]+?)\?>/g,
        interpolate : /<\?=([\s\S]+?)\?>/g
    };
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
};

flyjs.get = function(url,opts){
	flyjs.ajax(flyjs.extend(opts,{
		url:url,
		type:"GET"
	}));
};
flyjs.post = function(url,opts){
	flyjs.ajax(flyjs.extend(opts,{
		url:url,
		type:"POST"
	}));
};
//////////////////////////////////////////以下代码需要做框架适配///////////////////////////////////////////////
if(typeof jQuery != "undefined"){
    /**
    * ajax相关操作,TODO：扩展为框架适配器，默认适配jQuery
    */
    flyjs.ajax = function(opts){
        jQuery.ajax(opts);
    };
    //事件委托
    flyjs.live = function(selector,eventName,method,context){
        var context = context || document;
        jQuery(selector,context).live(eventName,method);
    };
}else if(typeof baidu != "undefined"){
    /**
    * 配置全局ajax事件，ajaxStart和ajaxStop
    */
    flyjs.each("ajaxStart ajaxComplete ajaxStop".split(" "),function(item,i){
        flyjs[item] = function(){}
    });
    /**
    * ajax提交方法
    * @date 2011年6月13日 21:46:16
    * @author lifayu@baidu.com
    * @config {String} url
    * @config {Object} data
    * @config {String} dataType == json
    * @config {String} type get/post
    * @config {Function} success
    * @config {Function} error
    * @config {Function} beforeSend
    * @config {Function} complete
    */
    flyjs.ajax = function(opts){
        var opts = flyjs.extend({
            aysnc:true,
            //dataType:"json",
            type:"get",
            beforeSend:function(){},
            success:function(){},
            error:function(){},
            complete:function(){}
        },opts);
        var accepts = {
            xml: "application/xml, text/xml",
            html: "text/html",
            script: "text/javascript, application/javascript",
            json: "application/json, text/javascript",
            text: "text/plain",
            _default: "*/*"
        }
        var method = opts.type.toLowerCase();
        if( method != "rest"){
            opts.data = baidu.url.jsonToQuery(opts.data);
        }else{
            method = "post";
            opts.data = baidu.json.stringify(opts.data);
        }
        var options = {
            method:method,
            async:opts.async,
            data:opts.data,
            username:opts.username,
            password:opts.password,
            onsuccess:function(){
                if(opts.dataType == "json"){
                    try{
                        opts.success(baidu.json.parse(arguments[1]),arguments[0]);
                    }catch(e){
                        opts.error.apply(this,arguments);
                    }
                }else{
                    opts.success.call(this,arguments[1],arguments[0]);
                }
                if(!opts.global){
                    flyjs.ajaxStop();
                }
                opts.complete(arguments[0]);
            },
            onfailure:function(){
                opts.error.apply(this,arguments);
                if(!opts.global){
                    flyjs.ajaxStop();
                }
                opts.complete(arguments[0]);
            },
            onbeforerequest:function(){
                opts.beforeSend.apply(this,arguments);
                if(!opts.global){
                    flyjs.ajaxStart();
                }
            },
            headers:{
                "Accept":opts.dataType && accepts[ opts.dataType ] ?  accepts[ opts.dataType ] + ", */*" : accepts._default
            },
            timeout:opts.timeout
        };
        if(opts.type.toLowerCase() == "rest"){
            options.headers["Content-Type"] = "application/json";
        }
        baidu.ajax.request(opts.url,options);
    }
    //事件委托
    flyjs.live = function(selector,eventName,method,context){
        var context = context || document;
        baidu.on(context,eventName,function(event){
            //baidu.event.stopPropagation(event);
            var me = this;
            var child = baidu.dom.query(selector);
            if(baidu.array.contains(child,baidu.event.getTarget(event))){
                method.call(this,event,baidu.event.getTarget(event));
            }else{
                var p = baidu.event.getTarget(event).parentNode;
                while(p != me && p != null){
                    if(baidu.array.contains(child,p)){
                        method.call(this,event,p);
                        break;
                    }else{
                        p = p.parentNode;
                    }
                }
            }
        });
    };
}
