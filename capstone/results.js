module.exports = function(){

    let express = require('express');
    let router = express.Router();

    function createQuizForView(req,res, quiz_id, quiz_name, employee_name, employee_id, max_correct, actual_correct){
        var mysql = req.app.get('mysql');
        
        // get employee's selected answers
        var query = "SELECT question_id, selected_question_id from results where employee_id=? AND quiz_id=?";
        var params = [employee_id, quiz_id];
        mysql.pool.query(query, params, function(error, results, fields){

            // log query results
            console.log("User Results\n", results);
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }

            else{
                var user_selections = results;
                getAnswersAndCompare(req, res, quiz_id, quiz_name, employee_name, employee_id, user_selections, max_correct, actual_correct);
                
            }

        });
    }       






    function getAnswersAndCompare(req, res, quiz_id, quiz_name, employee_name, employee_id, user_selections, max_correct, actual_correct){
        var mysql = req.app.get('mysql');
        var query = 'SELECT t1.question_id, answer_id, t1.question, answer_text, correct FROM (SELECT question_id, question FROM questions WHERE quiz_id=?) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id'
        var params = [quiz_id];
        mysql.pool.query( query, params, function(error, results, fields) {
        
            // log query results
            console.log("User Results\n", results);
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }

            else {

                var curr_id = results[0].question_id;
                var quizStringObj = {};
                var answerStringObj = {};
                quizStringObj[curr_id] = "<br><h6>" + results[0].question + "</h6>";

                for (var i = 1; i < results.length; i++){
                    if (results[i].question_id != curr_id){
                        curr_id = results[i].question_id;
                        quizStringObj[curr_id] = "<br><h6>" + results[i].question + "</h6>";
                    }
                }

                for (var i = 0; i < results.length; i++){
                    var userSelectedQuest = false;
                    var curr_id = results[i].question_id;
                    for (var j = 0; j < user_selections.length; j++){
                    
                        if (results[i].question_id === user_selections[j].question_id && results[i].answer_id === user_selections[j].selected_question_id){
                            
                            if (results[i].correct === 1){
                                var answerString = "<p>" + results[i].answer_text + "<span style='color:MediumSeaGreen;'> &#9745; </span></p>";
                                quizStringObj[curr_id] += answerString;
                            }

                            else {
                                var answerString = "<p>" + results[i].answer_text + "<span style='color:Tomato;'> &#9746; </span></p>";
                                quizStringObj[curr_id] += answerString;
                            }
                            
                                answerStringObj[results[i].answer_id] = true;
                        }

                    }
        

                    if (answerStringObj[results[i].answer_id] === undefined){ 
                        var answerString = "<p>" + results[i].answer_text + "</p>";
                        quizStringObj[curr_id] += answerString;
                      
                    }
                }
            
                
                var quizHTML = "<div style='text-align: center;'><div style='display: inline-block; text-align: left;'>" + "<h5>" + employee_name + " got " + actual_correct 
                                    + " out of " + max_correct + " correct. Below are the results!</h5><span style='color:MediumSeaGreen;'> &#9745; = Correct Selection</span><br><span style='color:Tomato;'> &#9746; = Incorrect Selection</span><br><span> Blank = No Selection</span><br><br>";
                /* Object.entries unsupported on node version 6
                for (const [key, value] of Object.entries(quizStringObj)){
                    quizHTML += `${value}`;
                }
                */
                for (const property in quizStringObj){
                    quizHTML += `${quizStringObj[property]}`;
                }

                quizHTML += "</div></div>";

                var context = {};

                console.log(quizHTML);
                context.quizHTML = quizHTML;
                context.display_quiz_table = false;
                context.display_quiz = true;
                context.full_name = employee_name;
                context.quiz_name = quiz_name;
                context.employee_id = employee_id;
                console.log ('quiz', quizHTML);
                res.render('employee_results', context);
            }
        });
    }



    // if the user has not logged in, make them do so  
     router.all('*', function (req, res, next) {
          if (!req.session.employer_id == null || req.session.employer_id == null) {
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

    router.get('/results_quiz', function(req,res){
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('/');
        }
        let data = {};
        let tableData = {};
        let pieData = {};
        let mysql = req.app.get('mysql');
        let responseCounts="SELECT quiz.quiz_name, questions.question_id, questions.question, answers.answer_id, answers.answer_text, answers.correct, IFNULL(selection_counts.answer_count, 0) AS answer_count, IFNULL(question_counts.question_count, 0) AS question_count, ROUND((IFNULL(selection_counts.answer_count, 0)/IFNULL(question_counts.question_count, 0))*100, 2) as score FROM `quiz` LEFT JOIN `questions` ON questions.quiz_id = quiz.quiz_id LEFT JOIN `answers` ON questions.question_id = answers.question_id LEFT JOIN ( SELECT answers.answer_id, IFNULL(COUNT(answer_count), 0) as answer_count FROM `answers` LEFT JOIN ( SELECT selected_question_id, employee_id as answer_count FROM `results` GROUP BY employee_id, selected_question_id ) AS counts ON counts.selected_question_id=answers.answer_id GROUP BY selected_question_id ) AS selection_counts ON selection_counts.answer_id = answers.answer_id LEFT JOIN ( SELECT questions.question_id, IFNULL(COUNT(question_count), 0) as question_count FROM `questions` LEFT JOIN ( SELECT question_id, employee_id as question_count FROM `results` GROUP BY employee_id, question_id ) AS counts ON counts.question_id=questions.question_id GROUP BY question_id, quiz_id) AS question_counts ON question_counts.question_id=questions.question_id WHERE quiz.quiz_id =?";
        // let responseCounts = "SELECT quiz.quiz_name, questions.question_id, questions.question, answers.answer_id, answers.answer_text, answers.correct, IFNULL(r.answer_count, 0) as answer_count, question_count, ROUND(answer_count/question_count, 2)*100 as score FROM `quiz` LEFT JOIN `questions` ON `questions`.quiz_id = `quiz`.quiz_id LEFT JOIN `answers` on `questions`.question_id = `answers`.`question_id` LEFT JOIN ( SELECT selected_question_id, count(result_id) as answer_count FROM `results` GROUP BY selected_question_id ) r ON r.selected_question_id = answers.answer_id LEFT JOIN (SELECT question_id, count(question_id) as question_count FROM `results` GROUP BY question_id ) q ON q.question_id = `questions`.`question_id` WHERE `quiz`.quiz_id =?";
        // let responseCounts = "SELECT quiz.quiz_name, questions.question_id, questions.question, answers.answer_id, answers.answer_text, answers.correct, IFNULL(selection_counts.answer_count, 0) AS answer_count, IFNULL(question_counts.question_count, 0) AS question_count, ROUND((IFNULL(selection_counts.answer_count, 0)/IFNULL(question_counts.question_count, 0))*100, 2) as score FROM `quiz` LEFT JOIN `questions` ON questions.quiz_id = quiz.quiz_id LEFT JOIN `answers` ON questions.question_id = answers.question_id LEFT JOIN ( SELECT selected_question_id, IFNULL(count(result_id), 0) as answer_count FROM `results` GROUP BY selected_question_id ) AS selection_counts ON selection_counts.selected_question_id = answers.answer_id LEFT JOIN ( SELECT questions.question_id, IFNULL(COUNT(question_count), 0) as question_count FROM `questions` LEFT JOIN ( SELECT question_id, employee_id as question_count FROM `results` GROUP BY employee_id, question_id ) AS counts ON counts.question_id=questions.question_id GROUP BY question_id, quiz_id ) AS question_counts ON question_counts.question_id = questions.question_id WHERE quiz.quiz_id =?"
        mysql.pool.query(responseCounts, req.query.quiz_id, function(error, results) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                let copy2 = results;
                let copy = JSON.stringify(results);
                console.log(typeof(copy));
                console.log("results = ", JSON.stringify(results));
                // results = Object.values(JSON.parse(JSON.stringify(results)))
                results = JSON.parse(JSON.stringify(results));

                // console.log("results = ", results);
                for (let i = 0; i < results.length; i++) {
                    if (results[i].correct == 1) {
                        if (tableData[results[i].question_id]) {
                            if (!results[i].score || results[i].score == null) {
                                pieData[results[i].question_id] = pieData[results[i].question_id];

                                tableData[results[i].question_id].push(["", results[i].answer_text, 0, pieData[results[i].question_id]], i);

                            } else {
                                pieData[results[i].question_id] = ((pieData[results[i].question_id]+results[i].score)/2);
                                tableData[results[i].question_id].push(["", results[i].answer_text, results[i].score, pieData[results[i].question_id]], i);
                            }

                        } else {
                            tableData[results[i].question_id] = [];
                            tableData[results[i].question_id]['question_id'] = results[i].question_id;




                            if (!results[i].score || results[i].score == null) {
                                pieData[results[i].question_id] = 0;
                                tableData[results[i].question_id].push([results[i].question, results[i].answer_text, 0, 0, i]);

                            } else {
                                pieData[results[i].question_id] = results[i].score;
                                tableData[results[i].question_id].push([results[i].question, results[i].answer_text, results[i].score, results[i].score], i);


                            }


                        }

                    }

                    if (data[results[i].question_id]) {
                        data[results[i].question_id]['answers'][results[i].answer_id] = {};
                        data[results[i].question_id]['answers'][results[i].answer_id]['answer'] = results[i].answer_text;
                        data[results[i].question_id]['answers'][results[i].answer_id]['count'] = results[i].answer_count;
                    } else {
                        data[results[i].question_id] = {};
                        data[results[i].question_id]['question'] = results[i].question;
                        data[results[i].question_id]['answers'] = {}
                        data[results[i].question_id]['answers'][results[i].answer_id] = {};
                        data[results[i].question_id]['answers'][results[i].answer_id]['answer'] = results[i].answer_text;
                        data[results[i].question_id]['answers'][results[i].answer_id]['count'] = results[i].answer_count;
                    }
                };
                console.log("pieData=",pieData);
                for (let p = 0; p < Object.keys(tableData).length; p++) {
                    tableData[Object.keys(tableData)[p]]['id'] = p+1;
                    for (let r = 0; r < tableData[Object.keys(tableData)[p]].length; r++) {

                        console.log("tableData[Object.keys(tableData)[p]][r]=",tableData[Object.keys(tableData)[p]][r]);
                        tableData[Object.keys(tableData)[p]][r][3] = pieData[Object.keys(tableData)[p]];
                    }
                }
                console.log("results= ", JSON.stringify(results));
                console.log("TABLEDATA=",tableData);
                // console.log("tableData=", tableData);
                // console.log("pieData=", pieData);
                // console.log("data=", pieData[results[0].question_id]);
                mysql.pool.query('SELECT quiz.*, score FROM `quiz` LEFT JOIN ( SELECT results.quiz_id, ROUND(SUM(correct)/COUNT(correct)*100, 2) as score from `results` LEFT JOIN `answers` ON results.selected_question_id=answers.answer_id group by quiz_id) quiz_totals ON quiz_totals.quiz_id = quiz.quiz_id where quiz.quiz_id=?',[req.query.quiz_id],
                    function (error, quizzes) {
                        // log query results
                        // console.log("quizzes List Results\n", quizzes);
                        if(error){
                            res.write(JSON.stringify(error));
                            res.end();
                        } else {
                            // quizzes = Object.values(JSON.parse(JSON.stringify(quizzes)))
                            quizzes = JSON.parse(JSON.stringify(quizzes));

                            res.render('quiz_results', {
                                quiz_id: req.query.quiz_id,
                                quiz_name: results[0]['quiz_name'],
                                first: pieData[results[0].question_id],
                                pieData: pieData,
                                copy3: encodeURIComponent(JSON.stringify(data)),
                                data:copy,
                                copy2:copy2,
                                score: quizzes[0].score,
                                tableData:tableData,
                                results:[5, 4, 6, 3, 9, 10, 13, 1, 7, 2, 8]
                            });
                        }
                    });

            }
        });


    });

    router.get('/results_employee', function(req,res) {
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('');
        }

        var context = {};
        var mysql = req.app.get('mysql');
        var session = req.app.get('session');

        // get employee & quiz info
        var query = 'SELECT quiz_name, quiz_id, t1.employee_id, fname, lname FROM (SELECT quiz_name, quiz.quiz_id, employee_id from quiz_employee INNER JOIN quiz ON quiz.quiz_id = quiz_employee.quiz_id WHERE employee_id=?) as t1 INNER JOIN employee ON employee.employee_id = t1.employee_id';
        var params = [req.query.employee_id];
        mysql.pool.query(query,params, function (error, results, fields) {
            // log query results
            console.log("Get Employee & Quiz Info Result\n", results);
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            } 

            if (results.length === 0){
                context.display_quiz_list = false;
                context.display_quiz_table = true;
                res.render('employee_results', context);
            }
            else {
                var quiz = [];
                params = [];
                for (var i = 0; i < results.length; i++){
                    quiz.push({quiz_name: results[i].quiz_name, quiz_id: results[i].quiz_id, employee_id: results[i].employee_id, max_correct: 0, actual_correct: 0, percent: 0});
                    params.push(String(results[i].quiz_id));
                }

                var full_name = results[0].fname + " " + results[0].lname;
                context.full_name = full_name;


                query = "SELECT quiz_id, COUNT(correct) as max_correct FROM (SELECT t1.quiz_id, t1.question_id, answer_id, t1.question, answer_text, correct FROM (SELECT quiz_id, question_id, question FROM questions WHERE quiz_id IN (?)) AS t1 INNER JOIN answers ON answers.question_id = t1.question_id) as t2 WHERE correct='1' GROUP BY quiz_id";
                
                mysql.pool.query(query, [params], function(error,results,fields){
                    
                    if(error){
                        res.write(JSON.stringify(error));
                        res.end();
                    } 

                    else {

                        console.log("Count Max Correct for each quiz", results);
                        for (var i = 0; i < results.length; i++){
                            for (var j = 0; j < quiz.length; j++) {
                                if (quiz[j].quiz_id === results[i].quiz_id){
                                    quiz[j].max_correct = results[i].max_correct;
                                }
                            }

                        }

                        // Count user score
                        query = "SELECT * FROM results INNER JOIN answers ON answers.answer_id=results.selected_question_id where employee_id=?"
                        params = [req.query.employee_id];
                        mysql.pool.query(query, params, function(error,results,fields){
                            if(error){
                                res.write(JSON.stringify(error));
                                res.end();
                            } 

                            console.log("Count user score", results);
                            for (var i = 0; i < results.length; i++){
                                for (var j = 0; j < quiz.length; j++){
                                    if (quiz[j].quiz_id === results[i].quiz_id) {
                                        if (results[i].correct === 1){
                                            quiz[j].actual_correct++;
                                        }
                                    }
                                }
                            }

                            for (var i = 0; i < quiz.length; i++){
                                if (quiz[i].max_correct === 0)
                                    quiz[i].percent = 0;
                                
                                else 
                                    quiz[i].percent = ((quiz[i].actual_correct/quiz[i].max_correct) * 100).toFixed(0);
                            }

                            context.quiz = quiz;
                            context.display_quiz_list = true;
                            context.display_quiz_table = true;
                            console.log("final", quiz);

                            // console.log("context", context);
                            res.render('employee_results', context);
                        });
                    }
                });



            }
        });

    });

    router.get('/results_single_quiz', function(req,res) {
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('');
        }

        var employee_id = req.query.employee_id;
        var quiz_id = req.query.quiz_id;
        var max_correct = req.query.max_correct;
        var actual_correct = req.query.actual_correct;
        var full_name = req.query.full_name;
        var quiz_name = req.query.quiz_name;

        console.log(employee_id);
        console.log(quiz_id);
        console.log(max_correct);
        console.log(actual_correct);
        console.log(full_name);
        console.log(quiz_name);


        createQuizForView(req,res, quiz_id, quiz_name, full_name, employee_id, max_correct, actual_correct);

    });

    return router;
}();