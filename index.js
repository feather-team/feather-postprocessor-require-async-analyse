/*
压缩前分析require-async
*/
'use strict';

var SCRIPT_REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|(<script[^>]*>)([\s\S]*?)<\/script>/ig;
var REQUIRE_ASYNC_REG = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(?:\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|require\.async\(([\s\S]+?)(?=,\s*function\(|\))/g, URL_REG = /['"]([^'"]+)['"]/g;
var USE_REQUIRE = feather.config.get('require.use');

var path = require('path');

function toRealPath(content, file){
    return content.replace(REQUIRE_ASYNC_REG, function($0, $1){
        if($1){
            return 'require.async(' + $1.replace(URL_REG, function(all, $1){
                if($1){
                    if(!feather.util.isRemoteUrl($1) && $1[0] != '/'){
                        var tmpFile = $1[0] == '.' ? new feather.file(path.resolve(file.dirname, $1)) : feather.file.wrap($1);

                        if(tmpFile.isFile() && tmpFile.exists()){
                            $1 = tmpFile.subpath;
                        }
                    }

                    file.extras.async.push($1);
                    return '"' + $1 + '"';
                }

                return all;
            });
        }

        return $0;
    });
}

module.exports = function(content, file, conf){
    file.extras.async = [];

    if(!USE_REQUIRE) return content;

    if(file.isHtmlLike){
        content = content.replace(SCRIPT_REG, function($0, $1, $2){
            if($2){
                return $1 + toRealPath($2, file) + '</script>';
            }

            return $0;
        });

        var sameJs = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.js'));
    
        if(sameJs.exists()){
            var url = sameJs.getUrl(feather.compile.settings.hash, feather.compile.settings.domain);

            if(file.extras.async.indexOf(sameJs.subpath) == -1
                && file.extras.headJs.indexOf(url) == -1
                && file.extras.bottomJs.indexOf(url) == -1
            ){
                if(/<\/body>/.test(content)){
                    content = content.replace(/<\/body>/, function(){
                        return '<script>require.async("' + sameJs.subpath + '");</script></body>';
                    });
                }else{
                    content += '<script>require.async("' + sameJs.subpath + '");</script>';
                }
                
                file.extras.async.push(sameJs.subpath);
            }
        }
    }else if(file.isJsLike){
        content = toRealPath(content, file);
    }

    return content;
};
