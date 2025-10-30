



UPDATE user 
set permissionGroup = 'pf'
where userID = 570;

update group_user
set accessLevel = 'pf'
where userID = 570 AND groupID = 74;

INSERT IGNORE INTO `group_user` (userID, groupID, accessLevel)
VALUES (570, 74, 'pf');

DELIMITER //
CREATE TRIGGER addFreeChatModule
AFTER INSERT ON `tito_class_status`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `tito_module` (moduleID, classID)
  VALUE (228, new.classID);
END //
DELIMITER ;

INSERT INTO `tito_class_status` (`classID`, `professorID`, `titoExpirationDate`) 
VALUES (74, 570, DATE_ADD(CURDATE(), INTERVAL 12 MONTH));


DROP TABLE tito_voice_message;
DROP TABLE tito_term_progress;
DROP TABLE tito_module_progress;
DROP TABLE tito_generated_module;
DROP TABLE tito_module;
DROP TABLE tito_lore_text;
DROP TABLE tito_lore;
DROP TABLE tito_class_status;
DROP TABLE messages;
DROP TABLE chatbot_sessions;

