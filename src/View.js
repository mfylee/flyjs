/**
 * 视图层
 * @author lifayu@meifuzhi.com
 * @date 2012-3-9
 * @version 1.0
 */
(function() {
	window.flyjs = flyjs || {};
	flyjs.View = flyjs.View || {};

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
						var method = me[events[key]];
						if(!method)
							throw new Error('Event "' + events[key] + '" does not exist');
						var match = key.match(/^(\S+)\s*(.*)$/);
						var eventName = match[1], selector = match[2];
						flyjs.live(selector, eventName, realListener(method), me.el);
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