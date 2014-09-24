module.exports = function Route(app){

  app.get('/', function (req, res){
    res.render('index', {title:'Rock, Paper Scissors Game'});
  });

  users = {};
  
  app.io.on('connection', function (req) {
  	console.log('New User Connected', req.id);
  });

  app.io.route('user_connect', function (req, res){
  	req.io.broadcast('new_user_added', { name: req.data.name, user_id: req.socket.id});
    req.io.emit('user_added', { name: req.data.name, user_id: req.socket.id, users_connected: users});
    users[req.socket.id] = {user_id: req.socket.id, name: req.data.name};
  });
  
  app.io.route('issue_challenge', function (req){
    app.io.broadcast('challenge', {player1: req.data.player1, player1_name: users[req.data.player1].name, player2: req.data.player2, player2_name: users[req.data.player2].name})
  });
  
  app.io.route('accepted', function (req){
  	req.io.join(req.data.player2)
  	room = {room_id: req.data.player2, player1: users[req.data.player1], player2: users[req.data.player2]}
  	console.log('room', room);
  	app.io.room(req.data.player2).broadcast('room_create', room)
  })
  
  app.io.route('play', function (req){
  	console.log(req.data)
  	console.log(req.data.room)
  	req.io.room(req.data.room).broadcast('round', req.data.play)
  })
 	
 	app.io.route('disconnect', function (req){
 		console.log('User disconnected', req.socket.id);
    delete users[req.socket.id];
 		req.io.broadcast('user_disconnect', { user_id: req.socket.id});
 	});

}