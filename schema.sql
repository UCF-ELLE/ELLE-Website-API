/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.4.7-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: elle_database
-- ------------------------------------------------------
-- Server version	11.4.7-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `adaptive_learning`
--

DROP TABLE IF EXISTS `adaptive_learning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `adaptive_learning` (
  `userID` int(11) NOT NULL,
  `termID` int(11) NOT NULL,
  `activation_val` float NOT NULL DEFAULT -9999,
  `decay_val` float NOT NULL DEFAULT 0.3,
  `dates` varchar(500) NOT NULL COMMENT 'Stored in a unique format due to lack of array support in SQL database.',
  `alpha_val` float NOT NULL DEFAULT 0.3,
  `times` varchar(500) NOT NULL,
  KEY `userID` (`userID`),
  KEY `termID` (`termID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adaptive_learning`
--

LOCK TABLES `adaptive_learning` WRITE;
/*!40000 ALTER TABLE `adaptive_learning` DISABLE KEYS */;
/*!40000 ALTER TABLE `adaptive_learning` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `animelle_save_data`
--

DROP TABLE IF EXISTS `animelle_save_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `animelle_save_data` (
  `saveID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `saveData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`saveData`)),
  PRIMARY KEY (`saveID`),
  UNIQUE KEY `userID` (`userID`),
  KEY `userID_save` (`userID`),
  CONSTRAINT `userID_save` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `animelle_save_data`
--

