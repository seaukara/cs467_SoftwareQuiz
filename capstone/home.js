//Home Page
module.exports = function(){
	let express = require('express');
	let router = express.Router();

	// Renders home page for employer
	router.get('/', function(req,res){
		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('login');
		}
		let mysql = req.app.get('mysql');

		mysql.pool.query('SELECT e.*, employee.* FROM `employer_employee` as e LEFT JOIN employee on employee.employee_id=e.employee_id WHERE employer_id=?',[req.session.employer_id],
			function (error, employees, fields) {
				// log query results
				console.log("Employee List Results\n", employees);
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				} else {
					mysql.pool.query('SELECT * FROM `quiz` WHERE employer_id=?',[req.session.employer_id],
						function (error, quizzes, fields) {
							// log query results
							console.log("quizzes List Results\n", quizzes);
							if(error){
								res.write(JSON.stringify(error));
								res.end();
							} else {
								res.render('home', {
									full_name:req.session.employer_name,
									employee: employees,
									quiz: quizzes
								});
							}
						});
				}
			});
	});
	return router;
}();