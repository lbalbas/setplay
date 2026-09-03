CREATE TABLE `event_games` (
	`event_id` text NOT NULL,
	`game_id` text NOT NULL,
	PRIMARY KEY(`event_id`, `game_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`source` text NOT NULL,
	`startgg_slug` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`region` text,
	`is_online` integer DEFAULT false NOT NULL,
	`location` text,
	`registration_url` text,
	`image_url` text,
	`prize_pool` integer,
	`attendee_count` integer,
	`featured_priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'upcoming' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`startgg_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_slug_unique` ON `games` (`slug`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscription_interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscription_id` text NOT NULL,
	`interest_type` text NOT NULL,
	`target_id` text NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `push_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
