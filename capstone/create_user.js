//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

     // renders initial login page
	router.get('/', function(req,res){
		res.render('create_user');
	});

	router.post('/', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log(req.body.fname);
  		console.log(req.body.lname);
  		console.log(req.body.email_address);
  		console.log(req.body.password);
  		console.log(req.body.confirm_password);

  		if (req.body.password != req.body.confirm_password){
  			context.no_match_pass = true;
  			res.render('create_user', context);
  		}

        else {
        	mysql.pool.query('INSERT INTO `employer`(`fname`, `lname`, `email`, `password`) VALUES (?,?,?,?)',
	        	[req.body.fname,req.body.lname,req.body.email_address,req.body.password],
				function (error, results, fields) {
				// log query results
				console.log("Login Results\n", results);

				if(error){
					if (error.code === "ER_DUP_ENTRY"){
						context.dup_email = true;
						res.render('create_user', context);
					}
					else {
						res.write(JSON.stringify(error));
						res.end();
					}
				}

				else {
					context.create_user_success = true;
					res.render('login',context);
				}

			
			});
        }
	});

	
	
	return router;
}();