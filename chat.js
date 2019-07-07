var express=require('express');
var Nexmo=require('nexmo');
var app=express();
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);

app.set("view engine",'ejs'); 

app.use(express.static('./public'));

var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended: false});

const nexmo = new Nexmo({
  apiKey: '0aabd16f',
  apiSecret: 'sxBlxAb8zkpkxPSU'
},{debug:true});

var mongoose=require('mongoose');

mongoose.connect('mongodb://chatapp:chatapp1@ds157735.mlab.com:57735/chatapp_project');

var PersonalSchema = new mongoose.Schema({
  from:String,
  msgs:Array
});

var UserSchema= new mongoose.Schema({
 name:String,
 number:String,
 pic:String,
 msgsfrom:Array,
 pm:PersonalSchema
});

var User= mongoose.model('User',UserSchema); 

server.listen(8080);

app.get('/',function(req,res){
   res.render('chatsignin');
});

app.post('/msg',urlencodedParser,function(req,res){

  app.locals.number=req.body.number;
  var message=Math.floor(Math.random()*147 + 2548);
    
  //nexmo.message.sendSms('Nexmo',number,message);
  res.render('aftercode',{data:message});
});

app.post('/codesent/:code',urlencodedParser,function(req,res){

  //if(req.params.code===req.body.code){
   // res.sendFile(__dirname + '/chat.html');
  //}
  //else{
    //res.redirect('/');
 // }
 res.render('profile');
});

app.post('/profile/:name',function(req,res){
   var query={name:req.params.name};
   User.find(query,function(err,data){
    if(err) throw err;
    res.render('profilepage',{data:data});
  });
});

app.post('/chat/:name',function(req,res){
  var query = {name:req.params.name};
  User.find(query,function(err,data){
    if(err) throw err;
    res.render('privatechat',{data:data});
});
});
+
app.post('/profiledone',urlencodedParser,function(req,res){
  
  app.locals.name=req.body.name;
  app.locals.pic=req.body.file;
  var user1=User({name:req.body.name,number:req.body.number,pic:req.body.file}).save(function(err){
    if(err) throw err;
  const query = {name : req.body.name};
  User.find(query,function(err,data){
    if(err) throw err;
    if(data.length>0){
       res.render('mainchat',{msgsfrom:data[0].msgsfrom});
    }
});});
});

app.post('/directenter/:name' , function(req,res){
  const query = {name : req.params.name};
  User.find(query , function(err,data){
    if(err) throw err;
    if(data.length > 0){
      res.render('mainchat',{name:data[0].name,number:data[0].number,pic:data[0].pic,msgsfrom:data[0].msgsfrom});
    }
  })
});

var usernames=[];var c=0;var value=0;

io.sockets.on('connection',function(socket){
        
    
   socket.on('new user',function(data){
        for(var i=0;i<usernames.length;i++)
        {
          if(data==usernames[i].name){
              if(usernames[i].cls=='active'){
                c=1;
                break;
              }
              else {
                usernames.splice(i,1);
                usernames[i].cls='active';
                c=2;
                update();
                break;
              }
          }
        }
        if(c==0)
         {
          usernames.push({uid:socket.id,name:data,cls:'active'});
          io.sockets.emit('adduser',{name:data,uid:socket.id});
          update();
         }
        else
        { 
          if(c==1){
          c=0;socket.emit('userExists', data + ' username is taken! Try some other username.');
        }}
   });
   
   function update(){
    c=0;
    io.sockets.emit('users',usernames);
  }

   socket.on("send message",function(data){
     io.sockets.emit('new message',{msg:data.msg,name:data.nme});
   
   });

   socket.on('change',function(data){
      for(var k=0;k<usernames.length;k++){
      if(data.name==usernames[k].name)
      {socket.emit('userExists', data.name + ' username is taken! Try some other username.');}
      else{
      if(usernames[k].name==data.prst)
        usernames[k].name=data.name;
    }}
    update();
   });

   socket.on('disconnect', function () {
    for(var i=0;i<usernames.length;i++){
      if(usernames[i].uid==socket.id)
        usernames[i].cls='disactive';
    }
    update();
  });

   socket.on('checkuid',function(data){
    for(var d=0;d<usernames.length;d++){
      if(usernames[d].name == data.name){
        const query = {name : data.name };
        User.find(query,function(err,data){
          if(err) throw err;
          if(data.length > 0){
            socket.emit('userfound',{usr:data[0].name});
          }
        });
      }
    }
   });

   socket.on('fromname',function(data){
    for(var d=0;d<usernames.length;d++){
      if(usernames[d].uid == data.id){
        console.log(usernames[d].name)
        socket.emit('gotfrom',{name:usernames[d].name});
        const query = {name : usernames[d].name};
        socket.on('store',function(data){
          User.update(query,{$push:{msgfrom:data.from}},function(err){
          if(err) throw err;
          console.log('done');
        });
      });
    }
   }

});

socket.on('storemsgs',function(data){
 var msgs =[];
 const query1 = {name : data.by};
 const query2 = {name : data.to};
 const msg = data.msg;
 const by = data.by;
 const to = data.to;
 User.find(query2,function(err,data){
  if(err) throw err;
  if(data.length>0){
    msgs = data[0].pm.msgs;
    //User.update(query1,{$push:{pm:{from:by , msgs:}})
  }
 }).then(() => {
    socket.emit('newmsg' , {msg : msg , name : by})
 })

});


});