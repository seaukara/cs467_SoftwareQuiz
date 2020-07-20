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

					answers_arr.push(results[i].answer_text);

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
  		const keys = Object.keys(req.body);

  		context.quiz_finished = true;


  		res.render('login', context);

	});
	
	return router;
}();