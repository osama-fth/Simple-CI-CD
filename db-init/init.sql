CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    sesso VARCHAR(1) NOT NULL check (sesso in ('M','F')),
    email VARCHAR(50) UNIQUE NOT NULL,
    data_di_nascita DATE NOT NULL
);

INSERT INTO users (nome, cognome, email, sesso, data_di_nascita) VALUES
('Mario','Rossi', 'mario.rossi@example.com', 'M', '1973-04-22'),
('Luigi','Bianchi', 'luigi.bianchi@example.com', 'F', '1989-01-12'),
('Anna','Verdi', 'anna.verdi@example.com', 'F', '1998-12-29'),
('Giulia','Ferrari', 'giulia.ferrari@example.com', 'F', '1995-07-08'),
('Marco','Esposito', 'marco.esposito@example.com', 'M', '1982-03-17'),
('Chiara','Romano', 'chiara.romano@example.com', 'F', '2000-09-30'),
('Francesco','Galli', 'francesco.galli@example.com', 'M', '1978-11-05'),
('Elena','Colombo', 'elena.colombo@example.com', 'F', '1986-06-14'),
('Davide','Ricci', 'davide.ricci@example.com', 'M', '1992-02-27');
