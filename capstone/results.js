module.exports = function(){

    let express = require('express');
    let router = express.Router();

    router.get('/results_quiz', function(req,res){
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('login');
        }

        let mysql = req.app.get('mysql');


        res.render('quiz_results', {
            quiz_id: req.query.quiz_id
        });


    });

    router.get('/results_employee', function(req,res) {
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('login');
        }
        res.render('employee_results', {
            employee_id: req.query.employee_id
        });
    });

    return router;
}();