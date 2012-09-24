/**
 * 模型层
 * @author lifayu@meifuzhi.com
 * @date 2012-3-9
 * @version 1.0
 */
(function() {
	window.flyjs = flyjs || {};
	flyjs.Model = flyjs.Model = {};
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