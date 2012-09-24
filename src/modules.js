/**
 * 模块管理
 * @require Template.js
 * @author lifayu@meifuzhi.com
 * @date 2012-3-9
 * @version 1.0
 */
(function() {
	window.flysj = flyjs || {};
	flyjs.Modules = flyjs.Modules || {};
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
				flyjs.ajax(m.extend({
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