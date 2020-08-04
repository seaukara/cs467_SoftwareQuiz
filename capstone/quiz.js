//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var nodemailer = require('nodemailer');

    // help from https://www.w3schools.com/nodejs/nodejs_email.asp
    function sendEmail(emailString){
    	var transporter = nodemailer.createTransport({
    		service: 'gmail',
		  	auth: {
		    	user: 'osu.softwarequiz.2020@gmail.com',
		   		pass: 'RxwUl8135U0NV4gL'
		  	}
		});

    	var mailOptions = {
			from: 'osu.softwarequiz.2020@gmail.com',
			to: 'dongbr@oregonstate.edu',
			subject: 'Sending Email using Node.js',
			html: emailString
		};

		transporter.sendMail(mailOptions, function(error, info){
			if (error) {
		    	console.log(error);
		  	} 

		  	else {
		    	console.log('Email sent: ' + info.response);
		  	}
		});

    }

    function checkResults(results, req){

    	var max_correct = results.length;
    	var correct_count = 0;
    	const user_answers = Object.keys(req.body);
    	var answersString = "";

    	for (var i = 0; i < results.length; i++){

    		if (req.body[results[i].question_id] != undefined){
    			if(parseInt(req.body[results[i].question_id]) === parseInt(results[i].answer_id))
    			{
    				correct_count++;
    				var questionStr = "<h3>" + results[i].question + "</h3>" + "<p>" + results[i].answer_text + "&#9745;</p>";
    				answersString += questionStr
    			}
    		}
    	}

    	console.log("correct_count: ", correct_count);
    	console.log("max_correct: ", max_correct);

    	var resultString = "<h1>" + req.session.employee_fname + " " + req.session.employee_lname + " just took Quiz: " + req.session.quiz_name + " and got " 
    	+ correct_count + "/" + max_correct + " correct!</h1>" + "<p>Contact: " + req.session.employee_email + "</p>";
    	resultString += answersString;
    	console.log(resultString);
    	return resultString;
    }


    function checkUserResults(req, res){
    	var mysql = req.app.get('mysql');
    	var query = 'SELECT t1.question_id, answer_id, answer_text FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id'
		var params = [req.session.quiz_id];
		mysql.pool.query( query, params, function(error, results, fields) {
		
			// log query results
			console.log("User Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {

				return results;

			    
		    }

		});
    }

    function checkMultipleAnswers(results, question_id){
	var numOfCorrect = 0;
		for (var i = 0; i < results.length; i++){
			if (results[i].question_id === question_id){
				if (results[i].correct === 1){
					numOfCorrect++;
					if (numOfCorrect > 1)
						return true;
				}
			}
		}

		return false;
	}

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
				var current_question_id = results[0].question_id;
				var questMultCorrect = checkMultipleAnswers(results, current_question_id);

				for (var i = 0; i < results.length; i++){
					if (current_question_id != results[i].question_id){
						var question_answer_obj = {question: results[i-1].question, question_id: current_question_id, mult_correct: questMultCorrect, answers: answers_arr};
						current_question_id = results[i].question_id;
						questMultCorrect = checkMultipleAnswers(results, current_question_id);
						answers_arr = [];
						questions.push(question_answer_obj);
					}

					var temp_arr = [];
					temp_arr.push(results[i].answer_text);
					temp_arr.push(results[i].answer_id);
					answers_arr.push(temp_arr);

				}

				var question_answer_obj = {question: results[i-1].question, question_id: current_question_id, mult_correct: questMultCorrect, answers: answers_arr};
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

				var queryResults = results;
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
						
						sendEmail(checkResults(queryResults,req));
						// checkUserResults(req, res);

						req.session.destroy();
  						res.render('login', context);
					}
				});


			    
            }

        });

	});
	
	return router;
}();