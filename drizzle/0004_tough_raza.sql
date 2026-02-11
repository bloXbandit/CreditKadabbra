CREATE TABLE `notification_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('payment_reminder','dispute_deadline','bureau_response','score_update','utilization_alert') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	CONSTRAINT `notification_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paymentReminders` boolean NOT NULL DEFAULT true,
	`paymentReminderDays` int NOT NULL DEFAULT 3,
	`disputeDeadlines` boolean NOT NULL DEFAULT true,
	`bureauResponses` boolean NOT NULL DEFAULT true,
	`scoreUpdates` boolean NOT NULL DEFAULT true,
	`utilizationAlerts` boolean NOT NULL DEFAULT true,
	`utilizationThreshold` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
