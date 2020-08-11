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
		let q = "SELECT e.*, employee.*, percent, total, total_correct FROM `employer_employee` as e LEFT JOIN employee on employee.employee_id=e.employee_id JOIN ( SELECT employee_id, SUM(IF(correct_question_id=selected_question_id, 1, 0)) as total_correct, COUNT(result_id) as total, ROUND(SUM(IF(correct_question_id=selected_question_id, 1, 0)) / COUNT(result_id) * 100, 0) AS percent FROM `results` GROUP BY employee_id) r ON r.employee_id = e.employee_id WHERE `e`.employer_id=?"
		mysql.pool.query(q,[req.session.employer_id],
			function (error, employees, fields) {
				if(error){
					res.write(JSON.stringify(error));
					res.end();
				} else {
					mysql.pool.query('SELECT quiz.*, ROUND(SUM(score.corrected_score)/COUNT(score.question_id)*100, 2) as score FROM `quiz` JOIN (SELECT scores.quiz_id, answers.question_id, SUM(correct) as num_correct_answers, 1/ SUM(correct) as answer_value, scores.correct_count, scores.attempt_count, scores.correct_count/scores.attempt_count as score, (scores.correct_count/scores.attempt_count)*(1/ SUM(correct)) as corrected_score FROM `answers` JOIN (SELECT results.quiz_id, question_id, SUM(IF(selected_question_id=correct_question_id, 1, 0)) as correct_count, COUNT(result_id) as attempt_count FROM `results` JOIN `quiz` ON quiz.quiz_id=results.quiz_id WHERE quiz.employer_id=? GROUP BY question_id) scores ON scores.question_id=answers.question_id GROUP BY question_id) score ON score.quiz_id=quiz.quiz_id WHERE employer_id=? GROUP BY quiz.quiz_id',[req.session.employer_id, req.session.employer_id],
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