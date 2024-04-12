-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: localhost    Database: elle_database
-- ------------------------------------------------------
-- Server version	8.0.36-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `animelle_save_data`
--

DROP TABLE IF EXISTS `animelle_save_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `animelle_save_data` (
  `saveID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `saveData` json DEFAULT NULL,
  PRIMARY KEY (`saveID`),
  UNIQUE KEY `userID` (`userID`),
  KEY `userID_save` (`userID`),
  CONSTRAINT `userID_save` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer` (
  `questionID` int NOT NULL,
  `termID` int NOT NULL,
  KEY `answer_ibfk_1` (`questionID`),
  KEY `answer_ibfk_2` (`termID`),
  CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE,
  CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audio` (
  `audioID` int NOT NULL AUTO_INCREMENT,
  `audioLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`audioID`)
) ENGINE=InnoDB AUTO_INCREMENT=543 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_module`
--

DROP TABLE IF EXISTS `deleted_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_module` (
  `moduleID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int DEFAULT NULL,
  PRIMARY KEY (`moduleID`),
  KEY `userID` (`userID`),
  CONSTRAINT `deleted_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_question`
--

DROP TABLE IF EXISTS `deleted_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=975 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deleted_term`
--

DROP TABLE IF EXISTS `deleted_term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=876 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `groupID` int NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL,
  PRIMARY KEY (`groupID`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group_module`
--

DROP TABLE IF EXISTS `group_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_module` (
  `moduleID` int NOT NULL,
  `groupID` int NOT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_user` (
  `userID` int NOT NULL,
  `groupID` int NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st',
  KEY `userID` (`userID`),
  KEY `groupID` (`groupID`),
  CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `image` (
  `imageID` int NOT NULL AUTO_INCREMENT,
  `imageLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`imageID`)
) ENGINE=InnoDB AUTO_INCREMENT=645 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `itemID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `game` varchar(255) NOT NULL,
  `itemType` varchar(255) NOT NULL,
  `points` int NOT NULL,
  `isDefault` tinyint(1) DEFAULT '0',
  `gender` enum('M','F','N') DEFAULT 'N',
  PRIMARY KEY (`itemID`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_answer`
--

DROP TABLE IF EXISTS `logged_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=55146 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_pasta`
--

DROP TABLE IF EXISTS `logged_pasta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=978 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logged_user_item`
--

DROP TABLE IF EXISTS `logged_user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logged_user_item` (
  `logItemID` int NOT NULL AUTO_INCREMENT,
  `userItemID` int NOT NULL,
  `sessionID` int NOT NULL,
  PRIMARY KEY (`logItemID`),
  KEY `userItemID` (`userItemID`),
  KEY `sessionID` (`sessionID`),
  CONSTRAINT `logged_user_item_ibfk_1` FOREIGN KEY (`userItemID`) REFERENCES `user_item` (`userItemID`),
  CONSTRAINT `logged_user_item_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_preferences`
--

DROP TABLE IF EXISTS `mentor_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_question_frequency` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `numIncorrectCards` int DEFAULT NULL,
  `numCorrectCards` int DEFAULT NULL,
  `time` int DEFAULT NULL,
  `moduleID` int NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `module_key` (`moduleID`),
  CONSTRAINT `module_key` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_responses`
--

DROP TABLE IF EXISTS `mentor_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `moduleID` int NOT NULL AUTO_INCREMENT,
  `name` varchar(250) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int NOT NULL,
  `isPastaModule` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`moduleID`),
  KEY `module_userID` (`userID`),
  CONSTRAINT `module_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `module_question`
--

DROP TABLE IF EXISTS `module_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_question` (
  `moduleID` int NOT NULL,
  `questionID` int NOT NULL,
  KEY `moduleID` (`moduleID`),
  KEY `questionID` (`questionID`) USING BTREE,
  CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `multiple_choice_answers`
--

DROP TABLE IF EXISTS `multiple_choice_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasta` (
  `pastaID` int NOT NULL AUTO_INCREMENT,
  `moduleID` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `utterance` varchar(255) NOT NULL,
  `mc1Answer` int DEFAULT NULL,
  `mc2Answer` int DEFAULT NULL,
  PRIMARY KEY (`pastaID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `pasta_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pasta_answer`
--

DROP TABLE IF EXISTS `pasta_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasta_answer` (
  `answerID` int NOT NULL AUTO_INCREMENT,
  `pastaID` int NOT NULL,
  `value` int NOT NULL,
  `answerType` enum('identify','split','mc1','mc2') NOT NULL,
  PRIMARY KEY (`answerID`),
  KEY `pastaID` (`pastaID`),
  CONSTRAINT `pasta_answer_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`)
) ENGINE=InnoDB AUTO_INCREMENT=149 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS `question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question` (
  `questionID` int NOT NULL AUTO_INCREMENT,
  `audioID` int DEFAULT NULL,
  `imageID` int DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`questionID`),
  KEY `audioID` (`audioID`) USING BTREE,
  KEY `imageID` (`imageID`) USING BTREE,
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  CONSTRAINT `question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1009 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_frame`
--

DROP TABLE IF EXISTS `question_frame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `question_frame_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `question_frame_option`
--

DROP TABLE IF EXISTS `question_frame_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_frame_option` (
  `optionID` int NOT NULL AUTO_INCREMENT,
  `qframeID` int NOT NULL,
  `optionText` varchar(255) NOT NULL,
  `mcQuestionNumber` int NOT NULL,
  PRIMARY KEY (`optionID`),
  UNIQUE KEY `unique_qframe_mc_option` (`qframeID`,`mcQuestionNumber`,`optionText`),
  CONSTRAINT `question_frame_option_ibfk_1` FOREIGN KEY (`qframeID`) REFERENCES `question_frame` (`qframeID`),
  CONSTRAINT `check_mc_question_number` CHECK ((`mcQuestionNumber` in (1,2)))
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6661 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `termID` int NOT NULL AUTO_INCREMENT,
  `tagName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  KEY `termID` (`termID`) USING BTREE,
  CONSTRAINT `tag_ibfk_1` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=844 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `term`
--

DROP TABLE IF EXISTS `term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `term` (
  `termID` int NOT NULL AUTO_INCREMENT,
  `imageID` int DEFAULT NULL,
  `audioID` int DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=880 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `expired` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_item`
--

DROP TABLE IF EXISTS `user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_item` (
  `userItemID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `itemID` int NOT NULL,
  `timeOfPurchase` datetime DEFAULT CURRENT_TIMESTAMP,
  `game` varchar(255) NOT NULL,
  `isWearing` tinyint(1) DEFAULT '0',
  `color` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`userItemID`),
  KEY `userID` (`userID`),
  KEY `itemID` (`itemID`),
  CONSTRAINT `user_item_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  CONSTRAINT `user_item_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `userPreferenceID` int NOT NULL AUTO_INCREMENT,
  `userID` int NOT NULL,
  `preferredHand` enum('R','L','A','') NOT NULL DEFAULT 'A',
  `vrGloveColor` varchar(15) NOT NULL DEFAULT 'Brown',
  PRIMARY KEY (`userPreferenceID`),
  KEY `userID` (`userID`),
  CONSTRAINT `userID_preferences` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-04-12 19:25:39
