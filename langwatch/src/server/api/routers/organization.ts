import { type Organization, type Project, type Team } from "@prisma/client";
import { nanoid } from "nanoid";
import slugify from "slugify";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export type FullyLoadedTeam = Team & {
  projects: Project[];
};

export type FullyLoadedOrganization = Organization & {
  teams: FullyLoadedTeam[];
};

export const organizationRouter = createTRPCRouter({
  createAndAssign: protectedProcedure
    .input(
      z.object({
        orgName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const prisma = ctx.prisma;

      const orgId = nanoid();
      const orgSlug =
        slugify(input.orgName, { lower: true, strict: true }) +
        "-" +
        orgId.substring(0, 8);

      const teamId = nanoid();
      const teamSlug =
        slugify(input.orgName, { lower: true, strict: true }) +
        "-" +
        teamId.substring(0, 8);

      await prisma.$transaction(async (prisma) => {
        // 1. Create the organization
        const organization = await prisma.organization.create({
          data: {
            id: orgId,
            name: input.orgName,
            slug: orgSlug,
          },
        });

        // 2. Assign the user to the organization
        await prisma.organizationUser.create({
          data: {
            userId: userId,
            organizationId: organization.id,
            role: "ADMIN", // Assuming the user becomes an admin of the created organization
          },
        });

        // 3. Create the default team
        const team = await prisma.team.create({
          data: {
            id: teamId,
            name: input.orgName, // Same name as organization
            slug: teamSlug, // Same as organization
            organizationId: organization.id,
          },
        });

        // 4. Assign the user to the team
        await prisma.teamUser.create({
          data: {
            userId: userId,
            teamId: team.id,
            role: "ADMIN", // Assuming the user becomes an admin of the created team
          },
        });
      });

      // Return success response
      return { success: true, teamSlug };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const prisma = ctx.prisma;

    const organizations: FullyLoadedOrganization[] =
      await prisma.organization.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
        include: {
          teams: {
            include: {
              projects: true,
            },
          },
        },
      });

    return organizations;
  }),
});
