CREATE TABLE "sidebar_shortcuts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"folder_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sidebar_shortcuts" ADD CONSTRAINT "sidebar_shortcuts_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_shortcuts" ADD CONSTRAINT "sidebar_shortcuts_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sidebar_shortcuts_owner_folder_idx" ON "sidebar_shortcuts" USING btree ("owner_id","folder_id");