// data-service/services/user-cache.service.js

import { getCache, setCache, deleteCache, deleteCacheByPattern } from "./catche.service.js";
/**
 * ==========================================
 * 1. USERS CACHE PATTERN
 * ==========================================
 */

export function userCacheKey(id) {
  return `users:one:${id}`;
}

export function usersListCacheKey(query) {
  return `users:list:${JSON.stringify(query)}`;
}

export async function getCachedUser(id) {
  return getCache(userCacheKey(id));
}

export async function cacheUser(id, user) {
  return setCache(userCacheKey(id), user, 60);
}

export async function invalidateUserCache(id) {
  await deleteCache(userCacheKey(id));
  await deleteCacheByPattern("users:list:*");
}

/**
 * ==========================================
 * 2. ACTIVITIES CACHE PATTERN
 * ==========================================
 */

export function activityCacheKey(id) {
  return `activities:one:${id}`;
}

export function activitiesListCacheKey(query) {
  return `activities:list:${JSON.stringify(query)}`;
}

export async function getCachedActivity(id) {
  return getCache(activityCacheKey(id));
}

export async function cacheActivity(id, activity) {
  return setCache(activityCacheKey(id), activity, 60);
}

export async function invalidateActivityCache(id) {
  await deleteCache(activityCacheKey(id));
  await deleteCacheByPattern("activities:list:*");
}

/**
 * ==========================================
 * 3. ORGANIZATIONS CACHE PATTERN
 * ==========================================
 */

export function organizationCacheKey(id) {
  return `organizations:one:${id}`;
}

export function organizationsListCacheKey(query) {
  return `organizations:list:${JSON.stringify(query)}`;
}

export async function getCachedOrganization(id) {
  return getCache(organizationCacheKey(id));
}

export async function cacheOrganization(id, organization) {
  return setCache(organizationCacheKey(id), organization, 60);
}

export async function invalidateOrganizationCache(id) {
  await deleteCache(organizationCacheKey(id));
  await deleteCacheByPattern("organizations:list:*");
}