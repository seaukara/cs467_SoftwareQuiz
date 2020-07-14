module.exports = function(){

    let express = require('express');
    let router = express.Router();

    router.get('/', function(req,res){
        if (!req.session.employer_id || req.session.employer_id == null) {
            res.redirect('login');
        }
        console.log("req = ", req.query)
        if ('quiz_id' in req.query) {
            res.render('quiz_results', {
                quiz_id: req.query.quiz_id
            });
        } else if ('employee_id' in req.query) {
                res.render('employee_results',
                {
                    employee_id: req.query.employee_id
                });

        }

    });


    return router;
}();