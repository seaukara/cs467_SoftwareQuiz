//Home Page
module.exports = function(){
	let express = require('express');
	let router = express.Router();

	// Renders home page for employer
	router.get('/', function(req,res){
		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('/');
		}
		let mysql = req.app.get('mysql');
		// let q = "SELECT e.*, employee.*, IFNULL(percent, 0) as percent, IFNULL(total, 0) as total, IFNULL(total_correct, 0) as total_correct FROM `employer_employee` as e LEFT JOIN employee on employee.employee_id=e.employee_id LEFT JOIN ( SELECT employee_id, SUM(IF(correct_question_id=selected_question_id, 1, 0)) as total_correct, COUNT(result_id) as total, ROUND(SUM(IF(correct_question_id=selected_question_id, 1, 0)) / COUNT(result_id) * 100, 0) AS percent FROM `results` GROUP BY employee_id) r ON r.employee_id = e.employee_id WHERE `e`.employer_id=?"
		let q = "SELECT employee.*, ROUND(score.correct/score.total*100, 2) as percent FROM `employee` LEFT JOIN `employer_employee` ON employer_employee.employee_id=employee.employee_id LEFT JOIN (SELECT results.quiz_id, results.question_id, employee_id, selected_question_id, SUM(correct) as correct, COUNT(correct) as total from results LEFT JOIN `answers` on results.selected_question_id=answers.answer_id group by employee_id) score ON score.employee_id=employee.employee_id WHERE employer_employee.employer_id=?"
		mysql.pool.query(q,[req.session.employer_id],
			function (error, employees, fields) {
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				} else {
					console.log("employees=", employees)
					mysql.pool.query('SELECT quiz.*, score FROM `quiz` LEFT JOIN ( SELECT results.quiz_id, ROUND(SUM(correct)/COUNT(correct)*100, 2) as score from `results` LEFT JOIN `answers` ON results.selected_question_id=answers.answer_id group by quiz_id) quiz_totals ON quiz_totals.quiz_id = quiz.quiz_id where quiz.employer_id=?',[req.session.employer_id],
						function (error, quizzes) {
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