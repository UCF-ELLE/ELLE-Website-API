-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 26, 2020 at 12:49 AM
-- Server version: 5.7.28
-- PHP Version: 7.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-05:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elle_new_database`
--

-- --------------------------------------------------------

--
-- Table structure for table `answer`
--

CREATE TABLE `answer` (
  `questionID` int(11) NOT NULL,
  `termID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `audio`
--

CREATE TABLE `audio` (
  `audioID` int(11) NOT NULL,
  `audioLocation` varchar(225) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_module`
--

CREATE TABLE `deleted_module` (
  `moduleID` int(11) NOT NULL,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint(4) DEFAULT NULL,
  `userID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_question`
--

CREATE TABLE `deleted_question` (
  `questionID` int(11) NOT NULL,
  `audioID` int(11) DEFAULT NULL,
  `imageID` int(11) DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `deleted_term`
--

CREATE TABLE `deleted_term` (
  `termID` int(11) NOT NULL,
  `imageID` int(11) DEFAULT NULL,
  `audioID` int(11) DEFAULT NULL,
  `front` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `back` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N',
  `LANGUAGE` varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `group`
--

CREATE TABLE `group` (
  `groupID` int(11) NOT NULL,
  `groupName` varchar(50) NOT NULL,
  `groupCode` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `group_module`
--

CREATE TABLE `group_module` (
  `moduleID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `group_user`
--

CREATE TABLE `group_user` (
  `userID` int(11) NOT NULL,
  `groupID` int(11) NOT NULL,
  `accessLevel` enum('st','ta','pf') NOT NULL DEFAULT 'st'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `image`
--

CREATE TABLE `image` (
  `imageID` int(11) NOT NULL,
  `imageLocation` varchar(225) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `logged_answer`
--

CREATE TABLE `logged_answer` (
  `logID` int(11) NOT NULL,
  `questionID` int(11) DEFAULT NULL,
  `termID` int(11) DEFAULT NULL,
  `sessionID` int(11) DEFAULT NULL,
  `correct` tinyint(4) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `log_time` time DEFAULT NULL,
  `deleted_questionID` int(11) DEFAULT NULL,
  `deleted_termID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `module`
--

CREATE TABLE `module` (
  `moduleID` int(11) NOT NULL,
  `name` varchar(250) NOT NULL,
  `language` varchar(2) NOT NULL,
  `complexity` tinyint(4) DEFAULT NULL,
  `userID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `module_question`
--

CREATE TABLE `module_question` (
  `moduleID` int(11) NOT NULL,
  `questionID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `question`
--

CREATE TABLE `question` (
  `questionID` int(11) NOT NULL,
  `audioID` int(11) DEFAULT NULL,
  `imageID` int(11) DEFAULT NULL,
  `type` varchar(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `questionText` varchar(75) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `sessionID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `moduleID` int(11) DEFAULT NULL,
  `sessionDate` date DEFAULT NULL,
  `playerScore` int(11) DEFAULT NULL,
  `startTime` time(5) DEFAULT NULL,
  `endTime` time(5) DEFAULT NULL,
  `platform` varchar(3) DEFAULT NULL,
  `mode` varchar(7) NOT NULL DEFAULT 'quiz',
  `deleted_moduleID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tag`
--

CREATE TABLE `tag` (
  `termID` int(11) NOT NULL,
  `tagName` varchar(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `term`
--

CREATE TABLE `term` (
  `termID` int(11) NOT NULL,
  `imageID` int(11) DEFAULT NULL,
  `audioID` int(11) DEFAULT NULL,
  `front` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `back` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `gender` enum('F','M','N') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'N',
  `LANGUAGE` varchar(2) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `expired` varchar(400) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `userID` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(100) NOT NULL,
  `pwdResetToken` varchar(100) DEFAULT NULL,
  `permissionGroup` enum('st','pf','su') DEFAULT 'st',
  `otc` varchar(6) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `userPreferenceID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `preferredHand` enum('R','L','A','') NOT NULL DEFAULT 'A',
  `vrGloveColor` varchar(15) NOT NULL DEFAULT 'Brown'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

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
-- Indexes for table `logged_answer`
--
ALTER TABLE `logged_answer`
  ADD PRIMARY KEY (`logID`),
  ADD KEY `deleted_term_key` (`deleted_termID`),
  ADD KEY `deleted_question_key` (`deleted_questionID`),
  ADD KEY `logged_answer_ibfk_1` (`questionID`),
  ADD KEY `logged_answer_ibfk_3` (`sessionID`),
  ADD KEY `logged_answer_ibfk_4` (`termID`);

--
-- Indexes for table `module`
--
ALTER TABLE `module`
  ADD PRIMARY KEY (`moduleID`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `module_question`
--
ALTER TABLE `module_question`
  ADD KEY `moduleID` (`moduleID`),
  ADD KEY `questionID` (`questionID`) USING BTREE;

--
-- Indexes for table `question`
--
ALTER TABLE `question`
  ADD PRIMARY KEY (`questionID`),
  ADD KEY `audioID` (`audioID`) USING BTREE,
  ADD KEY `imageID` (`imageID`) USING BTREE;

--
-- Indexes for table `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`sessionID`),
  ADD KEY `userID` (`userID`),
  ADD KEY `session_ibfk_2` (`moduleID`),
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
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`userPreferenceID`),
  ADD KEY `userID_preferences` (`userID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audio`
--
ALTER TABLE `audio`
  MODIFY `audioID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_module`
--
ALTER TABLE `deleted_module`
  MODIFY `moduleID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_question`
--
ALTER TABLE `deleted_question`
  MODIFY `questionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_term`
--
ALTER TABLE `deleted_term`
  MODIFY `termID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group`
--
ALTER TABLE `group`
  MODIFY `groupID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `image`
--
ALTER TABLE `image`
  MODIFY `imageID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logged_answer`
--
ALTER TABLE `logged_answer`
  MODIFY `logID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `module`
--
ALTER TABLE `module`
  MODIFY `moduleID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question`
--
ALTER TABLE `question`
  MODIFY `questionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `session`
--
ALTER TABLE `session`
  MODIFY `sessionID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tag`
--
ALTER TABLE `tag`
  MODIFY `termID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `term`
--
ALTER TABLE `term`
  MODIFY `termID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `userPreferenceID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

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
  ADD CONSTRAINT `deleted_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL ON UPDATE NO ACTION;

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
  ADD CONSTRAINT `groupID` FOREIGN KEY (`groupID`) REFERENCES `group` (`groupID`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `moduleID` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE ON UPDATE NO ACTION;

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
  ADD CONSTRAINT `logged_answer_ibfk_1` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE SET NULL ON UPDATE NO ACTION,
  ADD CONSTRAINT `logged_answer_ibfk_3` FOREIGN KEY (`sessionID`) REFERENCES `session` (`sessionID`) ON UPDATE NO ACTION,
  ADD CONSTRAINT `logged_answer_ibfk_4` FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE SET NULL;

--
-- Constraints for table `module`
--
ALTER TABLE `module`
  ADD CONSTRAINT `userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE SET NULL ON UPDATE NO ACTION;

--
-- Constraints for table `module_question`
--
ALTER TABLE `module_question`
  ADD CONSTRAINT `module_question_ibfk_1` FOREIGN KEY (`moduleID`) REFERENCES `module` (`moduleID`) ON DELETE CASCADE,
  ADD CONSTRAINT `module_question_ibfk_2` FOREIGN KEY (`questionID`) REFERENCES `question` (`questionID`) ON DELETE CASCADE;

--
-- Constraints for table `question`
--
ALTER TABLE `question`
  ADD CONSTRAINT `question_ibfk_1` FOREIGN KEY (`audioID`) REFERENCES `audio` (`audioID`) ON DELETE SET NULL,
  ADD CONSTRAINT `question_ibfk_2` FOREIGN KEY (`imageID`) REFERENCES `image` (`imageID`) ON DELETE SET NULL;

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
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `userID_preferences` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
