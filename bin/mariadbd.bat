"C:\Program Files\MariaDB 10.2\bin\mysqld"


config server

CREATE USER 'bailletarchives' IDENTIFIED BY 'nodeApp55';
GRANT USAGE ON *.* TO 'bailletarchives'@localhost IDENTIFIED BY 'nodeApp55';
GRANT ALL privileges ON 'bailletarchives'.* TO 'bailletarchives'@localhost;
mysql> FLUSH PRIVILEGES;