/**
 * flyjs 
 * a mvc framework
 * @author lepharye@gmail.com
 * @since 2012-09-25
 */
(function() {
	window["$FLYJS$"] = {};
	//用于存储对象实例
	window["$FLYJS$"]._instances = {};
	window.flyjs = flyjs || {};
    flyjs.Class = {};
	//视图层
	flyjs.View = {};
	//模型层
	flyjs.Model = {};
	//模块层
	flyjs.Modules = {};
	//历史管理
	flyjs.History = function() {};
	//路由控制
	flyjs.Router = {};
	//公有函数库
	flyjs.lib = {};
	//模版控制
	flyjs.Template = {};
	//生成guid
	flyjs.guid = (function() {
		var guid = 1;
		return function() {
			return "FLYJS__" + (guid++).toString(36);
		};
	})();
	//基类(掺类)
	flyjs.Class = function(guid) {
		this.guid = guid || flyjs.guid();
		this.bind = function(event, fun) {
			this.__listeners[event] = fun;
			return this;
		};
		this.unbind = function(event) {
			delete this._listeners[event];
			return this;
		};
		/**
		 * 事件派发 arguments:(evt[,...])
		 * @param {Function}evt     事件名称
		 * @param {any}other      其他传递的参数
		 */
		this.dispatchEvent = function(evt) {
			var me = this;
			if(evt && me.__listeners[evt]) {
				return me[evt].apply(me, Array.prototype.slice.call(arguments, 1));
			}
			if(evt && me[evt]) {
				return me[evt].apply(me, Array.prototype.slice.call(arguments, 1));
			}
		};
		//自定义方法库
		this.lib = {};
		/**
		 * 方法调用，依次从以下顺序查找 [监听器，当前对象，自定义方法库(this.lib)，公有方法库(flyjs.lib)，window]
		 * @arguments   fun[,...]
		 * @param {String}fun     要调用的方法名称，支持命名空间
		 * @param {any}other      其他传递的参数
		 */
		this.fire = function(fun) {
			var me = this;
			//方法查找范围
			var libs = [me.__listeners, me, me.lib, flyjs.lib, window];
			if( typeof fun != "undefined") {
				for(var i = 0, len = libs.length; i < len; i++) {
					var own = libs[i];
					var parts = fun.split(".");
					flyjs.each(parts, function(name) {
						own = own[name];
						if( typeof own == "undefined") {
							return false;
						}
					});
					if( typeof own == "function") {
						return own.apply(me, Array.prototype.slice.call(arguments, 1));
					}
				}
			}
		};
		window["$FLYJS$"]._instances[this.guid] = this;
	};
	flyjs.getInstance = function(guid){
		return window["$FLYJS$"]._instances[guid];
	};
	/**
	 * @param {Object} flyjs.Class 	基础掺类
	 * @param {Object} opts			构造Class时提供的受保护方法
	 * @param {Object} opt			new实例的时提供的方法
	 */
	flyjs.createClass = function(construtor, opts) {

		var opts = opts || {};
		var superClass = opts.superClass ||
		function() {
		};
		//flyjs.Class;
		/**
		 * 真正的Class
		 */
		var clz = function(opt) {
			var me = this;
			opt = opt || {};

			me._constructor = construtor;
			//加入掺类
			flyjs.Class.call(me, (opt.guid || ""));
			//执行父类构造函数
			superClass._constructor && superClass._constructor.call(me);
			//执行本类构造函数
			construtor.apply(me);

			flyjs.extend(me, opts, opt);

			me.dispatchEvent("_init");
		};
		var C = function() {
		};

		C.prototype.__listeners = {};
		for(var i in superClass.prototype) {
			C.prototype[i] = superClass.prototype[i];
		}

		var fp = clz.prototype = new C();
		/**
		 * 扩充原型链
		 */
		clz.extend = function(json) {
			for(var i in json) {
				clz.prototype[i] = json[i];
			}
			return clz;
		};
		/**
		 * 事件绑定
		 * @param {String}event		事件名称
		 * @param {Function} fun 	事件函数
		 */
		clz.bind = function(event, fun) {
			clz.prototype.__listeners[event] = fun;
			return clz;
		};
		/**
		 * 取消事件绑定
		 * @param {String} event	事件名称
		 */
		clz.unbind = function(event) {
			delete clz.prototype.__listeners[event];
			return clz;
		};
		return clz;
	};
	/**
	 * 数组、对象遍历器
	 * @param {Array|Object} source 目标源
	 * @param {Function} fun 迭代器
	 * @param {Object} thisObj this指针
	 */
	flyjs.each = function(source, fun, thisObj) {
		var returnValue, item;
		if(Object.prototype.toString.call(source) === "[object Array]") {
			for(var i = 0; i < source.length; i++) {
				item = source[i];
				returnValue = fun.call(thisObj || source, item, i);
				if(returnValue === false) {
					break;
				}
			};
		} else if(Object.prototype.toString.call(source) === "[object Object]") {
			for(var i in source) {
				item = source[i];
				returnValue = fun.call(thisObj || source, item, i);
				if(returnValue === false) {
					break;
				}
			}
		} else {
			return source;
		}
	};
	/**
	 * 类型判断
	 * @example  flyjs.isArray(sth)
	 */
	flyjs.each(["Array", "Boolean", "Date", "Number", "Object", "RegExp", "String", "Window", "HTMLDocument"], function(item, i) {
		flyjs["is" + item] = function(args) {
			return Object.prototype.toString.call(args) === "[object " + item + "]";
		}
	});
	/**
	 * 对象克隆
	 * @param {Boolean} deep 是否深度克隆，默认false，可选
	 * @param {*} source 目标对象
	 */
	flyjs.clone = function() {
		var target = arguments[0], deep = false;
		if( typeof target === "boolean") {
			deep = target;
			target = arguments[1];
		}
		if(!target || flyjs.isString(target) || flyjs.isNumber(target) || flyjs.isBoolean(target)) {
			return target;
		} else if(flyjs.isArray(target)) {
			var arr = [];
			for(var i = 0; i < target.length; i++) {
				arr[i] = deep ? flyjs.clone(deep, target[i]) : target[i];
			};
			return arr;
		} else if(flyjs.isObject(target)) {
			var obj = {};
			for(var i in target) {
				obj[i] = deep ? flyjs.clone(deep, target[i]) : target[i];
			}
			return obj;
		}
		return {};
	}
	/**
	 * 对象扩充
	 * @example flyjs.extend([true/false,]obj[,obj[...]]);
	 */
	flyjs.extend = function() {
		var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, opts, name, src, copy;
		if( typeof target === "boolean") {
			deep = target;
			target = arguments[1] || {};
			i = 2;
		}
		if(length === i) {
			return flyjs.clone(deep, target);
		} else {
			for(; i < length; i++) {
				if(( opts = arguments[i]) != null) {
					for(name in opts) {
						src = target[name];
						copy = opts[name];
						if(src === copy) {
							continue;
						}
						if(deep && copy && (flyjs.isArray(copy) || flyjs.isObject(copy))) {
							var clone = src && (flyjs.isArray(src) || flyjs.isObject(src)) ? src : flyjs.isArray(copy) ? [] : {};
							target[name] = flyjs.extend(deep, clone, copy);
						} else if(copy !== undefined) {
							target[name] = copy;
						}
					}
				}
			}
			return target;
		}
	};

	/**
	 * ajax提交方法
	 * @date 2011年6月13日 21:46:16
	 * @author lifayu@meifuzhi.com
	 * @config {String} url
	 * @config {Object} data
	 * @config {String} dataType == json
	 * @config {String} type get/post
	 * @config {Function} success
	 * @config {Function} error
	 * @config {Function} beforeSend
	 * @config {Function} complete
	 */
	flyjs.ajax = jQuery.ajax;
	/**
	 * ajax GET请求
	 * @param {String}url               请求地址
	 * @param {Object}opts              配置参数
	 * @param {Object}opts.data         发送的参数
	 * @param {Function}opts.success    成功后的回调函数
	 * @param {Function}opts.error      失败后的回调函数
	 * @param ... 						其他参考jQuery的ajax配置参数
	 */
	flyjs.get = function(url, opts) {
		flyjs.ajax(flyjs.extend(opts, {
			url : url,
			type : "GET"
		}));
	};
	/**
	 * ajax POST请求
	 * 参数说明同flyjs.get
	 */
	flyjs.post = function(url, opts) {
		flyjs.ajax(flyjs.extend(opts, {
			url : url,
			type : "POST"
		}));
	};
	/**
	 * 事件委托
	 * @param {DOM} 		selector 	目标对象
	 * @param {String} 		eventName 	事件类型
	 * @param {Function} 	method 		事件函数
	 * @param {DOM} 		context 	作用域
	 */
	flyjs.live = function(selector, eventName, method, context) {
		jQuery(selector, context).live(eventName, method);
	};
	flyjs.die = function(selector,eventName,context){
	    jQuery(selector,context).die(eventName);
	};
	flyjs.g = function(id, context) {
		return jQuery("#" + id, context);
	};
	flyjs.q = function(clazz, context) {
		return jQuery("." + clazz, context);
	};

})();