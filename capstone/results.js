module.exports = function(){

    let express = require('express');
    let router = express.Router();

    router.get('/results_quiz', function(req,res){
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('/');
        }
        let data = {};
        let tableData = {};
        let pieData = {};
        let mysql = req.app.get('mysql');

        let responseCounts = "SELECT quiz.quiz_name, questions.question_id, questions.question, answers.answer_id, answers.answer_text, answers.correct, IFNULL(r.answer_count, 0) as answer_count, question_count, ROUND(answer_count/question_count, 2)*100 as score FROM `quiz` LEFT JOIN `questions` ON `questions`.quiz_id = `quiz`.quiz_id LEFT JOIN `answers` on `questions`.question_id = `answers`.`question_id` LEFT JOIN ( SELECT selected_question_id, count(result_id) as answer_count FROM `results` GROUP BY selected_question_id ) r ON r.selected_question_id = answers.answer_id LEFT JOIN (SELECT question_id, count(question_id) as question_count FROM `results` GROUP BY question_id ) q ON q.question_id = `questions`.`question_id` WHERE `quiz`.quiz_id =?";
        mysql.pool.query(responseCounts, req.query.quiz_id, function(error, results) {
            if (error) {
                res.write(JSON.stringify(error));
                res.end();
            } else {
                let copy2 = results;
                let copy = JSON.stringify(results);
                console.log(typeof(copy));
                console.log(JSON.stringify(results));
                // results = Object.values(JSON.parse(JSON.stringify(results)))
                results = JSON.parse(JSON.stringify(results));

                // console.log("results = ", results);
                for (let i = 0; i < results.length; i++) {
                    if (results[i].correct == 1) {
                        if (tableData[results[i].question_id]) {
                            if (!results[i].score || results[i].score == null) {
                                pieData[results[i].question_id] = pieData[results[i].question_id]/2;

                                tableData[results[i].question_id].push(["", results[i].answer_text, 0, pieData[results[i].question_id]], i);

                            } else {
                                pieData[results[i].question_id] = (pieData[results[i].question_id]+results[i].score)/2;
                                tableData[results[i].question_id].push(["", results[i].answer_text, results[i].score, pieData[results[i].question_id]], i);
                            }

                        } else {
                            tableData[results[i].question_id] = [];




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

                for (let p = 0; p < Object.keys(tableData).length; p++) {
                    tableData[Object.keys(tableData)[p]]['id'] = p+1;
                    for (let r = 0; r < tableData[Object.keys(tableData)[p]].length; r++) {

                        console.log(tableData[Object.keys(tableData)[p]][r]);
                        tableData[Object.keys(tableData)[p]][r][3] = pieData[Object.keys(tableData)[p]];
                    }
                }
                console.log("results= ", JSON.stringify(results));
                console.log("TABLEDATA=",tableData);
                // console.log("tableData=", tableData);
                // console.log("pieData=", pieData);
                // console.log("data=", pieData[results[0].question_id]);
                mysql.pool.query('SELECT quiz.*, ROUND(SUM(score.corrected_score)/COUNT(score.question_id)*100, 2) as score FROM `quiz` JOIN (SELECT scores.quiz_id, answers.question_id, SUM(correct) as num_correct_answers, 1/ SUM(correct) as answer_value, scores.correct_count, scores.attempt_count, scores.correct_count/scores.attempt_count as score, (scores.correct_count/scores.attempt_count)*(1/ SUM(correct)) as corrected_score FROM `answers` JOIN (SELECT results.quiz_id, question_id, SUM(IF(selected_question_id=correct_question_id, 1, 0)) as correct_count, COUNT(result_id) as attempt_count FROM `results` JOIN `quiz` ON quiz.quiz_id=results.quiz_id GROUP BY question_id) scores ON scores.question_id=answers.question_id GROUP BY question_id) score ON score.quiz_id=quiz.quiz_id WHERE quiz.quiz_id=?',[req.query.quiz_id],
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
        res.render('employee_results', {
            employee_id: req.query.employee_id
        });
    });

    return router;
}();