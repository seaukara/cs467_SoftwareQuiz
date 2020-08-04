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

			let get_employee = "SELECT * FROM employee WHERE employee_id = ".concat(parseInt(req.query.id));
			console.log("get_employee=", get_employee);
			mysql.pool.query(get_employee, function (error, results) {
				if (error) {
					res.write(JSON.stringify(error));
					res.end();
				} else {
					results = Object.values(JSON.parse(JSON.stringify(results)))
					console.log("results=", results);

					res.render("update_employee", {
						fname: results[0]['fname'],
						lname: results[0]['lname'],
						email: results[0]['email'],
						employee_id: req.query.id
					});
				}

			});
		}
	});

	router.post('/', function (req, res) {
		console.log("update=", req.body);

		// console.log("update_question post");
		let mysql = req.app.get('mysql');
		let query = 'UPDATE `employee` SET `fname` =?, `lname` =?, `email` =? WHERE `employee_id` = ?';
		console.log([req.body.fname,req.body.lname,req.body.email,parseInt(req.body.employee_id)]);
		mysql.pool.query(query,[req.body.fname,req.body.lname,req.body.email,parseInt(req.body.employee_id)], function (error, result) {
			if (error) {
				res.write(JSON.stringify(error));
				console.error(error.message);
				res.end();
			} else {
				console.log(result);
				res.redirect("/");
			}
		});
		// let quiz_id = req.session.quiz_id;
		// let question_id = Object.keys(req.body)[0];
		// console.log("question_id=", question_id);
		// console.log("req.body[question_id]=", req.body[question_id]);
		// let correct = [];
		// let answerCount = 0;
		// if (typeof(req.body['answer_text_1']) == "string") {
		// 	if (typeof(req.body['correct']) == "string") {
		// 		correct.push([question_id, req.body['answer_text_1'], 0])
		// 	} else {
		// 		correct.push([question_id, req.body['answer_text_1'], 1])
		// 	}
		// } else {
		// 	for (let i = 0; i < req.body['answer_bool_1'].length; i++) {
		// 		if (req.body['answer_bool_1'][i] == 'on') {
		// 			correct.push([question_id, req.body['answer_text_1'][answerCount], 1])
		// 			i++;
		// 		} else {
		// 			correct.push([question_id, req.body['answer_text_1'][answerCount], 0])
		// 		}
		// 		answerCount++;
		// 	}
		// }
		// let updateQuery = 'UPDATE questions SET question ="'.concat(req.body[question_id], '" WHERE question_id=').concat(question_id);
		// let deleteQuery = 'DELETE from answers WHERE question_id = '.concat(question_id);
		// let insertQuery = 'INSERT INTO `answers`(`question_id`, `answer_text`, `correct`) VALUES ?'
		//
		// // let insertQuery =
		// // let question_id = req.body.keys()[0];
		//
		// // console.log(question_id);
		//
		// console.log("updateQuery=", updateQuery);
		// console.log("deleteQuery=", deleteQuery);
		// console.log("insertQuery=", insertQuery);
		// console.log("insertData=", correct);
		// // let get_question = "UPDATE questions ".concat(parseInt(req.query.id));
		// // console.log("get_question=", get_question);
		// mysql.pool.query(updateQuery, function (error, updateResults) {
		// 	if (error) {
		// 		res.write(JSON.stringify(error));
		// 		res.end();
		// 	} else {
		// 		mysql.pool.query(deleteQuery, function (error, deleteResults) {
		// 			if (error) {
		// 				res.write(JSON.stringify(error));
		// 				res.end();
		// 			} else {
		// 				mysql.pool.query(insertQuery, [correct], function (error, insertResults) {
		// 					if (error) {
		// 						res.write(JSON.stringify(error));
		// 						res.end();
		// 					} else {
		// 						res.redirect("/view_quiz?id=".concat(quiz_id));
		//
		// 					}
		// 				});
		//
		// 			}
		// 		});
		//
		// 	}
		//
		//
		// });
	});

	
	return router;
}();

