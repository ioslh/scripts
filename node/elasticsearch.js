#! /usr/local/bin/node
var Q    = require('q');
var fs   = require('fs');
var ElasticSearch = require('elasticsearch');
var cheerio = require('cheerio');



// 本地测试配置
var esConfig = {
  index:'support.bugtags.com',
  type:'posts',
  host: 'es.test.bugtags.com',
  port: 80
}


var languages = {
  'zh':'zh',
  'en':'en'
};


function fillDigit(s){
  s = '' + s;
  if(s.length === 1){
    return '0' + s;
  }else{
    return s;
  }
}


function formatTime(d){
  var s = (new Date(d));
  var str = '';
  str = '' + s.getFullYear() + '-' + fillDigit( s.getMonth() + 1 ) + '-' + fillDigit(s.getDate()) + ' ' + fillDigit(s.getHours()) + ':' + fillDigit(s.getMinutes()) + ':' + fillDigit(s.getSeconds());
  return str;
}


function formatPath(p,language){
  return '/' + language + '/' + p.replace(/md$/,'html');
}


function formatContent(data){

  var $ = cheerio.load(data,{
    decodeEntities:false
  });

  var str = $('.book-body section.normal').html();


  return stripTag(formatEntities(str));
}


function formatEntities(str){
  return str = str.replace(/&#x([a-zA-Z0-9]{4});/g,function(){
    var code = parseInt(arguments[1],16);
    return String.fromCharCode(code);
  })
}


function stripTag(str){
  return str.replace(/<[^>]+>/g,'');
}


function readMD(path,title,base,language){
  // 实际上，现在是读 html 了；
  var deferred = Q.defer();

  //var url = base + path;
  var url = '_site/' + language + '/' + path.replace(/md$/,'html');

  fs.readFile(url,'utf-8',function(err,data){
    if(err){
      deferred.reject(err);
    }else{
      var meta = fs.statSync(base + path);
      var obj = {
        title:title,
        url:formatPath(path,language),
        content:formatContent(data),
        atime:formatTime(meta.atime),
        mtime:formatTime(meta.mtime),
        ctime:formatTime(meta.ctime)
      };
      deferred.resolve(obj);
    }
  });
  return deferred.promise;
}


function readLanguage(language){
  console.log("Reading language directories: " + language);
  var deferred = Q.defer();

  var base = 'source/' + language + '/';

  fs.readFile(base + 'SUMMARY.md','utf-8',function(err,data){
    if(err) return "Something wrong";


    var summary = data;
    var titles = [],links = [];
    summary.replace(/\[([^\]]+)\]\(([^)]+)\)/mg,function(){
      links.push(arguments[2]);
      titles.push(arguments[1]);
    });

    Q.all(function(){
        var result = [];
        for(var i=0;i<links.length;i++){
          result.push(readMD(links[i],titles[i],base,language));
        };
        return result;
    }())
    .then(function(result){
      console.log('Reading language directories: ' + language + ', done. ');
      deferred.resolve(result);
    }).fail(function( err ){
      console.log( "oops");
      console.log( err );
    });
  });
  return deferred.promise;
}


Q.all([readLanguage('zh')]).then(function(data){
  // console.log(data);

  var hybridData = data[0];

  console.log('总共有 ' + hybridData.length + ' 篇文档；');

  // console.log(hybridData);

  var client = new ElasticSearch.Client({
    host:esConfig.host + ':' + esConfig.port
  });

  // console.log('暂时停止更新索引');

  // 这是当前的索引状况
  // client.indices.getMapping(function( err , map ){
  //   console.log( '当前索引状况' );
  //   console.log( JSON.stringify( map , null , '  ' ));
  // });
  //
  // return;

  var body = {
    mappings:{
      posts:{
        _source:{
          enabled:true
        },
        properties:{
          title:{
            type:"string",
            analyzer:"ik_syno",
            term_vector:'with_positions_offsets',
            search_analyzer:"ik_syno"
          },
          content:{
            type:"string",
            analyzer:"ik_syno",
            term_vector : 'with_positions_offsets',
            search_analyzer : 'ik_syno'
          },
          url:{
            type:"string",
            index:"not_analyzed"
          },
          atime:{
            type:'date',
            format:'yyyy-MM-dd HH:mm:ss'
          },
          mtime:{
            type:'date',
            format:'yyyy-MM-dd HH:mm:ss'
          },
          ctime:{
            type:'date',
            format:'yyyy-MM-dd HH:mm:ss'
          }
        }
      }
    }
  }

  body = JSON.stringify( body );

  console.log( '删除原有索引...');
  client.indices.delete({
    index:esConfig.index
  },function(){
    console.log('创建新的索引...');
    client.indices.create({
      index:esConfig.index,
      body:body
    },function(){
      console.log('添加文档的索引...');
      var promises = [];
      for(var i = 0;i<hybridData.length;i++){
        var cur = hybridData[i];
        promises.push(
          client.index({
            index:esConfig.index,
            type:esConfig.type,
            body:cur
          },function(err,res){
            if(err) console.log(err);
          })
        );
      }

      Promise.all(promises).then(function(){
        console.log('全部文章索引建立完成。')
      })

    })
  })
});
