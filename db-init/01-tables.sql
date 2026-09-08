CREATE TABLE IF NOT EXISTS generi (
    nome_genere VARCHAR(50) PRIMARY KEY,
    descrizione TEXT
);

CREATE TABLE IF NOT EXISTS categorie_eta (
    categoria_eta VARCHAR(20) PRIMARY KEY,
    descrizione TEXT,
    CHECK (categoria_eta IN ('0-6', '7-12', '13-17', 'Adulti', 'Tutti'))
);

CREATE TABLE IF NOT EXISTS editori (
    nome_editore VARCHAR(150) PRIMARY KEY,
    partita_iva CHAR(11) UNIQUE NOT NULL,
    paese VARCHAR(60),
    contatti VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS autori (
    codice_fiscale CHAR(16) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    data_nascita DATE NOT NULL,
    nazionalita VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS libri (
    isbn CHAR(13) PRIMARY KEY,
    titolo VARCHAR(200) NOT NULL,
    anno_pubblicazione INT 
        CHECK (anno_pubblicazione BETWEEN 1400 AND EXTRACT(YEAR FROM CURRENT_DATE)),
    numero_pagine INT CHECK (numero_pagine > 0),
    descrizione TEXT,

    nome_genere VARCHAR(50) NOT NULL,
    categoria_eta VARCHAR(20) NOT NULL,
    nome_editore VARCHAR(150),

    FOREIGN KEY (nome_genere) REFERENCES generi(nome_genere)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    FOREIGN KEY (categoria_eta) REFERENCES categorie_eta(categoria_eta)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    FOREIGN KEY (nome_editore) REFERENCES editori(nome_editore)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS libri_autori (
    isbn CHAR(13) NOT NULL,
    codice_fiscale CHAR(16) NOT NULL,
    ruolo VARCHAR(30) DEFAULT 'Autore',

    PRIMARY KEY (isbn, codice_fiscale),

    FOREIGN KEY (isbn) REFERENCES libri(isbn)
        ON UPDATE CASCADE ON DELETE CASCADE,

    FOREIGN KEY (codice_fiscale) REFERENCES autori(codice_fiscale)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS copie (
    codice_inventario VARCHAR(30) PRIMARY KEY,
    isbn CHAR(13) NOT NULL,
    stato VARCHAR(20) NOT NULL DEFAULT 'Disponibile'
        CHECK (stato IN ('Disponibile', 'Prestata', 'Danneggiata', 'Smarrita')),

    FOREIGN KEY (isbn) REFERENCES libri(isbn)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tesserati (
    codice_fiscale CHAR(16) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    data_nascita DATE NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    indirizzo VARCHAR(150),
    data_iscrizione DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS prestiti (
    id_prestito INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codice_inventario VARCHAR(30) NOT NULL,
    codice_fiscale CHAR(16) NOT NULL,
    data_prestito DATE NOT NULL DEFAULT CURRENT_DATE,
    data_restituzione_prevista DATE NOT NULL,
    data_restituzione_effettiva DATE,
    stato VARCHAR(20) NOT NULL DEFAULT 'Attivo'
        CHECK (stato IN ('Attivo', 'Restituito', 'In Ritardo')),
    CHECK (data_restituzione_prevista >= data_prestito),
    CHECK (
        data_restituzione_effettiva IS NULL
        OR data_restituzione_effettiva >= data_prestito
    ),
    FOREIGN KEY (codice_inventario) REFERENCES copie(codice_inventario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (codice_fiscale) REFERENCES tesserati(codice_fiscale)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Indice univoco parziale: impedisce a livello ACID che la stessa copia abbia più di un prestito 'Attivo' contemporaneo
CREATE UNIQUE INDEX IF NOT EXISTS idx_prestiti_attivi_copia
ON prestiti (codice_inventario)
WHERE stato = 'Attivo';

