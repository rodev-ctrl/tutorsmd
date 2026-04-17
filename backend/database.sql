create TABLE Clients(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    surname VARCHAR(255),
    email VARCHAR(255),
    pass VARCHAR(255)
);

create TABLE tutor(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    surname VARCHAR(255),
    email VARCHAR(255),
    pass VARCHAR(255)
)
/*
CREATE TABLE personWithPosts(
    id SERIAL PRIMARY KEY,
    amountExercises INT,
    email VARCHAR(255),
    dateOfBirth DATE
);
*/



              CREATE TYPE Review AS (
                name VARCHAR(255),
                grade INTEGER,
                text VARCHAR(8000)
            );


CREATE TABLE tutors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    namegerman VARCHAR(255),
    surname VARCHAR(255),
    surnamegerman VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    reviews JSONB,
    availablesubjects JSONB,
    highlight VARCHAR(255),
    highlightgerman VARCHAR(255),
    fulldescribe VARCHAR(8000),
    fulldescribegerman VARCHAR(8000),
    messages JSON,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    offer VARCHAR(8000),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    clientid INTEGER,
    complaint VARCHAR(8000),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    usertoken VARCHAR(8000),
    tutoremail VARCHAR(255),
    datetime VARCHAR(255),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);


CREATE TABLE desksAndLessonsFiles (
  id UUID PRIMARY KEY,
  lessonid VARCHAR(255) REFERENCES lessons(lessonid) ON DELETE CASCADE,
  page_index INT,
  data JSONB,         -- можно хранить JSON объектов доски
  image_path TEXT,    -- если сохраняешь в PNG
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tickets (
  ticket VARCHAR(255),
  user_email VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

CREATE TABLE lessons ( 
  id                BIGSERIAL PRIMARY KEY,
  lessonid          VARCHAR(255) NOT NULL UNIQUE, -- стабильный room/chat id
  client_email      VARCHAR(255) NOT NULL REFERENCES clients(email) ON UPDATE CASCADE ON DELETE RESTRICT,
  tutor_email       VARCHAR(255) NOT NULL REFERENCES tutors(email)  ON UPDATE CASCADE ON DELETE RESTRICT,
  datetime          JSONB, 
  start_at          TIMESTAMPTZ NOT NULL,       -- начало урока (UTC)
  duration_minutes  INT NOT NULL DEFAULT 90 CHECK (duration_minutes > 0),
  status            TEXT NOT NULL DEFAULT 'process' CHECK (status IN ('process','cancelled','completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- триггер на updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lessons_updated
BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- индексы
CREATE INDEX idx_lessons_client_email ON lessons (client_email);
CREATE INDEX idx_lessons_tutor_email  ON lessons (tutor_email);
CREATE INDEX idx_lessons_start_at     ON lessons (start_at);
CREATE INDEX idx_lessons_cts          ON lessons (client_email, tutor_email, start_at);


              CREATE TYPE Message AS (
                question VARCHAR(8000),
                files BYTEA,
                language VARCHAR(255)
            );

              create TABLE gasts(
                userId VARCHAR(255),
                chatId VARCHAR(255),
                messages JSONB
              );

              CREATE TABLE gasts (
    id SERIAL PRIMARY KEY, -- Автоматически добавляемый первичный ключ
    userid VARCHAR(255),
    chatid VARCHAR(255),
    messages JSONB,
    UNIQUE (userid, chatid) -- Составной уникальный индекс
);

              
INSERT INTO tutors (name, email, password, reviews, availableSubjects, highlight, fullDescribe) VALUES ('Roman', 'ra.ivanov1405@gmail.com', crypt('!Qwedcxzaqwsx123321', gen_salt('bf')), ARRAY[('John', 4, convert_to('Уроки великолепны. Не хватает иногда практики', 'UTF-8'))::Review], ARRAY['Математика', 'Немецкий'], 'Со мной математика - игра', 'Я готовлю к экзаменам и преподаю школьную программу') RETURNING *;
INSERT INTO tutors (name, email, password, reviews, availableSubjects, highlight, fullDescribe) VALUES ('Roman', 'pavlokabyn@gmail.com', crypt('pavlohallo', gen_salt('bf')), ARRAY[('Ivan', 5, convert_to('Все прекрасно!', 'UTF-8'))::Review], ARRAY['Немецкий'], 'Немецкий - игра', 'Я готовлю к экзаменам и преподаю школьную программу') RETURNING *;

                // SET TUTOR_ENCODING TO 'UTF8';
        // INSERT INTO tutors (name, email, reviews, availableSubjects, highlight, fullDescribe) VALUES ('Pavlo', 'pavlokabin@gmail.com', ARRAY[ROW('John', 4, 'Уроки великолепны. Не хватает иногда практики')::Review], ARRAY['Математика', 'Немецкий'], 'Со мной математика - игра', 'Я готовлю к экзаменам и преподаю школьную программу') RETURNING *;
            

INSERT INTO tutors (
  name, 
  email, 
  password, 
  reviews, 
  availablesubjects, 
  highlight, 
  fulldescribe, 
  messages, 
  "createdAt", 
  "updatedAt"
) 
VALUES ( 
  'Pavlo', 
  'pavlokabin@gmail.com', 
  crypt('pavlohallo', gen_salt('bf')), 
  NULL, 
  ARRAY['Deutsch'], 
  convert_to('Опытный репетитор', 'UTF-8'), 
  convert_to('Преподаю немецкий язык школьникам и взрослым', 'UTF-8'), 
  NULL, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
) 
RETURNING *;


INSERT INTO tutors (
  name,
  email,
  password,
  reviews,
  availablesubjects,
  highlight,
  fulldescribe,
  messages,
  "createdAt",
  "updatedAt"
)
VALUES (
  'Pavlo',
  'pavlokabin@gmail.com',
  crypt('pavlohallo', gen_salt('bf')),
  NULL,
  ARRAY['Deutsch'],
  'Опытный репетитор',
  'Преподаю немецкий язык школьникам и взрослым',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
RETURNING *;





ALTER TABLE tokens ALTER COLUMN "refreshToken" TYPE VARCHAR(2048);






            INSERT INTO tutors (name, email, password, reviews, availableSubjects, highlight, fullDescribe, isActivated, "createdAt", "updatedAt") VALUES ('Roman', 'ra.ivanov1405@gmail.com', crypt('!Qwedcxzaqwsx123321', gen_salt('bf')), ARRAY[(name: 'John', grade: 4, comment: 'Teaching is perfect. But more practice is needed')::Review], ARRAY['Math', 'German'], 'Math and German with me - a game', 'I prepare for the exams and teach the school program', false, NOW(), NOW()) RETURNING *;
            INSERT INTO tutors (name, email, password, reviews, availableSubjects, highlight, fullDescribe, "createdAt", "updatedAt") VALUES ('Roman', 'ra.ivanov1405@gmail.com', crypt('!Qwedcxzaqwsx123321', gen_salt('bf')), ARRAY[('John', 4, 'Unterrichten sind perfekt. Aber es wird mehr Praktik gebraucht')::Review], ARRAY['Mathe', 'Deutsch'], 'Math and German with me - a game', 'I prepare for the exams and teach the school program', NOW(), NOW()) RETURNING *;
SELECT convert_from('Роман'::bytea, 'UTF-8');





















// ЭТО ПРАВИЛЬНО. Нужно вставить правильно 'isActivated' в базу данных
INSERT INTO tutors (id, name, namegerman, surname, surnamegerman, email, "newEmail", "changeEmailLink", password, reviews, availablesubjects, highlight, highlightgerman, fulldescribe, fulldescribegerman, "createdAt", "updatedAt") VALUES (2, 'Роман', 'Roman', 'Иванов', 'Ivanov', 'ra.ivanov1405@gmail.com', '', '', crypt('!Qwedcxzaqwsx123321', gen_salt('bf')), '[{"name": "John", "grade": 4, "comment": "Преподавание прекрасно. Но нужно больше практики"}]'::jsonb, '{"ru": ["Математика", "Немецкий"], "de": ["Mathe", "Deutsch"]}'::jsonb, 'Математика и немецкий со мной - игра', 'Mathe und Deutsch mit mir – wie ein Spiel', 'Я готовлю к экзаменам и преподаю школьную программу', 'Ich bereite auf Prüfungen vor und unterrichte das Schulprogramm',  NOW(), NOW()) RETURNING *;
INSERT INTO tutors (id, name, namegerman, surname, surnamegerman, email, "newEmail", "changeEmailLink", password, reviews, availablesubjects, highlight, highlightgerman, fulldescribe, fulldescribegerman, "createdAt", "updatedAt") VALUES (1, 'Павло', 'Pavlo', 'Кабын', 'Kabyn', 'pavlokabyn@gmail.com', '', '', crypt('pavlohallo', gen_salt('bf')), '[]'::jsonb, '{"ru": ["Немецкий"], "de": ["Deutsch"]}'::jsonb, 'Немецкий со мной - игра', 'Deutsch mit mir - wie ein Spiel', 'Я готовлю к экзаменам и преподаю школьную программу', 'Ich bereite auf Prüfungen vor und unterrichte das Schulprogramm', NOW(), NOW()) RETURNING *;
////////////////////////////////////////////////////////////////




ALTER TABLE tutors
ADD COLUMN namegerman VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN surnamegerman VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN highlightgerman VARCHAR(255),
ADD COLUMN fulldescribegerman VARCHAR(255),
ADD COLUMN availablesubjects JSONB NOT NULL DEFAULT '{"ru": [], "de": []}';





CREATE TABLE studenttutorchats (
    id SERIAL PRIMARY KEY, -- Автоматически добавляемый первичный ключ
    chatid VARCHAR(255),
    messages JSONB,
    UNIQUE (chatid) -- Составной уникальный индекс
);



CREATE TABLE lessons (
    id SERIAL PRIMARY KEY, -- Автоматически добавляемый первичный ключ
    lessonid VARCHAR(255),
    messages JSONB,
    UNIQUE (lessonid) -- Составной уникальный индекс
);










// CASE - выражение для классификации объектов на основе значения столбца
SELECT name, CASE 
WHEN monthlymaintenance < 100 THEN 'cheap' 
ELSE 'expensive' 
END AS cost 
FROM cd.facilities;