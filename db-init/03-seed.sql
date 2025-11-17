INSERT INTO generi (nome_genere, descrizione) VALUES
('Fantasy', 'Storie di fantasia con mondi immaginari e magie'),
('Narrativa', 'Romanzi e racconti di vario genere'),
('Giallo', 'Storie di mistero e investigazioni'),
('Storico', 'Romanzi ambientati nel passato'),
('Fantascienza', 'Storie ambientate nel futuro o nello spazio'),
('Bambini', 'Libri adatti ai bambini piccoli'),
('Young Adult', 'Libri per adolescenti');

INSERT INTO categorie_eta (categoria_eta, descrizione) VALUES
('0-6', 'Libri per bambini piccoli'),
('7-12', 'Libri per bambini più grandi'),
('13-17', 'Libri per adolescenti'),
('Adulti', 'Libri per adulti'),
('Tutti', 'Adatti a tutte le età');

INSERT INTO editori (nome_editore, partita_iva, paese, contatti) VALUES
('Mondadori', '12345678901', 'Italia', 'info@mondadori.it'),
('Feltrinelli', '23456789012', 'Italia', 'info@feltrinelli.it'),
('Einaudi', '34567890123', 'Italia', 'info@einaudi.it'),
('Rizzoli', '45678901234', 'Italia', 'info@rizzoli.it'),
('HarperCollins', '56789012345', 'USA', 'info@harpercollins.com');

INSERT INTO autori (codice_fiscale, nome, cognome, data_nascita, nazionalita) VALUES
('RSSMRA85M01H501Z','Mario','Rossi','1985-03-01','Italiana'),
('BNCLDA90L20F205X','Luca','Bianchi','1990-06-20','Italiana'),
('VRGLPT70C15L219S','Paolo','Verdi','1970-12-15','Italiana'),
('ALCSMR75D10H501K','Sara','Alcini','1975-04-10','Italiana'),
('JNSDOE80A01F205L','John','Doe','1980-01-01','USA'),
('CLRJNS85B15D219R','Clara','Jones','1985-02-15','UK'),
('MKTDWK90C20H501X','Mark','Tudwick','1990-03-20','UK');

INSERT INTO libri (isbn, titolo, anno_pubblicazione, numero_pagine, descrizione, nome_genere, categoria_eta, nome_editore) VALUES
('9788804671234','Il Signore degli Anelli','1954',1178,'Epica saga fantasy','Fantasy','Adulti','Mondadori'),
('9788804682345','Harry Potter e la Pietra Filosofale','1997',223,'Un giovane mago scopre il suo destino','Fantasy','7-12','Feltrinelli'),
('9788804693456','Il Gatto con gli Stivali','1697',45,'Fiaba classica per bambini','Bambini','0-6','Einaudi'),
('9788804704567','La ragazza del treno','2015',330,'Thriller psicologico ambientato in città','Giallo','Adulti','Rizzoli'),
('9788804715678','Il nome della rosa','1980',512,'Giallo storico ambientato in un monastero','Storico','Adulti','Mondadori'),
('9788804726789','Guida galattica per autostoppisti','1979',224,'Avventure nello spazio con umorismo','Fantascienza','Adulti','HarperCollins'),
('9788804737890','Percy Jackson e il ladro di fulmini','2005',375,'Avventure di un ragazzo semidio','Fantasy','13-17','Feltrinelli'),
('9788804748901','Storia di una gabbianella e del gatto che le insegnò a volare','1996',120,'Fiaba moderna con temi di amicizia','Bambini','7-12','Einaudi'),
('9788804759012','1984','1949',328,'Romanzo distopico su totalitarismo','Fantascienza','Adulti','Mondadori'),
('9788804760123','La fabbrica di cioccolato','1964',155,'Avventura fantastica per bambini','Bambini','7-12','Rizzoli'),
('9788804771234','Hunger Games','2008',374,'Distopia per adolescenti con coraggio e ribellione','Young Adult','13-17','Feltrinelli'),
('9788804782345','Orgoglio e pregiudizio','1813',432,'Classico romanzo d’amore inglese','Narrativa','Adulti','Einaudi'),
('9788804793456','Il piccolo principe','1943',96,'Favola filosofica per tutte le età','Bambini','Tutti','HarperCollins'),
('9788804804567','Twilight','2005',498,'Storia d’amore vampiresca per adolescenti','Young Adult','13-17','Rizzoli'),
('9788804815678','Moby Dick','1851',635,'Avventura marina con tema ossessivo','Narrativa','Adulti','Mondadori');

