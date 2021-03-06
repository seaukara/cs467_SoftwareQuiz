//Login Page
module.exports = function(){
    var express = require('express');
    var router = express.Router();
    var nodemailer = require('nodemailer');

    // help from https://www.w3schools.com/nodejs/nodejs_email.asp
    function sendEmail(emailString, userEmail, fname, lname, quiz_name){
    	var transporter = nodemailer.createTransport({
    		service: 'gmail',
		  	auth: {
		    	user: 'osu.softwarequiz.2020@gmail.com',
		   		pass: 'RxwUl8135U0NV4gL'
		  	}
		});

    	var mailOptions = {
			from: 'osu.softwarequiz.2020@gmail.com',
			to: userEmail,
			subject: fname + ' ' + lname + ': ' + quiz_name + ' quiz',
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


    function checkUserAnswers(req, res, fname, lname, quiz_name, quiz_id){
    	var mysql = req.app.get('mysql');
    	var query = 'SELECT t1.question_id, answer_id, t1.question, answer_text, correct FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id'
		var params = [req.session.quiz_id];
		mysql.pool.query( query, params, function(error, results, fields) {
		
			// log query results
			console.log("Questions and Answers\n", results);
			// console.log("length", results.length);
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {

				var max_correct = 0;
		    	var correct_count = 0;
		    	const user_answers = Object.keys(req.body);
		    	for (var i = 0; i < results.length; i++){
		    		if (results[i].correct === 1)
		    			max_correct++;
		    	}

		    	var curr_id = results[0].question_id;
				var emailStringObj = {};
				var answerStringObj = {};
				emailStringObj[curr_id] = "<br><h3>" + results[0].question + "</h3>";

				for (var i = 1; i < results.length; i++){
					if (results[i].question_id != curr_id){
				    	curr_id = results[i].question_id;
				      	emailStringObj[curr_id] = "<br><h3>" + results[i].question + "</h3>";
				    }
				}

				for (var i = 0; i < results.length; i++){
					var userSelectedQuest = false;
					var curr_id = results[i].question_id;
					if (req.body[curr_id] != undefined){
					
						if (typeof(req.body[curr_id]) === 'string'){
						  	if (parseInt(req.body[curr_id]) === results[i].answer_id){
						   	 	if (results[i].correct === 1){
						      		var answerString = "<p>" + results[i].answer_text + "<span style='color:MediumSeaGreen;'> &#9745; </span></p>";
						      		emailStringObj[curr_id] += answerString;
						      		correct_count++;
						    	}

						    	else {
						      		var answerString = "<p>" + results[i].answer_text + "<span style='color:Tomato;'> &#9746; </span></p>";
						      		emailStringObj[curr_id] += answerString;
						    	}
						    
						    	answerStringObj[results[i].answer_id] = true;
						  	}
						}

						else {
					  		for (var j = 0; j < req.body[curr_id].length; j++){
					    	
						    	if (parseInt(req.body[curr_id][j]) === results[i].answer_id){
						      		if (results[i].correct === 1){
						        		var answerString = "<p>" + results[i].answer_text + "<span style='color:MediumSeaGreen;'> &#9745; </span></p>";
						        		emailStringObj[curr_id] += answerString;
						        		correct_count++;
						      		}
					     	
							     	else {
							        	var answerString = "<p>" + results[i].answer_text + "<span style='color:Tomato;'> &#9746; </span></p>";
							        	emailStringObj[curr_id] += answerString;
							      	}
					      			answerStringObj[results[i].answer_id] = true;
					    		}
					  		}
						}	
					}

					if (answerStringObj[results[i].answer_id] === undefined){ 
						
						if (results[i].correct === 1){
                            var answerString = "<p>" + results[i].answer_text + "<span>&#10062;</span></p>";
                            emailStringObj[curr_id] += answerString;
                        }
                        else {
                            var answerString = "<p>" + results[i].answer_text + "</p>";
                            emailStringObj[curr_id] += answerString;
                        }
                      
						
						  
					}
				}
				
				var emailString = "<div style='text-align: center;'><div style='display: inline-block; text-align: left;'>" + "<h1>" + fname + " " + lname + " has just taken the " 
									+ quiz_name + " quiz! " + fname + " got " + correct_count 
									+ " out of " + max_correct + " correct. Below are the results!</h1><span style='color:Blue;'> &#9745; = Correct Selection</span><br><span style='color:Tomato;'> &#9746; = Incorrect Selection</span><br><span style='color:MediumSeaGreen;'> &#10062; = Correct Answer, but not selected</span><br><span> Blank = No Selection</span><br><br>";

				for (const property in emailStringObj){
					emailString += `${emailStringObj[property]}`;
				}
				emailString += "</div></div>";

				// console.log(emailStringObj);
				console.log(emailString);
				get_and_send_email(req, res, emailString, fname, lname, quiz_name, quiz_id);

			    
		    }

		});
    }

    function get_and_send_email(req, res, emailString, fname, lname, quiz_name, quiz_id){
    	var mysql = req.app.get('mysql');
    	var query = 'SELECT email FROM quiz INNER JOIN employer ON quiz.employer_id = employer.employer_id WHERE quiz_id=?'
    	var params = [quiz_id];
    	mysql.pool.query( query, params, function(error, results, fields) {
		
			// log query results
			console.log("Results\n", results);
			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {
				var employer_email = results[0].email;
				sendEmail(emailString, employer_email, fname, lname, quiz_name);
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


	function storeQuizResults(req, res, user_answers){
		var context = {};
		context.quiz_finished = true;

		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
		var query = 'SELECT * FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id WHERE answers.correct = 1';
		mysql.pool.query(query, [req.session.quiz_id],
		function (error, results, fields) {
			// log query results
			// console.log("Results\n", results);

			if(error){
				res.write(JSON.stringify(error));
				res.end();
			}

			else {



				// Otherwise...
				/*
					We know begin to store the results of the user selections from their quiz.
					At first we build the general SQL format of an INSERT operation.
					Then we go through the questions they have answered and check it with all the correct answers to these questions.
					We have a checked_quest array that tells us if we have looked at a question and cross checked it with a user's selection
					If that question has not been checked yet then we go about building the INSERT SQL command via the params array
					which will hold all the values of our INSERT operation.	

					Note the user submission info comes in the form of an object of arrays (i.e. req.body). That is, some questions that users
					will answer will have multiple answers. We must parse through these arrays to store their selecions.

					Recall, user_answers are the keys to the object of req.body
				*/
				query = 'INSERT INTO results (quiz_id, question_id, employee_id, correct_question_id, selected_question_id) VALUES ?';
				var params = [];
				var quiz_id = req.session.quiz_id;
				var employee_id = req.session.employee_id;

				var checked_quest = [];


				for (var i = 0; i < user_answers.length; i++){
					for (var j = 0; j < results.length; j++)
					{
						if (checked_quest[results[j].question_id] === undefined && parseInt(user_answers[i]) === results[j].question_id){
							
							var question_id = results[j].question_id;
							var correct_answer_id = results[j].answer_id;
							
							if (typeof(req.body[user_answers[i]]) === 'string'){
								var user_selection = req.body[user_answers[i]];
								params.push([String(quiz_id), String(question_id), String(employee_id), String(correct_answer_id), String(user_selection)]);
							}
							else {
								for (var k = 0; k < req.body[user_answers[i]].length; k++){
									var user_selection = req.body[user_answers[i]][k];
									params.push([String(quiz_id), String(question_id), String(employee_id), String(correct_answer_id), String(user_selection)]);
								}
							}

							// Mark that we checked this question_id and we do not need to check it again.
							checked_quest[results[j].question_id] = true;
						}

					}

				}


				// console.log("params", params);

				mysql.pool.query(query, [params], function(error,results,fields){
					if (error){
						res.write(JSON.stringify(error));
						res.end();
					}
					else {

						checkUserAnswers(req, res, req.session.employee_fname, req.session.employee_lname, req.session.quiz_name, req.session.quiz_id);
						req.session.destroy();
						context.no_display_signout = true;
						res.render('login', context);
					}
				});
		    }

		});
	}

	function createQuiz(req, res, quiz_name, timer){
	    var context = {};
	    var mysql = req.app.get('mysql');
		var session = req.app.get('session');

	    mysql.pool.query('SELECT * FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id', [req.session.quiz_id],
	        function (error, results, fields) {
	        // log query results
	        // console.log("Results\n", results);

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

	            // console.log("questions", questions);
	            context.questions = questions;
	            context.quiz_name = quiz_name;
	            context.timer = timer;
	            context.no_display_signout = true;
	            res.render('quiz', context);
	            
	        }

	    });    
	}


     // if the user has not logged in, make them do so	
     router.all('*', function (req, res, next) {
          if (req.session.quiz_id === undefined || req.session.quiz_name === undefined || req.session.employee_id === undefined) {
               	res.redirect('/login')
          }
          else {
               next();
          }
     });


    // handles creating the quiz for the employee
	router.get('/', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		console.log(req.session.quiz_id);
  		console.log(req.session.quiz_name);
  		console.log(req.session.employee_id);

  		// check if the user has taken the quiz already
  		mysql.pool.query('SELECT * FROM quiz_employee WHERE employee_id=? AND quiz_id=?', [req.session.employee_id, req.session.quiz_id],
	        function (error, results, fields) {
	        // log query results
	        // console.log("CHecking if quiz has already taken\n", results);

	        if(error){
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        
	        if (results.length != 0){
	        	context.alreadyTaken = true;
	        	context.no_display_signout = true;
	        	res.render('login',context);
	        }

	        else {

	            createQuiz(req, res, req.session.quiz_name, req.session.timer);
	            
	        }

	    });

        
	});

	// handles the form input for employee quiz results
	router.post('/', function(req,res){
        var context = {};
		var mysql = req.app.get('mysql');
		var session = req.app.get('session');
  		
  		// console.log("body", req.body);
  		const user_answers = Object.keys(req.body);

		// Log the user as having taken the quiz
		mysql.pool.query('INSERT INTO quiz_employee (quiz_id, employee_id, quiz_taken) VALUES (?,?,?)', [req.session.quiz_id, req.session.employee_id, '1'], function (error, results, fields) {
        	// log query results
        	// console.log("INSERT Results\n", results);

	        if(error){
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        // If the user did not submit any answers
			if (user_answers.length === 0){
				var emailString = "<h1>" + req.session.employee_fname + " " + req.session.employee_lname + " submitted a blank quiz </h1>";
				get_and_send_email(req, res, emailString, req.session.employee_fname, req.session.employee_lname, req.session.quiz_name, req.session.quiz_id);
				context.quiz_finished = true;
				context.no_display_signout = true;

				res.render('login', context);
			}


	        else {

	           	storeQuizResults(req, res, user_answers);
	            
	        }

		});
  		
  		

	});
	
	return router;
}();