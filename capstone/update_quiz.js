
module.exports = function(){
    let express = require('express');
    let router = express.Router();

     // renders initial login page
	router.get('/', function(req,res){
		let mysql = req.app.get('mysql');
		// if (!req.session.employer_id || req.session.employer_id == null) {
		// 	res.redirect('login');
		// } else {
			let get_quiz = "SELECT * FROM quiz where quiz_id = ".concat(parseInt(req.query.id));
			console.log("get_quiz=", get_quiz);
			mysql.pool.query(get_quiz,function (error, results) {
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					console.log("quiz_details: ", results);
					let get_questions = "SELECT * FROM `questions` as q JOIN `answers` a ON q.question_id=a.question_id WHERE q.quiz_id = ".concat(parseInt(req.query.id));
					mysql.pool.query(get_questions,function (error, details) {
						if (error) {
							res.write(JSON.stringify(error));
							res.end();
						} else {
							// console.log(JSON.parse(JSON.stringify(details)));
							// details=JSON.parse(details);
							details = Object.values(JSON.parse(JSON.stringify(details)))
							// console.log("quiz_details= ", details);
							let questions = {};
							// questions.length = 0;
							// ;
							// 	let answers = [];
							// 	let bool = [];
							let cur = null;
							let question_count=0;
							let answer_count=0;
							for (let i = 0; i < details.length; i++) {
								let row = details[i];
								console.log("row = ", row);


								if (cur == null) {
									answer_count=0;
									question_count++;
									questions[question_count] = {};
									questions[question_count]['id'] = question_count;
									questions[question_count]['question'] = row['question'];
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
									questions[question_count]['question'] = row['question'];
									questions[question_count]['answers'] = [];
									questions[question_count]['answers'].push({"id": answer_count, "text":row['answer_text'], "val":parseInt(row['correct'])});
									cur = row['question'];
								}

							}
							let data = [];
							let c = 0;
							console.log("questions = ", questions);
							Object.keys(questions).forEach(function(key) {
								c++;
								let r = details[key]

								data.push({
									"id": c,
									"question": r['question'],
									"answers": r['answers']
								})
							});
							// while (details["question_text_".concat(question_count)]) {
							// 	questions['Question_'.concat(question_count)] = {};
							// 	questions['Question_'.concat(question_count)]['question'] = details["question_text_".concat(count)];
							//
							// 	while (details["answer_text_".concat(count)])
							// }
							// let cur=null;
							// Object.keys(details).forEach(function(key) {
							// 	if (questions.length == 0) {
							// 		questions.length = 1;
							// 		questions['Question_1'] = {};
							// 		cur = details[]
							// 	}
							//
							//
							// }
							// 		if (key.includes("question_text_")) {
							// 			questions[key]=results[0][key];
							// 		} else if (key.includes("answer_text_")) {
							// 			questions[key]=results[0][key];
							// 		} else if (key.includes("answer")) {
							// 			questions[key]=results[0][key];
							// 		}
							// 	});
							console.log("data = ", data);
							res.render('update_quiz', {
								'quiz_name': results[0].quiz_name,
								'timer': results[0].timer,
								'questions': questions

							});
						}
					});
				}
			});
		// }
	});



	return router;

}();