LOCK TABLES `animelle_save_data` WRITE;
/*!40000 ALTER TABLE `animelle_save_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `animelle_save_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer` (
  `questionID` int(11) NOT NULL,
  `termID` int(11) NOT NULL,
  KEY `answer_ibfk_1` (`questionID`),
  KEY `answer_ibfk_2` (`termID`),
  CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE,
  CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer`
--

LOCK TABLES `answer` WRITE;
/*!40000 ALTER TABLE `answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audio` (
  `audioID` int(11) NOT NULL AUTO_INCREMENT,
  `audioLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`audioID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbot_sessions`
--

DROP TABLE IF EXISTS `chatbot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY (`chatbotSID`),
  KEY(`userID`, `moduleID`, `chatbotSID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbot_sessions`
--

LOCK TABLES `chatbot_sessions` WRITE;
/*!40000 ALTER TABLE `chatbot_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `chatbot_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deleted_module`
--

DROP TABLE IF EXISTS `deleted_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_module` (
  `moduleID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint(4) DEFAULT NULL,
  `userID` int(11) DEFAULT NULL,
  PRIMARY KEY (`moduleID`),
  KEY `userID` (`userID`),
  CONSTRAINT `deleted_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deleted_module`
--

LOCK TABLES `deleted_module` WRITE;
/*!40000 ALTER TABLE `deleted_module` DISABLE KEYS */;
/*!40000 ALTER TABLE `deleted_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deleted_question`
--

DROP TABLE IF EXISTS `deleted_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_question` (
  `questionID` int(11) NOT NULL AUTO_INCREMENT,
  `audioID` int(11) DEFAULT NULL,
  `imageID` int(11) DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`questionID`),
  KEY `audioID` (`audioID`) USING BTREE,
  KEY `imageID` (`imageID`) USING BTREE,
  CONSTRAINT `deleted_question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  CONSTRAINT `deleted_question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deleted_question`
--

LOCK TABLES `deleted_question` WRITE;
/*!40000 ALTER TABLE `deleted_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `deleted_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deleted_term`
--

DROP TABLE IF EXISTS `deleted_term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deleted_term` (
  `termID` int(11) NOT NULL AUTO_INCREMENT,
  `imageID` int(11) DEFAULT NULL,
  `audioID` int(11) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deleted_term`
--

LOCK TABLES `deleted_term` WRITE;
/*!40000 ALTER TABLE `deleted_term` DISABLE KEYS */;
/*!40000 ALTER TABLE `deleted_term` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `groupID` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL,
  `status` enum('active','archived') DEFAULT 'active', -- for TWT, maybe for other classes
  `expirationDate` timestamp NOT NULL,
  PRIMARY KEY (`groupID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group`
--

LOCK TABLES `group` WRITE;
/*!40000 ALTER TABLE `group` DISABLE KEYS */;
/*!40000 ALTER TABLE `group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_module`
--

DROP TABLE IF EXISTS `group_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_module` (
  `moduleID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL,
  KEY `groupID` (`groupID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `groupID` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `moduleID` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_module`
--

LOCK TABLES `group_module` WRITE;
/*!40000 ALTER TABLE `group_module` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_user`
--

DROP TABLE IF EXISTS `group_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_user` (
  `userID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st',
  KEY `userID` (`userID`),
  KEY `groupID` (`groupID`),
  CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_user`
--

LOCK TABLES `group_user` WRITE;
/*!40000 ALTER TABLE `group_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `image` (
  `imageID` int(11) NOT NULL AUTO_INCREMENT,
  `imageLocation` varchar(225) DEFAULT NULL,
  PRIMARY KEY (`imageID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image`
--

LOCK TABLES `image` WRITE;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
/*!40000 ALTER TABLE `image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `itemID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `game` varchar(255) NOT NULL,
  `itemType` varchar(255) NOT NULL,
  `points` int(11) NOT NULL,
  `isDefault` tinyint(1) DEFAULT 0,
  `gender` enum('M','F','N') DEFAULT 'N',
  PRIMARY KEY (`itemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logged_answer`
--

DROP TABLE IF EXISTS `logged_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logged_answer` (
  `logID` int(11) NOT NULL AUTO_INCREMENT,
  `questionID` int(11) DEFAULT NULL,
  `termID` int(11) DEFAULT NULL,
  `sessionID` int(11) DEFAULT NULL,
  `correct` tinyint(4) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `log_time` time DEFAULT NULL,
  `deleted_questionID` int(11) DEFAULT NULL,
  `deleted_termID` int(11) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logged_answer`
--

LOCK TABLES `logged_answer` WRITE;
/*!40000 ALTER TABLE `logged_answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `logged_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logged_pasta`
--

DROP TABLE IF EXISTS `logged_pasta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logged_pasta` (
  `logID` int(11) NOT NULL AUTO_INCREMENT,
  `pastaID` int(11) NOT NULL,
  `correct` tinyint(1) DEFAULT NULL,
  `qFrameID` int(11) DEFAULT NULL,
  `questionType` enum('identify','split','mc1','mc2') DEFAULT NULL,
  `sessionID` int(11) NOT NULL,
  `log_time` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`logID`),
  KEY `pastaID` (`pastaID`),
  KEY `sessionID` (`sessionID`),
  KEY `qFrameID` (`qFrameID`),
  CONSTRAINT `logged_pasta_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`),
  CONSTRAINT `logged_pasta_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`),
  CONSTRAINT `logged_pasta_ibfk_3` FOREIGN KEY (`qFrameID`) REFERENCES `question_frame` (`qframeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logged_pasta`
--

LOCK TABLES `logged_pasta` WRITE;
/*!40000 ALTER TABLE `logged_pasta` DISABLE KEYS */;
/*!40000 ALTER TABLE `logged_pasta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logged_user_item`
--

DROP TABLE IF EXISTS `logged_user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `logged_user_item` (
  `logItemID` int(11) NOT NULL AUTO_INCREMENT,
  `userItemID` int(11) NOT NULL,
  `sessionID` int(11) NOT NULL,
  PRIMARY KEY (`logItemID`),
  KEY `userItemID` (`userItemID`),
  KEY `sessionID` (`sessionID`),
  CONSTRAINT `logged_user_item_ibfk_1` FOREIGN KEY (`userItemID`) REFERENCES `user_item` (`userItemID`),
  CONSTRAINT `logged_user_item_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logged_user_item`
--

LOCK TABLES `logged_user_item` WRITE;
/*!40000 ALTER TABLE `logged_user_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `logged_user_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_preferences`
--

DROP TABLE IF EXISTS `mentor_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_preferences` (
  `mentorPreferenceID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `mentorName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`mentorPreferenceID`),
  KEY `mentor_preferences_userID` (`userID`),
  CONSTRAINT `mentor_preferences_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_preferences`
--

LOCK TABLES `mentor_preferences` WRITE;
/*!40000 ALTER TABLE `mentor_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `mentor_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_question_frequency`
--

DROP TABLE IF EXISTS `mentor_question_frequency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_question_frequency` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `numIncorrectCards` int(11) DEFAULT NULL,
  `numCorrectCards` int(11) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `moduleID` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `module_key` (`moduleID`),
  CONSTRAINT `module_key` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_question_frequency`
--

LOCK TABLES `mentor_question_frequency` WRITE;
/*!40000 ALTER TABLE `mentor_question_frequency` DISABLE KEYS */;
/*!40000 ALTER TABLE `mentor_question_frequency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_responses`
--

DROP TABLE IF EXISTS `mentor_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_responses` (
  `mentorResponseID` int(11) NOT NULL AUTO_INCREMENT,
  `questionID` int(11) NOT NULL,
  `sessionID` int(11) NOT NULL,
  `response` varchar(255) DEFAULT NULL,
  `deleted_questionID` int(11) DEFAULT NULL,
  PRIMARY KEY (`mentorResponseID`),
  KEY `mentor_responses_questionID` (`questionID`),
  KEY `mentor_responses_sessionID` (`sessionID`),
  KEY `deleted_question_ID` (`deleted_questionID`),
  CONSTRAINT `deleted_question_ID` FOREIGN KEY (`deleted_questionID`) REFERENCES `deleted_question` (`questionID`),
  CONSTRAINT `mentor_responses_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`),
  CONSTRAINT `mentor_responses_sessionID` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_responses`
--

LOCK TABLES `mentor_responses` WRITE;
/*!40000 ALTER TABLE `mentor_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `mentor_responses` ENABLE KEYS */;
UNLOCK TABLES;





