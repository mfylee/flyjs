/**
 * 基础类构造器
 * @author lifayu@meifuzhi.com
 * @date 2012-07-06 
 */
(function(){
	window.flyjs = flyjs || {};
    flyjs.Class = flyjs.Class || {};
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