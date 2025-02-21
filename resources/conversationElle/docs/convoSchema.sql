-- New SQL table, using correct convention, python float support
-- userID referencing user table via FK

-- TODO: add metadata field for messages?
-- Add new metadata field for each message?
-- add words used inccorectly?

CREATE TABLE `chatbot_sessions` (
    `chatbotId` INT AUTO_INCREMENT PRIMARY KEY,              
    `userId` INT NOT NULL,
    `moduleId` INT NOT NULL,                                 
    `totalTimeChatted` FLOAT NOT NULL, 
    `wordsUsed` INT NOT NULL DEFAULT 0,                      
    `totalWordsForModule` INT NOT NULL,                    
    `grade` FLOAT NOT NULL,  
    `termsUsed` JSON NOT NULL, 
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `user`(`userId`) ON DELETE CASCADE
);

CREATE TABLE `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT NOT NULL,
    `chatbotId` INT NOT NULL,
    `moduleId` INT NOT NULL,
    `source` ENUM('llm', 'user') NOT NULL,
    `value` TEXT NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`chatbotId`) REFERENCES `chatbotSessions`(`chatbotId`) ON DELETE CASCADE
    FOREIGN KEY (`userId`) REFERENCES `user`(`userId`) ON DELETE CASCADE,
);