INSERT INTO libri_autori (isbn, codice_fiscale) VALUES
('9788804671234','RSSMRA85M01H501Z'),
('9788804682345','BNCLDA90L20F205X'),
('9788804693456','ALCSMR75D10H501K'),
('9788804704567','VRGLPT70C15L219S'),
('9788804715678','VRGLPT70C15L219S'),
('9788804726789','JNSDOE80A01F205L'),
('9788804737890','BNCLDA90L20F205X'),
('9788804748901','ALCSMR75D10H501K'),
('9788804759012','JNSDOE80A01F205L'),
('9788804760123','ALCSMR75D10H501K'),
('9788804771234','BNCLDA90L20F205X'),
('9788804782345','CLRJNS85B15D219R'),
('9788804793456','MKTDWK90C20H501X'),
('9788804804567','BNCLDA90L20F205X'),
('9788804815678','VRGLPT70C15L219S');

INSERT INTO copie (codice_inventario, isbn, stato) VALUES
('C1001','9788804671234','Disponibile'),
('C1002','9788804671234','Prestata'),
('C1003','9788804682345','Disponibile'),
('C1004','9788804682345','Disponibile'),
('C1005','9788804693456','Disponibile'),
('C1006','9788804704567','Danneggiata'),
('C1007','9788804715678','Disponibile'),
('C1008','9788804726789','Disponibile'),
('C1009','9788804737890','Prestata'),
('C1010','9788804748901','Disponibile'),
('C1011','9788804759012','Disponibile'),
('C1012','9788804760123','Disponibile'),
('C1013','9788804771234','Disponibile'),
('C1014','9788804782345','Disponibile'),
('C1015','9788804793456','Disponibile');

INSERT INTO tesserati (codice_fiscale, nome, cognome, data_nascita, email, indirizzo, data_iscrizione) VALUES
('RSSMRA90A01H501Z','Mario','Rossi','1990-01-01','mario.rossi@email.it','Via Roma 1, Milano','2023-01-10'),
('BNCLDA85B20F205X','Luca','Bianchi','1985-02-20','luca.bianchi@email.it','Via Torino 5, Roma','2023-02-15'),
('VRGLPT78C15L219S','Paolo','Verdi','1978-03-15','paolo.verdi@email.it','Via Firenze 12, Napoli','2023-03-20'),
('ALCSMR92D10H501K','Sara','Alcini','1992-04-10','sara.alcini@email.it','Via Bologna 22, Torino','2023-04-05'),
('JNSDOE88E01F205L','John','Doe','1988-05-01','john.doe@email.com','123 Main St, NY','2023-05-12'),
('CLRJNS85F15D219R','Clara','Jones','1985-06-15','clara.jones@email.co.uk','45 King Rd, London','2023-06-18'),
('MKTDWK90G20H501X','Mark','Tudwick','1990-07-20','mark.tudwick@email.co.uk','78 Queen St, Manchester','2023-07-22'),
('FMRLNS95H12L501Z','Federica','Marlini','1995-08-12','federica.marlini@email.it','Via Genova 7, Milano','2023-08-10'),
('GTPLRS87I05F219S','Giorgio','Tepplarsi','1987-09-05','giorgio.tepplarsi@email.it','Via Venezia 9, Roma','2023-09-03'),
('LMCNDR93J21H501K','Laura','Mancini','1993-10-21','laura.mancini@email.it','Via Napoli 15, Torino','2023-10-12'),
('DMRZLD91K10F205X','Domenico','Marzullo','1991-11-10','domenico.marzullo@email.it','Via Bari 11, Firenze','2023-11-05'),
('SBRTNC89L18L219S','Simone','Bertoni','1989-12-18','simone.bertoni@email.it','Via Palermo 20, Milano','2023-12-01'),
('CLPRTN94M03H501K','Chiara','Colaprico','1994-01-03','chiara.colaprico@email.it','Via Pisa 8, Roma','2024-01-10'),
('FRCNDR96N25F205L','Francesco','Conrad','1996-02-25','francesco.conrad@email.it','Via Siena 14, Firenze','2024-02-15'),
('LDRSNR97O30L219S','Ludovica','Dresner','1997-03-30','ludovica.dresner@email.it','Via Palermo 19, Napoli','2024-03-05');


