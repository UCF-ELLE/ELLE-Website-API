-- use elle2020;

ALTER TABLE group_module
ADD UNIQUE (`moduleID`, `groupID`);

ALTER TABLE group_user
ADD UNIQUE (`groupID`, `userID`);


-- -- The free chat module
INSERT INTO `module` (`moduleID`, `language`, `userID`, `name`) VALUES (3, 'en', 1, 'FREE_CHAT_MODULE');


-- Update a certain group to have all modules
-- TODO: create a super class containing all modules for testing
-- universal student account
-- ucf2
-- cooler
-- Group 1 has ACCESS to ALL MODULES and they are also TITO MODULES
-- INSERT INTO group_module (groupID, moduleID)
-- SELECT DISTINCT 1 AS groupID, m.moduleID 
-- FROM `module` m;

-- INSERT INTO group_user (userID, groupID, accessLevel)
-- VALUES (1, 1, 'pf');

INSERT IGNORE INTO group_module (moduleID, groupID)
SELECT DISTINCT moduleID as moduleID, 1
FROM `module`;

UPDATE `group_user`
SET `accessLevel` = 'pf'
WHERE `userID` = 1;

UPDATE `user`
SET `permissionGroup` = 'su'
WHERE `userID` = 1;


-- REGISTER A NEW USER FIRST BEFORE PROCEEDING
-- LOG IN AND GET THEIR USER ID AND REPLACE '473' WITH THE NEW ID
-- THAT WILL BE YOUR STUDENT ACCOUNT
-- username =  ecstaticseahorse0
-- password = 1 


-- THIS IS THE STUDENT WITH ACCESS TO ALL T-MODULES
INSERT INTO group_user (userID, groupID, accessLevel)
VALUES (473, 1, 'st');

UPDATE `group_user`
SET `accessLevel` = 'st'
WHERE `userID` = 473;

UPDATE `user`
SET `permissionGroup` = 'st'
WHERE `userID` = 473;
-- REPLACE TO HERE








-- Begin migration chatbot sessions
RENAME TABLE `chatbot_sessions` TO `chatbot_sessions_old`;

