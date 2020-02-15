"C:\Program Files\MariaDB 10.2\bin\mysqld"
serveur 4cuGEbe4W83J5

config server

CREATE USER 'bailletarchives' IDENTIFIED BY 'nodeApp55';
GRANT USAGE ON *.* TO 'bailletarchives'@localhost IDENTIFIED BY 'nodeApp55';
GRANT ALL privileges ON 'bailletarchives'.* TO 'bailletarchives'@localhost;
GRANT ALL privileges ON 'bailletarchives_test'.* TO 'bailletarchives'@localhost;
GRANT ALL privileges ON 'bailletarchives_training'.* TO 'bailletarchives'@localhost;
mysql> FLUSH PRIVILEGES;


CREATE USER 'bailletarchives' IDENTIFIED BY 'nodeApp55';
GRANT USAGE ON *.* TO 'bailletarchives_training'@localhost IDENTIFIED BY 'nodeApp55';
GRANT ALL privileges ON 'bailletarchives_training'.* TO 'bailletarchives'@localhost;
GRANT ALL privileges ON 'bailletarchives_test'.* TO 'bailletarchives'@localhost;
mysql> FLUSH PRIVILEGES;
