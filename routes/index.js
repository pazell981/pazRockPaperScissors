module.exports = function Route(app){

  app.get('/', function (req, res){
    res.render('index', {title:'Rock, Paper, Scissors Game'});
  });

  users = {};
  users[0] = {user_id: 0, name: "Tommy the Computer"};
  cplay=["Rock", "Paper", "Scissors"]
  room={}
  
  app.io.on('connection', function (req) {
  	console.log('New User Connected', req.id);
  });

  app.io.route('user_connect', function (req, res){
  	req.io.broadcast('new_user_added', { name: req.data.name, user_id: req.socket.id});
    req.io.emit('user_added', { name: req.data.name, user_id: req.socket.id, users_connected: users});
    users[req.socket.id] = {user_id: req.socket.id, name: req.data.name};
  });
  
  app.io.route('issue_challenge', function (req){
    if (req.data.player2==0){
      var roomissue={player1: req.data.player1, player2: req.data.player2}
      req.io.route('accepted', roomissue);
    }else{
      app.io.broadcast('challenge', {player1: req.data.player1, player1_name: users[req.data.player1].name, player2: req.data.player2, player2_name: users[req.data.player2].name})
    }
  });
  
  app.io.route('accepted', function (req){
    if (req.data.player2==0){
      req.io.join(req.data.player1)
      room[req.data.player1] = {room_id: req.data.player1, player1: users[req.data.player1], player2: users[req.data.player2]}
      console.log('room', room);
      app.io.room(req.data.player1).broadcast('room_create', room)
    } else {
      req.io.join(req.data.player2)
      room[req.data.player2] = {room_id: req.data.player2, player1: users[req.data.player1], player2: users[req.data.player2]}
      console.log('room', room);
      app.io.room(req.data.player2).broadcast('room_create', room)
    }
  })

  app.io.route('denied', function (req){
    room[req.data.player2] = {room_id: req.data.player2, player1: users[req.data.player1], player2: users[req.data.player2]};
    delete room[req.data.player2];
    app.io.room(req.data.player2).broadcast('denied', room);
  })
  
  app.io.route('play', function (req){
    console.log(room[req.data.room].player2.user_id)
    if (room[req.data.room].player2.user_id==0){
      compplay = cplay[(Math.random(2)+1)];
      console.log(compplay);
      req.io.room(req.data.room).broadcast('round', compplay)
    } else {
      req.io.room(req.data.room).broadcast('round', req.data.play)
    }
  })

  app.io.route('quit', function (req){
    delete room[req.data.room]
    req.io.room(req.data.room).broadcast('user_quit')
  })
 	
 	app.io.route('disconnect', function (req){
 		console.log('User disconnected', req.socket.id);
    delete users[req.socket.id];
 		req.io.broadcast('user_disconnect', { user_id: req.socket.id});
 	});

}