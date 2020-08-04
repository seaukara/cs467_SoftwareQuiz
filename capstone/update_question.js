//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

     // renders initial login page
	router.get('/', function(req,res) {
		if (!req.session.employer_id || req.session.employer_id == null) {
			res.redirect('login');
		} else {
			let mysql = req.app.get('mysql');

			let get_question = "SELECT *, questions.question_id as question_id FROM questions LEFT JOIN answers ON answers.question_id = questions.question_id where questions.question_id = ".concat(parseInt(req.query.id));
			console.log("get_question=", get_question);
			mysql.pool.query(get_question, function (error, results) {
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					results = Object.values(JSON.parse(JSON.stringify(results)))
					console.log("results=", results);

					res.render("update_question", {
						question: results[0]['question'],
						question_id: req.query.id,
						results: results
					});
				}

			});
		}
	});

	router.post('/', function (req, res) {
		console.log("update_question post");
		let mysql = req.app.get('mysql');
		let quiz_id = req.session.quiz_id;
		let question_id = Object.keys(req.body)[0];
		console.log("question_id=", question_id);
		console.log("req.body[question_id]=", req.body[question_id]);
		let correct = [];
		let answerCount = 0;
		if (typeof(req.body['answer_text_1']) == "string") {
			if (typeof(req.body['correct']) == "string") {
				correct.push([question_id, req.body['answer_text_1'], 0])
			} else {
				correct.push([question_id, req.body['answer_text_1'], 1])
			}
		} else {
			for (let i = 0; i < req.body['answer_bool_1'].length; i++) {
				if (req.body['answer_bool_1'][i] == 'on') {
					correct.push([question_id, req.body['answer_text_1'][answerCount], 1])
					i++;
				} else {
					correct.push([question_id, req.body['answer_text_1'][answerCount], 0])
				}
				answerCount++;
			}
		}
		let updateQuery = 'UPDATE questions SET question ="'.concat(req.body[question_id], '" WHERE question_id=').concat(question_id);
		let deleteQuery = 'DELETE from answers WHERE question_id = '.concat(question_id);
		let insertQuery = 'INSERT INTO `answers`(`question_id`, `answer_text`, `correct`) VALUES ?'

		// let insertQuery =
		// let question_id = req.body.keys()[0];

		// console.log(question_id);

		console.log("updateQuery=", updateQuery);
		console.log("deleteQuery=", deleteQuery);
		console.log("insertQuery=", insertQuery);
		console.log("insertData=", correct);
		// let get_question = "UPDATE questions ".concat(parseInt(req.query.id));
		// console.log("get_question=", get_question);
		mysql.pool.query(updateQuery, function (error, updateResults) {
			if (error) {
				res.write(JSON.stringify(error));
				res.end();
			} else {
				mysql.pool.query(deleteQuery, function (error, deleteResults) {
					if (error) {
						res.write(JSON.stringify(error));
						res.end();
					} else {
						mysql.pool.query(insertQuery, [correct], function (error, insertResults) {
							if (error) {
								res.write(JSON.stringify(error));
								res.end();
							} else {
								res.redirect("/view_quiz?id=".concat(quiz_id));

							}
						});

					}
				});

			}


		});
	});

	
	return router;
}();

