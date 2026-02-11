ALTER TABLE `accounts` ADD `dateClosed` date;--> statement-breakpoint
ALTER TABLE `accounts` ADD `highBalance` decimal(12,2);--> statement-breakpoint
ALTER TABLE `accounts` ADD `monthlyPayment` decimal(12,2);--> statement-breakpoint
ALTER TABLE `accounts` ADD `loanType` varchar(100);--> statement-breakpoint
ALTER TABLE `accounts` ADD `responsibility` varchar(100);--> statement-breakpoint
ALTER TABLE `accounts` ADD `creditorAddress` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `creditorPhone` varchar(50);--> statement-breakpoint
ALTER TABLE `accounts` ADD `remarks` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `paymentHistory` json;--> statement-breakpoint
ALTER TABLE `accounts` ADD `isNegative` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `parsedData` json;