-- NOTE: Create triggers for grammarScore, isActiveSession, timeChatted and moduleWordsUsed?
CREATE TABLE `chatbot_sessions` (
  `chatbotSID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `timeChatted` float NOT NULL DEFAULT 0,
  `moduleWordsUsed` int(4) NOT NULL DEFAULT 0,
  `creationTimestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `isActiveSession` boolean NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY (`chatbotSID`),
  KEY(`userID`, `moduleID`, `chatbotSID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- migrate data from old to new

-- FIX FREE CHAT ISSUE
UPDATE `chatbot_sessions_old`
SET `moduleId` = 3
WHERE `moduleId` = -1;

INSERT IGNORE INTO `chatbot_sessions` (`chatbotSID`, `userID`, `moduleID`, `timeChatted`, `moduleWordsUsed`, `creationTimestamp`)
SELECT `chatbotId`, `userId`, `moduleId`, `totalTimeChatted`, `totalWordsForModule`, `timestamp`
FROM `chatbot_sessions_old`;


-- Begin message migration
RENAME TABLE `messages` TO `messages_old`;



-- NOTE: Create triggers for grammarScore and keyWordsUsed?
CREATE TABLE `messages` (
  `messageID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `chatbotSID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `source` ENUM('llm','user') NOT NULL,
  `message` text NOT NULL,
  `creationTimestamp` timestamp NOT NULL DEFAULT current_timestamp(), -- When message was sent
  `isVoiceMessage` boolean NOT NULL DEFAULT 0,
  `keyWordsUsed` int(4) NOT NULL DEFAULT 0,
  `grammarScore` float(4) DEFAULT 0, -- xxx.x%, calculated later asynchronously(?)
  PRIMARY KEY (`messageID`),
  KEY (`creationTimestamp`),
  FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE, 
  FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

UPDATE `messages_old`
SET `moduleId` = 3
WHERE `moduleId` = -1;


-- Migrate data from messages_old into messages (new)
-- INSERT IGNORE INTO `messages` (`messageID`, `userID`, `chatbotSID`, `moduleID`, `source`, `message`, `creationTimestamp`, `isVoiceMessage`, `grammarScore`)
-- SELECT `id`, `userId`, `chatbotId`, `moduleId`, `source`, `value`, `timestamp`, 0, 0
-- FROM `messages_old`;


-- drop table tito_class_status;
-- drop table tito_generated_module;
-- drop table tito_module;
-- drop table tito_module_progress;
-- drop table tito_term_progress;
-- drop table tito_voice_message;

-- NOTE: Create triggers for titoExpirationDate?
CREATE TABLE `tito_class_status` (
  `classID` int(4) NOT NULL,
  `professorID` int(4) NOT NULL,
  `titoStatus` enum('active', 'inactive') NOT NULL DEFAULT 'active',
  `titoExpirationDate` date NOT NULL,
  FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  FOREIGN KEY (`professorID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY (`classID`, `professorID`),
  KEY (`titoStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


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
  KEY (`classID`,`status`),
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



-- Consider IGNORE after INSERT

-- -- populate `tito_module`
-- INSERT IGNORE INTO `tito_module` (`moduleID`, `classID`)
-- SELECT DISTINCT msg.moduleID, gu.groupID
-- FROM `messages` msg
-- JOIN `group_user` gu ON msg.userID = gu.userID
-- JOIN `group_module` gm ON gm.groupID = gu.groupID AND gm.moduleID = msg.moduleID;




-- -- populate `tito_module_progress`
-- INSERT IGNORE INTO `tito_module_progress` (`moduleID`, `userID`)
-- SELECT DISTINCT msg.moduleID, msg.userID
-- FROM `messages` msg
-- JOIN `group_user` gu ON gu.userID = msg.userID
-- JOIN `group_module` gm ON gm.groupID = gu.groupID AND gm.moduleID = msg.moduleID;




-- INSERT IGNORE INTO `tito_term_progress` (`userID`, `moduleID`, `termID`, `timesUsed`)
-- SELECT DISTINCT msg.userID, msg.moduleID, t.termID, 0
-- FROM `messages` msg
-- JOIN `module_question` mq ON mq.moduleID = msg.moduleID
-- JOIN `answer` a ON a.questionID = mq.questionID
-- JOIN `term` t ON t.termID = a.termID
-- JOIN `group_user` gu ON gu.userID = msg.userID;
-- -- WHERE gu.accessLevel = 'st';



-- -- Populate tito_class_status table
-- INSERT IGNORE INTO `tito_class_status` (`classID`, `professorID`, `titoStatus`, `titoExpirationDate`)
-- SELECT DISTINCT gu.groupID, gu.userID, 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR)
-- FROM `group_user` gu
-- WHERE gu.accessLevel = 'pf';








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


-- When an update of a SINGLE TERM CHANGES, updates `hasMastered` if there is a need to
DELIMITER //
CREATE TRIGGER beforeUpdateTermProgress_change_hasMastered
BEFORE UPDATE ON `tito_term_progress`
FOR EACH ROW
BEGIN
    IF (NEW.timesUsed > 3) AND ((NEW.timesMisspelled / NEW.timesUsed) <= 0.25) AND (OLD.hasMastered = 0) THEN
      SET NEW.hasMastered = 1;
    END IF;

END //
DELIMITER ;

    -- IF OLD.timesUsed < NEW.timesUsed THEN 
    --   SET NEW.timesUsed = `timesUsed` + (NEW.timesUsed - OLD.timesUsed)
    -- END IF;

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

-- When creating a new session, invalidates other sessions for this user
-- DELIMITER // 
-- CREATE TRIGGER onSessionCreate_revokeOtherSessions
-- AFTER INSERT ON `chatbot_sessions`
-- FOR EACH ROW
-- BEGIN
--   UPDATE `chatbot_sessions`
--   SET `isActiveSession` = 0
--   WHERE `userID` = NEW.userID;
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
END//
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
CREATE TRIGGER onClassCreation_insertAdmin
AFTER INSERT ON `group`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `group_user` (`userID`, `groupID`, `accessLevel`)
  VALUES (1, NEW.groupID, 'pf');
END //
DELIMITER ;










-- Clean up UNCOMMENT
-- DROP TABLE `chatbot_sessions_old`;
-- DROP TABLE `messages_old`;



-- OLD TRIGGERS

-- When an update of a SINGLE TERM CHANGES, updates `hasMastered` if there is a need to
-- DELIMITER //
-- CREATE TRIGGER onUpdateTermProgress_change_hasMastered
-- AFTER UPDATE ON `tito_term_progress`
-- FOR EACH ROW
-- BEGIN
--     IF NEW.timesUsed > 3 AND (NEW.timesMisspelled / NEW.timesUsed) <= 0.25 AND NOT OLD.hasMastered THEN
--         UPDATE `tito_term_progress`
--         SET `hasMastered` = TRUE
--         WHERE `userID` = NEW.userID AND `moduleID` = NEW.moduleID AND `termID` = NEW.termID;
--     ELSEIF (NEW.timesMisspelled / NEW.timesUsed) > 0.25 AND OLD.hasMastered THEN
--         UPDATE `tito_term_progress`
--         SET `hasMastered` = FALSE
--         WHERE `userID` = NEW.userID AND `moduleID` = NEW.moduleID AND `termID` = NEW.termID;
--     END IF;
-- END //
-- DELIMITER ;





