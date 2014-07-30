/**
 * mvc基础框架
 * @author lifayu@baidu.com
 * @since 2014-07-30
 * @version v2.0.0
 */
define(function(require, exports, module){

    var jQuery = $ = require("jquery");

    window["$FLYJS$"] = {};
    //用于存储对象实例
    window["$FLYJS$"]._instances = {};
    var flyjs = {
        version: "2.0.0"
    };

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

    (function(){
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

        /**
         * 基础类构造器
         * @author lifayu@baidu.com
         * @date 2012-07-06
         */
        flyjs.extend(flyjs.Class, {
            _base : {
                init : function() {
                },
                getCallRef : function() {
                    return "window['$FLYJS$']._instances['" + this.guid + "']";
                },
                getCallString : function(fn) {
                    var i = 0, arg = Array.prototype.slice.call(arguments, 1), len = arg.length;
                    for(; i < len; i++) {
                        if( typeof arg[i] == "string") {
                            arg[i] = "'" + arg[i] + "'";
                        }
                    }
                    return this.getCallRef() + '.' + fn + '(' + arg.join(",") + ');';
                },
                dispose : function() {
                    delete window["$FLYJS$"]._instances[this.guid];
                }
            },
            /**
             * 创建构造函数
             * @param {Function} constructor	构造函数
             * @param {Object} attr				原型方法,默认属性
             * @return Function(Class)
             */
            createClass : function(constructor, attr) {
                var me = this;

                var attr = attr || {};
                var opts = flyjs.extend({}, me._base, attr);

                return flyjs.createClass(constructor, opts);
            }
        });
    })();
    /**
     * 模型层
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */

    (function(){
        /**
         * 构造Model实体
         * @example
         * 	var Model = flyjs.Model.createClass(function(){
         *		//constructor
         *		this.name = "";
         *		this.age = "2";
         *	},{
         *		//protect
         *		getAge:function(){
         *			return this.age;
         *		}
         *	}).extend({
         *		//public
         *		setName:function(name){
         *			this.name = name;
         *		},
         *		getName:function(){
         *			return this.name;
         *		}
         *	});
         */
        flyjs.extend(flyjs.Model, {
            _base : {
                //初始化方法，默认调用
                _init : function() {
                },
                /**
                 * 设置或获取属性，类似java的getter/setter
                 * @param {String} a         属性名称
                 * @param {String|Object} b  如果存在，则为设置属性
                 */
                attr : function(a, b) {
                    var me = this;

                    var old = me[a];
                    if(arguments.length > 1) {
                        if(old != b) {
                            me[a] = b;
                            me.dispatchEvent("onchange", a, old, b);
                        }
                    } else {
                        return old;
                    }
                },
                /**
                 * 判断属性是否存在
                 * @param {String} attr 属性名称
                 */
                has : function(attr) {
                    return typeof this[attr] != "undefined";
                },
                /**
                 * 获取数据
                 * 使用get方式
                 * @param {String} url          请求地址
                 * @param {Object} opts         请求配置信息（data，success，error等）
                 * @param {Function} callback   回调函数，用于Model获取返回结果
                 */
                fetch : function(url, opts, callback) {
                    var me = this;
                    function realFun(opts) {
                        var fun = opts.success;
                        return function(json) {
                            if( typeof callback == "function") {
                                callback.call(me, json);
                            }
                            fun.call(this, json);
                        }
                    }


                    opts.success = realFun(opts);
                    flyjs.get(url, opts);
                },
                /**
                 * 保存数据
                 * 使用POST方式，参数参考flyjs.Base
                 */
                save : function(url, opts) {
                    var me = this;
                    var opts = flyjs.extend({
                        //这里是默认配置
                    }, opts);
                    function realFun(opts) {
                        var fun = opts.success;
                        return function(json) {
                            //flyjs.extend(me.attributes, opts.data);
                            fun.call(this, json);
                        }
                    }


                    opts.success = realFun(opts);
                    flyjs.post(url, opts);
                },
                /**
                 * 修改属性时触发
                 * @param {String}attr		change的字段
                 * @param {Object}oldValue	旧值
                 * @param {Object}newValue	新值
                 */
                onchange : function(attr, oldValue, newValue) {
                },
                dispose : function() {
                    delete window["$FLYJS$"]._instances[this.guid];
                }
            },
            /**
             * 创建构造函数
             * @param {Function} constructor	构造函数
             * @param {Object} attr				原型方法,默认属性
             * @return Function(Class)
             */
            createClass : function(constructor, attr) {
                var me = this;
                var attr = attr || {};
                var opts = flyjs.extend({}, me._base, attr);

                return flyjs.createClass(constructor, opts);
            },
            extend : function(opts) {
                return new (flyjs.Model.createClass(function(){},opts))();
            }
        });
    })();
    /**
     * 视图层
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */
    (function(){
        flyjs.extend(flyjs.View, {
            _base : {
                id : "",
                uiType : "",
                getId : function(key) {
                    var ui = this, idPrefix;
                    idPrefix = "FLYJS-" + ui.uiType + "--" + (ui.id ? ui.id : ui.guid);
                    return key ? idPrefix + "-" + key : idPrefix;
                },
                getClass : function(key) {
                    var me = this, className = me.classPrefix || "flyjs-" + me.uiType.toLowerCase();
                    if(key) {
                        className += "-" + key;
                    }
                    return className;
                },
                init : function() {
                },
                _init : function() {
                    this.init();
                    this.__bindEvent();
                },
                getMain : function() {
                    return document.getElementById(this.getId());
                },
                /**
                 * 获取引用对象字符串
                 */
                getCallRef : function() {
                    return "window['$FLYJS$']._instances['" + this.guid + "']";
                },
                getCallString : function(fn) {
                    var i = 0, arg = Array.prototype.slice.call(arguments, 1), len = arg.length;
                    for(; i < len; i++) {
                        if( typeof arg[i] == "string") {
                            arg[i] = "'" + arg[i] + "'";
                        }
                    }
                    arg.push('this');
                    arg.push('event');
                    return this.getCallRef() + '.' + fn + '(' + arg.join(",") + ');';
                },
                dispose : function() {
                    var me = this;
                    for(var key in me.events){
                        var match = key.match(/^(\S+)\s*(.*)$/);
                        var eventName = match[1], selector = match[2];
                        flyjs.die(selector, eventName, me.el);
                    }
                    delete window["$FLYJS$"]._instances[this.guid];
                },
                __bindEvent : function() {
                    var me = this;
                    var events = me.events;
                    function realListener(method) {
                        return function(event, target) {
                            method.call(me, event,this);
                        };
                    }

                    if(events) {
                        for(var key in events) {
                            var method = events[key];
                            var match = key.match(/^(\S+)\s*(.*)$/);
                            var eventName = match[1], selector = match[2];
                            if(typeof method == "function"){
                                flyjs.live(selector, eventName, realListener(method), me.el);
                            }else {
                                method = me[events[key]];
                                if(!method)
                                    throw new Error('Event "' + events[key] + '" does not exist');
                                flyjs.live(selector, eventName, realListener(method), me.el);
                            }
                        }
                    }
                }
            },
            /**
             * 创建构造函数
             * @param {Function} constructor	构造函数
             * @param {Object} attr				原型方法,默认属性
             * @return Function(Class)
             */
            createClass : function(constructor, attr) {
                var me = this;

                var attr = attr || {};
                var opts = flyjs.extend({}, me._base, attr);

                return flyjs.createClass(constructor, opts);
            },
            extend : function(opts) {
                return new (flyjs.View.createClass(function(){},opts))();
            }
        });
    })();
    /**
     * 模块管理
     * @require Template.js
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */
    (function(){

        var modules = {};
        flyjs.extend(flyjs.Modules, {
            /**
             * 模块注册
             * @param {String} name 模块名称或命名空间
             * @param {String} path 当type=="url"时，表示模块路径，当type=="script"时，表示节点ID，否则为模块内容
             * @param {String} type 模块类型（可选）url/script
             */
            add : function(name, path, type) {
                var parts = name.split(".");
                var parent = ns = modules;
                flyjs.each(parts, function(name) {
                    parent = ns;
                    ns[name] = ns[name] || {};
                    ns = ns[name];
                });
                name = parts.pop();
                if( typeof type != "undefined" && type == "url") {
                    parent[name] = {
                        name : name,
                        path : path
                    };
                } else if(type == "script") {
                    parent[name] = {
                        name : name,
                        text : document.getElementById(path).innerHTML
                    };
                } else {
                    parent[name] = {
                        name : name,
                        text : path
                    };
                }
            },
            /**
             * 使用模块
             * @param {String} name				模块名称或命名空间
             * @param {Function} callback(text)	回调函数,text表示模块内容
             * @config {Boolean}{opts.isCache}	是否支持缓存，默认true。
             */
            use : function(name, callback, opts) {
                var parts = name.split(".");
                var parent = ns = modules;
                var isCache = true;
                if(opts && typeof opts.isCache != "undefined")
                    isCache = opts.isCache;
                flyjs.each(parts, function(name) {
                    parent = ns;
                    ns[name] = ns[name] || {};
                    ns = ns[name];
                });
                name = parts.pop();
                var mod = parent[name];
                if( typeof mod.text != "undefined" && isCache) {
                    callback(mod.text);
                } else {
                    flyjs.ajax(flyjs.extend({
                        url : mod.path,
                        type : "GET",
                        success : function(htm) {
                            //支持单tpl多模块
                            var tpl = htm.split(/\n-{5,}.+?-{5,}\n/);
                            mod.text = tpl.length == 1 ? tpl[0] : tpl;
                            callback(mod.text);
                        },
                        error : function() {
                            alert("Error when load Module:[" + mod.name + "]！");
                        }
                    }), opts);
                }
            },
            /**
             * 模块预加载
             * @param {String} name	模块名称
             */
            preload : function(name) {
                flyjs.Modules.use(name, function() {
                }, {
                    async : false
                });
            },
            /**
             * 获取模版内容
             */
            get : function(name) {
                var ret;
                var arr = name.match(/([^\[]+)(\[(\d+)\])?/);
                flyjs.Modules.use(arr[1], function(text) {
                    ret = text;
                }, {
                    async : false
                });
                var index = parseInt(arr[3]);
                if( typeof arr[3] != "undefined" && flyjs.isNumber(index)) {
                    return ret[index];
                }
                return ret;
            },
            /**
             * 模版格式化
             * @param {String}name	Modules name
             * @param {Object}data	待填充数据
             */
            template : function(name, data) {
                return flyjs.template(flyjs.Modules.get(name), data);
            }
        });
        flyjs.addModule = flyjs.Modules.add;
        flyjs.useModule = flyjs.Modules.use;

    })();
    /**
     * javascript模版引擎
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */
    (function() {
        flyjs.extend(flyjs.Template, {
            /**
             * 字符串格式化
             * @param {String} str		目标字符串
             * @param {Object} opts		填充参数
             * @return {String}
             */
            format : function(str, opts) {
                str = String(str);
                return str.replace(/#{(.+?)}/g, function(match, key) {
                    var replacer = opts[key];
                    if( typeof replacer == "function") {
                        replacer = replacer(key);
                    }
                    return ('undefined' == typeof replacer ? '' : replacer);
                });
            },
            //语句
            evaluate : /<\?([\s\S]+?)\?>/g,
            //表达式
            interpolate : /<\?=([\s\S]+?)\?>/g,
            //模版函数缓存
            _tpls : {},
            /**
             * 模版引擎
             * 参考：underscore.js
             * @param {String} str      目标字符串
             * @param {Object} data     填充数据(可选)
             */
            template : function(str, data) {
                if( typeof flyjs.Template._tpls[str] != "undefined") {
                    var func = flyjs.Template._tpls[str];
                    return data ? func(data) : func;
                }
                var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(flyjs.Template.interpolate, function(match, code) {
                    var modifier = "", args = []
                    arr = code.split(/[|:]/);
                    code = arr[0];
                    if( typeof arr[1] != "undefined") {
                        if(/^@.+?/.test(arr[1])) {
                            modifier = arr[1].substr(1);
                        } else {
                            modifier = "flyjs.Template.modifier." + arr[1];
                        }
                        for(var i = 2; i < arr.length; i++) {
                            args.push(',"' + arr[i].replace(/"/g, '\\"') + '"');
                        }
                    }
                    return "'," + modifier + "(" + code.replace(/\\'/g, "'") + args.join("") + "),'";
                }).replace(flyjs.Template.evaluate || null, function(match, code) {
                        return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                    }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
                var func = new Function('obj', tmpl);
                flyjs.Template._tpls[str] = func;
                return data ? func(data) : func;
            },
            modifier : {
                //编码
                escape : function(v, type) {
                    switch(type) {
                        case "javascript":
                        case "js":
                            return v.replace(/(['"\/\\])/g, "\\$1");
                            break;
                        case "htmljs":
                            return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(['"\/\\])/g, "\\$1");
                            break;
                        case "jshtml":
                            return v.replace(/(['"\/\\])/g, "\\$1").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                            break;
                        case "url":
                            return encodeURIComponent(v);
                            break;
                        case "quotes":
                            return v.replace(/"/g, "&#34;").replace(/'/g, "&#39;");
                            break;
                        case "html":
                        default:
                            return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                    }
                },
                //默认值
                dft : function(v, dft) {
                    return v || dft;
                },
                //小写
                lower : function(v) {
                    return v.toLowerCase();
                },
                //大写
                upper : function(v) {
                    return v.toUpperCase();
                },
                //换行符替换成<br/>
                nl2br : function(v) {
                    return v.replace(/\n/g, "<br/>");
                },
                //为目标字符串添加wbr软换行
                wbr : function(v) {
                    return v.replace(/(?:<[^>]+>)|(?:&#?[0-9a-z]{2,6};)|(.{1})/gi, '$&<wbr>').replace(/><wbr>/g, '>');
                },
                //替换
                replace : function(v, s, d) {
                    return v.replace(s, d);
                },
                //正则替换
                regex_replace : function(v, regex, d) {
                    return v.replace(new RegExp(regex), d);
                },
                //去除多余空格
                strip : function(v) {
                    var trimer = new RegExp("(^[\\s\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\s\\t]+\x24)", "g");
                    return v.replace(trimer, "");
                },
                //string_format:function(v){},
                //字符串截取
                truncate : function(source, length, tail) {
                    function getByteLength(source) {
                        return String(source).replace(/[^\x00-\xff]/g, "ci").length;
                    }

                    tail = tail || "";
                    if(length < 0 || getByteLength(source) <= length) {
                        return source;
                    }
                    source = source.substr(0, length).replace(/([^\x00-\xff])/g, "\x241 ")//双字节字符替换成两个
                        .substr(0, length)//截取长度
                        .replace(/[^\x00-\xff]$/, "")//去掉临界双字节字符
                        .replace(/([^\x00-\xff]) /g, "\x241");
                    //还原
                    return source + tail;
                },
                //去除html标签
                strip_tags : function(v) {
                    return v.replace(/<[^>]+>/g, '');
                },
                //日期格式化
                date_format : function(v, pattern) {
                    var date = new Date(Date.parse(v));
                    var o = {
                        "M+" : date.getMonth() + 1,
                        "d+" : date.getDate(),
                        "H+" : date.getHours(),
                        "m+" : date.getMinutes(),
                        "s+" : date.getSeconds()
                    };
                    pattern = pattern.replace(/(y+)/, function() {
                        return String(date.getFullYear()).substr(4 - arguments[0].length);
                    });
                    for(var i in o) {
                        pattern = pattern.replace(new RegExp("(" + i + ")"), function() {
                            return ("00" + o[i]).substr(String(o[i]).length);
                        });
                    }
                    return pattern;
                }
            }
        });
        flyjs.format = flyjs.Template.format;
        flyjs.template = flyjs.Template.template;
        flyjs.modifier = flyjs.Template.modifier;
    })();
    /**
     * 历史管理
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */
    (function() {
        var hashStrip = /^#*/;
        var isExplorer = /msie [\w.]+/;
        var historyStarted = false;

        flyjs.History = function() {
            this.handlers = [];
            this.interval = 100;
        };
        flyjs.extend(flyjs.History.prototype, {

            getFragment : function(fragment) {
                if(fragment == null) {
                    fragment = window.location.hash;
                }
                try { //解决 “ % ” 不能decodeURIComponent的问题
                    return decodeURIComponent(fragment.replace(hashStrip, ''));
                } catch(e) {
                    return fragment.replace(hashStrip, '');
                }
            },
            start : function() {
                var me = this;
                if(historyStarted)
                    return;
                var fragment = me.getFragment();
                var docMode = document.documentMode;
                var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
                if(oldIE) {
                    var ifr = document.createElement("iframe");
                    //ifr.src = "javascript:0";
                    ifr.setAttribute("src", "javascript:0;");
                    ifr.setAttribute("tabindex", -1);
                    ifr.style.display = "none";
                    document.body.appendChild(ifr);
                    me.iframe = ifr.contentWindow;
                    me.navigate(fragment);
                }
                if('onhashchange' in window && !oldIE) {
                    window.onhashchange = function() {
                        me.checkUrl();
                    }
                } else {
                    setInterval(function() {
                        me.checkUrl();
                    }, me.interval);
                }
                me.fragment = fragment;
                historyStarted = true;
                me.loadUrl();
            },
            /**
             * 注册路由规则
             * @param {RegExp}route			路由规则
             * @param {Function}callback	回调函数
             */
            addRouter : function(route, callback) {
                this.handlers.unshift({
                    route : route,
                    callback : callback
                });
            },
            checkUrl : function(event) {
                var me = this;
                var current = me.getFragment();
                if(current == me.fragment && me.iframe) {
                    current = me.getFragment(me.iframe.location.hash);
                }
                var tmpfragment = me.fragment;
                try { //解决 “ % ” 不能decodeURIComponent的问题
                    tmpfragment = decodeURIComponent(me.fragment);
                } catch(e) {
                }
                if(current == me.fragment || current == tmpfragment) {
                    return false;
                }
                if(me.iframe) {
                    me.navigate(current);
                }me.loadUrl() || me.loadUrl(window.location.hash);
            },
            loadUrl : function(fragmentOverride) {
                var me = this;
                var fragment = me.fragment = me.getFragment(fragmentOverride);

                var matched = false;

                flyjs.each(me.handlers, function(item, i) {
                    if(item.route.test(fragment)) {
                        item.callback(fragment);
                        matched = true;
                    }
                });
                return matched;
            },
            navigate : function(fragment, triggerRoute) {
                var me = this;
                var frag = (fragment || '').replace(hashStrip, '');
                if(me.fragment == frag || me.fragment == decodeURIComponent(frag))
                    return;
                window.location.hash = me.fragment = frag;
                var loc = me.iframe.location;
                if(me.iframe && (frag != me.getFragment(me.iframe.location.hash))) {
                    me.iframe.document.open().close();
                    me.iframe.location.hash = frag;
                }
                if(triggerRoute) {
                    me.loadUrl(fragment);
                }
            }
        });
    })();

    /**
     * Router 路由管理
     * @author lifayu@baidu.com
     * @date 2012-3-9
     * @version 1.0
     */
    /**
     * @param {Object} opts.routes
     * @example
     * var Router = flyjs.Router.createClass(function(){},{
     *  routes:{
     * 		"!/home/:uid":"home"
     *  },
     *  home:function(uid){
     * 		console.log(uid);
     *  }
     * });
     */
    (function() {

        var namedParam = /:([\w\d]+)/g;
        var splatParam = /\*([\w\d]+)/g;
        var escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

        /**
         * 以^开头，以$结尾的字符串作为正则表达式处理
         */
        function isRegExp(str) {
            return /^\^.*?\$$/.test(str);
        }


        flyjs.extend(flyjs.Router, {
            _base : {
                routes : {},
                _init : function() {
                    var routes = [];
                    for(var route in this.routes) {
                        routes.unshift([route, this.routes[route]]);
                    }
                    for(var i = 0, l = routes.length; i < l; i++) {
                        this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
                    }
                },
                /**
                 * 注册路由规则
                 * @param {String} route
                 * @param {String} name
                 * @param {Function} callback
                 */
                route : function(route, name, callback) {
                    var me = this;
                    flyjs.history || (flyjs.history = new flyjs.History());
                    if(!isRegExp(route)) {
                        route = me._routeToRegExp(route);
                    } else {
                        route = new RegExp(route);
                    }

                    flyjs.history.addRouter(route, function(fragment) {
                        var args = me._extractParameters(route, fragment);
                        callback.apply(me, args);
                    });
                },
                /**
                 * 触发路由
                 * @param {String} fragment 路由地址
                 * @param {Boolean} triggerRoute 是否要执行路由函数
                 */
                navigate : function(fragment, triggerRoute) {
                    flyjs.history.navigate(fragment, triggerRoute);
                },
                //将路由规则转换为正则表达式
                _routeToRegExp : function(route) {
                    route = route.replace(escapeRegExp, "\\$&").replace(namedParam, "([^\/]*)").replace(splatParam, "(.*?)");
                    return new RegExp('^' + route + '$');
                },
                //分隔路由参数
                _extractParameters : function(route, fragment) {
                    return route.exec(fragment).slice(1);
                }
            },
            /**
             * 创建构造函数
             * @param {Function} constructor	构造函数
             * @param {Object} attr				原型方法,默认属性
             * @return Function(Class)
             */
            createClass : function(constructor, attr) {
                var me = this;

                var attr = attr || {};
                var opts = flyjs.extend({}, me._base, attr);

                return flyjs.createClass(constructor, opts);
            },
            extend : function(opts) {
                return new (flyjs.Router.createClass(function(){},opts))();
            }
        });

    })();

    return flyjs;
});
