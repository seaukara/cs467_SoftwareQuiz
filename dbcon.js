var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs467_group2',
  password        : 'RxwUl8135U0NV4gL',
  database        : 'cs467_group2'
});

module.exports.pool = pool;