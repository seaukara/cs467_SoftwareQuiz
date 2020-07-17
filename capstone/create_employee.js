//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

     // renders initial login page
	router.get('/', function(req,res){
		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('login');
		} else {
			res.render('create_employee');
		}
	});

	router.post('/', function(req,res) {
		var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');

		console.log(req.body.fname);
		console.log(req.body.lname);
		console.log(req.body.emp_email);


		// if (req.body.password != req.body.confirm_password){
		// 	context.no_match_pass = true;
		// 	res.render('create_user', context);
		// }

		// else {
		mysql.pool.query('INSERT INTO `employee`(`fname`, `lname`, `email`) VALUES (?,?,?)',
		[req.body.fname, req.body.lname, req.body.emp_email],
		function (error, results, fields) {
			// log query results
			console.log("Create employee results: ", results);

			if (error) {
				if (error.code === "ER_DUP_ENTRY") {
					context.dup_email = true;
					res.render('create_employee', context);
				} else {
					res.write(JSON.stringify(error));
					res.end();
				}
			} else {
				employee_id = results['insertId'];
				mysql.pool.query('INSERT INTO `employer_employee`(`employer_id`, `employee_id`) VALUES (?,?)',
					[req.session.employer_id, employee_id], function (error, results, fields) {
						// log query results
						console.log("Create employer_employer results: ", results);

						if (error) {
							if (error.code === "ER_DUP_ENTRY") {
								context.dup_email = true;
								res.render('create_employee', context);
							} else {
								res.write(JSON.stringify(error));
								res.end();
							}
						} else {

							context.create_user_success = true;
							res.redirect('home');
						}
				});
			}
		});
	});

	
	
	return router;
}();