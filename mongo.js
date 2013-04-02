var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var client = new Db('whitepaper', new Server("127.0.0.1", 27017, {}), {w: 1});

client.open(function(err, p_client) {
  var rooms = client.collection('rooms');

rooms.insert({'_id':1123, 'fuck':'asdfaf'},function(err,doc){
  console.log('dsfnadkfjakjdf');
});

rooms.findOne({'_id':1123, 'fuck':'asdfaf'},function(err,doc){
  if(err) console.log(err);
  console.log("shittssssssssssss");
});

console.log('fuckssssssssssssssss');
});




