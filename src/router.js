/**
 * 历史管理
 * @author lifayu@meifuzhi.com
 * @date 2012-3-9
 * @version 1.0
 */

(function() {
	window.flyjs = flyjs | {};
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
 * @author lifayu@meifuzhi.com
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
	window.flyjs = flyjs || {};
	flyjs.Router = flyjs.Router || {};

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