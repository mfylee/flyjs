
define(function(require, exports, module){

    var uri = {};
    /**
     * URI拼接
     * uri.join("/path", "/to/", "home", "../school", "./index.html")
     * @returns {string}
     */
    uri.join = function(/*urls*/){
       if(arguments.length == 0){
           return "";
       }
       var array = [arguments[0]];
       for(var i=1; i<arguments.length; i++){
           var arg = arguments[i];
           array = array.concat(arg.split("/"));
       }
       var path = [array[0]];
       for(var i=1; i<array.length; i++){
           var part = array[i];
           if(part == ".."){
               path.pop();
               path.pop();
           }else if(part == "."){
               //do nothing
               path.pop();
           }else{
               path.push(part);
           }
       }
       return path.join("/");
    };
    /**
     * 获取基准目录
     * @param path
     * @returns {string}
     */
    uri.dirname = function(path){
        var parts = path.split("/");
        parts.pop();
        return parts.join("/");
    };
    /**
     * query解析为对象
     * @param query
     * @returns {{}}
     */
    uri.parseQuery = function(query){
        console.log(query);
        var param = {};
        var arr = query.split("&");
        for(var i=0; i<arr.length; i++){
            var part = arr[i].split("=");
            param[part[0]] = decodeURIComponent(part[1]);
        }
        return param;
    };

    return uri;
});