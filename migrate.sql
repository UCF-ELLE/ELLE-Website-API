-- use elle2020;

-- Update `group` table
ALTER TABLE `group`
ADD COLUMN `status` ENUM('active','archived') DEFAULT 'active';

-- Update admin group to have all modules
INSERT IGNORE INTO group_module (moduleID, groupID)
SELECT DISTINCT msg.moduleID, 1 AS groupID
FROM messages msg;



-- Begin migration chatbot sessions
RENAME TABLE `chatbot_sessions` TO `chatbot_sessions_old`;

CREATE TABLE `chatbot_sessions` (
  `chatbotSID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `totalTimeChatted` float NOT NULL DEFAULT 0,
  `wordsUsed` int(4) NOT NULL DEFAULT 0,
  `moduleWordsUsed` int(4) NOT NULL DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `grammarPerformanceRating` float(4) NOT NULL DEFAULT 0,
  `activeSession` boolean NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`),
  PRIMARY KEY (`chatbotSID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- migrate data from old to new

INSERT IGNORE INTO `chatbot_sessions` (`chatbotSID`, `userID`, `moduleID`, `totalTimeChatted`, `wordsUsed`, `moduleWordsUsed`, `timestamp`)
SELECT `chatbotId`, `userId`, `moduleId`, `totalTimeChatted`, `wordsUsed`, `totalWordsForModule`, `timestamp`
FROM `chatbot_sessions_old`;


-- Begin message migration
RENAME TABLE `messages` TO `messages_old`;

CREATE TABLE `messages` (
  `messageID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `chatbotSID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `source` ENUM('llm','user') NOT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  `isVoiceMessage` boolean NOT NULL DEFAULT 0, 
  `grammarRating` float(4) DEFAULT 0.0,
  PRIMARY KEY (`messageID`),
  FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`), 
  FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`),
  FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Migrate data from old_messages into messages (new)
INSERT IGNORE INTO `messages` (`messageID`, `userID`, `chatbotSID`, `moduleID`, `source`, `message`, `timestamp`, `isVoiceMessage`, `grammarRating`)
SELECT `id`, `userId`, `chatbotId`, `moduleId`, `source`, `value`, `timestamp`, 0, 0
FROM `messages_old`;





-- ADD NEW TABLES
CREATE TABLE `tito_generated_module` (
  `moduleID` int(11) NOT NULL, 
  `proffesorID` int(11) NOT NULL, 
  `modulePrompt` text DEFAULT NULL, 
  FOREIGN KEY(`proffesorID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`proffesorID`, `moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

CREATE TABLE `tito_module` (
  `moduleID` int(11) NOT NULL,
  `classID` int(11) NOT NULL,
  `sequenceID` int(2) NOT NULL DEFAULT 0, 
  `titoPrompt` text DEFAULT NULL, 
  `startDate` DATE DEFAULT NULL, 
  `endDate` DATE DEFAULT NULL, 
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`classID`) REFERENCES `group` (`groupID`),
  PRIMARY KEY(`moduleID`, `moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_module_progress` (
  `proficiencyRate` float(4) DEFAULT 0.0,
  `moduleID` int(11) NOT NULL,
  `studentID` int(11) NOT NULL,
  `completedTutorial` boolean NOT NULL DEFAULT 0,
  `totalTermsUsed` int (5) NOT NULL Default 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`studentID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`moduleID`,`studentID`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_term_progress` (
  `moduleID` int(11) NOT NULL,
  `termID`  int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `proficiencyScore` float(4) NOT NULL DEFAULT 0.0, 
  `timesUsedSuccessfully` int(4) NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`termID`) REFERENCES `term` (`termID`),
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`userID`,`moduleID`,`termID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


CREATE TABLE `tito_voice_message` (
  `userID` int(11) NOT NULL,
  `voiceID` int(11) AUTO_INCREMENT,
  `filename` VARCHAR(255) NOT NULL, 
  `chatbotSID` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  PRIMARY KEY (`voiceID`),
  FOREIGN KEY (`userID`)  REFERENCES `user` (`userID`),
  FOREIGN KEY (`messageID`) REFERENCES `messages` (`messageID`),
  FOREIGN KEY (`chatbotSID`)  REFERENCES `chatbot_sessions` (`chatbotSID`),
  KEY `idx_session_user` (`chatbotSID`, `userID`),
  KEY `idx_voice_message` (`userID`, `messageID`),
  UNIQUE (`userID`, `messageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;



-- Consider IGNORE after INSERT

-- populate `tito_module`
INSERT IGNORE INTO `tito_module` (`moduleID`, `classID`)
SELECT DISTINCT msg.moduleID, gu.groupID
FROM `messages` msg
JOIN `group_user` gu ON msg.userID = gu.userID
JOIN `group_module` gm ON gm.groupID = gu.groupID AND gm.moduleID = msg.moduleID;




-- populate `tito_module_progress`
INSERT IGNORE INTO tito_module_progress (moduleID, studentID, completedTutorial, proficiencyRate)
SELECT DISTINCT msg.moduleID, msg.userID, 0, 0.0
FROM messages msg
JOIN group_user gu ON gu.userID = msg.userID
JOIN group_module gm ON gm.groupID = gu.groupID AND gm.moduleID = msg.moduleID;



-- populate tito_term_progress (VALID) EXCEPT ADDS ADMIN

INSERT IGNORE INTO tito_term_progress (userID, moduleID, termID, proficiencyScore, timesUsedSuccessfully)
SELECT DISTINCT msg.userID, msg.moduleID, t.termID, 0.0, 0
FROM messages msg
JOIN module_question mq ON mq.moduleID = msg.moduleID
JOIN answer a ON a.questionID = mq.questionID
JOIN term t ON t.termID = a.termID
JOIN group_user gu ON gu.userID = msg.userID
-- WHERE gu.accessLevel = 'st';




-- Clean up UNCOMMENT
-- DROP TABLE `chatbot_sessions_old`;
-- DROP TABLE `messages_old`;