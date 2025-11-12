-- MySQL dump 10.13  Distrib 5.7.24, for Linux (x86_64)
--
-- Host: localhost    Database: elle2020
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adaptive_learning`
--

DROP TABLE IF EXISTS `adaptive_learning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `adaptive_learning` (
  `userID` int NOT NULL,
  `termID` int NOT NULL,
  `activation_val` float NOT NULL DEFAULT '-9999',
  `decay_val` float NOT NULL DEFAULT '0.3',
  `dates` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Stored in a unique format due to lack of array support in SQL database.',
  `alpha_val` float NOT NULL DEFAULT '0.3',
  `times` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  KEY `userID` (`userID`),
  KEY `termID` (`termID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `animelle_save_data`
--

DROP TABLE IF EXISTS `animelle_save_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `animelle_save_data` (
  `saveID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `saveData` json DEFAULT NULL,
  PRIMARY KEY (`saveID`),
  UNIQUE KEY `userID` (`userID`),
  KEY `userID_save` (`userID`),
  CONSTRAINT `userID_save` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `answer` (
  `questionID` int NOT NULL,
  `termID` int NOT NULL,
  KEY `answer_ibfk_1` (`questionID`),
  KEY `answer_ibfk_2` (`termID`),
  CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE,
  CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audio` (
  `audioID` int NOT NULL AUTO_INCREMENT,
  `audioLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`audioID`)
) ENGINE=InnoDB AUTO_INCREMENT=1072 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chatbot_sessions`
--

DROP TABLE IF EXISTS `chatbot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chatbot_sessions` (
  `chatbotSID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `moduleID` int NOT NULL,
  `timeChatted` float NOT NULL DEFAULT '0',
  `moduleWordsUsed` int NOT NULL DEFAULT '0',
  `creationTimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isActiveSession` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`chatbotSID`),
  KEY `moduleID` (`moduleID`),
  KEY `userID` (`userID`,`moduleID`,`chatbotSID`),
  CONSTRAINT `chatbot_sessions_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `chatbot_sessions_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=202 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chatbot_sessions_old`
--

DROP TABLE IF EXISTS `chatbot_sessions_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chatbot_sessions_old` (
  `chatbotId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `moduleId` int NOT NULL,
  `totalTimeChatted` float NOT NULL,
  `wordsUsed` int NOT NULL DEFAULT '0',
  `totalWordsForModule` int NOT NULL,
  `grade` float NOT NULL,
  `termsUsed` json NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chatbotId`),
  KEY `userId` (`userId`),
  CONSTRAINT `chatbot_sessions_old_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_module`
--

DROP TABLE IF EXISTS `deleted_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deleted_module` (
  `moduleID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int DEFAULT NULL,
  PRIMARY KEY (`moduleID`),
  KEY `userID` (`userID`),
  CONSTRAINT `deleted_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=217 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_question`
--

DROP TABLE IF EXISTS `deleted_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deleted_question` (
  `questionID` int NOT NULL AUTO_INCREMENT,
  `audioID` int DEFAULT NULL,
  `imageID` int DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`questionID`),
  KEY `audioID` (`audioID`) USING BTREE,
  KEY `imageID` (`imageID`) USING BTREE,
  CONSTRAINT `deleted_question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  CONSTRAINT `deleted_question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1390 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_term`
--

DROP TABLE IF EXISTS `deleted_term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deleted_term` (
  `termID` int NOT NULL AUTO_INCREMENT,
  `imageID` int DEFAULT NULL,
  `audioID` int DEFAULT NULL,
  `front` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `back` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'N',
  `LANGUAGE` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`termID`),
  KEY `term_ibfk_1` (`imageID`),
  KEY `term_ibfk_2` (`audioID`),
  CONSTRAINT `deleted_term_ibfk_1` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `deleted_term_ibfk_2` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL ON UPDATE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2138 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group` (
  `groupID` int NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL,
  PRIMARY KEY (`groupID`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_module`
--

DROP TABLE IF EXISTS `group_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_module` (
  `moduleID` int NOT NULL,
  `groupID` int NOT NULL,
  UNIQUE KEY `moduleID_2` (`moduleID`,`groupID`),
  UNIQUE KEY `moduleID_3` (`moduleID`,`groupID`),
  KEY `groupID` (`groupID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `groupID` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `moduleID` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_user`
--

DROP TABLE IF EXISTS `group_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_user` (
  `userID` int NOT NULL,
  `groupID` int NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st',
  UNIQUE KEY `groupID_2` (`groupID`,`userID`),
  UNIQUE KEY `groupID_3` (`groupID`,`userID`),
  KEY `userID` (`userID`),
  KEY `groupID` (`groupID`),
  CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `titofy_class_onCreate` AFTER INSERT ON `group_user` FOR EACH ROW BEGIN
  IF NEW.accessLevel = 'pf' THEN
    INSERT IGNORE INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
    VALUES (NEW.groupID, NEW.userID, DATE_ADD(CURDATE(), INTERVAL 1 YEAR));
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `titofy_class_onUpdate` AFTER UPDATE ON `group_user` FOR EACH ROW BEGIN
  IF OLD.accessLevel != 'pf' AND NEW.accessLevel = 'pf' THEN
    INSERT IGNORE INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
    VALUES (NEW.groupID, NEW.userID, DATE_ADD(CURDATE(), INTERVAL 1 YEAR));
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `image` (
  `imageID` int NOT NULL AUTO_INCREMENT,
  `imageLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`imageID`)
) ENGINE=InnoDB AUTO_INCREMENT=2239 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item` (
  `itemID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `game` varchar(255) NOT NULL,
  `itemType` varchar(255) NOT NULL,
  `points` int NOT NULL,
  `isDefault` tinyint(1) DEFAULT '0',
  `gender` enum('M','F','N') DEFAULT 'N',
  PRIMARY KEY (`itemID`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_answer`
--

DROP TABLE IF EXISTS `logged_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logged_answer` (
  `logID` int NOT NULL AUTO_INCREMENT,
  `questionID` int DEFAULT NULL,
  `termID` int DEFAULT NULL,
  `sessionID` int DEFAULT NULL,
  `correct` tinyint DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `log_time` time DEFAULT NULL,
  `deleted_questionID` int DEFAULT NULL,
  `deleted_termID` int DEFAULT NULL,
  PRIMARY KEY (`logID`),
  KEY `logged_answer_ibfk_1` (`questionID`),
  KEY `logged_answer_ibfk_3` (`sessionID`),
  KEY `logged_answer_ibfk_4` (`termID`),
  KEY `deleted_term_key` (`deleted_termID`),
  KEY `deleted_question_key` (`deleted_questionID`),
  CONSTRAINT `deleted_question_key` FOREIGN KEY (`deleted_questionID`) REFERENCES `deleted_question` (`questionID`),
  CONSTRAINT `deleted_term_key` FOREIGN KEY (`deleted_termID`) REFERENCES `deleted_term` (`termID`),
  CONSTRAINT `logged_answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE SET NULL,
  CONSTRAINT `logged_answer_ibfk_3` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`),
  CONSTRAINT `logged_answer_ibfk_4` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=142531 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_pasta`
--

DROP TABLE IF EXISTS `logged_pasta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logged_pasta` (
  `logID` int NOT NULL AUTO_INCREMENT,
  `pastaID` int NOT NULL,
  `correct` tinyint(1) DEFAULT NULL,
  `qFrameID` int DEFAULT NULL,
  `questionType` enum('identify','split','mc1','mc2') DEFAULT NULL,
  `sessionID` int NOT NULL,
  `log_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`logID`),
  KEY `pastaID` (`pastaID`),
  KEY `sessionID` (`sessionID`),
  KEY `qFrameID` (`qFrameID`),
  CONSTRAINT `logged_pasta_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`),
  CONSTRAINT `logged_pasta_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`),
  CONSTRAINT `logged_pasta_ibfk_3` FOREIGN KEY (`qFrameID`) REFERENCES `question_frame` (`qframeID`)
) ENGINE=InnoDB AUTO_INCREMENT=903 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_user_item`
--

DROP TABLE IF EXISTS `logged_user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logged_user_item` (
  `logItemID` int NOT NULL AUTO_INCREMENT,
  `userItemID` int NOT NULL,
  `sessionID` int NOT NULL,
  PRIMARY KEY (`logItemID`),
  KEY `userItemID` (`userItemID`),
  KEY `sessionID` (`sessionID`),
  CONSTRAINT `logged_user_item_ibfk_1` FOREIGN KEY (`userItemID`) REFERENCES `user_item` (`userItemID`),
  CONSTRAINT `logged_user_item_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`)
) ENGINE=InnoDB AUTO_INCREMENT=17574 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_preferences`
--

DROP TABLE IF EXISTS `mentor_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mentor_preferences` (
  `mentorPreferenceID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `mentorName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`mentorPreferenceID`),
  KEY `mentor_preferences_userID` (`userID`),
  CONSTRAINT `mentor_preferences_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_question_frequency`
--

DROP TABLE IF EXISTS `mentor_question_frequency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mentor_question_frequency` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `numIncorrectCards` int DEFAULT NULL,
  `numCorrectCards` int DEFAULT NULL,
  `time` int DEFAULT NULL,
  `moduleID` int NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `module_key` (`moduleID`),
  CONSTRAINT `module_key` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_responses`
--

DROP TABLE IF EXISTS `mentor_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mentor_responses` (
  `mentorResponseID` int NOT NULL AUTO_INCREMENT,
  `questionID` int NOT NULL,
  `sessionID` int NOT NULL,
  `response` varchar(255) DEFAULT NULL,
  `deleted_questionID` int DEFAULT NULL,
  PRIMARY KEY (`mentorResponseID`),
  KEY `mentor_responses_questionID` (`questionID`),
  KEY `mentor_responses_sessionID` (`sessionID`),
  KEY `deleted_question_ID` (`deleted_questionID`),
  CONSTRAINT `deleted_question_ID` FOREIGN KEY (`deleted_questionID`) REFERENCES `deleted_question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `mentor_responses_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `mentor_responses_sessionID` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `messageID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `chatbotSID` int NOT NULL,
  `classID` int NOT NULL DEFAULT '1',
  `moduleID` int NOT NULL,
  `source` enum('llm','user') NOT NULL,
  `message` text NOT NULL,
  `creationTimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creationDate` date DEFAULT NULL,
  `isVoiceMessage` tinyint(1) NOT NULL DEFAULT '0',
  `keyWordsUsed` int NOT NULL DEFAULT '0',
  `grammarScore` float DEFAULT '0',
  PRIMARY KEY (`messageID`),
  KEY `classID` (`classID`),
  KEY `creationDate` (`creationDate`),
  KEY `userID` (`userID`,`messageID`),
  KEY `creationTimestamp` (`creationTimestamp`),
  KEY `moduleID` (`moduleID`),
  KEY `chatbotSID` (`chatbotSID`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_4` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=291 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `onMessageInsert_setDate` BEFORE INSERT ON `messages` FOR EACH ROW BEGIN
  IF NEW.creationDate IS NULL THEN
    SET NEW.creationDate = CURDATE();
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `onMessageUpdate_update_chatbotSessions` AFTER UPDATE ON `messages` FOR EACH ROW BEGIN 
  IF NEW.keyWordsUsed > OLD.keyWordsUsed THEN 
    UPDATE `chatbot_sessions` 
    SET `moduleWordsUsed` = `moduleWordsUsed` + (NEW.keyWordsUsed - OLD.keyWordsUsed) 
    WHERE userID = NEW.userID AND moduleID = NEW.moduleID AND chatbotSID = NEW.chatbotSID;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `messages_old`
--

DROP TABLE IF EXISTS `messages_old`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages_old` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `chatbotId` int NOT NULL,
  `moduleId` int NOT NULL,
  `source` enum('llm','user') NOT NULL,
  `value` text NOT NULL,
  `metadata` json NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbotId` (`chatbotId`),
  KEY `userId` (`userId`),
  CONSTRAINT `messages_old_ibfk_1` FOREIGN KEY (`chatbotId`) REFERENCES `chatbot_sessions_old` (`chatbotId`) ON DELETE CASCADE,
  CONSTRAINT `messages_old_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=215 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `module` (
  `moduleID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int NOT NULL,
  `isPastaModule` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`moduleID`),
  KEY `module_userID` (`userID`),
  CONSTRAINT `module_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=241 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `onModuleCreation_addToSuperProf` AFTER INSERT ON `module` FOR EACH ROW BEGIN
  INSERT IGNORE INTO `group_module` (`moduleID`, `groupID`)
  VALUES (new.moduleID, 74);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `module_question`
--

DROP TABLE IF EXISTS `module_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `module_question` (
  `moduleID` int NOT NULL,
  `questionID` int NOT NULL,
  KEY `moduleID` (`moduleID`),
  KEY `questionID` (`questionID`) USING BTREE,
  CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `afterInsertOnModuleQuestion_update_totalTerms` AFTER INSERT ON `module_question` FOR EACH ROW BEGIN
    DECLARE term_count INT DEFAULT 0;

    
    SELECT COUNT(DISTINCT t.termID)
    INTO term_count
    FROM `module_question` mq
    JOIN answer a ON mq.questionID = a.questionID
    JOIN term t ON a.termID = t.termID
    WHERE mq.moduleID = NEW.moduleID;

    
    UPDATE `tito_module`
    SET totalTerms = term_count
    WHERE moduleID = NEW.moduleID;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `afterDeleteOnModuleQuestion_update_totalTerms` AFTER DELETE ON `module_question` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `multiple_choice_answers`
--

DROP TABLE IF EXISTS `multiple_choice_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `multiple_choice_answers` (
  `multipleChoiceID` int NOT NULL AUTO_INCREMENT,
  `questionID` int NOT NULL,
  `answerChoice` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`multipleChoiceID`),
  KEY `multiple_choice_answers_questionID` (`questionID`),
  CONSTRAINT `multiple_choice_answers_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pasta`
--

DROP TABLE IF EXISTS `pasta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pasta` (
  `pastaID` int NOT NULL AUTO_INCREMENT,
  `moduleID` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `utterance` varchar(255) NOT NULL,
  `mc1Answer` int DEFAULT NULL,
  `mc2Answer` int DEFAULT NULL,
  PRIMARY KEY (`pastaID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `fk_pasta_module` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pasta_answer`
--

DROP TABLE IF EXISTS `pasta_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pasta_answer` (
  `answerID` int NOT NULL AUTO_INCREMENT,
  `pastaID` int NOT NULL,
  `value` int NOT NULL,
  `answerType` enum('identify','split','mc1','mc2') NOT NULL,
  PRIMARY KEY (`answerID`),
  KEY `pastaID` (`pastaID`),
  CONSTRAINT `fk_pasta_answer_pastaID` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`)
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS `question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question` (
  `questionID` int NOT NULL AUTO_INCREMENT,
  `audioID` int DEFAULT NULL,
  `imageID` int DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`questionID`),
  KEY `audioID` (`audioID`) USING BTREE,
  KEY `imageID` (`imageID`) USING BTREE,
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  CONSTRAINT `question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2747 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_frame`
--

DROP TABLE IF EXISTS `question_frame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_frame` (
  `qframeID` int NOT NULL AUTO_INCREMENT,
  `moduleID` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `mc1QuestionText` varchar(255) DEFAULT NULL,
  `splitQuestionVar` varchar(255) NOT NULL,
  `identifyQuestionVar` varchar(255) DEFAULT NULL,
  `mc2QuestionText` varchar(255) DEFAULT NULL,
  `displayName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`qframeID`),
  UNIQUE KEY `unique_category_per_module` (`moduleID`,`category`),
  CONSTRAINT `fk_question_frame_moduleID` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_frame_option`
--

DROP TABLE IF EXISTS `question_frame_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_frame_option` (
  `optionID` int NOT NULL AUTO_INCREMENT,
  `qframeID` int NOT NULL,
  `optionText` varchar(255) NOT NULL,
  `mcQuestionNumber` int NOT NULL,
  PRIMARY KEY (`optionID`),
  UNIQUE KEY `unique_qframe_mc_option` (`qframeID`,`mcQuestionNumber`,`optionText`),
  CONSTRAINT `fk_question_option_qframeID` FOREIGN KEY (`qframeID`) REFERENCES `question_frame` (`qframeID`),
  CONSTRAINT `check_mc_question_number` CHECK ((`mcQuestionNumber` in (1,2)))
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `session` (
  `sessionID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `moduleID` int DEFAULT NULL,
  `sessionDate` date DEFAULT NULL,
  `playerScore` int DEFAULT NULL,
  `startTime` time(5) DEFAULT NULL,
  `endTime` time(5) DEFAULT NULL,
  `platform` varchar(3) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `deleted_moduleID` int DEFAULT NULL,
  PRIMARY KEY (`sessionID`),
  KEY `userID` (`userID`),
  KEY `moduleID` (`moduleID`),
  KEY `deleted_module_key` (`deleted_moduleID`),
  CONSTRAINT `deleted_module_key` FOREIGN KEY (`deleted_moduleID`) REFERENCES `deleted_module` (`moduleID`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  CONSTRAINT `session_ibfk_2` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18453 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tag` (
  `termID` int NOT NULL AUTO_INCREMENT,
  `tagName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  KEY `termID` (`termID`) USING BTREE,
  CONSTRAINT `tag_ibfk_1` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2100 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `term`
--

DROP TABLE IF EXISTS `term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `term` (
  `termID` int NOT NULL AUTO_INCREMENT,
  `imageID` int DEFAULT NULL,
  `audioID` int DEFAULT NULL,
  `front` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `back` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'N',
  `language` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`termID`),
  KEY `term_ibfk_1` (`imageID`),
  KEY `term_ibfk_2` (`audioID`),
  CONSTRAINT `term_ibfk_1` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `term_ibfk_2` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL ON UPDATE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2612 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tito_class_status`
--

DROP TABLE IF EXISTS `tito_class_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_class_status` (
  `classID` int NOT NULL,
  `professorID` int NOT NULL,
  `titoStatus` enum('active','inactive') NOT NULL DEFAULT 'active',
  `titoExpirationDate` date NOT NULL,
  PRIMARY KEY (`classID`,`professorID`),
  KEY `professorID` (`professorID`),
  KEY `titoStatus` (`titoStatus`),
  CONSTRAINT `tito_class_status_ibfk_1` FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `tito_class_status_ibfk_2` FOREIGN KEY (`professorID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `addFreeChatModule` AFTER INSERT ON `tito_class_status` FOR EACH ROW BEGIN
  INSERT IGNORE INTO `tito_module` (moduleID, classID)
  VALUES (228, new.classID);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `onClassStatusUpdate_updateModulesStatus` AFTER UPDATE ON `tito_class_status` FOR EACH ROW BEGIN
    
    IF OLD.titoStatus = 'active' AND NEW.titoStatus = 'inactive' THEN
        UPDATE `tito_module`
        SET status = 'inactive'
        WHERE classID = NEW.classID;
    END IF;
    
    IF OLD.titoStatus = 'inactive' AND NEW.titoStatus = 'active' THEN
        UPDATE `tito_module`
        SET status = 'active'
        WHERE classID = NEW.classID;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tito_lore`
--

DROP TABLE IF EXISTS `tito_lore`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_lore` (
  `loreID` int NOT NULL AUTO_INCREMENT,
  `ownerID` int NOT NULL DEFAULT '2',
  PRIMARY KEY (`loreID`),
  KEY `ownerID` (`ownerID`),
  KEY `loreID` (`loreID`,`ownerID`),
  CONSTRAINT `tito_lore_ibfk_1` FOREIGN KEY (`ownerID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tito_lore_text`
--

DROP TABLE IF EXISTS `tito_lore_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_lore_text` (
  `loreID` int NOT NULL,
  `sequenceNumber` int NOT NULL,
  `loreText` text NOT NULL,
  PRIMARY KEY (`loreID`,`sequenceNumber`),
  CONSTRAINT `tito_lore_text_ibfk_1` FOREIGN KEY (`loreID`) REFERENCES `tito_lore` (`loreID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tito_module`
--

DROP TABLE IF EXISTS `tito_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_module` (
  `moduleID` int NOT NULL,
  `classID` int NOT NULL,
  `sequenceID` int NOT NULL DEFAULT '0',
  `titoPrompt` text,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `totalTerms` int NOT NULL DEFAULT '0',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `loreAssigned` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`classID`,`moduleID`),
  KEY `moduleID` (`moduleID`),
  KEY `classID` (`classID`,`status`),
  KEY `loreAssigned` (`loreAssigned`),
  CONSTRAINT `tito_module_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `tito_module_ibfk_2` FOREIGN KEY (`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `tito_module_ibfk_3` FOREIGN KEY (`loreAssigned`) REFERENCES `tito_lore` (`loreID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `beforeInsertOntitoModule_update_totalTerms` BEFORE INSERT ON `tito_module` FOR EACH ROW BEGIN
  DECLARE term_count INT DEFAULT 0;
  
  SELECT COUNT(DISTINCT t.termID)
  INTO term_count
  FROM `module_question` mq
  JOIN answer a ON mq.questionID = a.questionID
  JOIN term t ON a.termID = t.termID
  WHERE mq.moduleID = NEW.moduleID;

  
  SET NEW.totalTerms = term_count;


  IF NEW.startDate IS NULL THEN
    SET NEW.startDate = CURDATE();
  END IF;
  IF NEW.endDate IS NULL THEN
    SET NEW.endDate = DATE_ADD(NEW.startDate, INTERVAL 1 YEAR); 
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tito_module_progress`
--

DROP TABLE IF EXISTS `tito_module_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_module_progress` (
  `moduleID` int NOT NULL,
  `userID` int NOT NULL,
  `completedTutorial` tinyint(1) NOT NULL DEFAULT '0',
  `termsMastered` int NOT NULL DEFAULT '0',
  `loreProgress` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`moduleID`,`userID`),
  KEY `userID` (`userID`),
  CONSTRAINT `tito_module_progress_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `tito_module_progress_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tito_term_progress`
--

DROP TABLE IF EXISTS `tito_term_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_term_progress` (
  `moduleID` int NOT NULL,
  `termID` int NOT NULL,
  `userID` int NOT NULL,
  `timesMisspelled` int NOT NULL DEFAULT '0',
  `timesUsed` int NOT NULL DEFAULT '0',
  `hasMastered` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`userID`,`moduleID`,`termID`),
  KEY `termID` (`termID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `tito_term_progress_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `tito_term_progress_ibfk_2` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE,
  CONSTRAINT `tito_term_progress_ibfk_3` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `beforeUpdateTermProgress_change_hasMastered` BEFORE UPDATE ON `tito_term_progress` FOR EACH ROW BEGIN
    IF (NEW.timesUsed > 0) AND (OLD.hasMastered = 0) THEN
      SET NEW.hasMastered = 1;
    END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`elle`@`%`*/ /*!50003 TRIGGER `afterUpdateTermProgress_change_termsMastered` AFTER UPDATE ON `tito_term_progress` FOR EACH ROW BEGIN
    
    IF NEW.hasMastered = 1 AND OLD.hasMastered = 0 THEN
        UPDATE `tito_module_progress`
        SET `termsMastered` = `termsMastered` + 1
        WHERE `moduleID` = NEW.moduleID AND `userID` = NEW.userID;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tito_voice_message`
--

DROP TABLE IF EXISTS `tito_voice_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tito_voice_message` (
  `userID` int NOT NULL,
  `voiceID` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(30) NOT NULL,
  `chatbotSID` int NOT NULL,
  `messageID` int NOT NULL,
  `audioExpireDate` date NOT NULL,
  PRIMARY KEY (`voiceID`),
  UNIQUE KEY `userID_2` (`userID`,`messageID`),
  KEY `messageID` (`messageID`),
  KEY `chatbotSID` (`chatbotSID`,`userID`),
  KEY `userID` (`userID`,`messageID`),
  CONSTRAINT `tito_voice_message_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `tito_voice_message_ibfk_2` FOREIGN KEY (`messageID`) REFERENCES `messages` (`messageID`) ON DELETE CASCADE,
  CONSTRAINT `tito_voice_message_ibfk_3` FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokens` (
  `expired` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `userID` int NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `pwdResetToken` varchar(100) DEFAULT NULL,
  `permissionGroup` enum('st','pf','su') NOT NULL DEFAULT 'st',
  `otc` varchar(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=577 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_item`
--

DROP TABLE IF EXISTS `user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_item` (
  `userItemID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `itemID` int NOT NULL,
  `timeOfPurchase` datetime DEFAULT CURRENT_TIMESTAMP,
  `game` varchar(255) NOT NULL,
  `isWearing` tinyint(1) DEFAULT '0',
  `color` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`userItemID`),
  UNIQUE KEY `uc_user_item` (`userID`,`itemID`),
  KEY `userID` (`userID`),
  KEY `itemID` (`itemID`),
  CONSTRAINT `user_item_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  CONSTRAINT `user_item_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`)
) ENGINE=InnoDB AUTO_INCREMENT=4073 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_preferences` (
  `userPreferenceID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `preferredHand` enum('R','L','A','') NOT NULL DEFAULT 'A',
  `vrGloveColor` varchar(15) NOT NULL DEFAULT 'Brown',
  PRIMARY KEY (`userPreferenceID`),
  KEY `userID` (`userID`),
  CONSTRAINT `userID_preferences` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=578 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-10 14:58:09
