const dbName = 'mydb';

db = db.getSiblingDB(dbName);

db.createCollection('users');

db.users.insertMany([
  { nome: 'Mario', cognome: 'Rossi',  email: 'mario.rossi@example.com',  sesso: 'M', data_di_nascita: new Date('1973-04-22') },
  { nome: 'Luigi', cognome: 'Bianchi',email: 'luigi.bianchi@example.com', sesso: 'F', data_di_nascita: new Date('1989-01-12') },
  { nome: 'Anna',  cognome: 'Verdi',  email: 'anna.verdi@example.com',   sesso: 'F', data_di_nascita: new Date('1998-12-29') },
  { nome: 'Giulia',cognome: 'Ferrari',email: 'giulia.ferrari@example.com',sesso: 'F', data_di_nascita: new Date('1995-07-08') },
  { nome: 'Marco', cognome: 'Esposito',email:'marco.esposito@example.com', sesso: 'M', data_di_nascita: new Date('1982-03-17') },
  { nome: 'Chiara',cognome: 'Romano', email: 'chiara.romano@example.com', sesso: 'F', data_di_nascita: new Date('2000-09-30') },
  { nome: 'Francesco', cognome: 'Galli', email:'francesco.galli@example.com', sesso:'M', data_di_nascita: new Date('1978-11-05') },
  { nome: 'Elena', cognome: 'Colombo', email:'elena.colombo@example.com', sesso:'F', data_di_nascita: new Date('1986-06-14') },
  { nome: 'Davide', cognome: 'Ricci',  email: 'davide.ricci@example.com',  sesso:'M', data_di_nascita: new Date('1992-02-27') },
]);
