/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ideas from "../ideas.js";
import type * as lib_enums from "../lib/enums.js";
import type * as lib_gateway from "../lib/gateway.js";
import type * as lib_ideas from "../lib/ideas.js";
import type * as lib_owner from "../lib/owner.js";
import type * as lib_platformStatus from "../lib/platformStatus.js";
import type * as lib_prompt from "../lib/prompt.js";
import type * as lib_validators from "../lib/validators.js";
import type * as profiles from "../profiles.js";
import type * as research from "../research.js";
import type * as runs from "../runs.js";
import type * as sources from "../sources.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ideas: typeof ideas;
  "lib/enums": typeof lib_enums;
  "lib/gateway": typeof lib_gateway;
  "lib/ideas": typeof lib_ideas;
  "lib/owner": typeof lib_owner;
  "lib/platformStatus": typeof lib_platformStatus;
  "lib/prompt": typeof lib_prompt;
  "lib/validators": typeof lib_validators;
  profiles: typeof profiles;
  research: typeof research;
  runs: typeof runs;
  sources: typeof sources;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
