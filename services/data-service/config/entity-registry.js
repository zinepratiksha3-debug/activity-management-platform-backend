// data-service/config/entity-registry.js

import User from "../models/user.model.js";

export const ENTITY_REGISTRY = {
  user: {
    model: User,

    mediaFields: new Set([
      "avatar",
      "video",
    ]),
  },

  // Future:
  //
  // activity: {
  //   model: Activity,
  //   mediaFields: new Set([
  //     "coverImage",
  //     "attachments",
  //   ]),
  // },
  //
  // organization: {
  //   model: Organization,
  //   mediaFields: new Set([
  //     "logo",
  //     "coverImage",
  //   ]),
  // },
};

export function getEntityDefinition(entityType) {
  const definition = ENTITY_REGISTRY[entityType];

  if (!definition) {
    throw new Error(
      `Unsupported entity type: ${entityType}`
    );
  }

  return definition;
}
