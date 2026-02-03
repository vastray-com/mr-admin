import dataset from './dataset';
import pushRule from './pushRule';
import structuredRuleset from './structuredRuleset';
import task from './task';
import warehouse from './warehouse';

export const ENUM_VARS = {
  DATASET: dataset,
  RULESET: structuredRuleset,
  TASK: task,
  PUSH_RULE: pushRule,
  WAREHOUSE: warehouse,
};

// 用户角色
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}
