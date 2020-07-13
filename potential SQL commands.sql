------------------------- Potential Login commands -------------------------
-- Employer login
SELECT employer_id FROM Employer/Admin WHERE employer_email=? AND employer_password=? 		

-- Potential Employee
SELECT employee_id, employee_name FROM Employees/User WHERE employer_id=?    				

---------------------- QUIZ commands ---------------------
SELECT quiz_id FROM Quizzes WHERE employer_id=? AND quiz_name=?

-- Display Quizzes for Employer
SELECT quiz_id, quiz_name FROM Quizzes WHERE employer_id=?				

-- Create Quiz
INSERT INTO Quizzes (`employer_id`,`quiz_name`) VALUES (?,?)								

-- Get Quiz
SELECT quiz_id FROM Quizzes WHERE employer_id=? AND quiz_name=?

-- Add questions to quizzes
INSERT INTO `Questions` (`quiz_id`, `question`, `correct_answer`, `option2`, `option3`, `option4`, `option5`) VALUES (?,?,?,?,?,?,?)

-- Delete questions
DELETE FROM `Questions` WHERE question_id=?

-- Update questions
UPDATE `Questions` SET question=?, correct_answer=?, option2=?, option3=?, option4=?, option5=? WHERE question_id=?


-- Display Quiz for employee
SELECT * FROM Questions WHERE quiz_id=?								

-- View results for a quiz from all quiz takers
SELECT result_id, question_id FROM Results where quiz_id=?

-- View a specific employees result
SELECT result_id, question_id FROM Results where quiz_id=? AND employee_id=?


-- Submit results
-- user submits form data, we parse each question and check for correctness and insert into results
INSERT INTO `Results` (`quiz_id`, `question_id`, `employee_id`, `correct`) VALUES (?,?,?,?)



--- Create New User/Employee ---
INSERT INTO Employees/User (`employee_id`, `employer_id`, `employee_name`) VALUES (?,?,?)




-- General commands
SELECT employee_id, employee_name FROM Employees/User WHERE employe~id=?

''