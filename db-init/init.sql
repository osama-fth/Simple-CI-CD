CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    data_di_nascita DATE NOT NULL
);

INSERT INTO users (nome, cognome, email, data_di_nascita) VALUES
('Mario','Rossi', 'mario.rossi@example.com', '1973-04-22'),
('Luigi','Bianchi', 'luigi.bianchi@example.com', '1989-01-12'),
('Anna','Verdi', 'anna.verdi@example.com', '1998-12-29');