INSERT INTO prestiti (codice_inventario, codice_fiscale, data_prestito, data_restituzione_prevista, data_restituzione_effettiva, stato) VALUES
('C1001','RSSMRA90A01H501Z','2024-10-01','2024-10-15',NULL,'Attivo'),
('C1002','BNCLDA85B20F205X','2024-09-20','2024-10-04','2024-10-03','Restituito'),
('C1003','VRGLPT78C15L219S','2024-09-25','2024-10-09',NULL,'Attivo'),
('C1004','ALCSMR92D10H501K','2024-09-10','2024-09-24','2024-09-26','In Ritardo'),
('C1005','JNSDOE88E01F205L','2024-10-02','2024-10-16',NULL,'Attivo'),
('C1006','CLRJNS85F15D219R','2024-09-01','2024-09-15','2024-09-16','In Ritardo'),
('C1007','MKTDWK90G20H501X','2024-08-25','2024-09-08','2024-09-07','Restituito'),
('C1008','FMRLNS95H12L501Z','2024-09-12','2024-09-26',NULL,'Attivo'),
('C1009','GTPLRS87I05F219S','2024-09-05','2024-09-19','2024-09-18','Restituito'),
('C1010','LMCNDR93J21H501K','2024-10-03','2024-10-17',NULL,'Attivo'),
('C1011','DMRZLD91K10F205X','2024-08-15','2024-08-29','2024-08-28','Restituito'),
('C1012','SBRTNC89L18L219S','2024-09-18','2024-10-02',NULL,'Attivo'),
('C1013','CLPRTN94M03H501K','2024-09-22','2024-10-06',NULL,'Attivo'),
('C1014','FRCNDR96N25F205L','2024-09-01','2024-09-15','2024-09-16','In Ritardo'),
('C1015','LDRSNR97O30L219S','2024-09-10','2024-09-24','2024-09-25','In Ritardo'),
('C1001','GTPLRS87I05F219S','2024-08-01','2024-08-15','2024-08-14','Restituito'),
('C1003','BNCLDA85B20F205X','2024-07-20','2024-08-03','2024-08-01','Restituito'),
('C1005','RSSMRA90A01H501Z','2024-06-15','2024-06-29','2024-06-28','Restituito'),
('C1007','ALCSMR92D10H501K','2024-05-10','2024-05-24','2024-05-23','Restituito'),
('C1009','JNSDOE88E01F205L','2024-04-05','2024-04-19','2024-04-18','Restituito'),
('C1002','VRGLPT78C15L219S','2024-03-12','2024-03-26','2024-03-25','Restituito'),
('C1004','CLRJNS85F15D219R','2024-02-10','2024-02-24','2024-02-25','In Ritardo'),
('C1006','MKTDWK90G20H501X','2024-01-15','2024-01-29','2024-01-28','Restituito'),
('C1008','FMRLNS95H12L501Z','2023-12-20','2024-01-03','2024-01-02','Restituito'),
('C1010','LMCNDR93J21H501K','2023-11-05','2023-11-19','2023-11-18','Restituito'),
('C1011','DMRZLD91K10F205X','2023-10-01','2023-10-15','2023-10-16','In Ritardo');
