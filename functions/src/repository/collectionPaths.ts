import { CollectionName, collectionNames } from "../domain/firestoreModels";

export const collections: Record<CollectionName, CollectionName> = collectionNames.reduce(
  (accumulator, collectionName) => ({
    ...accumulator,
    [collectionName]: collectionName
  }),
  {} as Record<CollectionName, CollectionName>
);

export function collectionPath(collectionName: CollectionName): string {
  return collections[collectionName];
}
