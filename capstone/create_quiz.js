
module.exports = function(){
    let express = require('express');
    let router = express.Router();
     // renders initial login page
	router.get('/', function(req,res){

		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('login');
		} else {
			res.render('create_quiz');
		}
	});

	router.get('/update_quiz', function(req,res) {
		console.log('UPDATE!')
		mysql.pool.query("SELECT * FROM quiz where quiz_id = VALUES ?", req.query.id,function (error, results) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			} else {
				console.log("quiz_details: ", results);
				res.render('/update_quiz', {
					'quiz_name': results.quiz_name
				});
			}
		});
	});

	router.post('/', function(req,res) {
		console.log("SAVVVVE")
		let question_idx = {};

		let mysql = req.app.get('mysql');
		console.log("req.body= ", req.body);
		let r = '';
		let insert_sql = null;
		let val = [];
		var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
			'abcdefghijklmnopqrstuvwxyz0123456789@#$()-';




		if (req.body.publish == 'true') {

			for (let i = 1; i <= 12; i++) {
				var char = Math.floor(Math.random()
					* str.length + 1);

				r += str.charAt(char)
			}

			insert_sql = 'INSERT INTO `quiz`(`quiz_name`, `employer_id`, `timer`, `access_code`) VALUES (?,?,?,?)';
			val = [req.body.quiz_name, req.session.employer_id, req.body.quiz_time, r];
		} else {
			insert_sql = 'INSERT INTO `quiz`(`quiz_name`, `employer_id`, `timer`) VALUES (?,?,?)'
			val = [req.body.quiz_name, req.session.employer_id, req.body.quiz_time]
		}
		// console.log(r);
		let q_count = 0;
		Object.keys(req.body).forEach(function(key) {
			if (key.includes("question_text_")) q_count ++;
		});

		let quiz_id = null;
		let q = 0;

		let questions = [];
		// Create new quiz record
		let count = 0;

		mysql.pool.query(insert_sql, val,function (error, results) {
				console.log("Quiz results: ", results);
				if (error) {
						res.write(JSON.stringify(error));
						res.end();
				} else {
					quiz_id = results['insertId'];
					let idx = 0;
					let q = 0;
					for (q; q < q_count; q++) {
						idx++;
						if (req.body["question_text_".concat(idx)] != '') {
							questions.push([quiz_id, req.body["question_text_".concat(idx)]]);
						}
					}
					let question_id = null;
					console.log("question: ", questions);
					if (questions.length > 0) {
						mysql.pool.query(
							'INSERT INTO `questions`(`quiz_id`, `question`) VALUES ?', [questions],
							function (error, question_result) {
								if (error) {
									res.write(JSON.stringify(error));
									res.end();
								} else {
									question_id = question_result['insertId'];
									console.log(" QUESTION_ID = ", question_id);

									let options = [];
									idx = 0;
									q = 0;
									for (q; q < questions.length; q++) {
										idx++;
										if (req.body["question_text_".concat(idx)] != '' && req.body['answer_text_'.concat(idx)]) {
											// if ('answer_text_'.concat(idx))
											let answers = req.body['answer_text_'.concat(idx)];
											let correct = req.body['answer_bool_'.concat(idx)];
											let i = 0;
											for (i; i < answers.length; i++) {
												if (answers[i] != '') {
													if (correct[i] == "on") {
														c = 1;
														let s = i + 1;
														correct.splice(s, 1);
													} else {
														c = 0;
													}
													options.push([question_id, answers[i], c]);
												}
											}
											question_id++;
										}
									}
									if (options.length > 0) {
										console.log("options = ", options);
										mysql.pool.query(
											'INSERT INTO `answers` (`question_id`, `answer_text`, `correct`) VALUES ?', [options],
											function (error, answer_result) {

												if (error) {
													res.write(JSON.stringify(error));
													res.end();
												} else {
													// console.log("Answer record results: ", answer_result);
													res.redirect('/home');
												}
											});

									} else {
										res.redirect('/');
									}
								}
							});
				} else {
						res.redirect('/');
					}

				}
		});

	});

	return router;

}();