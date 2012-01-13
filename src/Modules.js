/**
 * flyjs Modules
 * @author lifayu@baidu.com/liuyan03@baidu.com
 */
(function(flyjs){
	var modules = {};
	flyjs.Modules = {
		/**
		 * 模块注册
		 * @param {String} name 模块名称或命名空间
		 * @param {String} path 当type=="url"时，表示模块路径，否则为模块内容
		 * @param {String} type 模块类型（可选）
		 */
		add:function(name,path,type){
			var parts = name.split(".");
			var parent = ns = modules;
			flyjs.each(parts,function(name){
				parent = ns;
				ns[name] = ns[name] || {};
				ns = ns[name];
			});
			name = parts.pop();
			if(typeof type != "undefined" && type == "url"){
				parent[name] = {
					name:name,
					path:path
				};
			}else{
				parent[name] = {
					name:name,
					text:path
				};
			}
		},
		/**
		 * 使用模块
		 * @param {String} name				模块名称或命名空间
		 * @param {Function} callback(text)	回调函数,text表示模块内容
		 * @config {Boolean}{opts.isCache}	是否支持缓存，默认true。
		 */
		use:function(name,callback,opts){
			var parts = name.split(".");
			var parent = ns = modules;
			var isCache = true;
			if(opts && typeof opts.isCache != "undefined")
				isCache = opts.isCache;
			flyjs.each(parts,function(name){
				parent = ns;
				ns[name] = ns[name]|| {}; 
				ns = ns[name];
			});
			name = parts.pop();
			var mod = parent[name];
			if(typeof mod.text != "undefined" && isCache){
				callback(mod.text);
			}else{	
				flyjs.ajax(flyjs.extend({
					url:mod.path,
					type:"GET",
					success:function(htm){
						mod.text = htm;
						callback(htm);
					},
					error:function(){
						alert("加载模块["+mod.name+"]失败！");
					}
				}),opts);
			}
		},
		/**
		 * 模块预加载
		 * @param {String} name	模块名称
		 */
		preload:function(name){
			flyjs.Modules.use(name,function(){},{
                async:false
            });
		}
	};
	flyjs.addModule = flyjs.Modules.add;
	flyjs.useModule = flyjs.Modules.use;
})(flyjs);
