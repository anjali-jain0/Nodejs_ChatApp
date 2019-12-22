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
  usrid:String,
  from:String,
  msgs:Array,
  name:String
});

var UserSchema= new mongoose.Schema({
 name:String,
 number:Number,
 pic:String,
 msgsfrom:Array
});

var User= mongoose.model('User',UserSchema); 
var Personal = mongoose.model('Personal',PersonalSchema);

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
  //else{++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++9+9696
    //res.redirect('/');
 // }
 res.render('profile');
});

app.post('/profile/:myname/:name',function(req,res){
   var query={name:req.params.name};
   var query1={name:req.params.myname};
   User.find(query1,function(err,data){
    if(err) throw err;
    app.locals.name=data[0].name;
    app.locals.number=data[0].number;
    app.locals.msgsfrom=data[0].msgsfrom;
    User.find(query,function(err,data){
    if(err) throw err;
    res.render('mainchat',{profile:data});
  });
   });
});

app.post('/chat/:myname/:name',function(req,res){
  var query = {name:req.params.name};
  var query1={name:req.params.myname};
  var f=0;
  User.find(query1)
  .then(data => {
    for(var i=0;i<data[0].msgsfrom.length;i++){
      if(data[0].msgsfrom[i].name==req.params.name){
        console.log('name matched so removed from msgfrom');
        f=1;
        break;
      }
    }
    if(f==1)
      return User.updateOne(query1,{$pull : {msgsfrom: { name :req.params.name}}});
    else
      return true;
  })
  .then(res => {
    return User.find(query1)
  })
  .then(data => {
    app.locals.name=data[0].name;
    app.locals.number=data[0].number;
    app.locals.msgsfrom=data[0].msgsfrom;
    //var query3 = {usrid:data[0]._id,from:req.params.name};
    var query3 = {name:req.params.myname,from:req.params.name};
    var msgs =[];
    Personal.find(query3,function(err,data){
      if(err) throw err;
      if(data.length>0){
        msgs = data[0].msgs;
      }
      User.find(query,function(err,data){
          if(err) throw err;
          res.render('privatechat',{msgs:msgs,chat:data});
        });
    });
  });
  // .then(data => {
  //   res.render('mainchat',{chat:data,chatflag:true,flag:false});

  // });
});

app.get('/showmsgs/:me/:msgfrm' , function(req,res){
    
    console.log('came to show received msgs');
    var query={name:req.params.me};
    User.find(query)
    .then(data => {
      app.locals.name=data[0].name;
      app.locals.number=data[0].number;
      app.locals.msgsfrom=data[0].msgsfrom;
      var query2 = {name:req.params.me,from:req.params.msgfrm};
      console.log(query2);
      return Personal.find(query2);
    })
    .then(data => {
      console.log('msgs');
      var msgs=data[0].msgs;
      console.log(msgs);
      return msgs;
    })
    .then(msgs => {
      var msgs=msgs;
      User.find({name:req.params.msgfrm},function(err,data){
        if(err) throw err;
        res.render('privatechat',{msgs:msgs,chat:data});
      });
    });

});

app.post('/profiledone',urlencodedParser,function(req,res){
  
  app.locals.name=req.body.name;
  app.locals.pic=req.body.file;
  var user1=User({name:req.body.name,number:req.body.number,pic:req.body.file}).save(function(err){
    if(err) throw err;
  const query = {name : req.body.name};
  User.find(query,function(err,data){
    if(err) throw err;
    if(data.length>0){
       res.render('mainchat',{msgsfrom:data[0].msgsfrom,flag:false,chatflag:false});
    }
});});
});

app.post('/directenter/:name' , function(req,res){
  const query = {name : req.params.name};
  User.find(query , function(err,data){
    if(err) throw err;
    if(data.length > 0){
      res.render('mainchat',{name:data[0].name,number:data[0].number,pic:data[0].pic,msgsfrom:data[0].msgsfrom,
                flag:false,chatflag:false});
    }
  })
});

var usernames=[];var value=0;var flag=0;var again=0;

io.sockets.on('connection',function(socket){
        
    
   socket.on('new user',function(data){
    console.log('stage2')
        for(var i=0;i<usernames.length;i++)
        {
          if(data.name==usernames[i].name){
               again=1;
               var ob = usernames[i];
               console.log(data.number);
               User.find({name:data.name,number:Number(data.number)},function(err,data){
                if(err) throw err;
                else if(data.length==0){
                   socket.emit('userExists', ' username and number is taken!');  
                 } else if(data.length>0){
                  ob.cls='active';
                  flag=1;
                  update(flag);
                 }
               });           
          }} if(again==0) {
            console.log('hey2')
             usernames.push({uid:socket.id,name:data.name,cls:'active'});
             flag=0;
             update(flag);
          }
  
   });
   
   function update(flag){
    again=0;
    io.sockets.emit('users',{usernames,flag});
  }

   socket.on("send message",function(data){
     io.sockets.emit('new message',{msg:data.msg,name:data.nme,date:data.date,minutes:data.minutes,hours:data.hours});
   
   });

   socket.on('change',function(data){
      for(var k=0;k<usernames.length;k++){
      if(data.name==usernames[k].name)
      {socket.emit('userExists', data.name + ' username is taken! Try some other username.');}
      else{
      if(usernames[k].name==data.prst)
        usernames[k].name=data.name;
    }}
    update(0);
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
        const query = {name : data.name ,number:data.number};
        User.find(query,function(err,data){
          if(err) throw err;
          if(data.length > 0){
            socket.emit('userfound',{usr:data[0].name});
          }
        });
      }
    }
   });

  
socket.on('store',function(data){
  console.log('yha p kayyyy')
  var query = {name:data.nm};
  console.log(query);
  var input = {name:data.from};
  User.find(query,function(err,data){
    if(err) throw err;
    console.log(data);
    if(data[0].msgsfrom.length>0){
      for(var i=0;i<data[0].msgsfrom.length;i++){
        if(data[0].msgsfrom[i].name==data.from){
          console.log('already a msg from this user');
          break;
        }
    }
    } else{
     User.updateOne(query,{$push:{msgsfrom:input}},function(err){
              if(err) throw err;
           });
    }
    socket.emit('nowstore');
    });
  });




socket.on('storemsgs',function(data){
  console.log('heloo ')
 var msgs =[];
 const query1 = {name : data.by};
 const query2 = {name : data.to};
 const msg = data.msg;
 const by = data.by;
 const to = data.to;
  
 User.find(query2,function(err,data){
  if(err) throw err;
  var id=data[0]._id;
  Personal.find({name:to},function(err,data){
    if(err) throw err;
    console.log('data kya h');
    console.log(data);
    if(data.length > 0){
      var pm = Personal.updateOne({name:to,from:by}, {$push:{msgs:msg}} ,function(err){
                if(err) throw err;
              });
    } else {
       var pm = Personal({name:to,usrid:id,from:by,msgs:msg}).save(function(err){
                if(err) throw err;
              });
    }
  })
 })
 .then((resp) => {
    socket.emit('newmsg' , {msg:msg,name:by,date:data.date,minutes:data.minutes,hours:data.hours});
 });

});

});

//direct entry of user
//popups ussi page p front end me

//once user sees their personal msgs and opens their chat them remove that msg from personal chat msgs area
//view profile bhi vhi uss page p modal popup ki trh show hoga
//chat msgs with thier time and date of msg


//offline online ka dekhna h kb online rhe kb offline ho
//chat me msgsfrom me ek insaan ke agr 3 msgs ho to bhi uska naam ek hi baar aaye na ki pia pia pia aisa ho
//private chat ke msgs dono me share ni hore