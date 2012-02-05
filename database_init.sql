CREATE DATABASE wordsort;

USE wordsort;

CREATE TABLE words (
  id INT AUTO_INCREMENT, 
  room VARCHAR(64),
  x INT,
  y INT,
  text TEXT,
  boxwrap BOOLEAN,
  color VARCHAR(64),
  fontsize INT,
  PRIMARY KEY (id)
);