-- use elle2020;

ALTER TABLE group_module
ADD UNIQUE (`moduleID`, `groupID`);

ALTER TABLE group_user
ADD UNIQUE (`groupID`, `userID`);


-- -- The free chat module
-- INSERT INTO `module` (`moduleID`, `language`, `userID`, `name`) VALUES (228, 'en', 1, 'FREE_CHAT_MODULE');


-- Update a certain group to have all modules
-- TODO: create a super class containing all modules for testing
-- universal student account
-- ucf2
-- cooler
-- Group 74 has ACCESS to ALL MODULES and they are also TITO MODULES
-- INSERT INTO group_module (groupID, moduleID)
-- SELECT DISTINCT 1 AS groupID, m.moduleID 
-- FROM `module` m;


-- Insert all modules into class 74
-- INSERT IGNORE INTO group_module (moduleID, groupID)
-- SELECT DISTINCT moduleID as moduleID, 74
-- FROM `module`;


-- INSERT IGNORE INTO `group_user` (userID, groupID, accessLevel)
-- VALUES (570, 74, 'pf');



-- REGISTER A NEW USER FIRST BEFORE PROCEEDING
-- LOG IN AND GET THEIR USER ID AND REPLACE '572' WITH THE NEW ID
-- THAT WILL BE YOUR STUDENT ACCOUNT
-- username =  chilledUser1
-- password = 1 


-- THIS IS THE STUDENT WITH ACCESS TO ALL T-MODULES
-- INSERT INTO group_user (userID, groupID, accessLevel)
-- VALUES (572, 1, 'st');

-- UPDATE `group_user`
-- SET `accessLevel` = 'st'
-- WHERE `userID` = 572;

-- UPDATE `user`
-- SET `permissionGroup` = 'st'
-- WHERE `userID` = 572;
-- REPLACE TO HERE









-- Begin migration chatbot sessions
-- RENAME TABLE `chatbot_sessions` TO `chatbot_sessions_old`;

