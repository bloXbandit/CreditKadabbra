CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountNumber` varchar(100),
	`accountType` enum('revolving','installment','mortgage','other') NOT NULL,
	`status` varchar(100),
	`balance` decimal(12,2),
	`creditLimit` decimal(12,2),
	`paymentStatus` varchar(100),
	`openDate` date,
	`lastPaymentDate` date,
	`statementDate` date,
	`isDisputed` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`reportDate` date NOT NULL,
	`fileUrl` text,
	`fileKey` text,
	`parsed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`score` int NOT NULL,
	`scoreDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`itemType` enum('account','inquiry','public_record','personal_info') NOT NULL,
	`itemId` int,
	`disputeReason` text NOT NULL,
	`letterContent` text,
	`status` enum('draft','sent','in_progress','resolved','rejected') NOT NULL DEFAULT 'draft',
	`dateSent` date,
	`dateResolved` date,
	`outcome` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('credit_report','dispute_letter','bureau_response','supporting_doc','other') NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(100),
	`fileSize` int,
	`relatedDisputeId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`creditorName` varchar(255) NOT NULL,
	`inquiryDate` date NOT NULL,
	`inquiryType` enum('hard','soft') NOT NULL,
	`isDisputed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`milestoneType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`achievedDate` date NOT NULL,
	`value` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `privacy_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`actionType` enum('opt_out_prescreened','opt_out_sharing','limit_sensitive','freeze','other') NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`actionDate` date NOT NULL,
	`confirmationNumber` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privacy_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`bureau` enum('equifax','experian','transunion') NOT NULL,
	`recordType` varchar(100) NOT NULL,
	`filingDate` date,
	`status` varchar(100),
	`amount` decimal(12,2),
	`description` text,
	`isDisputed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `score_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetScore` int NOT NULL,
	`targetDate` date,
	`achieved` boolean NOT NULL DEFAULT false,
	`achievedDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `score_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` date,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`completed` boolean NOT NULL DEFAULT false,
	`relatedDisputeId` int,
	`relatedAccountId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wayfinder_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioName` varchar(255) NOT NULL,
	`scenarioType` enum('balance_paydown','collection_removal','missed_payment_correction','inquiry_removal','custom') NOT NULL,
	`currentScore` int,
	`projectedScore` int,
	`parameters` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wayfinder_scenarios_id` PRIMARY KEY(`id`)
);
