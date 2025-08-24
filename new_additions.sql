CREATE TABLE `group_user` (
  `userID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st',
  KEY `userID` (`userID`),
  KEY `groupID` (`groupID`),
  CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `module` (
  `moduleID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(250) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint(4) DEFAULT NULL,
  `userID` int(11) NOT NULL,
  `isPastaModule` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`moduleID`),
  KEY `module_userID` (`userID`),
  CONSTRAINT `module_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `module_question` (
  `moduleID` int(11) NOT NULL,
  `questionID` int(11) NOT NULL,
  KEY `moduleID` (`moduleID`),
  KEY `questionID` (`questionID`) USING BTREE,
  CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `question` (
  `questionID` int(11) NOT NULL AUTO_INCREMENT,
  `audioID` int(11) DEFAULT NULL,
  `imageID` int(11) DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`questionID`),
  KEY `audioID` (`audioID`) USING BTREE,
  KEY `imageID` (`imageID`) USING BTREE,
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  CONSTRAINT `question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `term` (
  `termID` int(11) NOT NULL AUTO_INCREMENT,
  `imageID` int(11) DEFAULT NULL,
  `audioID` int(11) DEFAULT NULL,
  `front` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `back` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'N',
  `language` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`termID`),
  KEY `term_ibfk_1` (`imageID`),
  KEY `term_ibfk_2` (`audioID`),
  CONSTRAINT `term_ibfk_1` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `term_ibfk_2` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL ON UPDATE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `user` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `pwdResetToken` varchar(100) DEFAULT NULL,
  `permissionGroup` enum('st','pf','su') NOT NULL DEFAULT 'st',
  `otc` varchar(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `image` (
  `imageID` int(11) NOT NULL AUTO_INCREMENT,
  `imageLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`imageID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `audio` (
  `audioID` int(11) NOT NULL AUTO_INCREMENT,
  `audioLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`audioID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Dependencies




--modified --modified --modified --modified
CREATE TABLE `group` (
  `groupID` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL,
  `status` enum('active','archived') DEFAULT 'active', -- for TWT, maybe for other classes
  PRIMARY KEY (`groupID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


CREATE TABLE `chatbot_sessions` (
  `chatbotSID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `moduleID` int(11) NOT NULL,
  `totalTimeChatted` float NOT NULL DEFAULT 0,
  `wordsUsed` int(11) NOT NULL DEFAULT 0,
  `moduleWordsUsed` int(11) NOT NULL DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `grammarPerformanceRating` float(4) NOT NULL DEFAULT 0,
  `activeSession` boolean NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`),
  PRIMARY KEY (`chatbotSID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- The messeges sent between user and LLM
-- trigger on insert, update chatbot session performance async and related
CREATE TABLE `messages` (
  `messageID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `chatbotSID` int(11) NOT NULL,
  `moduleID` int(11) NOT NULL,
  `source` enum('llm','user') NOT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(), -- When message was sent
  `isVoiceMessage` boolean NOT NULL DEFAULT 0, -- if voice message, fetches audio for review
  `grammarRating` float(4) DEFAULT 0, -- xxx.x%, calculated later asynchronously, NULL means score unavailable
  PRIMARY KEY (`messageID`),
  KEY `chatbotSID` (`chatbotSID`),
  KEY `userID` (`userID`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- on module deletion delete tito_module too & relevant
-- maybe allow dragging of modules to reorder on front end
-- class ID tied to a professor user
CREATE TABLE `tito_module` (
  `moduleID` int(11) NOT NULL,
  `classID` int(11) NOT NULL,
  `sequenceID` int(2) NOT NULL, -- chronological order in the unit
  `titoPrompt` text DEFAULT NULL, -- extra instructions given to the chatbot for the module, can be used to prevent extraneous materials
  `startDate` DATE NOT NULL, -- default is today/day of creation
  `endDate` DATE NOT NULL, -- default is end of semesterFOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`classID`) REFERENCES `group` (`groupID`),
  PRIMARY KEY(`moduleID`, `classID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- user progress on a term
CREATE TABLE `tito_term_progress` (
  `moduleID` int(11) NOT NULL,
  `termID`  int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `proficiencyScore` float(4) NOT NULL DEFAULT 0.0, -- expect xxx.x%
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`termID`) REFERENCES `term` (`termID`),
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`userID`,`moduleID`,`termID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


-- Contains file path to audio message
CREATE TABLE `tito_voice_message` (
  `userID` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  `filePath` VARCHAR(255) NOT NULL, -- relative path for audio access
  PRIMARY KEY (`messageID`),
  FOREIGN KEY (`userID`)  REFERENCES `user` (`userID`),
  FOREIGN KEY (`messageID`)  REFERENCES `messages` (`messageID`),
  KEY `userID` (`userID`) --quickly search for specific users
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;


-- create a trigger to auto update on a term insert/update
-- contains overall progress on the current module for a student
CREATE TABLE `tito_module_progress` (
  `termID` int(11) NOT NULL,
  `proiciencyRate` float(4) DEFAULT 0.0, -- xxx.x% expected
  `moduleID` int(11) NOT NULL,
  `studentID` int(11) NOT NULL,
  `completedTutorial` boolean NOT NULL DEFAULT 0, -- becomes 1 after tito intro scene finishes
  FOREIGN KEY(`termID`) REFERENCES `term` (`termID`),
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
  FOREIGN KEY(`studentID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`moduleID`,`studentID`) -- expects searches to be all modules in practice by student
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- temp hold new modules
-- trigger to export to `module` table then repopulate tito_module
-- Only stores a reference to `module`s created via AI
CREATE TABLE `tito_generated_module` (
  `moduleID` int(11) NOT NULL, -- module assigned to this class
  `proffesorID` int(11) NOT NULL, -- professor of this class
  `modulePrompt` text DEFAULT NULL, -- extra instructions for AI
  FOREIGN KEY(`proffesorID`) REFERENCES `user` (`userID`),
  PRIMARY KEY(`proffesorID`, `moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- module_question maps to module and a question table
-- -- answer maps to a question and term table

-- so to map terms to a module 
-- finding the module of a term
-- -- select moduleID FROM module_questions where (answer.questionID = module_questions.questionID)

-- finding the terms of a module
-- -- select questionID FROM module_question where (module_question.moduleID = SOME_ID)
-- with result you have all terms linked to module
-- -- select termID FROM term WHERE questionID(results) = answer.questionID 



-- OLD STUFF

-- DROP TABLE IF EXISTS `tito_unit`; -- sequence ID is an issue, organized in assigned_unit
-- CREATE TABLE `tito_unit` (
--   `professorID` int(11) NOT NULL,
--   `unitID` int(11) NOT NULL,
--   `uName` text DEFAULT 'unnamed unit',
--   `languageID` char(2) NOT NULL,
--   `isPrivate` TINYINT(1) DEFAULT 1, -- maybe use an enum (public, select_sharing, private)
--   FOREIGN KEY(`professorID`) REFERENCES `user` (`userID`), -- add constraint professorID must be a 'pf' user
--   PRIMARY KEY(`unitID`)
  
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- DROP TABLE IF EXISTS `tito_unit_access`; -- allows other professors to use the units
-- CREATE TABLE `tito_unit_access` (
--   `professorID` int(11) NOT NULL,
--   `unitID` int(11) NOT NULL,
--   FOREIGN KEY(`professorID`) REFERENCES `user` (`userID`),
--   FOREIGN KEY(`unitID`) REFERENCES `tito_unit` (`unitID`),
--   PRIMARY KEY(`professorID`,`unitID`) -- a composite key
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- DROP TABLE IF EXISTS `tito_assigned_modules`; -- for students to receive unit to do work on
-- CREATE TABLE `tito_assigned_modules` (
--   `classID` int(11) NOT NULL,
--   `moduleID` int(11) NOT NULL,
--   `startDate` DATE NOT NULL, -- default is today/day of creation
--   `endDate` DATE NOT NULL, -- default is end of semester
--   FOREIGN KEY(`classID`) REFERENCES `group` (`groupID`),
--   FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`),
--   PRIMARY KEY(`classID`,`moduleID`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;