-- NOTE: Create triggers for grammarScore, isActiveSession, timeChatted and moduleWordsUsed?
CREATE TABLE `chatbot_sessions` (
  `chatbotSID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `timeChatted` float NOT NULL DEFAULT 0,
  `moduleWordsUsed` int(4) NOT NULL DEFAULT 0,
  `creationTimestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `isActiveSession` boolean NOT NULL DEFAULT 1,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY (`chatbotSID`),
  KEY(`userID`, `moduleID`, `chatbotSID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- migrate data from old to new

-- FIX FREE CHAT ISSUE
UPDATE `chatbot_sessions_old`
SET `moduleId` = 228
WHERE `moduleId` = -1;


-- Begin message migration
-- RENAME TABLE `messages` TO `messages_old`;

CREATE TABLE `messages` (
  `messageID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `chatbotSID` int(4) NOT NULL,
  `classID` int(4) NOT NULL DEFAULT 1,
  `moduleID` int(4) NOT NULL,
  `source` ENUM('llm','user') NOT NULL,
  `message` text NOT NULL,
  `creationTimestamp` timestamp NOT NULL DEFAULT current_timestamp(), -- When message was sent
  `creationDate` date DEFAULT NULL,
  `isVoiceMessage` boolean NOT NULL DEFAULT 0,
  `keyWordsUsed` int(4) NOT NULL DEFAULT 0,
  `grammarScore` float(4) DEFAULT 0, 
  PRIMARY KEY (`messageID`),
  KEY(`classID`),
  KEY (`creationDate`),
  KEY (`userID`, `messageID`),
  KEY (`creationTimestamp`),
  FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE, 
  FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ID = -1 DNE in real db, so replace with an actual module
UPDATE `messages_old`
SET `moduleId` = 228
WHERE `moduleId` = -1;



-- NOTE: Create triggers for titoExpirationDate?
CREATE TABLE `tito_class_status` (
  `classID` int(4) NOT NULL,
  `professorID` int(4) NOT NULL,
  `titoStatus` enum('active', 'inactive') NOT NULL DEFAULT 'active',
  `titoExpirationDate` date NOT NULL,
  FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  FOREIGN KEY (`professorID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY (`classID`, `professorID`),
  KEY (`professorID`),
  KEY (`titoStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- CREATE TRIGGER WHEN A MODULE IS TITO-FIED
-- Create on delete behavior to default to loreID = 1
CREATE TABLE `tito_lore` (
  `loreID` int(2) NOT NULL AUTO_INCREMENT,
  `ownerID` int(5) NOT NULL DEFAULT 2, -- ucf2 / admin
  FOREIGN KEY (`ownerID`) REFERENCES `user` (`userID`),
  KEY (`loreID`, `ownerID`),
  PRIMARY KEY (`loreID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `tito_lore_text` (
  `loreID` int(2) NOT NULL,
  `sequenceNumber` int(1) NOT NULL,
  `loreText` text NOT NULL,
  FOREIGN KEY (`loreID`) REFERENCES `tito_lore` (`loreID`) ON DELETE CASCADE,
  PRIMARY KEY (`loreID`, `sequenceNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `tito_generated_module` (
  `moduleID` int(4) NOT NULL, 
  `professorID` int(4) NOT NULL, 
  `modulePrompt` text DEFAULT NULL, 
  FOREIGN KEY(`professorID`) REFERENCES `user` (`userID`),
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  PRIMARY KEY(`professorID`, `moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- NOTE: Create triggers for titoExpirationDate?
CREATE TABLE `tito_module` (
  `moduleID` int(4) NOT NULL,
  `classID` int(4) NOT NULL,
  `sequenceID` int(2) NOT NULL DEFAULT 0, 
  `titoPrompt` text DEFAULT NULL, 
  `startDate` DATE DEFAULT NULL, 
  `endDate` DATE DEFAULT NULL, 
  `totalTerms` int(4) NOT NULL DEFAULT 0, 
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `loreAssigned` int(2) NOT NULL DEFAULT 1,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  FOREIGN KEY(`loreAssigned`) REFERENCES `tito_lore` (`loreID`),
  KEY (`classID`,`status`),
  KEY (`loreAssigned`),
  PRIMARY KEY(`classID`, `moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_module_progress` (
  `moduleID` int(4) NOT NULL,
  `userID` int(4) NOT NULL,
  `completedTutorial` boolean NOT NULL DEFAULT 0,
  `termsMastered` int (5) NOT NULL DEFAULT 0,
  `loreProgress` int(1) NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY(`moduleID`,`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_term_progress` (
  `moduleID` int(4) NOT NULL,
  `termID`  int(4) NOT NULL,
  `userID` int(4) NOT NULL,
  `timesMisspelled` int(2) NOT NULL DEFAULT 0,
  `timesUsed` int(3) NOT NULL DEFAULT 0,
  `hasMastered` boolean NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY(`userID`,`moduleID`,`termID`),
  KEY (`moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_voice_message` (
  `userID` int(4) NOT NULL,
  `voiceID` int(4) AUTO_INCREMENT,
  `filename` VARCHAR(30) NOT NULL,
  `chatbotSID` int(4) NOT NULL,
  `messageID` int(4) NOT NULL,
  `audioExpireDate` date NOT NULL,
  PRIMARY KEY (`voiceID`),
  FOREIGN KEY (`userID`)  REFERENCES `user` (`userID`) ON DELETE CASCADE,
  FOREIGN KEY (`messageID`) REFERENCES `messages` (`messageID`) ON DELETE CASCADE,
  FOREIGN KEY (`chatbotSID`)  REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  KEY (`chatbotSID`, `userID`),
  KEY (`userID`, `messageID`),
  UNIQUE (`userID`, `messageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;



-- HARDCODE INSERT, REPLACE WITH ACTUAL THINGS
INSERT INTO `tito_lore` (`ownerID`) VALUES (1);
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (1, 1, "Tito remembers his hometown… but the name is fuzzy.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (1, 2, "Tito recalls speaking another language long ago!");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (1, 3, "A vivid scene returns: a seaside market and familiar voices.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (1, 4, "Tito has fully regained his memory thanks to you!");

INSERT INTO `tito_lore` (`ownerID`) VALUES (1);
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (2, 1, "A name surfaces… maybe ‘Mira’? Tito isn’t sure.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (2, 2, "He remembers a small boat and a song he used to hum.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (2, 3, "Faces blur into focus—market stalls, a blue kite, laughter.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (2, 4, "Everything clicks into place—Tito’s story is whole again!");

INSERT INTO `tito_lore` (`ownerID`) VALUES (1);
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (3, 1, "A torn journal page appears—ink smeared, date missing.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (3, 2, "Another page: a recipe in the margins and a note to self.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (3, 3, "The pages stitch together—directions to somewhere by the pier.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (3, 4, "The journal closes; Tito remembers every chapter.");

INSERT INTO `tito_lore` (`ownerID`) VALUES (1);
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (4, 1, "A sun-faded postcard: ‘Wish you were here…’ The signature is unclear.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (4, 2, "Another postcard shows bright umbrellas and a long pier.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (4, 3, "A final postcard reveals an address Tito once called home.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (4, 4, "All postcards align—Tito knows exactly where he belongs.");

INSERT INTO `tito_lore` (`ownerID`) VALUES (1);
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (5, 1, "A melody returns—just four notes on a breeze.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (5, 2, "Lyrics follow, half in another language he used to speak.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (5, 3, "He can hum the whole tune, and a friend’s voice joins in.");
INSERT INTO tito_lore_text (loreID, sequenceNumber, loreText) VALUES (5, 4, "The song finishes; the memories return in harmony.");



-- CREATE TRIGGERS

-- When a class's status changes, cascade changes to modules too if they are tito_modules
DELIMITER //
CREATE TRIGGER onClassStatusUpdate_updateModulesStatus
AFTER UPDATE ON `tito_class_status`
FOR EACH ROW
BEGIN
    -- Case 1: active -> inactive
    IF OLD.titoStatus = 'active' AND NEW.titoStatus = 'inactive' THEN
        UPDATE `tito_module`
        SET status = 'inactive'
        WHERE classID = NEW.classID;
    END IF;
    -- Case 2: inactive -> active
    IF OLD.titoStatus = 'inactive' AND NEW.titoStatus = 'active' THEN
        UPDATE `tito_module`
        SET status = 'active'
        WHERE classID = NEW.classID;
    END IF;
END//
DELIMITER ;






DELIMITER //
CREATE TRIGGER afterUpdateTermProgress_change_termsMastered
AFTER UPDATE ON `tito_term_progress`
FOR EACH ROW
BEGIN
    -- Only act when hasMastered becomes true for the first time
    IF NEW.hasMastered = 1 AND OLD.hasMastered = 0 THEN
        UPDATE `tito_module_progress`
        SET `termsMastered` = `termsMastered` + 1
        WHERE `moduleID` = NEW.moduleID AND `userID` = NEW.userID;
    END IF;
END //
DELIMITER ;




-- when a new term is added to a module, reupdate totalterm count
DELIMITER //
CREATE TRIGGER afterInsertOnModuleQuestion_update_totalTerms
AFTER INSERT ON `module_question`
FOR EACH ROW
BEGIN
    DECLARE term_count INT DEFAULT 0;

    -- Count distinct terms for this module
    SELECT COUNT(DISTINCT t.termID)
    INTO term_count
    FROM `module_question` mq
    JOIN answer a ON mq.questionID = a.questionID
    JOIN term t ON a.termID = t.termID
    WHERE mq.moduleID = NEW.moduleID;

    -- Update totalTerms for *all* classes that use this module
    UPDATE `tito_module`
    SET totalTerms = term_count
    WHERE moduleID = NEW.moduleID;
END//
DELIMITER ;

-- same as above but for deletes
DELIMITER //
CREATE TRIGGER afterDeleteOnModuleQuestion_update_totalTerms
AFTER DELETE ON `module_question`
FOR EACH ROW
BEGIN
    DECLARE term_count INT DEFAULT 0;

    SELECT COUNT(DISTINCT t.termID)
    INTO term_count
    FROM module_question mq
    JOIN answer a ON mq.questionID = a.questionID
    JOIN term t ON a.termID = t.termID
    WHERE mq.moduleID = OLD.moduleID;

    UPDATE `tito_module`
    SET totalTerms = term_count
    WHERE moduleID = OLD.moduleID;
END//
DELIMITER ;

-- Updates chatbot_sessions's kewwordcount by the delta change
DELIMITER //
CREATE TRIGGER onMessageUpdate_update_chatbotSessions
AFTER UPDATE ON `messages` 
FOR EACH ROW 
BEGIN 
  IF NEW.keyWordsUsed > OLD.keyWordsUsed THEN 
    UPDATE `chatbot_sessions` 
    SET `moduleWordsUsed` = `moduleWordsUsed` + (NEW.keyWordsUsed - OLD.keyWordsUsed) 
    WHERE userID = NEW.userID AND moduleID = NEW.moduleID AND chatbotSID = NEW.chatbotSID;
  END IF;
END //
DELIMITER ;

DELIMITER // 
CREATE TRIGGER onMessageInsert_setDate
BEFORE INSERT ON `messages`
FOR EACH ROW
BEGIN
  IF NEW.creationDate IS NULL THEN
    SET NEW.creationDate = CURDATE();
  END IF;
END //
DELIMITER ;


DELIMITER // 
CREATE TRIGGER onModuleCreation_addToSuperProf
AFTER INSERT ON `module`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `group_module` (`moduleID`, `groupID`)
  VALUES (new.moduleID, 74);
END //
DELIMITER ;




-- UPDATES
-- When an update of a SINGLE TERM CHANGES, updates `hasMastered` if there is a need to

DELIMITER //
CREATE TRIGGER addFreeChatModule
AFTER INSERT ON `tito_class_status`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `tito_module` (moduleID, classID)
  VALUES (228, new.classID);
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER beforeUpdateTermProgress_change_hasMastered
BEFORE UPDATE ON `tito_term_progress`
FOR EACH ROW
BEGIN
    IF (NEW.timesUsed > 0) AND (OLD.hasMastered = 0) THEN
      SET NEW.hasMastered = 1;
    END IF;

END //
DELIMITER ;


-- DELIMITER //
-- CREATE TRIGGER titofy_module
-- AFTER INSERT ON `group_module`
-- FOR EACH ROW
-- BEGIN
--   INSERT IGNORE INTO `tito_module` (moduleID, classID)
--   VALUES (NEW.moduleID, new.groupID);
-- END //
-- DELIMITER ;

-- When tito_module is created, auto populates the totalTerms
DELIMITER //
CREATE TRIGGER beforeInsertOntitoModule_update_totalTerms
BEFORE INSERT ON `tito_module`
FOR EACH ROW
BEGIN
  DECLARE term_count INT DEFAULT 0;
  -- Count unique terms assigned to this module
  SELECT COUNT(DISTINCT t.termID)
  INTO term_count
  FROM `module_question` mq
  JOIN answer a ON mq.questionID = a.questionID
  JOIN term t ON a.termID = t.termID
  WHERE mq.moduleID = NEW.moduleID;

  -- Update the totalTerms for the inserted record
  SET NEW.totalTerms = term_count;


  IF OLD.startDate = NULL THEN
    SET NEW.startDate = CURDATE();
  END IF;
  IF OLD.endDate = NULL THEN
    SET NEW.endDate = DATE_ADD(NEW.startDate, INTERVAL 1 YEAR); 
  END IF;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER titofy_class_onCreate
AFTER INSERT ON `group_user`
FOR EACH ROW
BEGIN
  IF NEW.accessLevel = 'pf' THEN
    INSERT IGNORE INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
    VALUES (NEW.groupID, NEW.userID, DATE_ADD(CURDATE(), INTERVAL 1 YEAR));
  END IF;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER titofy_class_onUpdate
AFTER UPDATE ON `group_user`
FOR EACH ROW
BEGIN
  IF OLD.accessLevel != 'pf' AND NEW.accessLevel = 'pf' THEN
    INSERT IGNORE INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
    VALUES (NEW.groupID, NEW.userID, DATE_ADD(CURDATE(), INTERVAL 1 YEAR));
  END IF;
END //
DELIMITER ;


-- Clean up UNCOMMENT
-- DROP TABLE `chatbot_sessions_old`;
-- DROP TABLE `messages_old`;


DROP TRIGGER onClassStatusUpdate_updateModulesStatus;
DROP TRIGGER afterUpdateTermProgress_change_termsMastered;
DROP TRIGGER afterInsertOnModuleQuestion_update_totalTerms;
DROP TRIGGER afterDeleteOnModuleQuestion_update_totalTerms;
DROP TRIGGER onMessageUpdate_update_chatbotSessions;
DROP TRIGGER onMessageInsert_setDate;
DROP TRIGGER onModuleCreation_addToSuperProf;
DROP TRIGGER addFreeChatModule;
DROP TRIGGER beforeUpdateTermProgress_change_hasMastered;
DROP TRIGGER beforeInsertOntitoModule_update_totalTerms;
DROP TRIGGER titofy_class_onCreate;
DROP TRIGGER titofy_class_onUpdate;