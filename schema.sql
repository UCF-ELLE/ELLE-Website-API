-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 14, 2024 at 11:45 PM
-- Server version: 8.0.37-0ubuntu0.22.04.3
-- PHP Version: 8.1.2-1ubuntu2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elle_database`
--

-- --------------------------------------------------------

--
-- Table structure for table `adaptive_learning`
--

DROP TABLE IF EXISTS `adaptive_learning`;
CREATE TABLE `adaptive_learning` (
  `userID` int NOT NULL,
  `termID` int NOT NULL,
  `activation_val` float NOT NULL DEFAULT '-9999',
  `decay_val` float NOT NULL DEFAULT '0.3',
  `dates` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'Stored in a unique format due to lack of array support in SQL database.',
  `alpha_val` float NOT NULL DEFAULT '0.3',
  `times` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `animelle_save_data`
--

DROP TABLE IF EXISTS `animelle_save_data`;
CREATE TABLE `animelle_save_data` (
  `saveID` int NOT NULL,
  `userID` int NOT NULL,
  `saveData` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `answer`
--

DROP TABLE IF EXISTS `answer`;
CREATE TABLE `answer` (
  `questionID` int NOT NULL,
  `termID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
CREATE TABLE `audio` (
  `audioID` int NOT NULL,
  `audioLocation` varchar(225) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_module`
--

DROP TABLE IF EXISTS `deleted_module`;
CREATE TABLE `deleted_module` (
  `moduleID` int NOT NULL,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_question`
--

DROP TABLE IF EXISTS `deleted_question`;
CREATE TABLE `deleted_question` (
  `questionID` int NOT NULL,
  `audioID` int DEFAULT NULL,
  `imageID` int DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_term`
--

DROP TABLE IF EXISTS `deleted_term`;
CREATE TABLE `deleted_term` (
  `termID` int NOT NULL,
  `imageID` int DEFAULT NULL,
  `audioID` int DEFAULT NULL,
  `front` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `back` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'N',
  `LANGUAGE` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
CREATE TABLE `group` (
  `groupID` int NOT NULL,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `group_module`
--

DROP TABLE IF EXISTS `group_module`;
CREATE TABLE `group_module` (
  `moduleID` int NOT NULL,
  `groupID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `group_user`
--

DROP TABLE IF EXISTS `group_user`;
CREATE TABLE `group_user` (
  `userID` int NOT NULL,
  `groupID` int NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
CREATE TABLE `image` (
  `imageID` int NOT NULL,
  `imageLocation` varchar(225) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
CREATE TABLE `item` (
  `itemID` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `game` varchar(255) NOT NULL,
  `itemType` varchar(255) NOT NULL,
  `points` int NOT NULL,
  `isDefault` tinyint(1) DEFAULT '0',
  `gender` enum('M','F','N') DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logged_answer`
--

DROP TABLE IF EXISTS `logged_answer`;
CREATE TABLE `logged_answer` (
  `logID` int NOT NULL,
  `questionID` int DEFAULT NULL,
  `termID` int DEFAULT NULL,
  `sessionID` int DEFAULT NULL,
  `correct` tinyint DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `log_time` time DEFAULT NULL,
  `deleted_questionID` int DEFAULT NULL,
  `deleted_termID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `logged_pasta`
--

DROP TABLE IF EXISTS `logged_pasta`;
CREATE TABLE `logged_pasta` (
  `logID` int NOT NULL,
  `pastaID` int NOT NULL,
  `correct` tinyint(1) DEFAULT NULL,
  `qFrameID` int DEFAULT NULL,
  `questionType` enum('identify','split','mc1','mc2') DEFAULT NULL,
  `sessionID` int NOT NULL,
  `log_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logged_user_item`
--

DROP TABLE IF EXISTS `logged_user_item`;
CREATE TABLE `logged_user_item` (
  `logItemID` int NOT NULL,
  `userItemID` int NOT NULL,
  `sessionID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mentor_preferences`
--

DROP TABLE IF EXISTS `mentor_preferences`;
CREATE TABLE `mentor_preferences` (
  `mentorPreferenceID` int NOT NULL,
  `userID` int NOT NULL,
  `mentorName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `mentor_question_frequency`
--

DROP TABLE IF EXISTS `mentor_question_frequency`;
CREATE TABLE `mentor_question_frequency` (
  `ID` int NOT NULL,
  `numIncorrectCards` int DEFAULT NULL,
  `numCorrectCards` int DEFAULT NULL,
  `time` int DEFAULT NULL,
  `moduleID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `mentor_responses`
--

DROP TABLE IF EXISTS `mentor_responses`;
CREATE TABLE `mentor_responses` (
  `mentorResponseID` int NOT NULL,
  `questionID` int NOT NULL,
  `sessionID` int NOT NULL,
  `response` varchar(255) DEFAULT NULL,
  `deleted_questionID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
CREATE TABLE `module` (
  `moduleID` int NOT NULL,
  `name` varchar(250) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint DEFAULT NULL,
  `userID` int NOT NULL,
  `isPastaModule` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `module_question`
--

DROP TABLE IF EXISTS `module_question`;
CREATE TABLE `module_question` (
  `moduleID` int NOT NULL,
  `questionID` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `multiple_choice_answers`
--

DROP TABLE IF EXISTS `multiple_choice_answers`;
CREATE TABLE `multiple_choice_answers` (
  `multipleChoiceID` int NOT NULL,
  `questionID` int NOT NULL,
  `answerChoice` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `pasta`
--

DROP TABLE IF EXISTS `pasta`;
CREATE TABLE `pasta` (
  `pastaID` int NOT NULL,
  `moduleID` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `utterance` varchar(255) NOT NULL,
  `mc1Answer` int DEFAULT NULL,
  `mc2Answer` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasta_answer`
--

DROP TABLE IF EXISTS `pasta_answer`;
CREATE TABLE `pasta_answer` (
  `answerID` int NOT NULL,
  `pastaID` int NOT NULL,
  `value` int NOT NULL,
  `answerType` enum('identify','split','mc1','mc2') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question`
--

DROP TABLE IF EXISTS `question`;
CREATE TABLE `question` (
  `questionID` int NOT NULL,
  `audioID` int DEFAULT NULL,
  `imageID` int DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `question_frame`
--

DROP TABLE IF EXISTS `question_frame`;
CREATE TABLE `question_frame` (
  `qframeID` int NOT NULL,
  `moduleID` int NOT NULL,
  `category` varchar(50) NOT NULL,
  `mc1QuestionText` varchar(255) DEFAULT NULL,
  `splitQuestionVar` varchar(255) NOT NULL,
  `identifyQuestionVar` varchar(255) DEFAULT NULL,
  `mc2QuestionText` varchar(255) DEFAULT NULL,
  `displayName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_frame_option`
--

DROP TABLE IF EXISTS `question_frame_option`;
CREATE TABLE `question_frame_option` (
  `optionID` int NOT NULL,
  `qframeID` int NOT NULL,
  `optionText` varchar(255) NOT NULL,
  `mcQuestionNumber` int NOT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `sessionID` int NOT NULL,
  `userID` int NOT NULL,
  `moduleID` int DEFAULT NULL,
  `sessionDate` date DEFAULT NULL,
  `playerScore` int DEFAULT NULL,
  `startTime` time(5) DEFAULT NULL,
  `endTime` time(5) DEFAULT NULL,
  `platform` varchar(3) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `deleted_moduleID` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tag`
--

DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
  `termID` int NOT NULL,
  `tagName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `term`
--

DROP TABLE IF EXISTS `term`;
CREATE TABLE `term` (
  `termID` int NOT NULL,
  `imageID` int DEFAULT NULL,
  `audioID` int DEFAULT NULL,
  `front` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `back` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'N',
  `language` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

DROP TABLE IF EXISTS `tokens`;
CREATE TABLE `tokens` (
  `expired` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `userID` int NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `pwdResetToken` varchar(100) DEFAULT NULL,
  `permissionGroup` enum('st','pf','su') NOT NULL DEFAULT 'st',
  `otc` varchar(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_item`
--

DROP TABLE IF EXISTS `user_item`;
CREATE TABLE `user_item` (
  `userItemID` int NOT NULL,
  `userID` int NOT NULL,
  `itemID` int NOT NULL,
  `timeOfPurchase` datetime DEFAULT CURRENT_TIMESTAMP,
  `game` varchar(255) NOT NULL,
  `isWearing` tinyint(1) DEFAULT '0',
  `color` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
CREATE TABLE `user_preferences` (
  `userPreferenceID` int NOT NULL,
  `userID` int NOT NULL,
  `preferredHand` enum('R','L','A','') NOT NULL DEFAULT 'A',
  `vrGloveColor` varchar(15) NOT NULL DEFAULT 'Brown'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adaptive_learning`
--
ALTER TABLE `adaptive_learning`
  ADD KEY `userID` (`userID`),
  ADD KEY `termID` (`termID`);

--
-- Indexes for table `animelle_save_data`
--
ALTER TABLE `animelle_save_data`
  ADD PRIMARY KEY (`saveID`),
  ADD UNIQUE KEY `userID` (`userID`),
  ADD KEY `userID_save` (`userID`);

--
-- Indexes for table `answer`
--
ALTER TABLE `answer`
  ADD KEY `answer_ibfk_1` (`questionID`),
  ADD KEY `answer_ibfk_2` (`termID`);

--
-- Indexes for table `audio`
--
ALTER TABLE `audio`
  ADD PRIMARY KEY (`audioID`);

--
-- Indexes for table `deleted_module`
--
ALTER TABLE `deleted_module`
  ADD PRIMARY KEY (`moduleID`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `deleted_question`
--
ALTER TABLE `deleted_question`
  ADD PRIMARY KEY (`questionID`),
  ADD KEY `audioID` (`audioID`) USING BTREE,
  ADD KEY `imageID` (`imageID`) USING BTREE;

--
-- Indexes for table `deleted_term`
--
ALTER TABLE `deleted_term`
  ADD PRIMARY KEY (`termID`),
  ADD KEY `term_ibfk_1` (`imageID`),
  ADD KEY `term_ibfk_2` (`audioID`);

--
-- Indexes for table `group`
--
ALTER TABLE `group`
  ADD PRIMARY KEY (`groupID`);

--
-- Indexes for table `group_module`
--
ALTER TABLE `group_module`
  ADD KEY `groupID` (`groupID`),
  ADD KEY `moduleID` (`moduleID`);

--
-- Indexes for table `group_user`
--
ALTER TABLE `group_user`
  ADD KEY `userID` (`userID`),
  ADD KEY `groupID` (`groupID`);

--
-- Indexes for table `image`
--
ALTER TABLE `image`
  ADD PRIMARY KEY (`imageID`);

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`itemID`);

--
-- Indexes for table `logged_answer`
--
ALTER TABLE `logged_answer`
  ADD PRIMARY KEY (`logID`),
  ADD KEY `logged_answer_ibfk_1` (`questionID`),
  ADD KEY `logged_answer_ibfk_3` (`sessionID`),
  ADD KEY `logged_answer_ibfk_4` (`termID`),
  ADD KEY `deleted_term_key` (`deleted_termID`),
  ADD KEY `deleted_question_key` (`deleted_questionID`);

--
-- Indexes for table `logged_pasta`
--
ALTER TABLE `logged_pasta`
  ADD PRIMARY KEY (`logID`),
  ADD KEY `pastaID` (`pastaID`),
  ADD KEY `sessionID` (`sessionID`),
  ADD KEY `qFrameID` (`qFrameID`);

--
-- Indexes for table `logged_user_item`
--
ALTER TABLE `logged_user_item`
  ADD PRIMARY KEY (`logItemID`),
  ADD KEY `userItemID` (`userItemID`),
  ADD KEY `sessionID` (`sessionID`);

--
-- Indexes for table `mentor_preferences`
--
ALTER TABLE `mentor_preferences`
  ADD PRIMARY KEY (`mentorPreferenceID`),
  ADD KEY `mentor_preferences_userID` (`userID`);

--
-- Indexes for table `mentor_question_frequency`
--
ALTER TABLE `mentor_question_frequency`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `module_key` (`moduleID`);

--
-- Indexes for table `mentor_responses`
--
ALTER TABLE `mentor_responses`
  ADD PRIMARY KEY (`mentorResponseID`),
  ADD KEY `mentor_responses_questionID` (`questionID`),
  ADD KEY `mentor_responses_sessionID` (`sessionID`),
  ADD KEY `deleted_question_ID` (`deleted_questionID`);

--
-- Indexes for table `module`
--
ALTER TABLE `module`
  ADD PRIMARY KEY (`moduleID`),
  ADD KEY `module_userID` (`userID`);

--
-- Indexes for table `module_question`
--
ALTER TABLE `module_question`
  ADD KEY `moduleID` (`moduleID`),
  ADD KEY `questionID` (`questionID`) USING BTREE;

--
-- Indexes for table `multiple_choice_answers`
--
ALTER TABLE `multiple_choice_answers`
  ADD PRIMARY KEY (`multipleChoiceID`),
  ADD KEY `multiple_choice_answers_questionID` (`questionID`);

--
-- Indexes for table `pasta`
--
ALTER TABLE `pasta`
  ADD PRIMARY KEY (`pastaID`),
  ADD KEY `moduleID` (`moduleID`);

--
-- Indexes for table `pasta_answer`
--
ALTER TABLE `pasta_answer`
  ADD PRIMARY KEY (`answerID`),
  ADD KEY `pastaID` (`pastaID`);

--
-- Indexes for table `question`
--
ALTER TABLE `question`
  ADD PRIMARY KEY (`questionID`),
  ADD KEY `audioID` (`audioID`) USING BTREE,
  ADD KEY `imageID` (`imageID`) USING BTREE;

--
-- Indexes for table `question_frame`
--
ALTER TABLE `question_frame`
  ADD PRIMARY KEY (`qframeID`),
  ADD UNIQUE KEY `unique_category_per_module` (`moduleID`,`category`);

--
-- Indexes for table `question_frame_option`
--
ALTER TABLE `question_frame_option`
  ADD PRIMARY KEY (`optionID`),
  ADD UNIQUE KEY `unique_qframe_mc_option` (`qframeID`,`mcQuestionNumber`,`optionText`);

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`sessionID`),
  ADD KEY `userID` (`userID`),
  ADD KEY `moduleID` (`moduleID`),
  ADD KEY `deleted_module_key` (`deleted_moduleID`);

--
-- Indexes for table `tag`
--
ALTER TABLE `tag`
  ADD KEY `termID` (`termID`) USING BTREE;

--
-- Indexes for table `term`
--
ALTER TABLE `term`
  ADD PRIMARY KEY (`termID`),
  ADD KEY `term_ibfk_1` (`imageID`),
  ADD KEY `term_ibfk_2` (`audioID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`userID`);

--
-- Indexes for table `user_item`
--
ALTER TABLE `user_item`
  ADD PRIMARY KEY (`userItemID`),
  ADD KEY `userID` (`userID`),
  ADD KEY `itemID` (`itemID`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`userPreferenceID`),
  ADD KEY `userID` (`userID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `animelle_save_data`
--
ALTER TABLE `animelle_save_data`
  MODIFY `saveID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audio`
--
ALTER TABLE `audio`
  MODIFY `audioID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_module`
--
ALTER TABLE `deleted_module`
  MODIFY `moduleID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_question`
--
ALTER TABLE `deleted_question`
  MODIFY `questionID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_term`
--
ALTER TABLE `deleted_term`
  MODIFY `termID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group`
--
ALTER TABLE `group`
  MODIFY `groupID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `image`
--
ALTER TABLE `image`
  MODIFY `imageID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `itemID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logged_answer`
--
ALTER TABLE `logged_answer`
  MODIFY `logID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logged_pasta`
--
ALTER TABLE `logged_pasta`
  MODIFY `logID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logged_user_item`
--
ALTER TABLE `logged_user_item`
  MODIFY `logItemID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mentor_preferences`
--
ALTER TABLE `mentor_preferences`
  MODIFY `mentorPreferenceID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mentor_question_frequency`
--
ALTER TABLE `mentor_question_frequency`
  MODIFY `ID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mentor_responses`
--
ALTER TABLE `mentor_responses`
  MODIFY `mentorResponseID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `module`
--
ALTER TABLE `module`
  MODIFY `moduleID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `multiple_choice_answers`
--
ALTER TABLE `multiple_choice_answers`
  MODIFY `multipleChoiceID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasta`
--
ALTER TABLE `pasta`
  MODIFY `pastaID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasta_answer`
--
ALTER TABLE `pasta_answer`
  MODIFY `answerID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question`
--
ALTER TABLE `question`
  MODIFY `questionID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_frame`
--
ALTER TABLE `question_frame`
  MODIFY `qframeID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_frame_option`
--
ALTER TABLE `question_frame_option`
  MODIFY `optionID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `session`
--
ALTER TABLE `session`
  MODIFY `sessionID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tag`
--
ALTER TABLE `tag`
  MODIFY `termID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `term`
--
ALTER TABLE `term`
  MODIFY `termID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_item`
--
ALTER TABLE `user_item`
  MODIFY `userItemID` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `userPreferenceID` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `animelle_save_data`
--
ALTER TABLE `animelle_save_data`
  ADD CONSTRAINT `userID_save` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`);

--
-- Constraints for table `answer`
--
ALTER TABLE `answer`
  ADD CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE,
  ADD CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE;

--
-- Constraints for table `deleted_module`
--
ALTER TABLE `deleted_module`
  ADD CONSTRAINT `deleted_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL;

--
-- Constraints for table `deleted_question`
--
ALTER TABLE `deleted_question`
  ADD CONSTRAINT `deleted_question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  ADD CONSTRAINT `deleted_question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL;

--
-- Constraints for table `deleted_term`
--
ALTER TABLE `deleted_term`
  ADD CONSTRAINT `deleted_term_ibfk_1` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL ON UPDATE SET NULL,
  ADD CONSTRAINT `deleted_term_ibfk_2` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL ON UPDATE SET NULL;

--
-- Constraints for table `group_module`
--
ALTER TABLE `group_module`
  ADD CONSTRAINT `groupID` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE,
  ADD CONSTRAINT `moduleID` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE;

--
-- Constraints for table `group_user`
--
ALTER TABLE `group_user`
  ADD CONSTRAINT `group_user_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_user_ibfk_2` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE;

--
-- Constraints for table `logged_answer`
--
ALTER TABLE `logged_answer`
  ADD CONSTRAINT `deleted_question_key` FOREIGN KEY (`deleted_questionID`) REFERENCES `deleted_question` (`questionID`),
  ADD CONSTRAINT `deleted_term_key` FOREIGN KEY (`deleted_termID`) REFERENCES `deleted_term` (`termID`),
  ADD CONSTRAINT `logged_answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE SET NULL,
  ADD CONSTRAINT `logged_answer_ibfk_3` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`),
  ADD CONSTRAINT `logged_answer_ibfk_4` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE SET NULL;

--
-- Constraints for table `logged_pasta`
--
ALTER TABLE `logged_pasta`
  ADD CONSTRAINT `logged_pasta_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`),
  ADD CONSTRAINT `logged_pasta_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`),
  ADD CONSTRAINT `logged_pasta_ibfk_3` FOREIGN KEY (`qFrameID`) REFERENCES `question_frame` (`qframeID`);

--
-- Constraints for table `logged_user_item`
--
ALTER TABLE `logged_user_item`
  ADD CONSTRAINT `logged_user_item_ibfk_1` FOREIGN KEY (`userItemID`) REFERENCES `user_item` (`userItemID`),
  ADD CONSTRAINT `logged_user_item_ibfk_2` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`);

--
-- Constraints for table `mentor_preferences`
--
ALTER TABLE `mentor_preferences`
  ADD CONSTRAINT `mentor_preferences_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `mentor_question_frequency`
--
ALTER TABLE `mentor_question_frequency`
  ADD CONSTRAINT `module_key` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Constraints for table `mentor_responses`
--
ALTER TABLE `mentor_responses`
  ADD CONSTRAINT `deleted_question_ID` FOREIGN KEY (`deleted_questionID`) REFERENCES `deleted_question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `mentor_responses_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `mentor_responses_sessionID` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `module`
--
ALTER TABLE `module`
  ADD CONSTRAINT `module_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`);

--
-- Constraints for table `module_question`
--
ALTER TABLE `module_question`
  ADD CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE;

--
-- Constraints for table `multiple_choice_answers`
--
ALTER TABLE `multiple_choice_answers`
  ADD CONSTRAINT `multiple_choice_answers_questionID` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `pasta`
--
ALTER TABLE `pasta`
  ADD CONSTRAINT `pasta_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`);

--
-- Constraints for table `pasta_answer`
--
ALTER TABLE `pasta_answer`
  ADD CONSTRAINT `pasta_answer_ibfk_1` FOREIGN KEY (`pastaID`) REFERENCES `pasta` (`pastaID`);

--
-- Constraints for table `question`
--
ALTER TABLE `question`
  ADD CONSTRAINT `question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  ADD CONSTRAINT `question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL;

--
-- Constraints for table `question_frame`
--
ALTER TABLE `question_frame`
  ADD CONSTRAINT `question_frame_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`);

--
-- Constraints for table `question_frame_option`
--
ALTER TABLE `question_frame_option`
  ADD CONSTRAINT `question_frame_option_ibfk_1` FOREIGN KEY (`qframeID`) REFERENCES `question_frame` (`qframeID`);

--
-- Constraints for table `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `deleted_module_key` FOREIGN KEY (`deleted_moduleID`) REFERENCES `deleted_module` (`moduleID`),
  ADD CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  ADD CONSTRAINT `session_ibfk_2` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE SET NULL;

--
-- Constraints for table `tag`
--
ALTER TABLE `tag`
  ADD CONSTRAINT `tag_ibfk_1` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE;

--
-- Constraints for table `term`
--
ALTER TABLE `term`
  ADD CONSTRAINT `term_ibfk_1` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL ON UPDATE SET NULL,
  ADD CONSTRAINT `term_ibfk_2` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL ON UPDATE SET NULL;

--
-- Constraints for table `user_item`
--
ALTER TABLE `user_item`
  ADD CONSTRAINT `user_item_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`),
  ADD CONSTRAINT `user_item_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`);

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `userID_preferences` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
