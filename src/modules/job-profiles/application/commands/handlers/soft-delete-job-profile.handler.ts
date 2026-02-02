import { Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { SoftDeleteJobProfileCommand } from "../impl/soft-delete-job-profile.command";

@CommandHandler(SoftDeleteJobProfileCommand)
export class SoftDeleteJobProfileHandler implements ICommandHandler<SoftDeleteJobProfileCommand> {
  private readonly logger = new Logger(SoftDeleteJobProfileHandler.name);

  async execute(command: SoftDeleteJobProfileCommand): Promise<void> {
    this.logger.log(
      `Soft deleting job profile ${command.jobProfileId} for user ${command.userId}`,
    );

    // TODO: This is placeholder logic - will be replaced in Step 2
    // In production, this will:
    // 1. Fetch job profile from repository
    // 2. Check if it exists (404 if not)
    // 3. Verify ownership (403 if not owner)
    // 4. Call entity.softDelete()
    // 5. Persist via repository.softDelete()

    this.logger.log(
      `Placeholder: Would soft delete job profile ${command.jobProfileId}`,
    );

    return Promise.resolve();
  }
}
