/**
 * flyjs View
 */
(function(flyjs){
	flyjs.View.Base = {
		id:"",
		uiType:"",
		getId:function(key){
			var ui = this,idPrefix;
			idPrefix = "FLYJS-"+ui.uiType + "--" + (ui.id ? ui.id : ui.guid);
			return key ? idPrefix + "-" + key : idPrefix;
		},
		getClass:function(key){
			var me = this,className = me.classPrefix;
			if(key){
				className += "-" + key;
			}
			return className;
		},
		init:function(){},
		getMain:function(){
			return $("#"+me.getId());
		},
		renderMain:function(){
			var ui = this;
			ui.getMain.attr("data-guid",ui.guid);
		},
		getCallRef:function(){
			return "window['$FLYJS$']._instances['"+this.guid+"']";
		},
		getCallString:function(fn){
			var i=0,arg = Array.prototype.slice.call(arguments,1),
				len = arg.length;
			for(;i<len;i++){
				if(typeof arg[i] == "string"){
					arg[i] = "'" + arg[i] + "'";
				}
			}
			return this.getCallRef()
					+ '.' + fn + '('
					+ arg.join(",") + ');';
		},
		dispatchEvent:function(evt){
			var me = this;
			if(evt && me[evt]){
				return me[evt].apply(me,Array.prototype.slice.call(arguments,1));
			}
		},
		ondispose:function(){
			delete window["$FLYJS$"]._instances[this.guid];
		},
		_bindEvent:function(){
			var me = this;
			var events = me.events;
			function realListener(method){
				return function(event,target){
					method.call(me,event,target);
				};
			}
			if(events){
				for(var key in events){
					var method = me[events[key]];
					if (!method) throw new Error('Event "' + events[key] + '" does not exist');
					var match = key.match(/^(\S+)\s*(.*)$/);
					var eventName = match[1], selector = match[2];
					flyjs.live(selector,eventName,realListener(method),me.el);
				}
			}
		}
	};
	/**
	 * 创建View Class
	 * @param {Function}	constructor 构造函数
	 * @param {Object}		opts		类属性或方法
	 * @return {Function} 
	 */
	flyjs.View.createClass = function(constructor,opts){
		var opts = opts || {};
		var superClass = opts.superClass || flyjs.Class;
		//真正的构造函数
		var ui = function(opt){
			var me = this;
			opt = opt || {};
			superClass.call(me,(opt.guid || ""));
			constructor.apply(me);
			flyjs.extend(me,opts,opt);
			me.classPrefix = me.classPrefix || "flyjs-" + me.uiType.toLowerCase();
			me.init();
			me._bindEvent();
		};
		C = function(){};
		C.prototype = superClass.prototype;
		var fp = ui.prototype = new C();
		for(var i in flyjs.View.Base){
			fp[i] = flyjs.View.Base[i];
		}
		ui.extend = function(json){
			for(var i in json){
				ui.prototype[i] = json[i];
			}
			return ui;
		};
		return ui;
	};
	flyjs.View.extend = function(opts){
		return new (flyjs.View.createClass(function(){},opts))();
	};
})(flyjs);
