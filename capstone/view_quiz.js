
module.exports = function(){
    let express = require('express');
    let router = express.Router();

     // renders initial login page
	router.get('/', function(req,res){
		let mysql = req.app.get('mysql');
		req.session.quiz_id = req.query.id;
		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('login');
		} else {
			let get_quiz = "SELECT * FROM quiz where quiz_id = ".concat(parseInt(req.query.id));
			// console.log("get_quiz=", get_quiz);
			mysql.pool.query(get_quiz,function (error, results) {
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					// console.log("quiz_details: ", results);
					let get_questions = "SELECT *, q.question_id as question_id FROM `questions` as q LEFT JOIN `answers` a ON q.question_id=a.question_id WHERE q.quiz_id = ".concat(parseInt(req.query.id));
					mysql.pool.query(get_questions,function (error, details) {
						if (error) {
							res.write(JSON.stringify(error));
							res.end();
						} else {

							// details = Object.values(JSON.parse(JSON.stringify(details)))
							details = JSON.parse(JSON.stringify(details));

							let questions = {};

							let cur = null;
							let question_count=0;
							let answer_count=0;
							console.log("details.length", details.length);

							for (let i = 0; i < details.length; i++) {
								let row = details[i];
								if (cur == null) {
									answer_count=0;
									question_count++;
									questions[question_count] = {};
									questions[question_count]['id'] = question_count;
									questions[question_count]['question'] = row['question'];
									questions[question_count]['question_id'] = row['question_id'];
									questions[question_count]['answers'] = [];

									cur = row['question'];
								}
								if (cur == row['question']) {
									answer_count++;

									questions[question_count]['answers'].push({"id": answer_count , "text":row['answer_text'], "val":parseInt(row['correct'])});
								} else {
									answer_count=1;
									question_count++;
									questions[question_count] = {};
									questions[question_count]['id'] = question_count;
									questions[question_count]['question_id'] = row['question_id'];
									questions[question_count]['question'] = row['question'];
									questions[question_count]['answers'] = [];
									questions[question_count]['answers'].push({"id": answer_count, "text":row['answer_text'], "val":parseInt(row['correct'])});
									cur = row['question'];
								}

							}
							let data = [];
							let c = 0;

							if (Object.keys(questions).length < 2) {
								data.push({
									"id": 1,
									"question_id": questions['1']['question_id'],
									"question": questions['1']['question'],
									"answers": questions['1']['answers']
								})
							} else {
								Object.keys(questions).forEach(function (key) {
									c++;
									let r = details[key]

									data.push({
										"id": c,
										"question_id": r['question_id'],
										"question": r['question'],
										"answers": r['answers']
									})
								});
							}

							res.render('view_quiz', {
								'quiz_name': results[0].quiz_name,
								'timer': results[0].timer,
								'questions': questions

							});
						}
					});
				}
			});
		}
	});
	router.get('/delete', function(req,res) {

		let quiz_id = req.session.quiz_id;
		let mysql = req.app.get('mysql');
		console.log("delete quiz: ", req.query.id);
		mysql.pool.query('DELETE FROM `questions` WHERE question_id=?',[req.query.id],
			function (error, result, fields) {
				// log query results
				console.log("Result: \n", result);
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					res.redirect('/view_quiz?id='.concat(quiz_id));
				}
			});
	});

	router.post('/', function(req,res){
		let mysql = req.app.get('mysql');
		console.log("req.body = ", req.body);

		let question = req.body['newquestion'];
		let quiz_id = req.session.quiz_id;
		mysql.pool.query("INSERT INTO `questions`(`quiz_id`, `question`) VALUES (?, ?)", [quiz_id, question], function (error, result) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			} else {
				let question_id = result['insertId'];
				console.log("question_id=", question_id);
				let c = 0;
				let answers = [];
				console.log("req.body['answer_text_1'].length=", req.body['answer_text_1'].length);
				if (req.body['answer_text_1'].length < 2) {
					if (req.body['answer_bool_1'] == "") {
						answers.push([question_id, req.body['answer_text_1'], 0])
					} else {
						answers.push([question_id, req.body['answer_text_1'], 1])
					}
				} else {
					console.log("here");
					console.log(req.body['answer_text_1'].length);
					for (let i=0; i < req.body['answer_text_1'].length; i++) {
						console.log("req.body['answer_bool_1'][c]=", req.body['answer_bool_1'][c]);
						if (req.body['answer_bool_1'][c] == "on") {
							answers.push([question_id, req.body['answer_text_1'][i], 1])
							c++;
						} else {
							answers.push([question_id, req.body['answer_text_1'][i], 0])
						}
						c++;

					}
				}
				console.log("answers=", answers);


					mysql.pool.query('INSERT INTO `answers` (`question_id`, `answer_text`, `correct`) VALUES ?', [answers], function (error, insertResult) {
						if (error) {
							res.write(JSON.stringify(error));
							res.end();
						} else {
							res.redirect('/view_quiz?id='.concat(quiz_id));
						}
					});
			}
		});

	});

	return router;

}();