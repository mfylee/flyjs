/**
 * javascript模版引擎
 * @author lifayu@meifuzhi.com
 * @date 2012-3-9
 * @version 1.0
 */
(function() {
	window.flyjs = flyjs || {};
	flyjs.Template = flyjs.Template || {};
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