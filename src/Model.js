/**
 * flyjs Model
 */
(function(flyjs){
	flyjs.Model.Base = {
        __error:0,
        //初始化方法，默认调用
		init:function(){},
        //模型数据维护
		attributes:{},
        /**
         * 设置或获取属性
         * @param {String} arguments[0]         属性名称
         * @param {String|Object} arguments[1]  如果存在，则为设置属性
         */
		attr:function(){
			var me = this;
			if(arguments.length > 1){
				var old = me.attributes[arguments[0]];
				if(old != arguments[1]){
					me.attributes[arguments[0]] = arguments[1];
					me.dispatchEvent("onchange");
				}
			}else{
				return me.attributes[arguments[0]];
			}
		},
        /**
         * 获取数据
         * 使用get方式
         */
        fetch:function(url,opts){
            flyjs.get(url,opts);
        },
        /**
         * 保存数据
         * 使用POST方式，参数参考flyjs.Base
         */
        save:function(url,opts){
            var me = this;
            var opts= flyjs.extend({
                //这里是默认配置
                validError:function(){}
            },opts);
            if(me.validator(opts.data,opts)){
                function realFun(opts){
                    var fun = opts.success;
                    return function(json){
                        flyjs.extend(me.attributes,opts.data);
                        fun.call(this,json);
                    }
                }
                opts.success = realFun(opts);
                flyjs.post(url,opts);
            }else{
                opts.validError(me);
            }
        },
        /**
         * 判断属性是否存在
         * @param {String} attr 属性名称
         */
        has:function(attr){
            return typeof this.attributes[attr] != "undefined";
        },
        rules:{},
        validator:function(data,opts){
            var me = this;
            me.__error = 0;
            flyjs.each(data,function(value,key){
                if(typeof me.rules[key] == "function"){
                    if(!me.rules[key].call(me,value,data)){
                        me.__error++;
                        //TODO 共享message
                        opts.validError(me,key);
                    }
                }
            });
            return me.__error == 0;
        },
		onchange:function(){},
		dispatchEvent:function(evt){
			var me = this;
			if(evt && me[evt]){
				return me[evt].apply(me,Array.prototype.slice.call(arguments,1));
			}
		},
		ondispose:function(){
			delete window["$FLYJS$"]._instances[this.guid];
		}
	};
	flyjs.Model.createClass = function(constructor,opts){
		var opts = opts || {};
		var superClass = opts.superClass || function(){};
		//真正的构造函数
		var mod = function(opt){
			var me = this;
			opt = opt || {};
			superClass.call(me,(opt.guid || ""));
			constructor.apply(me);
			flyjs.extend(me,opts,opt);
			me.init();
		};
		C = function(){};
		C.prototype = superClass.prototype;
		var fp = mod.prototype = new C();
		for(var i in flyjs.Model.Base){
			fp[i] = flyjs.Model.Base[i];
		}
		mod.extend = function(json){
			for(var i in json){
				mod.prototype[i] = json[i];
			}
			return mod;
		};
		return mod;
	};
	flyjs.Model.extend = function(){
		if(arguments.length > 1){
			return flyjs.extend(true,{},arguments[0],arguments[1]);
		}else{
			return new (flyjs.Model.createClass(function(){},arguments[0]))();
		}
	};
})(flyjs);
