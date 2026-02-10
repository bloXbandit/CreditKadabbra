CREATE TABLE `alternative_bureau_disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureauId` int NOT NULL,
	`disputeDate` date NOT NULL,
	`description` text NOT NULL,
	`letterContent` text,
	`status` enum('draft','submitted','investigating','resolved','rejected') NOT NULL DEFAULT 'draft',
	`resolutionDate` date,
	`outcome` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alternative_bureau_disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alternative_bureaus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`website` varchar(255),
	`phone` varchar(20),
	`mailAddress` text,
	`reportRequestMethod` varchar(50),
	`disputeMethod` varchar(50),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alternative_bureaus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_report_errors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`errorType` enum('statute_of_limitations','duplicate_account','incorrect_balance','incorrect_status','incorrect_payment_history','unauthorized_inquiry','identity_error','metro2_violation','unverifiable','other') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`itemType` enum('account','inquiry','public_record','personal_info') NOT NULL,
	`itemId` int,
	`errorDescription` text NOT NULL,
	`suggestedAction` text,
	`legalCitationId` int,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_report_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispute_letter_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`errorType` varchar(100) NOT NULL,
	`bureauType` enum('major','alternative','both') NOT NULL,
	`templateContent` text NOT NULL,
	`legalCitations` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispute_letter_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`citationType` enum('federal','state','regulation') NOT NULL,
	`statute` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`fullText` text,
	`applicableState` varchar(2),
	`errorCategory` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legal_citations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountType` enum('credit_card','auto_loan','personal_loan','student_loan','mortgage','other') NOT NULL,
	`issuer` varchar(255),
	`currentBalance` decimal(12,2),
	`creditLimit` decimal(12,2),
	`originalAmount` decimal(12,2),
	`monthlyPayment` decimal(10,2),
	`minimumPayment` decimal(10,2),
	`statementDate` int,
	`paymentDueDate` int,
	`interestRate` decimal(5,2),
	`remainingTerm` int,
	`status` enum('current','late','closed','paid_off') NOT NULL DEFAULT 'current',
	`propertyAddress` text,
	`estimatedValue` decimal(12,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opt_out_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureauId` int,
	`bureauType` enum('major','alternative') NOT NULL,
	`optOutDate` date NOT NULL,
	`status` enum('pending','confirmed','expired') NOT NULL DEFAULT 'pending',
	`confirmationNumber` varchar(100),
	`expirationDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opt_out_tracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_freeze_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureauId` int,
	`bureauType` enum('major','alternative') NOT NULL,
	`freezeDate` date NOT NULL,
	`status` enum('active','lifted_temp','lifted_perm','removed') NOT NULL DEFAULT 'active',
	`pinEncrypted` text,
	`liftExpiration` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `security_freeze_tracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_alternative_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bureauId` int NOT NULL,
	`requestDate` date NOT NULL,
	`receivedDate` date,
	`status` enum('requested','received','reviewed') NOT NULL DEFAULT 'requested',
	`fileUrl` text,
	`fileKey` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_alternative_reports_id` PRIMARY KEY(`id`)
);
