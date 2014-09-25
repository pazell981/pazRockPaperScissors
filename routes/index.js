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
      app.io.room(req.data.player1).broadcast('room_create', room[req.data.player1])
    } else {
      req.io.join(req.data.player2)
      room[req.data.player2] = {room_id: req.data.player2, player1: users[req.data.player1], player2: users[req.data.player2]}
      app.io.room(req.data.player2).broadcast('room_create', room[req.data.player2])
    }
  })

  app.io.route('invite_denied', function (req){
    deny = room[req.data.player2]
    delete room[req.data.player2]
    app.io.room(req.data.player2).broadcast('denied', deny);
  })
  
  app.io.route('play', function (req){
    play_room = room[req.data.room];
    if (play_room.player2.user_id!=0){
      req.io.room(play_room.room_id).broadcast('round', req.data.play)    
    } else {
      key = Math.floor(Math.random()*3);
      compplay = {play: cplay[key]};
      app.io.room(play_room.room_id).broadcast('round', cplay[key])
    }
  })

  app.io.route('quit', function (req){
    quit = room[req.data.player2]
    delete room[req.data.room]
    req.io.room(req.data.room).broadcast('user_quit', quit)
  })
 	
 	app.io.route('disconnect', function (req){
 		console.log('User disconnected', req.socket.id);
    delete users[req.socket.id];
 		req.io.broadcast('user_disconnect', { user_id: req.socket.id});
 	});

}