//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

    /*
    // if the user has not logged in, make them do so	
    router.all('*', function (req, res, next) {
        if (req.session.quiz_id === undefined || req.session.quiz_name === undefined || req.session.employee_id === undefined) {
        	console.log("redirect");
           	res.redirect('/login')
        }
        else {
            next();
          }
     });
     */
     // renders initial login page
	router.get('/', function(req,res){
		res.render('login');
		
	});

	
    // handles the form input for employer logins
	router.post('/employer', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log(req.body.employer_email_addr);
  		console.log(req.body.password);

        mysql.pool.query('SELECT employer_id, fname, lname FROM employer WHERE email=? AND password=?',[req.body.employer_email_addr,req.body.password],
			function (error, results, fields) {
			// log query results
			console.log("Login Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {

			    // User Login error handling
                if (Array.isArray(results) && results.length <= 0) {
                     context.employer_login_err = true;
                     res.render('login', context);
                }

				else{
					req.session.employer_id = results[0].employer_id;
					req.session.employer_name = results[0].fname + " " + results[0].lname;
					console.log("Employer Session ID: ", req.session.employer_id);
					res.redirect('/home');
				}
            }

		});
	});
	
	// handles the form input for employee logins
	router.post('/employee', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log(req.body.employee_email_addr);
  		console.log(req.body.access_code);

        mysql.pool.query('SELECT employee_id, fname, lname FROM employee WHERE email=?',[req.body.employee_email_addr],
			function (error, results, fields) {
			// log query results
			console.log("Login Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {
			    // User Login error handling
                if (Array.isArray(results) && results.length <= 0) {
                     context.employee_login_email_err = true;
                     res.render('login', context);
                }

                else {
                	req.session.employee_id = results[0].employee_id;
                	req.session.employee_fname = results[0].fname;
                	req.session.employee_lname = results[0].lname;
                	req.session.employee_email = req.body.employee_email_addr;

					console.log("Employee Session ID: ", req.session.employee_id);

					mysql.pool.query('SELECT quiz_id, quiz_name, timer FROM quiz WHERE access_code=?', req.body.access_code, function(error, results, fields){
						// log query results
						console.log("Login Results\n", results);

						if(error){
							res.write(JSON.stringify(error));
							res.end();
						}

						else {
							// User Login error handling
			                if (Array.isArray(results) && results.length <= 0) {
			                     context.employee_login_access_code_err = true;
			                     res.render('login', context);
			                }

			                else{
								req.session.quiz_id = results[0].quiz_id;
								req.session.quiz_name = results[0].quiz_name;
								req.session.timer = results[0].timer;
								console.log("Quiz Session ID: ", req.session.quiz_id);
								console.log("Quiz Session Name: ", req.session.quiz_name);
								res.redirect('/quiz');
							}
						}
						
					});

                }				
			}

		});
	});

	// handles the form input for employer logins
	router.get('/create_user', function(req,res){
       res.redirect('/create_user');

     
	});


	return router;
}();