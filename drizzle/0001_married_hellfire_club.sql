CREATE TABLE `albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('ceremony','reception','dancing','inspiration','guest_uploads') DEFAULT 'inspiration',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`description` varchar(255),
	`budgeted` decimal(10,2) DEFAULT '0',
	`spent` decimal(10,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`type` enum('rsvp_confirmation','rsvp_reminder','invitation','other') NOT NULL,
	`subject` varchar(255),
	`status` enum('sent','failed','pending') DEFAULT 'pending',
	`sentAt` timestamp,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`weddingId` int NOT NULL,
	`guestId` int,
	`title` varchar(255),
	`description` text,
	`imageUrl` text NOT NULL,
	`fileSize` int,
	`uploadedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `galleryUploadTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`albumId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `galleryUploadTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `galleryUploadTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `gifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`guestId` int NOT NULL,
	`type` enum('money','gift') NOT NULL,
	`amount` decimal(10,2) DEFAULT '0',
	`description` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`group` enum('bride','groom','mutual') NOT NULL,
	`role` enum('regular','vip','bridesmaid','groomsman') DEFAULT 'regular',
	`status` enum('pending','confirmed','declined') DEFAULT 'pending',
	`mealPreference` enum('regular','vegetarian','vegan','glutenFree'),
	`plusOnes` int DEFAULT 0,
	`notes` text,
	`invitationSentAt` timestamp,
	`rsvpedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`guestId` int,
	`title` varchar(255),
	`content` text,
	`imageUrl` text,
	`includeRsvpLink` boolean DEFAULT true,
	`sentAt` timestamp,
	`status` enum('draft','scheduled','sent','failed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rsvpResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`guestId` int NOT NULL,
	`attending` boolean,
	`mealPreference` enum('regular','vegetarian','vegan','glutenFree'),
	`plusOnesCount` int DEFAULT 0,
	`plusOnesDetails` json,
	`notes` text,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rsvpResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rsvpTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`guestId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rsvpTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `rsvpTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `seatingTables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`shape` enum('round','square','rectangle') DEFAULT 'round',
	`capacity` int DEFAULT 8,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seatingTables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableId` int NOT NULL,
	`guestId` int,
	`seatNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timelineEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weddingId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`time` datetime,
	`category` enum('bride','groom','friends','general') DEFAULT 'general',
	`description` text,
	`assignedTo` varchar(255),
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timelineEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weddings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brideNames` text,
	`groomNames` text,
	`weddingDate` datetime,
	`venue` text,
	`guestCount` int DEFAULT 0,
	`rsvpDeadline` datetime,
	`budget` decimal(10,2),
	`theme` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weddings_id` PRIMARY KEY(`id`)
);
