/*
压缩前分析require-async
*/
'use strict';

var SCRIPT_REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|(<script[^>]*>)([\s\S]*?)<\/script>/ig;
var REQUIRE_ASYNC_REG = /'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|require\.async\(([\s\S]+?)(?=,\s*function\(|\))/g, URL_REG = /['"]([^'"]+)['"]/g;

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

                    file.addRequire($1);
                    return '"' + $1 + '"';
                }

                return all;
            });
        }

        return $0;
    });
}

module.exports = function(content, file, conf){
    if(file.isHtmlLike){
        content = content.replace(SCRIPT_REG, function($0, $1, $2){
            if($2){
                return $1 + toRealPath($2, file) + '</script>';
            }

            return $0;
        });
    }else if(file.isJsLike){
        if(!file.isMod){
            content = toRealPath(content, file);
        }
    }

    return content;
};