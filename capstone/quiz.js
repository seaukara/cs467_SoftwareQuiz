//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();

     // if the user has not logged in, make them do so	
     router.all('*', function (req, res, next) {
          if (req.session.quiz_id === undefined || req.session.quiz_name === undefined || req.session.employee_id === undefined) {
	            console.log("redirect");
	            console.log(req.session.quiz_id);
			  	console.log(req.session.quiz_name);
			  	console.log(req.session.employee_id);
               	res.redirect('/login')
          }
          else {
               next();
          }
     });


    // handles the form input for employer logins
	router.get('/', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log(req.session.quiz_id);
  		console.log(req.session.quiz_name);
  		console.log(req.session.employee_id);

        mysql.pool.query('SELECT * FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id', [req.session.quiz_id],
			function (error, results, fields) {
			// log query results
			console.log("Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {

				var questions = [];
				var answers_arr = [];
				var answer_count = 0;
				var question_count = 0;
				var current_question_id = 0;
				for (var i = 0; i < results.length; i++){
					if (current_question_id === 0)
						current_question_id = results[i].question_id;

					else if (current_question_id != results[i].question_id){
						var question_answer_obj = {question: results[i-1].question, question_id: current_question_id, answers: answers_arr};
						current_question_id = results[i].question_id;
						answers_arr = [];
						questions.push(question_answer_obj);
					}

					var temp_arr = [];
					temp_arr.push(results[i].answer_text);
					temp_arr.push(results[i].answer_id);
					answers_arr.push(temp_arr);

				}

				var question_answer_obj = {question: results[i-1].question, question_id: current_question_id, answers: answers_arr};
				questions.push(question_answer_obj);

				console.log("questions", questions);
				context.questions = questions;
				context.quiz_name = req.session.quiz_name;
				context.timer = req.session.timer;

				res.render('quiz', context);
			    
            }

		});
	});

	// handles the form input for employee logins
	router.post('/', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log("body", req.body);
  		const user_answers = Object.keys(req.body);
  		console.log(user_answers);
  		context.quiz_finished = true;

  		var query = 'SELECT * FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id WHERE answers.correct = 1';
  		mysql.pool.query(query, [req.session.quiz_id],
			function (error, results, fields) {
			// log query results
			console.log("Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {

				var itr = 0;
				var correctCount = 0;
				query = 'INSERT INTO results (quiz_id, question_id, employee_id, correct_question_id, selected_question_id) VALUES ?';
				var params = [];
				var quiz_id = req.session.quiz_id;
				var employee_id = req.session.employee_id;

				for (var i = 0; i < user_answers.length; i++){
					for (var j = 0; j < results.length; j++){
						if (parseInt(user_answers[i]) === results[j].question_id){
							var question_id = results[j].question_id;
							var correct_answer_id = results[j].answer_id;
							var user_selection = req.body[user_answers[i]];

							params.push([String(quiz_id), String(question_id),String(employee_id), String(correct_answer_id), String(user_selection)]);
						}
					}
					
				}
				console.log("params", params);

				mysql.pool.query(query, [params], function(error,results,fields){
					if (error){
						res.write(JSON.stringify(error));
						res.end();
					}
					else {
						req.session.destroy();
  						res.render('login', context);
					}
				});


			    
            }

        });

	});
	
	return router;
}();