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
				// console.log("Employee List Results\n", employees);
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				} else {
					mysql.pool.query('SELECT * FROM `quiz` WHERE employer_id=?',[req.session.employer_id],
						function (error, quizzes, fields) {
							// log query results
							// console.log("quizzes List Results\n", quizzes);
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
	router.get('/delete_employee', function(req,res){
		let mysql = req.app.get('mysql');
		console.log("delete employee: ", req.query.id);
		mysql.pool.query('DELETE FROM `employee` WHERE employee_id=?',[req.query.id],
			function (error, result, fields) {
				// log query results
				console.log("Result: \n", result);
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					res.redirect('/');
				}
			});
		// res.redirect('/');


	});
	router.get('/delete_quiz', function(req,res) {


		let mysql = req.app.get('mysql');
		console.log("delete quiz: ", req.query.id);
		mysql.pool.query('DELETE FROM `quiz` WHERE quiz_id=?',[req.query.id],
			function (error, result, fields) {
				// log query results
				console.log("Result: \n", result);
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					res.redirect('/');
				}
			});
	});

	router.get('/publish_quiz', function(req,res) {
		let mysql = req.app.get('mysql');
		let quiz_id = req.query.id;
		let r = '';
		var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
			'abcdefghijklmnopqrstuvwxyz0123456789@#$()-';

		for (let i = 1; i <= 12; i++) {
			var char = Math.floor(
				Math.random() * str.length + 1);

			r += str.charAt(char)
		}
		r = req.session.employer_id.toString().concat("-", r);

		console.log(r);
		publishQuery = "UPDATE quiz SET access_code = '".concat(r, "' WHERE quiz_id = ").concat(quiz_id);
		mysql.pool.query(publishQuery,function (error, results) {
			console.log("Quiz results: ", results);
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			} else {
				res.redirect("/");
			}
		});

	});
	return router;
}();