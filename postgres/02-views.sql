CREATE OR REPLACE VIEW libri_disponibili AS
SELECT 
    c.codice_inventario,
    l.isbn,
    l.titolo,
    l.nome_genere,
    l.categoria_eta,
    l.nome_editore
FROM copie c
JOIN libri l ON c.isbn = l.isbn
WHERE c.stato = 'Disponibile';

CREATE OR REPLACE VIEW prestiti_attivi AS
SELECT 
    p.id_prestito,
    t.codice_fiscale,
    t.nome,
    t.cognome,
    c.codice_inventario,
    l.titolo,
    p.data_prestito,
    p.data_restituzione_prevista
FROM prestiti p
JOIN tesserati t ON p.codice_fiscale = t.codice_fiscale
JOIN copie c ON p.codice_inventario = c.codice_inventario
JOIN libri l ON c.isbn = l.isbn
WHERE p.stato = 'Attivo';

CREATE OR REPLACE VIEW prestiti_in_ritardo AS
SELECT 
    p.id_prestito,
    t.codice_fiscale,
    t.nome,
    t.cognome,
    c.codice_inventario,
    l.titolo,
    p.data_prestito,
    p.data_restituzione_prevista
FROM prestiti p
JOIN tesserati t ON p.codice_fiscale = t.codice_fiscale
JOIN copie c ON p.codice_inventario = c.codice_inventario
JOIN libri l ON c.isbn = l.isbn
WHERE p.stato = 'Attivo'
  AND p.data_restituzione_prevista < CURRENT_DATE;

CREATE OR REPLACE VIEW libri_piu_prestati AS
SELECT 
    l.isbn,
    l.titolo,
    COUNT(p.id_prestito) AS numero_prestiti
FROM libri l
JOIN copie c ON l.isbn = c.isbn
JOIN prestiti p ON c.codice_inventario = p.codice_inventario
GROUP BY l.isbn, l.titolo
ORDER BY numero_prestiti DESC;

CREATE OR REPLACE VIEW autori_piu_prolifici AS
SELECT 
    a.codice_fiscale,
    a.nome,
    a.cognome,
    COUNT(la.isbn) AS numero_libri
FROM autori a
JOIN libri_autori la ON a.codice_fiscale = la.codice_fiscale
GROUP BY a.codice_fiscale, a.nome, a.cognome
ORDER BY numero_libri DESC;

CREATE OR REPLACE VIEW libri_per_genere AS
SELECT 
    g.nome_genere,
    g.descrizione AS descrizione_genere,
    l.isbn,
    l.titolo,
    l.categoria_eta,
    l.nome_editore
FROM libri l
JOIN generi g ON l.nome_genere = g.nome_genere
ORDER BY g.nome_genere, l.titolo;

CREATE OR REPLACE VIEW libri_per_categoria_eta AS
SELECT 
    c.categoria_eta,
    c.descrizione AS descrizione_categoria,
    l.isbn,
    l.titolo,
    l.nome_genere,
    l.nome_editore
FROM libri l
JOIN categorie_eta c ON l.categoria_eta = c.categoria_eta
ORDER BY c.categoria_eta, l.titolo;

CREATE OR REPLACE VIEW libri_per_editore AS
SELECT 
    e.nome_editore,
    l.isbn,
    l.titolo,
    l.nome_genere,
    l.categoria_eta
FROM libri l
JOIN editori e ON l.nome_editore = e.nome_editore
ORDER BY e.nome_editore, l.titolo;

CREATE OR REPLACE VIEW prestiti_storici AS
SELECT 
    t.codice_fiscale,
    t.nome,
    t.cognome,
    c.codice_inventario,
    l.titolo,
    p.data_prestito,
    p.data_restituzione_prevista,
    p.data_restituzione_effettiva,
    p.stato
FROM prestiti p
JOIN tesserati t ON p.codice_fiscale = t.codice_fiscale
JOIN copie c ON p.codice_inventario = c.codice_inventario
JOIN libri l ON c.isbn = l.isbn
ORDER BY t.cognome, t.nome, p.data_prestito DESC;