--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
-- The messeges sent between user and LLM
-- trigger on insert, update chatbot session performance async and related
CREATE TABLE `messages` (
  `messageID` int(4) NOT NULL AUTO_INCREMENT,
  `userID` int(4) NOT NULL,
  `chatbotSID` int(4) NOT NULL,
  `moduleID` int(4) NOT NULL,
  `source` ENUM('llm','user') NOT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(), -- When message was sent
  `isVoiceMessage` boolean NOT NULL DEFAULT 0,
  `keyWordsUsed` int(4) NOT NULL DEFAULT 0,
  `grammarRating` float(4) DEFAULT 0, -- xxx.x%, calculated later asynchronously, NULL means score unavailable
  PRIMARY KEY (`messageID`),
  FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE, 
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`chatbotSID`) REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
-- 
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module_question`
--

DROP TABLE IF EXISTS `module_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `module_question` (
  `moduleID` int(11) NOT NULL,
  `questionID` int(11) NOT NULL,
  KEY `moduleID` (`moduleID`),
  KEY `questionID` (`questionID`) USING BTREE,
  CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module_question`
--

LOCK TABLES `module_question` WRITE;
/*!40000 ALTER TABLE `module_question` DISABLE KEYS */;
/*!40000 ALTER TABLE `module_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `multiple_choice_answers`
--

DROP TABLE IF EXISTS `multiple_choice_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `multiple_choice_answers` (
  `multipleChoiceID` int(11) NOT NULL AUTO_INCREMENT,
  `questionID` int(11) NOT NULL,
  `answerChoice` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`multipleChoiceID`),
  KEY `multiple_choice_answers_questionID` (`questionID`),
  CONSTRAINT `multiple_choice_answers_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `multiple_choice_answers`
--

LOCK TABLES `multiple_choice_answers` WRITE;
/*!40000 ALTER TABLE `multiple_choice_answers` DISABLE KEYS */;
/*!40000 ALTER TABLE `multiple_choice_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pasta`
--

DROP TABLE IF EXISTS `pasta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasta` (
  `pastaID` int(11) NOT NULL AUTO_INCREMENT,
  `moduleID` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `utterance` varchar(255) NOT NULL,
  `mc1Answer` int(11) DEFAULT NULL,
  `mc2Answer` int(11) DEFAULT NULL,
  PRIMARY KEY (`pastaID`),
  KEY `moduleID` (`moduleID`),
  CONSTRAINT `pasta_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pasta`
--

LOCK TABLES `pasta` WRITE;
/*!40000 ALTER TABLE `pasta` DISABLE KEYS */;
/*!40000 ALTER TABLE `pasta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pasta_answer`
--

DROP TABLE IF EXISTS `pasta_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pasta_answer` (
  `answerID` int(11) NOT NULL AUTO_INCREMENT,
  `pastaID` int(11) NOT NULL,
  `value` int(11) NOT NULL,
  `answerType` enum('identify','split','mc1','mc2') NOT NULL,
  PRIMARY KEY (`answerID`),
  KEY `pastaID` (`pastaID`),
  CONSTRAINT `pasta_answer_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pasta_answer`
--

LOCK TABLES `pasta_answer` WRITE;
/*!40000 ALTER TABLE `pasta_answer` DISABLE KEYS */;
/*!40000 ALTER TABLE `pasta_answer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS `question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question`
--

LOCK TABLES `question` WRITE;
/*!40000 ALTER TABLE `question` DISABLE KEYS */;
/*!40000 ALTER TABLE `question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_frame`
--

DROP TABLE IF EXISTS `question_frame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_frame` (
  `qframeID` int(11) NOT NULL AUTO_INCREMENT,
  `moduleID` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `mc1QuestionText` varchar(255) DEFAULT NULL,
  `splitQuestionVar` varchar(255) NOT NULL,
  `identifyQuestionVar` varchar(255) DEFAULT NULL,
  `mc2QuestionText` varchar(255) DEFAULT NULL,
  `displayName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`qframeID`),
  UNIQUE KEY `unique_category_per_module` (`moduleID`,`category`),
  CONSTRAINT `question_frame_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_frame`
--

LOCK TABLES `question_frame` WRITE;
/*!40000 ALTER TABLE `question_frame` DISABLE KEYS */;
/*!40000 ALTER TABLE `question_frame` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_frame_option`
--

DROP TABLE IF EXISTS `question_frame_option`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_frame_option` (
  `optionID` int(11) NOT NULL AUTO_INCREMENT,
  `qframeID` int(11) NOT NULL,
  `optionText` varchar(255) NOT NULL,
  `mcQuestionNumber` int(11) NOT NULL,
  PRIMARY KEY (`optionID`),
  UNIQUE KEY `unique_qframe_mc_option` (`qframeID`,`mcQuestionNumber`,`optionText`),
  CONSTRAINT `question_frame_option_ibfk_1` FOREIGN KEY (`qframeID`) REFERENCES `question_frame` (`qframeID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_frame_option`
--

LOCK TABLES `question_frame_option` WRITE;
/*!40000 ALTER TABLE `question_frame_option` DISABLE KEYS */;
/*!40000 ALTER TABLE `question_frame_option` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `sessionID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `moduleID` int(11) DEFAULT NULL,
  `sessionDate` date DEFAULT NULL,
  `playerScore` int(11) DEFAULT NULL,
  `startTime` time(5) DEFAULT NULL,
  `endTime` time(5) DEFAULT NULL,
  `platform` varchar(3) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `deleted_moduleID` int(11) DEFAULT NULL,
  PRIMARY KEY (`sessionID`),
  KEY `userID` (`userID`),
  KEY `moduleID` (`moduleID`),
  KEY `deleted_module_key` (`deleted_moduleID`),
  CONSTRAINT `deleted_module_key` FOREIGN KEY (`deleted_moduleID`) REFERENCES `deleted_module` (`moduleID`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  CONSTRAINT `session_ibfk_2` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `termID` int(11) NOT NULL AUTO_INCREMENT,
  `tagName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  KEY `termID` (`termID`) USING BTREE,
  CONSTRAINT `tag_ibfk_1` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tag`
--

LOCK TABLES `tag` WRITE;
/*!40000 ALTER TABLE `tag` DISABLE KEYS */;
/*!40000 ALTER TABLE `tag` ENABLE KEYS */;
UNLOCK TABLES;



--
-- Table structure for table `term`
--

DROP TABLE IF EXISTS `term`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `term`
--

LOCK TABLES `term` WRITE;
/*!40000 ALTER TABLE `term` DISABLE KEYS */;
/*!40000 ALTER TABLE `term` ENABLE KEYS */;
UNLOCK TABLES;

DROP TABLE IF EXISTS `tito_generated_module`;
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


-- loop through all distinct messages with a unique (userID, moduleID) pair 
-- create entry only for 1 unique module/class pair using the messages table.
-- to find the classid (aka groupID), you must use a query using `group_module` to get the classID (groupID) associated to `group_user` user's classID (groupID) using the userID from the message's userID and the moduleID columns 


DROP TABLE IF EXISTS `tito_module`;
-- on module deletion delete tito_module too & relevant
-- maybe allow dragging of modules to reorder on front end
-- class ID tied to a professor user
CREATE TABLE `tito_module` (
  `moduleID` int(11) NOT NULL,
  `classID` int(11) NOT NULL,
  `sequenceID` int(2) NOT NULL AUTO_INCREMENT, -- chronological order in the unit
  `titoPrompt` text DEFAULT NULL, -- extra instructions given to the chatbot for the module, can be used to prevent extraneous materials
  `startDate` DATE DEFAULT NULL, -- default is today/day of creation
  `endDate` DATE DEFAULT NULL, -- default is end of semester
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`classID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  PRIMARY KEY(`classID`, `moduleID`),
  KEY (`classID`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

DROP TABLE IF EXISTS `tito_module_progress`;
-- create a trigger to auto update on a term insert/update
-- contains overall progress on the current module for a student
-- ISSUE: LACKS A CLASS ID TO PREVENT OVERLAP
CREATE TABLE `tito_module_progress` (
  `proficiencyRate` float(4) DEFAULT 0.0, -- xxx.x% overall progress
  `moduleID` int(11) NOT NULL,
  `studentID` int(11) NOT NULL,
  `completedTutorial` boolean NOT NULL DEFAULT 0, -- becomes 1 after tito intro scene finishes
  `totalTermsUsed` int (5) NOT NULL Default 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`studentID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY(`moduleID`,`studentID`) -- expects searches to be all modules in practice by student
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

DROP TABLE IF EXISTS `tito_term_progress`;
-- user progress on a term
CREATE TABLE `tito_term_progress` (
  `moduleID` int(11) NOT NULL,
  `termID`  int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `proficiencyScore` float(4) NOT NULL DEFAULT 0.0, -- expect xxx.x%
  `timesUsedSuccessfully` int(4) NOT NULL DEFAULT 0,
  FOREIGN KEY(`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  FOREIGN KEY(`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE,
  FOREIGN KEY(`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  PRIMARY KEY(`userID`,`moduleID`,`termID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

DROP TABLE IF EXISTS `tito_voice_message`;
-- Contains file path to audio message
CREATE TABLE `tito_voice_message` (
  `userID` int(11) NOT NULL,
  `voiceID` int(11) AUTO_INCREMENT,
  `filename` VARCHAR(30) NOT NULL,
  `chatbotSID` int(11) NOT NULL,
  `messageID` int(11) NOT NULL,
  PRIMARY KEY (`voiceID`),
  FOREIGN KEY (`userID`)  REFERENCES `user` (`userID`) ON DELETE CASCADE,
  FOREIGN KEY (`messageID`) REFERENCES `messages` (`messageID`) ON DELETE CASCADE,
  FOREIGN KEY (`chatbotSID`)  REFERENCES `chatbot_sessions` (`chatbotSID`) ON DELETE CASCADE,
  KEY `idx_session_user` (`chatbotSID`, `userID`),
  KEY `idx_voice_message` (`userID`, `messageID`),
  UNIQUE (`userID`, `messageID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokens` (
  `expired` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens`
--

LOCK TABLES `tokens` WRITE;
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_item`
--

DROP TABLE IF EXISTS `user_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_item` (
  `userItemID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `itemID` int(11) NOT NULL,
  `timeOfPurchase` datetime DEFAULT current_timestamp(),
  `game` varchar(255) NOT NULL,
  `isWearing` tinyint(1) DEFAULT 0,
  `color` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`userItemID`),
  KEY `userID` (`userID`),
  KEY `itemID` (`itemID`),
  CONSTRAINT `user_item_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  CONSTRAINT `user_item_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_item`
--

LOCK TABLES `user_item` WRITE;
/*!40000 ALTER TABLE `user_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `userPreferenceID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `preferredHand` enum('R','L','A','') NOT NULL DEFAULT 'A',
  `vrGloveColor` varchar(15) NOT NULL DEFAULT 'Brown',
  PRIMARY KEY (`userPreferenceID`),
  KEY `userID` (`userID`),
  CONSTRAINT `userID_preferences` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preferences`
--

LOCK TABLES `user_preferences` WRITE;
/*!40000 ALTER TABLE `user_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_preferences` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-06-27 15:20:23




