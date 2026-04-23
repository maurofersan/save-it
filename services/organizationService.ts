import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import type { Organization } from "@/types/models";

const COL = "organizations";

type OrganizationDoc = {
  _id: ObjectId;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapOrg(doc: OrganizationDoc): Organization {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  const db = await getMongoDb();
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  const doc = await db
    .collection<OrganizationDoc>(COL)
    .findOne({ _id: oid });
  return doc ? mapOrg(doc) : null;
}
