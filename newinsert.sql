


-- DELIMITER // 
-- CREATE TRIGGER onModuleCreation_addToSuperProf
-- AFTER INSERT ON `module`
-- FOR EACH ROW
-- BEGIN
--   INSERT IGNORE INTO `group_module` (`moduleID`, `groupID`)
--   VALUES (new.moduleID, 74);
-- END //
-- DELIMITER ;

-- DELIMITER //
-- CREATE TRIGGER grantFreechatClass
-- AFTER UPDATE ON `group_user`
-- FOR EACH ROW
-- BEGIN
--   IF NEW.accessLevel = 'pf' AND OLD.accessLevel != 'pf' AND NEW.groupID != 75 THEN
--     INSERT IGNORE INTO `group_user` (userID, groupID, accessLevel)
--     VALUES (NEW.userID, 75, 'pf');
--   END IF;
-- END //
-- DELIMITER ;

DELIMITER //
CREATE TRIGGER addFreeChatModule
AFTER INSERT ON `tito_class_status`
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO `tito_module` (moduleID, classID)
  VALUE (228, new.classID);
END //
DELIMITER ;

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

