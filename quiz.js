//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

     // renders initial login page
	router.get('/', function(req,res){
		res.render('quiz');
		
	});

	
	
	return router;
}();